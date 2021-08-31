import {Component, OnInit} from '@angular/core';
import {UsersService} from "./services/users.service";
import { io } from "socket.io-client";
import {CurrentUserService} from "./services/current-user.service";
import {HttpClient} from "@angular/common/http";
import {take} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

    constructor(public us: UsersService, private cu: CurrentUserService, private http: HttpClient) {

    }

    ngOnInit() {
        const user = this.cu.generateUser();
        const socket = io('http://localhost:5001', { autoConnect: false });

        this.http.post('http://localhost:5001/api/auth', user).pipe(take(1)).subscribe((val: any) => {
            socket.auth = { userId: val.user.id, roomId: val.roomId };

            console.log(val);
            socket.on(val.roomId, (msg: any) => {
                console.log(msg);
            });

            socket.connect();
        }, console.log);
    }

}
