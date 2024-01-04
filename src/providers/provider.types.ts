import { PropertiesType } from '../dispatchers/dispatchers.types';

export type ProviderType = {
  name: 'Sentry' | 'FullStory' | 'MixPanel' | 'Firebase';
  userIdentification: (id: string, userProperties: any) => void;
  customEvent: (event: string, properties: PropertiesType) => void;
  screenEvent: (screen: string) => void;
};
