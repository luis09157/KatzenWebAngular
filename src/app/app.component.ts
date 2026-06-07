import { Component, OnInit } from '@angular/core';
import { LoggerService } from './core/logger.service';
import { LoadingService } from './core/loading.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'katzenvet-angular';

  constructor(
    private logger: LoggerService,
    public globalLoading: LoadingService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.authService.ensureActiveSession();
  }
}
