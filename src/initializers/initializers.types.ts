export type ProviderNameType = 'Clarity' | 'Sentry' | 'FullStory' | 'MixPanel' | 'Firebase' | 'Statsig';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface IInitializeParams {
  providerName: ProviderNameType;
  tracesSampleRate?: number;
  apiKey?: string;
}
