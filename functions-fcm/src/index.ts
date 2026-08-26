/**
 * Codebase FCM — sin secret Resend (spec 023).
 * Deploy: firebase deploy --only functions:fcm:onRecordatorioWritePush
 */
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

export { onRecordatorioWritePush } from './recordatorio-push';

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });
