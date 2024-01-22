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

  it('should be dispatch sendScreenEvent', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('TestScreen');

    expect(consoleLogSpy).toHaveBeenCalledWith('[BLUEFIN]: Screen event: TestScreen');
  });

  it('should be dispatch sendCustomEvent', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendCustomEvent('TestEvent', { prop1: 'value1' });

    expect(consoleLogSpy).toHaveBeenCalledWith('[BLUEFIN]: Custom event: TestEvent - {"prop1":"value1"}');
  });

  it('should be dispatch sendUserIdentification', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendUserIdentification('123', { name: 'Name' });

    expect(consoleLogSpy).toHaveBeenCalledWith('[BLUEFIN]: User identification: 123 - {"name":"Name"}');
  });
});
