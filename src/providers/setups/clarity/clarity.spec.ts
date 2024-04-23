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
});
