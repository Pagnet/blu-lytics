/* eslint-disable import/prefer-default-export */
import { ProviderType } from '../providers/provider.types';

export const isValidProvidersList = (
  providersList: ProviderType[],
): boolean => Array.isArray(providersList) && providersList.length > 0;
