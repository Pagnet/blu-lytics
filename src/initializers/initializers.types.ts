type ProviderNameType = 'Sentry' | 'FullStory' | 'MixPanel';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface IInitializeParams {
  providerName: ProviderNameType;
  environment: EnvironmentType;
  dsn?: string;
  token?: string;
  orgId?: string;
  tracesSampleRate?: number;
}
