import { Pipe, PipeTransform } from '@angular/core';
import { ChatsDictionary } from '../services/chat.service';

@Pipe({
  name: 'userChatUnreadCounter'
})
export class UserChatUnreadCounterPipe implements PipeTransform {

    transform(chats: ChatsDictionary | null, userId: string): number | undefined {
        if (chats) {
            return chats[userId]?.unreadCount;
        }

        return;
    }

}
