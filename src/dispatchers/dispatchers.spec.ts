import {
  sendCustomEvent,
  sendScreenEvent,
  sendUserIdentification,
} from './index';
import { providersList } from '../providers';

jest.mock('../initializers', () => ({
  userSelectedEnvironment: 'development',
}));

jest.mock('../providers', () => ({
  providersList: [
    {
      name: 'FakeProvider',
      screenEvent: jest.fn(),
      customEvent: jest.fn(),
      userIdentification: jest.fn(),
    },
    {
      name: 'Statsig',
      screenEvent: jest.fn(),
      customEvent: jest.fn(),
      userIdentification: jest.fn(),
    },
  ],
}));

const statsigStaging = { enabled: false };
jest.mock('../providers/setups/statsig/statsig', () => ({
  isStatsigEnabledInStaging: () => statsigStaging.enabled,
}));

jest.mock('../utils', () => ({
  isValidProvidersList: jest.fn(() => true),
  checkIfMixPanelIsInitialized: jest.fn(),
}));

describe('Event dispatching functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const localStorageKey = '_bl_providers';
  const providers = ['Sentry', 'MixPanel'];

  beforeEach(() => {
    localStorage.setItem(localStorageKey, JSON.stringify([providers]));
    localStorage.setItem('_bl_props', JSON.stringify({}));
  });

  it('should be dispatch sendScreenEvent', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('TestScreen');

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Screen event: TestScreen');
  });

  it('should dispatch sendScreenEvent without properties keeping the legacy log format when _bl_props is empty', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('TestScreen');

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Screen event: TestScreen');
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('TestScreen - '),
    );
  });

  it('should include defaultProperties in log when _bl_props has content and no explicit properties are passed', () => {
    localStorage.setItem('_bl_props', JSON.stringify({ client_uuid: 'abc123' }));
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('home_view');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[blu-lytics]: Screen event: home_view - {"client_uuid":"abc123"}',
    );
  });

  it('should dispatch sendScreenEvent merging defaultProperties with the provided properties', () => {
    localStorage.setItem('_bl_props', JSON.stringify({ origin: 'home' }));
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('credit_list_view', { campaign_name: 'black_friday' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[blu-lytics]: Screen event: credit_list_view - {"origin":"home","campaign_name":"black_friday"}',
    );
  });

  describe('production dispatch (non-development)', () => {
    beforeEach(() => {
      localStorage.setItem('_bl_env', 'production');
      // Remove the providers allow-list so the dispatcher falls back to the
      // full (mocked) providersList instead of filtering by name.
      localStorage.removeItem('_bl_providers');
    });

    afterEach(() => {
      localStorage.removeItem('_bl_env');
    });

    it('should call provider.screenEvent with only the screen when no properties are provided and _bl_props is empty', () => {
      sendScreenEvent('TestScreen');

      expect(providersList[0].screenEvent).toHaveBeenCalledWith(
        'TestScreen',
        undefined,
      );
    });

    it('should call provider.screenEvent with defaultProperties when _bl_props has content and no explicit properties are passed', () => {
      localStorage.setItem('_bl_props', JSON.stringify({ client_uuid: 'abc123', is_economic_group: false }));

      sendScreenEvent('home_view');

      expect(providersList[0].screenEvent).toHaveBeenCalledWith(
        'home_view',
        { client_uuid: 'abc123', is_economic_group: false },
      );
    });

    it('should call provider.screenEvent with the screen and merged properties', () => {
      localStorage.setItem('_bl_props', JSON.stringify({ origin: 'home' }));

      sendScreenEvent('credit_list_view', {
        campaign_name: 'black_friday',
        opportunities_pagblu_count: 3,
      });

      expect(providersList[0].screenEvent).toHaveBeenCalledWith(
        'credit_list_view',
        {
          origin: 'home',
          campaign_name: 'black_friday',
          opportunities_pagblu_count: 3,
        },
      );
    });
  });

  describe('staging dispatch', () => {
    beforeEach(() => {
      localStorage.setItem('_bl_env', 'staging');
      localStorage.removeItem('_bl_providers');
    });

    afterEach(() => {
      localStorage.removeItem('_bl_env');
    });

    it('should only log sendUserIdentification without calling providers', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      sendUserIdentification('123', { name: 'Name' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: User identification: 123 - {"name":"Name"}');
      expect(providersList[0].userIdentification).not.toHaveBeenCalled();
    });

    it('should only log sendScreenEvent without calling providers', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      sendScreenEvent('TestScreen');

      expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Screen event: TestScreen');
      expect(providersList[0].screenEvent).not.toHaveBeenCalled();
    });

    it('should only log sendCustomEvent without calling providers', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      sendCustomEvent('TestEvent', { prop1: 'value1' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Custom event: TestEvent - {"prop1":"value1"}');
      expect(providersList[0].customEvent).not.toHaveBeenCalled();
    });

    it('should not call Statsig in staging when sendInStaging is off', () => {
      sendCustomEvent('TestEvent', { prop1: 'value1' });
      sendScreenEvent('TestScreen');
      sendUserIdentification('123', { name: 'Name' });

      expect(providersList[1].customEvent).not.toHaveBeenCalled();
      expect(providersList[1].screenEvent).not.toHaveBeenCalled();
      expect(providersList[1].userIdentification).not.toHaveBeenCalled();
    });

    describe('with Statsig enabled in staging', () => {
      beforeEach(() => {
        statsigStaging.enabled = true;
      });

      afterEach(() => {
        statsigStaging.enabled = false;
      });

      it('should dispatch only to Statsig, keeping other providers silent', () => {
        localStorage.setItem('_bl_props', JSON.stringify({ client_uuid: 'abc' }));

        sendCustomEvent('TestEvent', { prop1: 'value1' });
        sendScreenEvent('TestScreen');
        sendUserIdentification('123', { name: 'Name' });

        expect(providersList[1].customEvent).toHaveBeenCalledWith('TestEvent', {
          client_uuid: 'abc',
          prop1: 'value1',
        });
        expect(providersList[1].screenEvent).toHaveBeenCalledWith('TestScreen', {
          client_uuid: 'abc',
        });
        expect(providersList[1].userIdentification).toHaveBeenCalledWith('123', {
          name: 'Name',
        });
        expect(providersList[0].customEvent).not.toHaveBeenCalled();
        expect(providersList[0].screenEvent).not.toHaveBeenCalled();
        expect(providersList[0].userIdentification).not.toHaveBeenCalled();
      });

      it('should not dispatch to Statsig in development even when enabled', () => {
        localStorage.setItem('_bl_env', 'development');

        sendCustomEvent('TestEvent', { prop1: 'value1' });

        expect(providersList[1].customEvent).not.toHaveBeenCalled();
      });

      it('should swallow Statsig errors in staging', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (providersList[1].customEvent as jest.Mock).mockImplementationOnce(() => {
          throw new Error('boom');
        });

        expect(() => sendCustomEvent('TestEvent', { prop1: 'value1' })).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[blu-lytics][Statsig] Failed to dispatch in staging',
          expect.any(Error),
        );
        consoleErrorSpy.mockRestore();
      });
    });
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
