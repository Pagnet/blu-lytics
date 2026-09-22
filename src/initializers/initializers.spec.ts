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

jest.mock('../providers/setups/statsig/statsig', () => ({
  configureStatsig: jest.fn(),
}));

// eslint-disable-next-line import/first
import { configureStatsig } from '../providers/setups/statsig/statsig';

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
        '[blu-lytics] Initialized providers:',
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

    describe('Statsig', () => {
      const statsigParams: IInitializeParams = { providerName: 'Statsig', apiKey: 'client-key' };
      const statsigOptions = { events: ['pagblu_installments_offer_view'] };

      it('configures Statsig in production with the allowlist', () => {
        initializeProviders(statsigParams, { environment: 'production', statsigOptions });

        expect(configureStatsig).toHaveBeenCalledWith('client-key', 'production', statsigOptions);
        expect(JSON.parse(localStorage.getItem('_bl_providers') as string)).toContain('Statsig');
      });

      it('does not configure Statsig in staging without sendInStaging', () => {
        initializeProviders(statsigParams, { environment: 'staging', statsigOptions });

        expect(configureStatsig).not.toHaveBeenCalled();
      });

      it('configures Statsig in staging only with sendInStaging: true', () => {
        const options = { ...statsigOptions, sendInStaging: true };

        initializeProviders(statsigParams, { environment: 'staging', statsigOptions: options });

        expect(configureStatsig).toHaveBeenCalledWith('client-key', 'staging', options);
      });

      it('never configures Statsig in development', () => {
        initializeProviders(statsigParams, {
          environment: 'development',
          statsigOptions: { ...statsigOptions, sendInStaging: true },
        });

        expect(configureStatsig).not.toHaveBeenCalled();
      });
    });
  });
});
