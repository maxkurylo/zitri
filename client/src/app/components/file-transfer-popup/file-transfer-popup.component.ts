import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FileTransferStateType} from "../../services/file-transfer.service";

@Component({
  selector: 'app-file-transfer-popup',
  templateUrl: './file-transfer-popup.component.html',
  styleUrls: ['./file-transfer-popup.component.scss']
})
export class FileTransferPopupComponent implements OnInit {
  @Output() onAgree = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input() state: FileTransferStateType | null = null;

  constructor() { }

  ngOnInit(): void {
  }

}
