import { StatsigClient } from '@statsig/js-client';
import { runStatsigTriggeredSessionReplay } from '@statsig/session-replay';
import StatsigProvider, {
  buildSessionReplayConfig,
  configureStatsig,
  isStatsigEnabledInStaging,
  isStatsigEvent,
  resetStatsigForTests,
} from './statsig';

const mockClient = {
  initializeAsync: jest.fn(() => Promise.resolve()),
  updateUserAsync: jest.fn(() => Promise.resolve()),
  logEvent: jest.fn(),
  flush: jest.fn(() => Promise.resolve()),
};

jest.mock('@statsig/js-client', () => ({
  StatsigClient: jest.fn(() => mockClient),
}));

jest.mock('@statsig/session-replay', () => ({
  runStatsigTriggeredSessionReplay: jest.fn(),
}));

const ALLOWLIST = [
  'pagblu_installments_offer_view',
  'pagblu_installments_selection_open',
];

const setDefaultProps = (props: Record<string, unknown>) => localStorage.setItem('_bl_props', JSON.stringify(props));

describe('StatsigProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStatsigForTests();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('configureStatsig (fail-closed)', () => {
    it('creates the client with the environment tier and initializes asynchronously', () => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST });

      expect(StatsigClient).toHaveBeenCalledWith(
        'client-key',
        {},
        { environment: { tier: 'production' } },
      );
      expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
      expect(isStatsigEvent('pagblu_installments_offer_view')).toBe(true);
      expect(isStatsigEvent('charge_success')).toBe(false);
    });

    it('creates the client already identified when client_uuid is stored', () => {
      setDefaultProps({ client_uuid: 'client-0' });

      configureStatsig('client-key', 'production', { events: ALLOWLIST });
      StatsigProvider.customEvent('pagblu_installments_offer_view', {
        client_uuid: 'client-0',
      });

      expect(StatsigClient).toHaveBeenCalledWith(
        'client-key',
        { userID: 'client-0' },
        { environment: { tier: 'production' } },
      );
      expect(mockClient.updateUserAsync).not.toHaveBeenCalled();
      expect(mockClient.logEvent).toHaveBeenCalledTimes(1);
    });

    it('does not create the client without an api key', () => {
      configureStatsig('', 'production', { events: ALLOWLIST });

      expect(StatsigClient).not.toHaveBeenCalled();
    });

    it('does not create the client without an allowlist', () => {
      configureStatsig('client-key', 'production', { events: [] });
      configureStatsig('client-key', 'production', undefined);

      expect(StatsigClient).not.toHaveBeenCalled();
    });

    it('never propagates an error thrown while creating the client', () => {
      (StatsigClient as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('boom');
      });

      expect(() => configureStatsig('client-key', 'production', { events: ALLOWLIST })).not.toThrow();
      expect(console.error).toHaveBeenCalled();

      setDefaultProps({ client_uuid: 'client-1' });
      StatsigProvider.customEvent('pagblu_installments_offer_view', {});
      expect(mockClient.logEvent).not.toHaveBeenCalled();
    });

    it('only reports staging as enabled when sendInStaging is true and the client exists', () => {
      configureStatsig('client-key', 'staging', { events: ALLOWLIST });
      expect(isStatsigEnabledInStaging()).toBe(false);

      configureStatsig('client-key', 'staging', {
        events: ALLOWLIST,
        sendInStaging: true,
      });
      expect(isStatsigEnabledInStaging()).toBe(true);

      configureStatsig('', 'staging', { events: ALLOWLIST, sendInStaging: true });
      expect(isStatsigEnabledInStaging()).toBe(false);
    });
  });

  describe('session replay', () => {
    it('is not started unless explicitly enabled', () => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST });
      configureStatsig('client-key', 'production', {
        events: ALLOWLIST,
        sessionReplay: { enabled: false },
      });

      expect(runStatsigTriggeredSessionReplay).not.toHaveBeenCalled();
    });

    it('starts the triggered recorder on the same client, before initialization', () => {
      const order: string[] = [];
      (runStatsigTriggeredSessionReplay as jest.Mock).mockImplementationOnce(() => order.push('replay'));
      mockClient.initializeAsync.mockImplementationOnce(() => {
        order.push('init');
        return Promise.resolve();
      });

      configureStatsig('client-key', 'production', {
        events: ALLOWLIST,
        sessionReplay: { enabled: true },
      });

      expect(runStatsigTriggeredSessionReplay).toHaveBeenCalledWith(
        mockClient,
        expect.objectContaining({
          autoStartRecording: false,
          keepRollingWindow: true,
        }),
      );
      expect(order).toEqual(['replay', 'init']);
    });

    it('masks every text and input by default and honours the unmask/block selectors', () => {
      const { rrwebConfig } = buildSessionReplayConfig({ enabled: true });
      if (!rrwebConfig?.maskTextFn || !rrwebConfig.maskInputFn) throw new Error('missing mask functions');

      document.body.innerHTML = `
        <div id="masked">Fulano 12.345.678/0001-90</div>
        <div data-replay-unmask><span id="visible">Parcelar</span></div>
      `;
      const masked = document.getElementById('masked') as HTMLElement;
      const visible = document.getElementById('visible') as HTMLElement;

      expect(rrwebConfig.maskAllInputs).toBe(true);
      expect(rrwebConfig.maskTextSelector).toBe('*');
      expect(rrwebConfig.blockSelector).toBe('[data-replay-block]');
      expect(rrwebConfig.maskTextFn('Fulano 12.345', masked)).toBe('****** ******');
      expect(rrwebConfig.maskTextFn('Fulano', null)).toBe('******');
      expect(rrwebConfig.maskTextFn('Parcelar', visible)).toBe('Parcelar');
      expect(rrwebConfig.maskInputFn('R$ 10', masked)).toBe('** **');
      expect(rrwebConfig.maskInputFn('R$ 10', visible)).toBe('R$ 10');
    });

    it('accepts custom selectors and recording flags', () => {
      const config = buildSessionReplayConfig({
        enabled: true,
        autoStartRecording: true,
        keepRollingWindow: false,
        unmaskSelector: '.ok',
        blockSelector: '.secret',
      });

      document.body.innerHTML = '<p class="ok"><b id="b">x</b></p>';
      expect(config.autoStartRecording).toBe(true);
      expect(config.keepRollingWindow).toBe(false);
      expect(config.rrwebConfig?.blockSelector).toBe('.secret');
      expect(config.rrwebConfig?.maskTextFn?.('x', document.getElementById('b'))).toBe('x');
    });

    it('never propagates recorder errors', () => {
      (runStatsigTriggeredSessionReplay as jest.Mock).mockImplementationOnce(() => {
        throw new Error('rrweb down');
      });

      expect(() => configureStatsig('client-key', 'production', {
        events: ALLOWLIST,
        sessionReplay: { enabled: true },
      })).not.toThrow();
      expect(console.error).toHaveBeenCalled();

      StatsigProvider.customEvent('pagblu_installments_offer_view', { client_uuid: 'client-1' });
      expect(mockClient.logEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('events', () => {
    beforeEach(() => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST });
    });

    it('logs an allowed custom event identified by client_uuid, without PII', () => {
      StatsigProvider.userIdentification('42', {
        $name: 'Fulano',
        $email: 'fulano@example.com',
      });

      StatsigProvider.customEvent('pagblu_installments_selection_open', {
        client_uuid: 'client-1',
        is_economic_group: false,
        payment_type: 'credit',
      });

      expect(mockClient.updateUserAsync).toHaveBeenCalledTimes(1);
      expect(mockClient.updateUserAsync).toHaveBeenCalledWith({
        userID: 'client-1',
        customIDs: { userID: '42' },
      });
      expect(mockClient.logEvent).toHaveBeenCalledWith(
        'pagblu_installments_selection_open',
        undefined,
        {
          client_uuid: 'client-1',
          is_economic_group: 'false',
          payment_type: 'credit',
        },
      );
      expect(JSON.stringify(mockClient.updateUserAsync.mock.calls)).not.toMatch(
        /fulano/,
      );
    });

    it('logs an allowed screen event with the same allowlist', () => {
      StatsigProvider.screenEvent('pagblu_installments_offer_view', {
        client_uuid: 'client-1',
        eligible: true,
        eligible_count: 3,
      });

      expect(mockClient.logEvent).toHaveBeenCalledWith(
        'pagblu_installments_offer_view',
        undefined,
        { client_uuid: 'client-1', eligible: 'true', eligible_count: '3' },
      );
    });

    it('ignores events outside the allowlist', () => {
      StatsigProvider.customEvent('charge_success', {
        client_uuid: 'client-1',
        charger_cpf_cnpj: '00000000000',
      });
      StatsigProvider.screenEvent('pagblu_list_view', { client_uuid: 'client-1' });

      expect(mockClient.logEvent).not.toHaveBeenCalled();
      expect(mockClient.updateUserAsync).not.toHaveBeenCalled();
    });

    it('does not send anything without client_uuid', () => {
      StatsigProvider.customEvent('pagblu_installments_selection_open', {
        payment_type: 'credit',
      });

      expect(mockClient.logEvent).not.toHaveBeenCalled();
      expect(mockClient.updateUserAsync).not.toHaveBeenCalled();
    });

    it('falls back to the client_uuid stored in _bl_props', () => {
      setDefaultProps({ client_uuid: 'client-2' });

      StatsigProvider.screenEvent('pagblu_installments_offer_view');

      expect(mockClient.updateUserAsync).toHaveBeenCalledWith({
        userID: 'client-2',
      });
      expect(mockClient.logEvent).toHaveBeenCalledWith(
        'pagblu_installments_offer_view',
        undefined,
        {},
      );
    });

    it('updates the user only once per client_uuid', () => {
      const props = { client_uuid: 'client-1' };
      StatsigProvider.customEvent('pagblu_installments_selection_open', props);
      StatsigProvider.customEvent('pagblu_installments_selection_open', props);

      expect(mockClient.updateUserAsync).toHaveBeenCalledTimes(1);
      expect(mockClient.logEvent).toHaveBeenCalledTimes(2);
    });

    it('identifies with client_uuid from _bl_props when user identification arrives', () => {
      setDefaultProps({ client_uuid: 'client-1' });

      StatsigProvider.userIdentification('42', {});

      expect(mockClient.updateUserAsync).toHaveBeenCalledWith({
        userID: 'client-1',
        customIDs: { userID: '42' },
      });
    });

    it('never propagates SDK errors', () => {
      mockClient.logEvent.mockImplementationOnce(() => {
        throw new Error('sdk down');
      });

      expect(() => StatsigProvider.customEvent('pagblu_installments_selection_open', {
        client_uuid: 'client-1',
      })).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[blu-lytics][Statsig]'),
        expect.any(Error),
      );
    });

    it('flushes pending events on beforeunload', () => {
      window.dispatchEvent(new Event('beforeunload'));

      expect(mockClient.flush).toHaveBeenCalled();
    });

    it('forgets the identity on reset', () => {
      StatsigProvider.userIdentification('42', {});
      StatsigProvider.reset?.();

      StatsigProvider.customEvent('pagblu_installments_selection_open', {
        client_uuid: 'client-1',
      });

      expect(mockClient.updateUserAsync).toHaveBeenLastCalledWith({
        userID: 'client-1',
      });
    });
  });
});
