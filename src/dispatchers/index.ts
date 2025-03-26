/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { providersList } from '../providers';
import { EventData, PropertiesType, UserPropertiesType } from './dispatchers.types';
import { checkIfMixPanelIsInitialized } from '../utils';

/**
 * Dispatches the specified event data to all configured providers.
 *
 * @param {EventData} eventData - The data associated with the event to be dispatched.
 * @returns {void}
 */
export const dispatchEventToAllProviders = (eventData: EventData): void => {
  const localStorageProvidersList = JSON.parse(localStorage?.getItem('_bl_providers') as string);

  const providersFiltered = localStorageProvidersList
    ? providersList.filter((item) => localStorageProvidersList.includes(item.name))
    : providersList;

  if (providersFiltered.length > 0) {
    providersFiltered.forEach((provider) => {
      checkIfMixPanelIsInitialized(provider.name);
      const actions = {
        screenEvent: () => provider.screenEvent
          && eventData.screen
          && provider.screenEvent(eventData.screen),
        customEvent: () => provider.customEvent
          && eventData.event
          && eventData.properties
          && provider.customEvent(eventData.event, eventData.properties),
        userIdentification: () => provider.userIdentification
          && eventData.id
          && eventData.userProperties
          && provider.userIdentification(eventData.id, eventData.userProperties),
      };

      Object.values(actions).forEach((action) => action());
    });
  }
};

const currentEnvironment = localStorage.getItem('_bl_env') || 'development';

const sendScreenEvent = (screen: string): void => {
  if (currentEnvironment === 'development') {
    console.log(`[blu-lytics]: Screen event: ${screen}`);
  } else {
    dispatchEventToAllProviders({ screen });
  }
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  if (currentEnvironment === 'development') {
    console.log(
      `[blu-lytics]: Custom event: ${event} - ${JSON.stringify(properties)}`,
    );
  } else {
    dispatchEventToAllProviders({ event, properties });
  }
};

const sendUserIdentification = (
  id: string,
  userProperties: UserPropertiesType,
): void => {
  if (currentEnvironment === 'development') {
    console.log(
      `[blu-lytics]: User identification: ${id} - ${JSON.stringify(userProperties)}`,
    );
  } else {
    dispatchEventToAllProviders({ id, userProperties });
  }
};

export { sendCustomEvent, sendScreenEvent, sendUserIdentification };
