import { FCM_SW_CACHE_VERSION, FCM_SW_URL, PORTAL_CACHE_NAME } from './firebase-messaging-sw-register';

describe('firebase-messaging-sw-register', () => {
  it('usa v4 y no precachea con un nombre viejo', () => {
    expect(FCM_SW_CACHE_VERSION).toBe(4);
    expect(PORTAL_CACHE_NAME).toBe('katzen-portal-v4');
    expect(FCM_SW_URL).toBe('/firebase-messaging-sw.js?v=4');
  });
});
