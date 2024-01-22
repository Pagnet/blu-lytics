import * as Sentry from '@sentry/react';
import SentryProvider from './sentry';

jest.mock('@sentry/react', () => ({
  __esModule: true,
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  Severity: {
    Info: 'info',
  },
}));

describe('SentryProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatchUserIdentification should set user in Sentry', () => {
    const userId = '123';
    const userProperties = {
      email: 'test@example.com',
      name: 'Test User',
      customProperty: 'custom',
    };

    SentryProvider.userIdentification(userId, userProperties);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: userId,
      email: userProperties.email,
      username: userProperties.name,
      name: userProperties.name,
      customProperty: 'custom',
    });
  });

  it('dispatchCustomEvent should add breadcrumb in Sentry', () => {
    const eventName = 'customEvent';
    const properties = {
      key1: 'value1',
      key2: 'value2',
    };

    SentryProvider.customEvent(eventName, properties);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'customEvent',
      message: eventName,
      level: 'info',
      data: properties,
      type: 'info',
    });
  });

  it('dispatchScreenEvent should add breadcrumb for screen in Sentry', () => {
    const screenName = 'Home';

    SentryProvider.screenEvent(screenName);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'screen',
      message: screenName,
      level: 'info',
      type: 'info',
    });
  });
});
