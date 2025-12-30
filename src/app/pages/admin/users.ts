import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FuelEntryService, UserRecord, UserRole, Station } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  template: `
    <div class="space-y-6 page-fade-in pt-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--sp-text-main)]">Staff Management</h2>
          <p class="text-[var(--sp-text-muted)] text-sm font-medium">Assign roles and stations to your team</p>
        </div>
      </div>

      <div class="dashboard-card !p-0 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="table-header">
              <tr>
                <th class="px-6 py-4">Name / Email</th>
                <th class="px-6 py-4">Assigned Station</th>
                <th class="px-6 py-4">Role</th>
                <th class="px-6 py-4 text-center">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--sp-bg)]">
              <tr *ngFor="let user of users()" class="group hover:bg-[var(--sp-light-blue)]/30 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-[var(--sp-text-main)]">{{ user.name }}</div>
                  <div class="text-[11px] text-[var(--sp-text-muted)] font-medium">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <select (change)="updateStation(user.uid, $any($event.target).value)" 
                          class="input-field !py-1 !px-2 text-xs w-full max-w-[160px]">
                    <option value="">Unassigned</option>
                    <option *ngFor="let s of stations()" [value]="s.id" [selected]="user.stationId === s.id">
                      {{ s.name }}
                    </option>
                  </select>
                </td>
                <td class="px-6 py-4">
                  <select (change)="updateRole(user.uid, $any($event.target).value)" 
                          class="input-field !py-1 !px-2 text-xs uppercase tracking-wider font-bold">
                    <option *ngFor="let r of roles" [value]="r" [selected]="user.role === r">{{ r }}</option>
                  </select>
                </td>
                <td class="px-6 py-4 text-center">
                   <span class="badge" [ngClass]="user.isActive ? 'bg-green-50 text-[var(--sp-success)] border-[var(--sp-success)]/20' : 'bg-red-50 text-[var(--sp-error)] border-[var(--sp-error)]/20'">
                     {{ user.isActive ? 'Active' : 'Blocked' }}
                   </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button (click)="toggleActive(user)" 
                          [class]="user.isActive ? 'text-[var(--sp-error)] hover:underline' : 'text-[var(--sp-success)] hover:underline'"
                          class="text-[11px] font-bold uppercase tracking-wider transition-all">
                    {{ user.isActive ? 'Block Access' : 'Restore Access' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule]
})
export class UserManager {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  roles: UserRole[] = ['staff', 'manager', 'owner'];
  userProfile = this.authService.userProfile;

  users = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap((profile): Observable<UserRecord[]> => {
        if (profile?.orgId) {
          return this.fuelService.getOrgUsers(profile.orgId);
        }
        return of([] as UserRecord[]);
      })
    ),
    { initialValue: [] as UserRecord[] }
  );

  stations = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap((profile): Observable<Station[]> => {
        if (profile?.orgId) {
          return this.fuelService.getStations(profile.orgId);
        }
        return of([] as Station[]);
      })
    ),
    { initialValue: [] as Station[] }
  );

  async updateStation(uid: string, stationId: string) {
    await this.fuelService.updateUser(uid, { stationId });
  }

  async updateRole(uid: string, role: any) {
    await this.fuelService.updateUser(uid, { role });
  }

  async toggleActive(user: UserRecord) {
    await this.fuelService.updateUser(user.uid, { isActive: !user.isActive });
  }
}
