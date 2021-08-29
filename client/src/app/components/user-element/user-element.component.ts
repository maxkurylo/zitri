import {Component, Input, OnInit} from '@angular/core';
import {User} from "../../services/current-user.service";

@Component({
  selector: 'app-user-element',
  templateUrl: './user-element.component.html',
  styleUrls: ['./user-element.component.scss']
})
export class UserElementComponent implements OnInit {
  @Input() user: User | null = null;

  constructor() { }

  ngOnInit(): void {
  }

}
