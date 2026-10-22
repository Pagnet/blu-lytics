import { StatsigClient } from '@statsig/js-client';
import { runStatsigTriggeredSessionReplay } from '@statsig/session-replay';
import StatsigProvider, {
  checkStatsigGate,
  configureStatsig,
  isStatsigEnabledInStaging,
  isStatsigEvent,
  resetStatsigForTests,
} from './statsig';

const mockClient = {
  initializeAsync: jest.fn(() => Promise.resolve()),
  updateUserAsync: jest.fn(() => Promise.resolve()),
  logEvent: jest.fn(),
  checkGate: jest.fn(() => true),
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

    it('does not create the client without an api key', () => {
      configureStatsig('', 'production', { events: ALLOWLIST });

      expect(StatsigClient).not.toHaveBeenCalled();
    });

    it('creates the client without an allowlist but sends only opted-in events', () => {
      configureStatsig('client-key', 'production', { events: [] });

      expect(StatsigClient).toHaveBeenCalledTimes(1);

      StatsigProvider.customEvent('transfer_accountlist_action', { client_uuid: 'client-1' });
      expect(mockClient.logEvent).not.toHaveBeenCalled();

      StatsigProvider.customEvent(
        'transfer_accountlist_action',
        { client_uuid: 'client-1' },
        { statsig: true },
      );
      expect(mockClient.logEvent).toHaveBeenCalledTimes(1);
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
    it('does not start session replay by default', () => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST });

      expect(runStatsigTriggeredSessionReplay).not.toHaveBeenCalled();
    });

    it('starts the triggered session replay with all text and inputs masked', () => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST, sessionReplay: true });

      expect(runStatsigTriggeredSessionReplay).toHaveBeenCalledWith(mockClient, {
        autoStartRecording: true,
        keepRollingWindow: true,
        rrwebConfig: { maskAllInputs: true, maskTextSelector: '*' },
      });
    });

    it('identifies the user from _bl_props at startup when session replay is on', () => {
      setDefaultProps({ client_uuid: 'client-1' });

      configureStatsig('client-key', 'production', { events: ALLOWLIST, sessionReplay: true });

      expect(StatsigClient).toHaveBeenCalledWith(
        'client-key',
        { userID: 'client-1' },
        { environment: { tier: 'production' } },
      );
      StatsigProvider.customEvent('pagblu_installments_offer_view', {});
      expect(mockClient.updateUserAsync).not.toHaveBeenCalled();
      expect(mockClient.logEvent).toHaveBeenCalledTimes(1);
    });

    it('keeps the anonymous startup user when session replay is off', () => {
      setDefaultProps({ client_uuid: 'client-1' });

      configureStatsig('client-key', 'production', { events: ALLOWLIST });

      expect(StatsigClient).toHaveBeenCalledWith(
        'client-key',
        {},
        { environment: { tier: 'production' } },
      );
    });

    it('keeps sending events when session replay fails to start', () => {
      (runStatsigTriggeredSessionReplay as jest.Mock).mockImplementationOnce(() => {
        throw new Error('boom');
      });
      setDefaultProps({ client_uuid: 'client-1' });

      configureStatsig('client-key', 'production', { events: ALLOWLIST, sessionReplay: true });
      StatsigProvider.customEvent('pagblu_installments_offer_view', {});

      expect(console.error).toHaveBeenCalled();
      expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
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

    it('logs events outside the allowlist when the caller opts in with statsig: true', () => {
      StatsigProvider.customEvent(
        'transfer_accountlist_action',
        { client_uuid: 'client-1', action: 'select_contact' },
        { statsig: true },
      );
      StatsigProvider.screenEvent(
        'transfer_accountlist_view',
        { client_uuid: 'client-1' },
        { statsig: true },
      );

      expect(mockClient.logEvent).toHaveBeenCalledWith(
        'transfer_accountlist_action',
        undefined,
        { client_uuid: 'client-1', action: 'select_contact' },
      );
      expect(mockClient.logEvent).toHaveBeenCalledWith(
        'transfer_accountlist_view',
        undefined,
        { client_uuid: 'client-1' },
      );
    });

    it('ignores events outside the allowlist when statsig is false or absent', () => {
      StatsigProvider.customEvent('charge_success', { client_uuid: 'client-1' }, { statsig: false });

      expect(mockClient.logEvent).not.toHaveBeenCalled();
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

  describe('checkStatsigGate', () => {
    it('evaluates the gate for the client_uuid after the user values load', async () => {
      let finishUpdate: () => void = () => {};
      mockClient.updateUserAsync.mockImplementationOnce(
        () => new Promise<void>((resolve) => { finishUpdate = resolve; }),
      );
      configureStatsig('client-key', 'production', { events: ALLOWLIST });
      setDefaultProps({ client_uuid: 'client-1' });

      const result = checkStatsigGate('frequent_payees_transfer');
      await Promise.resolve();
      expect(mockClient.updateUserAsync).toHaveBeenCalledWith({ userID: 'client-1' });
      expect(mockClient.checkGate).not.toHaveBeenCalled();

      finishUpdate();
      await expect(result).resolves.toBe(true);
      expect(mockClient.checkGate).toHaveBeenCalledWith('frequent_payees_transfer');
    });

    it('waits for the initialization when the user is already identified', async () => {
      let finishInit: () => void = () => {};
      mockClient.initializeAsync.mockImplementationOnce(
        () => new Promise<void>((resolve) => { finishInit = resolve; }),
      );
      setDefaultProps({ client_uuid: 'client-1' });
      configureStatsig('client-key', 'production', { events: ALLOWLIST, sessionReplay: true });

      const result = checkStatsigGate('frequent_payees_transfer');
      await Promise.resolve();
      expect(mockClient.updateUserAsync).not.toHaveBeenCalled();
      expect(mockClient.checkGate).not.toHaveBeenCalled();

      finishInit();
      await expect(result).resolves.toBe(true);
    });

    it('resolves to false when the gate does not pass', async () => {
      mockClient.checkGate.mockReturnValueOnce(false);
      configureStatsig('client-key', 'production', { events: ALLOWLIST });
      setDefaultProps({ client_uuid: 'client-1' });

      await expect(checkStatsigGate('frequent_payees_transfer')).resolves.toBe(false);
    });

    it('resolves to false without the client', async () => {
      setDefaultProps({ client_uuid: 'client-1' });

      await expect(checkStatsigGate('frequent_payees_transfer')).resolves.toBe(false);
      expect(mockClient.checkGate).not.toHaveBeenCalled();
    });

    it('resolves to false without client_uuid', async () => {
      configureStatsig('client-key', 'production', { events: ALLOWLIST });

      await expect(checkStatsigGate('frequent_payees_transfer')).resolves.toBe(false);
      expect(mockClient.checkGate).not.toHaveBeenCalled();
    });

    it('never propagates SDK errors', async () => {
      mockClient.checkGate.mockImplementationOnce(() => {
        throw new Error('boom');
      });
      configureStatsig('client-key', 'production', { events: ALLOWLIST });
      setDefaultProps({ client_uuid: 'client-1' });

      await expect(checkStatsigGate('frequent_payees_transfer')).resolves.toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
