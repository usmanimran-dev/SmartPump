import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
    const router = inject(Router);
    const auth = inject(Auth);

    return authState(auth).pipe(
        take(1),
        map(user => {
            if (user) {
                // If logged in, redirect to enterprise portal
                return router.createUrlTree(['/company-portal']);
            } else {
                return true;
            }
        })
    );
};
