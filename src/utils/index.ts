import mixpanel from 'mixpanel-browser';
import { ProviderType } from '../providers/provider.types';

export const isValidProvidersList = (
  providersList: ProviderType[],
): boolean => Array.isArray(providersList) && providersList.length > 0;

export const checkIfMixPanelIsInitialized = (provider: string): void => {
  const isMixPanelProvider = provider === 'MixPanel';
  if (isMixPanelProvider) {
    const apiKey = localStorage?.getItem('_bl_mp') as string;
    const wasInitialized = localStorage.getItem('_bl_init');

    if (!wasInitialized) {
      mixpanel.init(apiKey, {
        track_pageview: true,
      });
      localStorage.removeItem('_bl_mp');
      localStorage.setItem('_bl_init', 'init');
    }
  }
};
