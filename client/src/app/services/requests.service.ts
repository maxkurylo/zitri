import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {take} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class RequestsService {

    constructor(private http: HttpClient) { }

    auth(generatedUser: any, roomId: string | undefined): Observable<any> {
        return this.http.post('http://localhost:5001/api/auth', {...generatedUser, roomId}).pipe(take(1));
    }

    changeRoom(newRoomId: string, oldRoomId: string): Observable<any> {
        return this.http.post('http://localhost:5001/api/change-room', { newRoomId, oldRoomId }).pipe(take(1));
    }

    getRoomUsers(roomId: string): Observable<any> {
        return this.http.get(`http://localhost:5001/api/get-room-users?roomId=${roomId}`).pipe(take(1));
    }
}
