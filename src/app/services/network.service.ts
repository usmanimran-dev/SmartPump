import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class NetworkService {
    private platformId = inject(PLATFORM_ID);

    // Signal to track online/offline status
    isOnline = signal<boolean>(true); // Default to true for SSR

    constructor() {
        // Only initialize listeners in browser environment
        if (isPlatformBrowser(this.platformId)) {
            this.isOnline.set(navigator.onLine);
            this.initNetworkListeners();
        }
    }

    private initNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline.set(true);
            console.log('🟢 Network: ONLINE');
        });

        window.addEventListener('offline', () => {
            this.isOnline.set(false);
            console.log('🔴 Network: OFFLINE');
        });
    }

    /**
     * Check if the application is currently online
     */
    checkConnection(): boolean {
        if (isPlatformBrowser(this.platformId)) {
            return navigator.onLine;
        }
        return true; // Assume online during SSR
    }
}
