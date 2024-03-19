import { clarity } from 'clarity-js';
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
  clarity.identify(id);
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => {
  clarity.set(event, 'customEvent');
};

const dispatchScreenEvent = (screen: string): void => {
  clarity.set(screen, 'screen');
};

const ClarityProvider: ProviderType = {
  name: 'Clarity',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default ClarityProvider;
