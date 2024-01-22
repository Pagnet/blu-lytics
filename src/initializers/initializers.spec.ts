import {
  initializeProviders,
  userSelectedEnvironment,
} from './index';
import { IInitializeParams, ProviderNameType } from './initializers.types';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
}));

jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
}));

describe('Initializers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('initializeProviders', () => {
    it('should initialize providers and update userSelectedEnvironment', () => {
      const paramsArray: IInitializeParams[] = [{ providerName: 'Mixpanel' as ProviderNameType, apiKey: 'your-api-key' }, { providerName: 'Sentry' as ProviderNameType, apiKey: 'your-api-key' }];
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      initializeProviders(paramsArray, { environment: 'production' });

      expect(userSelectedEnvironment).toBe('production');
      expect(logSpy).toHaveBeenCalledWith(
        '[Bluefin] Initialized providers:',
        expect.arrayContaining(['Mixpanel', 'Sentry']),
      );
      logSpy.mockRestore();
    });

    it('should throw an error when initializing Sentry with an invalid tracesSampleRate', () => {
      const paramsArray: IInitializeParams[] = [
        { providerName: 'Sentry' as ProviderNameType, apiKey: 'your-api-key', tracesSampleRate: 1.5 },
      ];

      expect(() => initializeProviders(paramsArray, { environment: 'production' })).toThrow(
        'tracesSampleRate must be in the range [0, 1]',
      );
    });

    it('should not throw an error when initializing Sentry with a valid tracesSampleRate', () => {
      const validParams: IInitializeParams[] = [
        { providerName: 'Sentry' as ProviderNameType, apiKey: 'your-api-key', tracesSampleRate: 0.5 },
      ];

      expect(() => initializeProviders(validParams, { environment: 'production' })).not.toThrow();
    });

    it('should default to "production" environment if not specified in parameters', () => {
      const paramsArray = { providerName: 'Sentry' as ProviderNameType, apiKey: 'your-api-key' };
      initializeProviders(paramsArray);

      expect(userSelectedEnvironment).toEqual('production');
    });
  });
});
