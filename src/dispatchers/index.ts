import { providersList } from '../providers';
import { isValidProvidersList } from '../utils';

export const sendScreenEvent = (screen: string): void => {
  if (!isValidProvidersList(providersList)) {
    return;
  }
  providersList
    .filter((provider) => provider.screenEvent)
    .forEach((provider) => provider.screenEvent?.(screen));
};

export const sendCustomEvent = (): void => {
};
