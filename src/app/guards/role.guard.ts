import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        return toObservable(authService.isInitialized).pipe(
            filter(initialized => initialized), // Wait until sync is done
            take(1),
            map(() => {
                const role = authService.userRole() as UserRole;

                // Super Admin bypass
                if (role === 'super-admin') return true;

                if (allowedRoles.includes(role)) {
                    return true;
                } else {
                    console.warn(`Access denied. Role ${role} is not authorized.`);
                    return router.createUrlTree(['/dashboard']);
                }
            })
        );
    };
};
