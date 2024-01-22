/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { userSelectedEnvironment } from '../initializers';
import { providersList } from '../providers';
import { isValidProvidersList } from '../utils';
import { EventData, PropertiesType, UserPropertiesType } from './dispatchers.types';

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

const sendScreenEvent = (screen: string): void => {
  if (userSelectedEnvironment === 'development') {
    console.log(`[BLUEFIN]: Screen event: ${screen}`);
  } else {
    dispatchEventToAllProviders({ screen });
  }
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  if (userSelectedEnvironment === 'development') {
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
  if (userSelectedEnvironment === 'development') {
    console.log(
      `[BLUEFIN]: User identification: ${id} - ${JSON.stringify(userProperties)}`,
    );
  } else {
    dispatchEventToAllProviders({ id, userProperties });
  }
};

export { sendCustomEvent, sendScreenEvent, sendUserIdentification };
