import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideServiceWorker } from '@angular/service-worker';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAYvG-Qyk3hVwxZh9DNr8ISn4f3jxRjEbw",
  authDomain: "smart-pump-e3854.firebaseapp.com",
  projectId: "smart-pump-e3854",
  storageBucket: "smart-pump-e3854.firebasestorage.app",
  messagingSenderId: "773485865936",
  appId: "1:773485865936:web:e2f1b816c56a2b8aed27d5",
  measurementId: "G-WFXX9BJ452"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    // --- Firebase Providers ---
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
