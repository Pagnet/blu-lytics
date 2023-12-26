/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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

/**
 * Validates if the screen event name follows the specified format.
 * The format is: lowercase letters separated by underscores and limited to 40 characters.
 * @param {string} eventName - The name of the event.
 * @returns {boolean} - True if the event name is valid, false otherwise.
 */
const isValidScreenEventName = (eventName: string): boolean => {
  const regex = /^[a-z]+(_[a-z]+)*$/;
  return eventName.length <= 40 && regex.test(eventName);
};

const sendScreenEvent = (screen: string): void => {
  if (!isValidScreenEventName(screen)) {
    console.error(`Invalid screen event name: ${screen}`);
    return;
  }

  console.log(`[BLUEFIN]: Screen event: ${screen}`);
  dispatchEventToAllProviders({ screen });
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  console.log(
    `[BLUEFIN]: Custom event: ${event} - ${JSON.stringify(properties)}`,
  );
  dispatchEventToAllProviders({ event, properties });
};

const sendUserIdentification = (
  id: string,
  userProperties: UserPropertiesType,
): void => {
  console.log(
    `[BLUEFIN]: User identification: ${id} - ${JSON.stringify(userProperties)}`,
  );
  dispatchEventToAllProviders({ id, userProperties });
};

export { sendCustomEvent, sendScreenEvent, sendUserIdentification };
