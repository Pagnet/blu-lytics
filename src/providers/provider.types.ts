import { UserBluefin } from '../types/generic.types';

export type BluefinErrorType = 'CannotAddProviderTwice';

export type ProviderType = {
  name: string;
  userProperties: (user: UserBluefin) => void;
  customEvent: (event: string) => void;
  screenEvent: (screen: string) => void;
};
