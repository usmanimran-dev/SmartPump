import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const router = inject(Router);
    const auth = inject(Auth);

    return authState(auth).pipe(
        take(1),
        map(user => {
            if (user) {
                return true;
            } else {
                return router.createUrlTree(['/login']);
            }
        })
    );
};
