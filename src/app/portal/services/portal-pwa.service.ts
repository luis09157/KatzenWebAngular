import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { PwaManifestService } from '../../core/services/pwa-manifest.service';

/**
 * Fachada PWA del portal (spec 052 + 087).
 * El install real vive en `PwaInstallService`; aquí se fuerza manifest portal.
 */
@Injectable({ providedIn: 'root' })
export class PortalPwaService {
  readonly installAvailable$: BehaviorSubject<boolean>;

  constructor(
    private pwaInstall: PwaInstallService,
    private pwaManifest: PwaManifestService
  ) {
    this.installAvailable$ = this.pwaInstall.installAvailable$;
  }

  init(): void {
    this.pwaManifest.setKind('portal');
    this.pwaInstall.init();
  }

  isStandalone(): boolean {
    return this.pwaInstall.isStandalone();
  }

  isIosSafari(): boolean {
    return this.pwaInstall.isIosSafari();
  }

  showIosInstallHint(): boolean {
    return this.pwaInstall.showIosInstallHint();
  }

  promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    return this.pwaInstall.promptInstall();
  }
}
