import { PropertiesType } from '../dispatchers/dispatchers.types';

export type ProviderType = {
  name: 'Clarity' | 'Sentry' | 'FullStory' | 'MixPanel';
  userIdentification: (id: string, userProperties: any) => void;
  customEvent: (event: string, properties: PropertiesType) => void;
  screenEvent: (screen: string) => void;
  reset?: () => void;
};
