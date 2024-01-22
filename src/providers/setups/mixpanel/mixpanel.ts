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
  mixpanel.track(event, { properties });
};

const dispatchScreenEvent = (screen: string): void => {
  mixpanel.track(screen);
};

const MixPanelProvider: ProviderType = {
  name: 'MixPanel',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default MixPanelProvider;
