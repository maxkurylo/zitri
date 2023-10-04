import { Pipe, PipeTransform } from '@angular/core';
import {TransferState, TransferStateMap} from "../services/file-transfer.service";
import {UserId} from "../services/current-user.service";

@Pipe({
  name: 'userTransferState'
})
export class UserTransferStatePipe implements PipeTransform {

    transform(state: TransferStateMap | null, userId: UserId): TransferState | undefined {
        if (state) {
            return state[userId];
        }
        return undefined;
    }

}
