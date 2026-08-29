/**
 * Codebase FCM — sin secret Resend (spec 023 + 052 ola 2).
 * Deploy (solo con autorización Luis):
 *   firebase deploy --only functions:fcm:onRecordatorioWritePush
 *   firebase deploy --only functions:fcm:onVacunaCreatedInbox
 *   firebase deploy --only functions:fcm:onVacunaPushSchedule
 */
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

export { onRecordatorioWritePush } from './recordatorio-push';
export { onVacunaCreatedInbox } from './vacuna-inbox';
export { onVacunaPushSchedule } from './recordatorio-push-schedule';
