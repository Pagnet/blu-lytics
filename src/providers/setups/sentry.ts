import * as Sentry from '@sentry/react';
import { PropertiesType } from '../../dispatchers/dispatchers.types';
import { ProviderType } from '../provider.types';

interface IUserProperties {
  email?: string;
  name?: string;
  [key: string]: string | undefined;
}

const dispatchUserIdentification = (
  id: string,
  userProperties: IUserProperties,
): void => {
  const userSentry = {
    id,
    email: userProperties.email || '',
    username: userProperties.name || '',
    ...userProperties,
  };
  Sentry.setUser(userSentry);
};

const dispatchCustomEvent = (
  event: string,
  properties: PropertiesType,
): void => {
  const breadcrumb = {
    category: 'customEvent',
    message: event,
    level: Sentry.Severity.Info,
    data: properties,
    type: 'info',
  };
  Sentry.addBreadcrumb(breadcrumb);
};

const dispatchScreenEvent = (screen: string): void => {
  const breadcrumb = {
    category: 'screen',
    message: screen,
    level: Sentry.Severity.Info,
    type: 'info',
  };
  Sentry.addBreadcrumb(breadcrumb);
};

const SentryProvider: ProviderType = {
  name: 'Sentry',
  userIdentification: dispatchUserIdentification,
  customEvent: dispatchCustomEvent,
  screenEvent: dispatchScreenEvent,
};

export default SentryProvider;
