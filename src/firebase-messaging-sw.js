/* eslint-disable no-undef */
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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'KatzenVet';
  const options = {
    body: payload.notification?.body || 'Tienes un nuevo aviso.',
    icon: '/assets/icons/icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});
