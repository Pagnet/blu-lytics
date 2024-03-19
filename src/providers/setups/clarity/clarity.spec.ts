import { clarity } from 'clarity-js';
import ClarityProvider from './clarity';

jest.mock('clarity-js', () => ({
  clarity: {
    identify: jest.fn(),
    set: jest.fn(),
  },
}));

describe('ClarityProvider', () => {
  it('dispatchUserIdentification should call clarity.identify with correct arguments', () => {
    const userId = 'user123';

    ClarityProvider.userIdentification(userId, '');

    expect(clarity.identify).toHaveBeenCalledWith(userId);
  });

  it('dispatchCustomEvent should call clarity.set with correct arguments', () => {
    const eventName = 'clickEvent';
    const properties = { key: 'value' };

    ClarityProvider.customEvent(eventName, properties);

    expect(clarity.set).toHaveBeenCalledWith(eventName, 'customEvent');
  });

  it('dispatchScreenEvent should call clarity.set with correct arguments', () => {
    const screenName = 'HomeScreen';

    ClarityProvider.screenEvent(screenName);

    expect(clarity.set).toHaveBeenCalledWith(screenName, 'screen');
  });
});
