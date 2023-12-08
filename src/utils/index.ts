import { ProviderType } from '../providers/provider.types';

// eslint-disable-next-line import/prefer-default-export
export const isValidProvidersList = (
  providersList: ProviderType[],
): boolean => Array.isArray(providersList) && providersList.length > 0;
