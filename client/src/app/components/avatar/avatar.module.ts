import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AvatarComponent} from "./avatar.component";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";



@NgModule({
  declarations: [AvatarComponent],
    imports: [
        CommonModule,
        MatProgressSpinnerModule
    ],
  exports: [AvatarComponent]
})
export class AvatarModule { }
