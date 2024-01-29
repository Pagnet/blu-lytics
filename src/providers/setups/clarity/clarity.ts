import { clarity } from 'react-microsoft-clarity';
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
  clarity.identify(id, { userProperties: 'id' });
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => {
  clarity.setTag(event, 'customEvent');
};

const dispatchScreenEvent = (screen: string): void => {
  clarity.setTag(screen, 'screen');
};

const ClarityProvider: ProviderType = {
  name: 'Clarity',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default ClarityProvider;
