import {
  sendCustomEvent,
  sendScreenEvent,
  sendUserIdentification,
} from './index';

jest.mock('../initializers', () => ({
  userSelectedEnvironment: 'development',
}));

jest.mock('../providers', () => ({
  providersList: [
    {
      screenEvent: jest.fn(),
      customEvent: jest.fn(),
      userIdentification: jest.fn(),
    },
  ],
}));

jest.mock('../utils', () => ({
  isValidProvidersList: jest.fn(() => true),
}));

describe('Event dispatching functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const localStorageKey = '_bl_providers';
  const providers = ['Sentry', 'MixPanel'];

  beforeEach(() => {
    localStorage.setItem(localStorageKey, JSON.stringify([providers]));
  });

  it('should be dispatch sendScreenEvent', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('TestScreen');

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Screen event: TestScreen');
  });

  it('should be dispatch sendCustomEvent', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendCustomEvent('TestEvent', { prop1: 'value1' });

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Custom event: TestEvent - {"prop1":"value1"}');
  });

  it('should be dispatch sendUserIdentification', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendUserIdentification('123', { name: 'Name' });

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: User identification: 123 - {"name":"Name"}');
  });
});
