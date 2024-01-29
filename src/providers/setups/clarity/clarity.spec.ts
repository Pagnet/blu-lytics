import { clarity } from 'react-microsoft-clarity';
import ClarityProvider from './clarity';

jest.mock('react-microsoft-clarity', () => ({
  clarity: {
    identify: jest.fn(),
    setTag: jest.fn(),
  },
}));

describe('ClarityProvider', () => {
  it('dispatchUserIdentification should call clarity.identify with correct arguments', () => {
    const userId = 'user123';

    ClarityProvider.userIdentification(userId, { userProperties: 'id' });

    expect(clarity.identify).toHaveBeenCalledWith(userId, { userProperties: 'id' });
  });

  it('dispatchCustomEvent should call clarity.setTag with correct arguments', () => {
    const eventName = 'clickEvent';
    const properties = { key: 'value' };

    ClarityProvider.customEvent(eventName, properties);

    expect(clarity.setTag).toHaveBeenCalledWith(eventName, 'customEvent');
  });

  it('dispatchScreenEvent should call clarity.setTag with correct arguments', () => {
    const screenName = 'HomeScreen';

    ClarityProvider.screenEvent(screenName);

    expect(clarity.setTag).toHaveBeenCalledWith(screenName, 'screen');
  });
});
