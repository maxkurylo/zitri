import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import { ShareRoomComponent } from './components/share-room/share-room.component';
import {QrCodeModule} from "./components/qr-code/qr-code.module";
import {MatRippleModule} from "@angular/material/core";
import {InitService} from "./services/init.service";
import {AvatarModule} from "./components/avatar/avatar.module";
import {MatDialogModule} from "@angular/material/dialog";
import {ReactiveFormsModule} from "@angular/forms";
import { UserElementComponent } from './components/user-element/user-element.component';
import {HttpClientModule} from "@angular/common/http";
import {MatMenuModule} from "@angular/material/menu";
import { ChatComponent } from './components/chat/chat.component';

function initializeAppFactory(initService: InitService) {
    return () => initService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ShareRoomComponent,
    UserElementComponent,
    ChatComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        QrCodeModule,
        MatRippleModule,
        AvatarModule,
        MatDialogModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatMenuModule
    ],
    providers: [{
        provide: APP_INITIALIZER,
        useFactory: initializeAppFactory,
        deps: [InitService],
        multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
