import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

import { WebRTCConfig } from '../helpers/webrtc-peer';
import { GeneratedUser, User } from '../types/IUser';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private http: HttpClient) {}

    public auth(generatedUser: GeneratedUser): Promise<AuthInfo> {
        return this.http
            .post<AuthInfo>('/api/auth', generatedUser)
            .pipe(take(1))
            .toPromise();
    }

    public changeRoom(
        newRoomId: string | null,
        oldRoomId: string | null
    ): Promise<RoomInfo> {
        return this.http
            .post<RoomInfo>('/api/change-room', { newRoomId, oldRoomId })
            .pipe(take(1))
            .toPromise();
    }

    public webrtc(): Promise<WebRTCConfig> {
        return this.http
            .get<WebRTCConfig>('/api/webrtc')
            .pipe(take(1))
            .toPromise();
    }
}

export interface AuthInfo {
    token: string;
    user: User;
}

export interface RoomInfo {
    roomId: string;
    roomUsers: User[];
}
