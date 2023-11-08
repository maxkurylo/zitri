import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShareRoomComponent } from './components/share-room/share-room.component';
import { QrCodeModule } from './components/qr-code/qr-code.module';
import { MatRippleModule } from '@angular/material/core';
import { InitService } from './services/init.service';
import { AvatarModule } from './components/avatar/avatar.module';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { UserElementComponent } from './components/user-element/user-element.component';
import { HttpClientModule } from '@angular/common/http';
import { MatMenuModule } from '@angular/material/menu';
import { ChatComponent } from './components/chat/chat.component';
import { JwtModule, JwtModuleOptions } from '@auth0/angular-jwt';
import { FileTransferPopupComponent } from './components/file-transfer-state/file-transfer-state.component';
import { WrapFileNamePipe } from './pipes/wrap-file-name.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { UsersListComponent } from './components/users-list/users-list.component';
import { UserTransferStatePipe } from './pipes/user-transfer-state.pipe';
import { JoinRoomPopupComponent } from './components/join-room-popup/join-room-popup.component';
import { AboutPopupComponent } from './components/about-popup/about-popup.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { InviteToTheRoomComponent } from './components/invite-to-the-room/invite-to-the-room.component';
import { BottomSheetComponent } from './components/bottom-sheet/bottom-sheet.component';
import { UserChatUnreadCounterPipe } from './pipes/user-chat-unread-counter.pipe';
import { LinkifyPipe } from './pipes/linkify.pipe';
import { UpdateAvailableBannerComponent } from './components/update-available-banner/update-available-banner.component';
import { CirclesComponent } from './components/circles/circles.component';
import { MainScreenEmptyComponent } from './components/main-screen-empty/main-screen-empty.component';
import { RemoveHttpPipe } from './pipes/remove-http.pipe';

const jwtModuleOptions: JwtModuleOptions = {
    config: {
        tokenGetter: () => sessionStorage.getItem('token'),
    },
};

function initializeAppFactory(initService: InitService) {
    return () => initService.init();
}

@NgModule({
    declarations: [
        AppComponent,
        HeaderComponent,
        ShareRoomComponent,
        UserElementComponent,
        UserChatUnreadCounterPipe,
        LinkifyPipe,
        RemoveHttpPipe,
        ChatComponent,
        FileTransferPopupComponent,
        WrapFileNamePipe,
        UsersListComponent,
        UserTransferStatePipe,
        JoinRoomPopupComponent,
        AboutPopupComponent,
        InviteToTheRoomComponent,
        BottomSheetComponent,
        UpdateAvailableBannerComponent,
        CirclesComponent,
        MainScreenEmptyComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        JwtModule.forRoot(jwtModuleOptions),
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        QrCodeModule,
        MatRippleModule,
        MatBottomSheetModule,
        AvatarModule,
        MatDialogModule,
        ReactiveFormsModule,
        MatMenuModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000',
        }),
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppFactory,
            deps: [InitService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
