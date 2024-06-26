import { ProviderType } from './provider.types';
import SentryProvider from './setups/sentry/sentry';
import MixPanelProvider from './setups/mixpanel/mixpanel';
import FullStoryProvider from './setups/fullstory/fullstory';
import ClarityProvider from './setups/clarity/clarity';

/**
 * An array containing the default provider(s).
 */
const providersDefault: ProviderType[] = [
  SentryProvider,
  MixPanelProvider,
  FullStoryProvider,
  ClarityProvider,
];
/**
 * An array containing the list of providers, initialized with the default provider(s).
 */
const providersList: ProviderType[] = [...providersDefault];

/**
 * Adds or updates a provider in the providers list.
 *
 * @param provider - The provider to be added or updated.
 */
const setup = (provider: ProviderType): void => {
  const existingIndex = providersList.findIndex(
    (existingProvider) => existingProvider.name === provider.name,
  );

  if (existingIndex !== -1) {
    providersList[existingIndex] = provider;
  } else {
    providersList.unshift(provider);
  }
};

export { providersList, setup };
