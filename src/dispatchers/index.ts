/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { currentProvidersEnvironment } from '../initializers';
import { providersList } from '../providers';
import { isValidProvidersList } from '../utils';
import { PropertiesType, UserPropertiesType } from './dispatchers.types';

type EventData = {
  screen?: string;
  properties?: PropertiesType;
  event?: string;
  id?: string;
  userProperties?: UserPropertiesType;
};

/**
 * Dispatches the specified event data to all configured providers.
 *
 * @param {EventData} eventData - The data associated with the event to be dispatched.
 * @returns {void}
 */
export const dispatchEventToAllProviders = (eventData: EventData): void => {
  if (!isValidProvidersList(providersList)) {
    return;
  }

  providersList.forEach((provider) => {
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
};

const isDevelopment: boolean = currentProvidersEnvironment === 'development';

const sendScreenEvent = (screen: string): void => {
  if (isDevelopment) {
    console.log(`[BLUEFIN]: Screen event: ${screen}`);
  } else {
    dispatchEventToAllProviders({ screen });
  }
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  if (isDevelopment) {
    console.log(
      `[BLUEFIN]: Custom event: ${event} - ${JSON.stringify(properties)}`,
    );
  } else {
    dispatchEventToAllProviders({ event, properties });
  }
};

const sendUserIdentification = (
  id: string,
  userProperties: UserPropertiesType,
): void => {
  if (isDevelopment) {
    console.log(
      `[BLUEFIN]: User identification: ${id} - ${JSON.stringify(userProperties)}`,
    );
  } else {
    dispatchEventToAllProviders({ id, userProperties });
  }
};

export { sendCustomEvent, sendScreenEvent, sendUserIdentification };
