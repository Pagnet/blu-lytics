import { StatsigClient, StatsigUser } from '@statsig/js-client';
import { PropertiesType } from '../../../dispatchers/dispatchers.types';
import { ProviderType } from '../../provider.types';

export type StatsigOptionsType = {
  events: string[];
  sendInStaging?: boolean;
  userIdProperty?: string;
};

type StatsigState = {
  client: StatsigClient | null;
  allowedEvents: Set<string>;
  sendInStaging: boolean;
  userIdProperty: string;
  currentUserId: string | null;
  auxiliaryUserId: string | null;
};

const LOG_PREFIX = '[blu-lytics][Statsig]';

const state: StatsigState = {
  client: null,
  allowedEvents: new Set(),
  sendInStaging: false,
  userIdProperty: 'client_uuid',
  currentUserId: null,
  auxiliaryUserId: null,
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

const buildUser = (clientUuid: string): StatsigUser => ({
  userID: clientUuid,
  ...(state.auxiliaryUserId
    ? { customIDs: { userID: state.auxiliaryUserId } }
    : {}),
});

const ensureUser = (clientUuid: string): boolean => {
  if (!state.client) return false;
  if (state.currentUserId === clientUuid) return true;

  state.currentUserId = clientUuid;
  state.client.updateUserAsync(buildUser(clientUuid)).catch((error) => {
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

const dispatchAllowedEvent = (
  event: string,
  properties?: PropertiesType,
): void => {
  try {
    if (!state.client || !state.allowedEvents.has(event)) return;

    const clientUuid = readClientUuid(properties);
    if (!clientUuid || !ensureUser(clientUuid)) return;

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

    state.currentUserId = null;
    ensureUser(clientUuid);
  } catch (error) {
    logError('Failed to identify user', error);
  }
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => dispatchAllowedEvent(event, properties);

const dispatchScreenEvent = (
  screen: string,
  properties?: PropertiesType,
): void => dispatchAllowedEvent(screen, properties);

const dispatchReset = (): void => {
  state.currentUserId = null;
  state.auxiliaryUserId = null;
};

const flush = (): void => {
  state.client?.flush().catch((error) => {
    logError('Failed to flush events', error);
  });
};

/**
 * Configures the Statsig client. Fail-closed: without an api key, without a
 * non-empty allowlist of events or while the client is not created, nothing
 * is sent.
 */
export const configureStatsig = (
  apiKey: string,
  tier: string,
  options?: StatsigOptionsType,
): void => {
  state.client = null;
  state.currentUserId = null;
  state.allowedEvents = new Set(options?.events || []);
  state.sendInStaging = options?.sendInStaging === true;
  state.userIdProperty = options?.userIdProperty || 'client_uuid';

  if (!apiKey || state.allowedEvents.size === 0) return;

  try {
    const client = new StatsigClient(
      apiKey,
      {},
      { environment: { tier } },
    );
    client.initializeAsync().catch((error) => {
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
  state.currentUserId = null;
  state.auxiliaryUserId = null;
};

const StatsigProvider: ProviderType = {
  name: 'Statsig',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
  reset: dispatchReset,
};

export default StatsigProvider;
