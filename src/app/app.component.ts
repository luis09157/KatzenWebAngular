import { Component } from '@angular/core';
import { LoadingService } from './core/loading.service';
import { refreshFirebaseMessagingSw } from './core/utils/firebase-messaging-sw-register';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'katzenvet-angular';

  constructor(public globalLoading: LoadingService) {
    void refreshFirebaseMessagingSw();
  }
}
