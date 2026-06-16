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
  ],
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

  it('should dispatch sendScreenEvent without properties keeping the legacy log format', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    sendScreenEvent('TestScreen');

    expect(consoleLogSpy).toHaveBeenCalledWith('[blu-lytics]: Screen event: TestScreen');
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('TestScreen - '),
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

    it('should call provider.screenEvent with only the screen when no properties are provided', () => {
      sendScreenEvent('TestScreen');

      expect(providersList[0].screenEvent).toHaveBeenCalledWith(
        'TestScreen',
        undefined,
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
