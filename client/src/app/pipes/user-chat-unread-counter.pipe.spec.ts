import { UserChatUnreadCounterPipe } from './user-chat-unread-counter.pipe';

describe('UserChatUnreadCounterPipe', () => {
  it('create an instance', () => {
    const pipe = new UserChatUnreadCounterPipe();
    expect(pipe).toBeTruthy();
  });
});
