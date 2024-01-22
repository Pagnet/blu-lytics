import mixpanel from 'mixpanel-browser';
import MixPanelProvider from './mixpanel';

jest.mock('mixpanel-browser', () => ({
  identify: jest.fn(),
  track: jest.fn(),
  people: {
    set: jest.fn(),
  },

}));

describe('MixPanelProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('dispatchUserIdentification should call mixpanel.identify and mixpanel.people.set', () => {
    const id = 'testUserId';
    const userProperties = {
      email: 'test@example.com',
      name: 'Test User',
    };

    MixPanelProvider.userIdentification(id, userProperties);

    expect(mixpanel.identify).toHaveBeenCalledWith(id);
    expect(mixpanel.people.set).toHaveBeenCalledWith({
      $name: 'Test User',
      $email: 'test@example.com',
    });
  });

  test('dispatchCustomEvent should call mixpanel.track with event and properties', () => {
    const event = 'testEvent';
    const properties = { key1: 'value1', key2: 'value2' };

    MixPanelProvider.customEvent(event, properties);

    expect(mixpanel.track).toHaveBeenCalledWith(event, { properties });
  });

  test('dispatchScreenEvent should call mixpanel.track with screen', () => {
    const screen = 'testScreen';

    MixPanelProvider.screenEvent(screen);

    expect(mixpanel.track).toHaveBeenCalledWith(screen);
  });
});
