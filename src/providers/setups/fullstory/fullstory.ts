import * as FullStory from '@fullstory/browser';
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
  FullStory.identify(id);
  FullStory.setUserVars(userProperties);
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => {
  FullStory.event(event, { properties });
};

const dispatchScreenEvent = (screen: string): void => {
  FullStory.event(screen, {});
};

const FullStoryProvider: ProviderType = {
  name: 'FullStory',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default FullStoryProvider;
