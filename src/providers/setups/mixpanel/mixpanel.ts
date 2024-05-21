import mixpanel from 'mixpanel-browser';
import { PropertiesType } from '../../../dispatchers/dispatchers.types';
import { ProviderType } from '../../provider.types';

interface IUserProperties {
  email?: string;
  name?: string;
  [key: string]: string | undefined;
}

const dispatchUserIdentification = (
  id: string,
  userProperties: IUserProperties,
): void => {
  mixpanel.identify(id);
  mixpanel.people.set({ USER_ID: id });

  const superProperties = ['name', 'email'];
  const peopleProperties: Record<string, any> = {};

  const cipherProperty = (key: string) => {
    if (userProperties?.[key]) {
      peopleProperties[`$${key}`] = userProperties[key];
    }
  };
  superProperties.forEach(cipherProperty);

  Object.entries(userProperties)
    .filter(([key, value]) => !superProperties.includes(key) && value)
    .forEach(([key, value]) => {
      peopleProperties[key] = value;
    });
  mixpanel.people.set(peopleProperties);
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => {
  const { ...rest } = properties;

  try {
    mixpanel.track(event, rest);
  } catch (error) {
    console.error('Error tracking screen event:', error);
  }
};

const dispatchScreenEvent = (screen: string): void => {
  try {
    mixpanel.track(screen);
  } catch (error) {
    console.error('Error tracking screen event:', error);
  }
};

const MixPanelProvider: ProviderType = {
  name: 'MixPanel',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default MixPanelProvider;
