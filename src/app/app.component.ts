import { Component, OnInit } from '@angular/core';
import { LoggerService } from './core/logger.service';
import { LoadingService } from './core/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'katzenvet-angular';

  constructor(
    private logger: LoggerService,
    public globalLoading: LoadingService
  ) {}

  ngOnInit(): void {
    // App Check / reCAPTCHA solo en pantallas de login (ver AppCheckService)
  }
}
