import { BluefinErrorType, ProviderType } from './provider.types';

const BluefinErrors: Record<BluefinErrorType, string> = {
  CannotAddProviderTwice: 'Cannot add the same provider twice.',
};

const providersList: ProviderType[] = [];

const setup = (provider: ProviderType): void => {
  if (
    providersList.every(
      (existingProvider) => existingProvider.name !== provider.name,
    )
  ) {
    providersList.push(provider);
  } else {
    throw BluefinErrors.CannotAddProviderTwice;
  }
};

export { providersList, setup };
