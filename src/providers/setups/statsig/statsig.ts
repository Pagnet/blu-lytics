import { StatsigClient, StatsigUser } from '@statsig/js-client';
import { runStatsigTriggeredSessionReplay } from '@statsig/session-replay';
import {
  DispatchOptionsType,
  PropertiesType,
} from '../../../dispatchers/dispatchers.types';
import { ProviderType } from '../../provider.types';

// Who goes in the Statsig `userID`: 'client' (default) = client_uuid; 'user' = the person.
// `customIDs.client_uuid` always carries the client, for gates with ID type `client_uuid`.
export type StatsigIdentityType = 'client' | 'user';

export type StatsigOptionsType = {
  events: string[];
  sendInStaging?: boolean;
  userIdProperty?: string;
  sessionReplay?: boolean;
  identity?: StatsigIdentityType;
};

type StatsigState = {
  client: StatsigClient | null;
  allowedEvents: Set<string>;
  sendInStaging: boolean;
  userIdProperty: string;
  identity: StatsigIdentityType;
  currentUserKey: string | null;
  auxiliaryUserId: string | null;
  ready: Promise<unknown> | null;
};

const LOG_PREFIX = '[blu-lytics][Statsig]';

// Session replay masks every text and input on the client side, regardless of the
// privacy settings in the Statsig console.
const SESSION_REPLAY_RRWEB_CONFIG = {
  maskAllInputs: true,
  maskTextSelector: '*',
};

const state: StatsigState = {
  client: null,
  allowedEvents: new Set(),
  sendInStaging: false,
  userIdProperty: 'client_uuid',
  identity: 'client',
  currentUserKey: null,
  auxiliaryUserId: null,
  ready: null,
};

const logError = (message: string, error?: unknown): void => {
  console.error(`${LOG_PREFIX} ${message}`, error);
};

const readDefaultProperties = (): PropertiesType => {
  try {
    const stored = localStorage.getItem('_bl_props');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logError('Failed to parse stored properties', error);
    return {};
  }
};

const readClientUuid = (properties?: PropertiesType): string | null => {
  const fromProperties = properties?.[state.userIdProperty];
  const fromStorage = readDefaultProperties()[state.userIdProperty];
  const value = fromProperties ?? fromStorage;
  return typeof value === 'string' && value.length > 0 ? value : null;
};

const toId = (value: unknown): string | null => {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value.length > 0 ? value : null;
};

// The person comes from `user_id` in the event or in `_bl_props` (survives a reload) and,
// right after login, from the user identification.
const readUserId = (properties?: PropertiesType): string | null => (
  toId(properties?.user_id)
  ?? toId(readDefaultProperties().user_id)
  ?? state.auxiliaryUserId
);

const buildUser = (clientUuid: string, userId: string | null): StatsigUser => {
  const unitId = state.identity === 'user' ? userId : clientUuid;
  return {
    ...(unitId ? { userID: unitId } : {}),
    customIDs: { client_uuid: clientUuid },
    ...(userId ? { custom: { user_id: userId } } : {}),
  };
};

const ensureUser = (clientUuid: string, userId: string | null): boolean => {
  if (!state.client) return false;
  const key = `${clientUuid}|${userId ?? ''}`;
  if (state.currentUserKey === key) return true;

  state.currentUserKey = key;
  state.ready = state.client.updateUserAsync(buildUser(clientUuid, userId)).catch((error) => {
    logError('Failed to update user', error);
  });
  return true;
};

const toMetadata = (properties?: PropertiesType): Record<string, string> => {
  const metadata: Record<string, string> = {};
  Object.entries(properties || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    metadata[key] = Array.isArray(value) ? JSON.stringify(value) : String(value);
  });
  return metadata;
};

const isAllowed = (event: string, options?: DispatchOptionsType): boolean => (
  options?.statsig === true || state.allowedEvents.has(event)
);

const dispatchAllowedEvent = (
  event: string,
  properties?: PropertiesType,
  options?: DispatchOptionsType,
): void => {
  try {
    if (!state.client || !isAllowed(event, options)) return;

    const clientUuid = readClientUuid(properties);
    if (!clientUuid || !ensureUser(clientUuid, readUserId(properties))) return;

    state.client.logEvent(event, undefined, toMetadata(properties));
  } catch (error) {
    logError(`Failed to log event ${event}`, error);
  }
};

const dispatchUserIdentification = (id: string): void => {
  try {
    state.auxiliaryUserId = id;
    const clientUuid = readClientUuid();
    if (!clientUuid || !state.client) return;

    ensureUser(clientUuid, readUserId());
  } catch (error) {
    logError('Failed to identify user', error);
  }
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
  options?: DispatchOptionsType,
): void => dispatchAllowedEvent(event, properties, options);

const dispatchScreenEvent = (
  screen: string,
  properties?: PropertiesType,
  options?: DispatchOptionsType,
): void => dispatchAllowedEvent(screen, properties, options);

const dispatchReset = (): void => {
  state.currentUserKey = null;
  state.auxiliaryUserId = null;
};

const startSessionReplay = (client: StatsigClient): void => {
  try {
    runStatsigTriggeredSessionReplay(client, {
      autoStartRecording: true,
      keepRollingWindow: true,
      rrwebConfig: SESSION_REPLAY_RRWEB_CONFIG,
    });
  } catch (error) {
    logError('Failed to start session replay', error);
  }
};

/**
 * Evaluates a gate on the client for the current client_uuid, after the SDK
 * finishes loading the values for that user. Fail-closed: without the client,
 * without client_uuid or on any error, resolves to false. The evaluation emits
 * the client-side exposure that fires the session replay triggers by gate.
 */
export const checkStatsigGate = async (gate: string): Promise<boolean> => {
  try {
    const clientUuid = readClientUuid();
    if (!clientUuid || !ensureUser(clientUuid, readUserId())) return false;

    await state.ready;
    return state.client?.checkGate(gate) === true;
  } catch (error) {
    logError(`Failed to check gate ${gate}`, error);
    return false;
  }
};

const flush = (): void => {
  state.client?.flush().catch((error) => {
    logError('Failed to flush events', error);
  });
};

/**
 * Configures the Statsig client. Fail-closed: without an api key or while the
 * client is not created, nothing is sent. An event is sent only when it is in
 * `options.events` or when the caller passes `{ statsig: true }`.
 * With `sessionReplay`, recordings start only through the triggers
 * configured in the Statsig console, with all text masked, and the user is
 * identified at startup from `_bl_props` so the targeting gate can evaluate it.
 */
export const configureStatsig = (
  apiKey: string,
  tier: string,
  options?: StatsigOptionsType,
): void => {
  state.client = null;
  state.currentUserKey = null;
  state.ready = null;
  state.allowedEvents = new Set(options?.events || []);
  state.sendInStaging = options?.sendInStaging === true;
  state.userIdProperty = options?.userIdProperty || 'client_uuid';
  state.identity = options?.identity === 'user' ? 'user' : 'client';

  if (!apiKey) return;

  try {
    const initialClientUuid = options?.sessionReplay ? readClientUuid() : null;
    const initialUserId = initialClientUuid ? readUserId() : null;
    const client = new StatsigClient(
      apiKey,
      initialClientUuid ? buildUser(initialClientUuid, initialUserId) : {},
      { environment: { tier } },
    );
    state.currentUserKey = initialClientUuid ? `${initialClientUuid}|${initialUserId ?? ''}` : null;
    if (options?.sessionReplay) startSessionReplay(client);
    state.ready = client.initializeAsync().catch((error) => {
      logError('Failed to initialize', error);
    });
    state.client = client;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', flush);
    }
  } catch (error) {
    state.client = null;
    logError('Failed to create client', error);
  }
};

export const isStatsigEnabledInStaging = (): boolean => state.sendInStaging && state.client !== null;

export const isStatsigEvent = (event: string): boolean => state.allowedEvents.has(event);

export const resetStatsigForTests = (): void => {
  state.client = null;
  state.allowedEvents = new Set();
  state.sendInStaging = false;
  state.userIdProperty = 'client_uuid';
  state.identity = 'client';
  state.currentUserKey = null;
  state.auxiliaryUserId = null;
  state.ready = null;
};

const StatsigProvider: ProviderType = {
  name: 'Statsig',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
  reset: dispatchReset,
};

export default StatsigProvider;
