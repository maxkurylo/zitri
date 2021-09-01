import {Component, OnInit} from '@angular/core';
import {UsersService} from "./services/users.service";
import {CurrentUserService} from "./services/current-user.service";
import {HttpClient} from "@angular/common/http";
import {take} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

    constructor(public us: UsersService) {

    }

    ngOnInit() {
    }

}
