/* eslint-disable no-undef */
/**
 * Service worker híbrido: FCM (spec 023/031) + cache best-effort del portal (spec 052 ola 2).
 * Un solo SW en la raíz para no pelear con un ngsw-worker.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDhRLUEpcjpt820tZ15helJVM5SuLUqwCY',
  authDomain: 'katzen-a0e3e.firebaseapp.com',
  databaseURL: 'https://katzen-a0e3e-default-rtdb.firebaseio.com',
  projectId: 'katzen-a0e3e',
  storageBucket: 'katzen-a0e3e.appspot.com',
  messagingSenderId: '262209452533',
  appId: '1:262209452533:web:ba8966a907d98bc2d3c8bc'
});

const messaging = firebase.messaging();
const PORTAL_CACHE = 'katzen-portal-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/katzen-logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'KatzenVet';
  const options = {
    body: payload.notification?.body || 'Tienes un nuevo aviso.',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target =
    data.tipo === 'vacuna_resumen_clinica' ? '/admin/vacunas' : '/portal/notificaciones';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(target);
          }
          return undefined;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
      return undefined;
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PORTAL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== PORTAL_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  if (
    path.includes('firebase') ||
    path.startsWith('/__/') ||
    path.endsWith('firebase-messaging-sw.js')
  ) {
    return;
  }

  const isNavigation = request.mode === 'navigate';
  const isPortalNav = isNavigation && (path === '/' || path.startsWith('/portal'));
  const isStaticAsset =
    path.startsWith('/assets/') ||
    path === '/manifest.webmanifest' ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico');

  if (!isPortalNav && !isStaticAsset) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(PORTAL_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (isNavigation) return caches.match('/index.html');
          return undefined;
        })
      )
  );
});
