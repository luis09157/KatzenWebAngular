import { FCM_SW_CACHE_VERSION, FCM_SW_URL, PORTAL_CACHE_NAME } from './firebase-messaging-sw-register';

describe('firebase-messaging-sw-register', () => {
  it('usa v6 (igual que el SW) y no precachea con un nombre viejo', () => {
    expect(FCM_SW_CACHE_VERSION).toBe(6);
    expect(PORTAL_CACHE_NAME).toBe('katzen-portal-v6');
    expect(FCM_SW_URL).toBe('/firebase-messaging-sw.js?v=6');
  });
});
