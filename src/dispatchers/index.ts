/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { providersList } from '../providers';
import {
  EventData,
  PropertiesType,
  UserPropertiesType,
} from './dispatchers.types';
import { checkIfMixPanelIsInitialized } from '../utils';
import { isStatsigEnabledInStaging } from '../providers/setups/statsig/statsig';

/**
 * Dispatches the specified event data to all configured providers.
 *
 * @param {EventData} eventData - The data associated with the event to be dispatched.
 * @returns {void}
 */
export const dispatchEventToAllProviders = (eventData: EventData): void => {
  const localStorageProvidersList = JSON.parse(
    localStorage?.getItem('_bl_providers') as string,
  );

  const providersFiltered = localStorageProvidersList
    ? providersList.filter((item) =>
        localStorageProvidersList.includes(item.name),
      )
    : providersList;

  if (providersFiltered.length > 0) {
    providersFiltered.forEach((provider) => {
      checkIfMixPanelIsInitialized(provider.name);
      const actions = {
        screenEvent: () =>
          provider.screenEvent &&
          eventData.screen &&
          provider.screenEvent(eventData.screen, eventData.properties),
        customEvent: () =>
          provider.customEvent &&
          eventData.event &&
          eventData.properties &&
          provider.customEvent(eventData.event, eventData.properties),
        userIdentification: () =>
          provider.userIdentification &&
          eventData.id &&
          eventData.userProperties &&
          provider.userIdentification(eventData.id, eventData.userProperties),
      };

      Object.values(actions).forEach((action) => action());
    });
  }
};

const getIsDevelopment = (): boolean => {
  const currentEnvironment = localStorage.getItem('_bl_env') || 'development';
  return currentEnvironment !== 'production';
};

/**
 * Outside production nothing is sent, except to Statsig when the current
 * environment is staging and it was initialized with `sendInStaging: true`.
 * No other provider receives events in this branch.
 */
const dispatchEventToStatsigInStaging = (eventData: EventData): void => {
  if (localStorage.getItem('_bl_env') !== 'staging') return;
  if (!isStatsigEnabledInStaging()) return;

  const provider = providersList.find((item) => item.name === 'Statsig');
  if (!provider) return;

  try {
    if (eventData.screen) {
      provider.screenEvent(eventData.screen, eventData.properties);
    }
    if (eventData.event && eventData.properties) {
      provider.customEvent(eventData.event, eventData.properties);
    }
    if (eventData.id && eventData.userProperties) {
      provider.userIdentification(eventData.id, eventData.userProperties);
    }
  } catch (error) {
    console.error('[blu-lytics][Statsig] Failed to dispatch in staging', error);
  }
};

const saveDefaultPropertiesToLocalStorage = (
  properties: PropertiesType,
): void => {
  localStorage.setItem('_bl_props', JSON.stringify(properties));
};

const loadDefaultPropertiesFromLocalStorage = (): PropertiesType => {
  const storedProperties = localStorage.getItem('_bl_props');
  return storedProperties ? JSON.parse(storedProperties) : {};
};

let defaultProperties: PropertiesType = loadDefaultPropertiesFromLocalStorage();

const setDefaultProperties = (properties: PropertiesType): void => {
  defaultProperties = { ...properties };
  saveDefaultPropertiesToLocalStorage(defaultProperties);
};

const sendScreenEvent = (
  screen: string,
  properties?: PropertiesType,
): void => {
  const rawStoredProperties = localStorage.getItem('_bl_props');

  if (rawStoredProperties) {
    try {
      defaultProperties = JSON.parse(rawStoredProperties);
    } catch (error) {
      console.error('[blu-lytics] Failed to parse stored properties', error);
    }
  }

  const mergedProperties = { ...defaultProperties, ...properties };
  const hasProperties = Object.keys(mergedProperties).length > 0;

  if (getIsDevelopment()) {
    console.log(
      hasProperties
        ? `[blu-lytics]: Screen event: ${screen} - ${JSON.stringify(mergedProperties)}`
        : `[blu-lytics]: Screen event: ${screen}`,
    );
    dispatchEventToStatsigInStaging({
      screen,
      ...(hasProperties ? { properties: mergedProperties } : {}),
    });
  } else {
    dispatchEventToAllProviders({
      screen,
      ...(hasProperties ? { properties: mergedProperties } : {}),
    });
  }
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  const rawStoredProperties = localStorage.getItem('_bl_props');

  if (rawStoredProperties) {
    try {
      defaultProperties = JSON.parse(rawStoredProperties);
    } catch (error) {
      console.error('[blu-lytics] Failed to parse stored properties', error);
    }
  }

  const mergedProperties = {
    ...defaultProperties,
    ...properties,
  };

  if (getIsDevelopment()) {
    console.log(
      `[blu-lytics]: Custom event: ${event} - ${JSON.stringify(
        mergedProperties,
      )}`,
    );
    dispatchEventToStatsigInStaging({ event, properties: mergedProperties });
  } else {
    dispatchEventToAllProviders({ event, properties: mergedProperties });
  }
};

const sendUserIdentification = (
  id: string,
  userProperties: UserPropertiesType,
): void => {
  if (getIsDevelopment()) {
    console.log(
      `[blu-lytics]: User identification: ${id} - ${JSON.stringify(
        userProperties,
      )}`,
    );
    dispatchEventToStatsigInStaging({ id, userProperties });
  } else {
    dispatchEventToAllProviders({ id, userProperties });
  }
};

const resetMixpanel = (): void => {
  if (getIsDevelopment()) {
    console.log('[blu-lytics]: Resetting Mixpanel');
  } else {
  const provider = providersList.find((item) => item.name === 'MixPanel');
    if (provider?.reset) {
      checkIfMixPanelIsInitialized(provider.name);
      provider.reset();
    }
  }
};

export {
  sendCustomEvent,
  sendScreenEvent,
  sendUserIdentification,
  setDefaultProperties,
  resetMixpanel,
};

