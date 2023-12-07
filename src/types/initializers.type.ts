type ProviderNameType =
  | 'SentryProvider'
  | 'FullStoryProvider'
  | 'MixpanelProvider';

export type EnvironmentType =
  | 'development'
  | 'staging'
  | 'production';

export interface IInitializeParams {
    providerName: ProviderNameType;
    environment: EnvironmentType;
    dsn?: string;
    token?: string;
  }
