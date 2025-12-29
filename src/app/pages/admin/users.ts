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
    <div class="space-y-8 page-fade-in">
      <div>
        <h2 class="text-3xl font-black text-white tracking-tight">Staff Management</h2>
        <p class="text-slate-500 font-medium">Assign roles and stations to your team</p>
      </div>

      <div class="dashboard-card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th class="px-6 py-4">Name / Email</th>
                <th class="px-6 py-4">Assigned Station</th>
                <th class="px-6 py-4">Role</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr *ngFor="let user of users()" class="group hover:bg-white/5 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-slate-200">{{ user.name }}</div>
                  <div class="text-[10px] text-slate-500 font-mono">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <select (change)="updateStation(user.uid, $any($event.target).value)" 
                          class="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-slate-400">
                    <option value="">Unassigned</option>
                    <option *ngFor="let s of stations()" [value]="s.id" [selected]="user.stationId === s.id">
                      {{ s.name }}
                    </option>
                  </select>
                </td>
                <td class="px-6 py-4 text-xs font-bold">
                  <select (change)="updateRole(user.uid, $any($event.target).value)" 
                          class="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-slate-400 uppercase tracking-widest">
                    <option *ngFor="let r of roles" [value]="r" [selected]="user.role === r">{{ r }}</option>
                  </select>
                </td>
                <td class="px-6 py-4">
                   <span [ngClass]="user.isActive ? 'text-emerald-400' : 'text-rose-400'" class="text-[10px] uppercase font-black">
                     {{ user.isActive ? 'Active' : 'Blocked' }}
                   </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button (click)="toggleActive(user)" 
                          [class]="user.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'"
                          class="text-xs font-black uppercase tracking-widest">
                    {{ user.isActive ? 'Block' : 'Unblock' }}
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
