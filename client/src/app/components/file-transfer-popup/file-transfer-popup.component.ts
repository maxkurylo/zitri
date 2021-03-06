import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-file-transfer-popup',
  templateUrl: './file-transfer-popup.component.html',
  styleUrls: ['./file-transfer-popup.component.scss']
})
export class FileTransferPopupComponent implements OnInit {
  @Output() onAgree = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input() state: PopupStateType | null = null;
  @Input() fileInfo: FileInfo;
  @Input() isMobile: boolean = false;
  type = PopupStateType;

  constructor() { }

  ngOnInit(): void {
  }

  handleCancel(e: any) {
    e.stopPropagation();
    this.onCancel.emit()
  }

  handleAgree(e: any) {
    e.stopPropagation();
    this.onAgree.emit()
  }
}


export enum PopupStateType {
  'ZIPPING',
  'OFFER',
  'WAITING_FOR_APPROVE',
  'DECLINED',
  'IN_PROGRESS',
  'CONFIRM_CANCEL',
  'ERROR'
}

export interface FileInfo {
  name?: string;
  size?: string;
  type?: string;
  zipped?: boolean;
}
