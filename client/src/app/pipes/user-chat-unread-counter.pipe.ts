import { Pipe, PipeTransform } from '@angular/core';
import {UserId} from "../services/current-user.service";
import { ChatsDictionary } from '../services/chat.service';

@Pipe({
  name: 'userChatUnreadCounter'
})
export class UserChatUnreadCounterPipe implements PipeTransform {

    transform(chats: ChatsDictionary | null, userId: UserId): number | undefined {
        if (chats) {
            return chats[userId]?.unreadCount;
        }

        return;
    }

}
