import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { initializeApp as initializeTempApp, deleteApp as deleteTempApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword as createTempUser } from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UserRecord, UserRole } from './fuel.service';

export type { UserRecord, UserRole };

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    // Expose the firebase user as a Signal
    userSignal = toSignal(user(this.auth), { initialValue: null });

    // Real-time user profile signal (Includes roles, orgId, stationId)
    userProfile = signal<UserRecord | null>(null);

    // Compatibility compute for legacy code
    userRole = computed(() => this.userProfile()?.role || 'staff');

    // Loading state for login operations
    isLoading = signal(false);
    isInitialized = signal(false);

    private profileSub?: any;

    constructor() {
        // Reactively fetch profile when user changes
        user(this.auth).subscribe(async (u) => {
            if (u) {
                await this.syncUserProfile(u);
            } else {
                this.userProfile.set(null);
            }
        });
    }

    private async syncUserProfile(u: User) {
        const userDocRef = doc(this.firestore, `users/${u.uid}`);

        // Use onSnapshot for real-time profile updates (kill-switch)
        const { onSnapshot } = await import('@angular/fire/firestore');

        this.profileSub = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as UserRecord;
                if (data.isActive === false) {
                    alert('Account deactivated. Please contact your manager.');
                    this.logout();
                    return;
                }
                this.userProfile.set({ ...data, uid: u.uid } as UserRecord);
            } else {
                // Handle new user creation (simplified for this context)
                this.createNewProfile(u, userDocRef);
            }
            this.isInitialized.set(true);
        }, (error) => {
            console.error('Profile sync error:', error);
            this.isInitialized.set(true);
        });
    }

    private async createNewProfile(u: User, docRef: any) {
        const defaultProfile: UserRecord = {
            uid: u.uid,
            name: u.displayName || u.email?.split('@')[0] || 'User',
            email: u.email!,
            role: 'owner', // Default first user to owner
            stationId: '',
            orgId: u.uid, // Their own unique organization
            isActive: true
        };

        await setDoc(docRef, {
            ...defaultProfile,
            createdAt: serverTimestamp()
        });
        // onSnapshot will pick this up automatically
    }

    async login(email: string, pass: string) {
        this.isLoading.set(true);
        try {
            await signInWithEmailAndPassword(this.auth, email, pass);
            this.router.navigate(['/company-portal']);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        } finally {
            this.isLoading.set(false);
        }
    }

    async googleLogin() {
        this.isLoading.set(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
            this.router.navigate(['/company-portal']);
        } catch (error) {
            console.error('Google Login failed', error);
            throw error;
        } finally {
            this.isLoading.set(false);
        }
    }

    async logout() {
        if (this.profileSub) this.profileSub();
        await signOut(this.auth);
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.userSignal();
    }

    async createStaff(data: Partial<UserRecord>, password: string) {
        this.isLoading.set(true);
        // Secondary app approach to avoid signing out the current admin
        const firebaseConfig = {
            apiKey: "AIzaSyAYvG-Qyk3hVwxZh9DNr8ISn4f3jxRjEbw",
            authDomain: "smart-pump-e3854.firebaseapp.com",
            projectId: "smart-pump-e3854",
            storageBucket: "smart-pump-e3854.firebasestorage.app",
            messagingSenderId: "773485865936",
            appId: "1:773485865936:web:e2f1b816c56a2b8aed27d5"
        };

        const tempAppName = 'temp-create-user-' + Math.random().toString(36).substring(7);
        const tempApp = initializeTempApp(firebaseConfig, tempAppName);
        const tempAuth = getTempAuth(tempApp);

        try {
            const userCred = await createTempUser(tempAuth, data.email!, password);
            const uid = userCred.user.uid;

            // Create Profile in Firestore using the primary Firestore instance
            const userDocRef = doc(this.firestore, `users/${uid}`);
            await setDoc(userDocRef, {
                ...data,
                uid: uid,
                createdAt: serverTimestamp(),
                isActive: true
            });

            await deleteTempApp(tempApp);
            return uid;
        } catch (error) {
            console.error('Create staff failed', error);
            await deleteTempApp(tempApp);
            throw error;
        } finally {
            this.isLoading.set(false);
        }
    }
}
