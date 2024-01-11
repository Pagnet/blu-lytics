type ProviderNameType = 'Clarity' | 'Sentry' | 'FullStory' | 'MixPanel' | 'Firebase';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface IInitializeParams {
  providerName: ProviderNameType;
  tracesSampleRate?: number;
  apiKey?: string;
}
