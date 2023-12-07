import { EventType } from './event.types';
import { UserBluefin } from './generic.types';

export type ProviderType = {
  name: string;
  errorEvent: (error: Error) => void;
  userProperties: (user: UserBluefin) => void;
  customEvent: (event: EventType) => void;
  screenEvent: (screen: string) => void;
};
