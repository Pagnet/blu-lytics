import {
  DispatchOptionsType,
  PropertiesType,
} from '../dispatchers/dispatchers.types';

export type ProviderType = {
  name: 'Clarity' | 'Sentry' | 'FullStory' | 'MixPanel' | 'Statsig';
  userIdentification: (id: string, userProperties: any) => void;
  customEvent: (
    event: string,
    properties: PropertiesType,
    options?: DispatchOptionsType,
  ) => void;
  screenEvent: (
    screen: string,
    properties?: PropertiesType,
    options?: DispatchOptionsType,
  ) => void;
  reset?: () => void;
};
