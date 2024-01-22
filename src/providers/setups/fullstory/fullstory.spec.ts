import * as FullStory from '@fullstory/browser';
import FullStoryProvider from './fullstory';

jest.mock('@fullstory/browser', () => ({
  identify: jest.fn(),
  setUserVars: jest.fn(),
  event: jest.fn(),
}));

describe('FullStoryProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatchUserIdentification should call FullStory.identify and FullStory.setUserVars', () => {
    const id = '123';
    const userProperties = { email: 'test@example.com', name: 'Test User' };

    FullStoryProvider.userIdentification(id, userProperties);

    expect(FullStory.identify).toHaveBeenCalledWith(id);
    expect(FullStory.setUserVars).toHaveBeenCalledWith(userProperties);
  });

  it('dispatchCustomEvent should call FullStory.event with properties', () => {
    const event = 'customEvent';
    const properties = { key: 'value' };

    FullStoryProvider.customEvent(event, properties);

    expect(FullStory.event).toHaveBeenCalledWith(event, { properties });
  });

  it('dispatchScreenEvent should call FullStory.event with empty properties', () => {
    const screen = 'testScreen';

    FullStoryProvider.screenEvent(screen);

    expect(FullStory.event).toHaveBeenCalledWith(screen, {});
  });
});
