import { ProviderType } from '../types/provider.types';

type BluefinErrorType = 'CannotAddProviderTwice';

const BluefinErrors: Record<BluefinErrorType, string> = {
  CannotAddProviderTwice: 'Cannot add the same provider twice.',
};

const isValidProvidersList = (
  providersList: ProviderType[],
): boolean => Array.isArray(providersList) && providersList.length > 0;

const providersList: ProviderType[] = [];

export const setup = (provider: ProviderType): void => {
  if (
    providersList.every(
      (existingProvider) => existingProvider.name !== provider.name,
    )
  ) {
    providersList.push(provider);
    console.info(`Provider ${provider.name} added`);
  } else {
    throw BluefinErrors.CannotAddProviderTwice;
  }
};

export const sendScreenEvent = (screen: string): void => {
  if (!isValidProvidersList(providersList)) {
    return;
  }
  providersList
    .filter((provider) => provider.screenEvent)
    .forEach((provider) => provider.screenEvent?.(screen));
};
