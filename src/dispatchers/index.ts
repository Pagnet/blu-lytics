/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { providersList } from '../providers';
import { isValidProvidersList } from '../utils';
import { EventType, PropertiesType, UserPropertiesType } from './dispatchers.types';

const sendEvent = (
  event: string,
  eventType: EventType,
  properties?: PropertiesType,
  userProperties?: UserPropertiesType,
): void => {
  if (!isValidProvidersList(providersList)) {
    return;
  }

  const payload = eventType === 'userIdentification' ? userProperties : properties;

  providersList
    .filter((provider) => provider[eventType])
    .forEach((provider) => {
      provider[eventType]?.(event, payload);
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

  sendEvent(screen, 'screenEvent');
};

const sendCustomEvent = (event: string, properties: PropertiesType): void => {
  sendEvent(event, 'customEvent', properties);
};

const sendUserIdentification = (id: string, userProperties: UserPropertiesType): void => {
  sendEvent(id, 'userIdentification', userProperties);
};

export { sendCustomEvent, sendScreenEvent, sendUserIdentification };
