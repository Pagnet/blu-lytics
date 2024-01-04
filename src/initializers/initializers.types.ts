type ProviderNameType = 'Sentry' | 'FullStory' | 'MixPanel' | 'Firebase';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface IInitializeParams {
  providerName: ProviderNameType;
  environment?: EnvironmentType;
  tracesSampleRate?: number;
  apiKey?: string;
}
