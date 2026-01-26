import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-[var(--sp-text-main)]">Staff Management</h2>
          <p class="text-[var(--sp-text-muted)] text-sm font-medium">Assign roles and stations to your team</p>
        </div>
        <button (click)="showForm.set(!showForm())" class="btn-primary">
          {{ showForm() ? 'Cancel' : 'Add New Staff' }}
        </button>
      </div>

      <!-- Add Staff Form -->
      <div *ngIf="showForm()" class="dashboard-card max-w-2xl mx-auto shadow-lg mb-8 border border-[var(--sp-primary)]/10">
        <h3 class="text-lg font-bold text-[var(--sp-text-main)] mb-6">Register New Team Member</h3>
        <form [formGroup]="staffForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" formControlName="name" class="input-field w-full" placeholder="e.g. Ahmad Ali" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" formControlName="email" class="input-field w-full" placeholder="staff@smartpump.com" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Password</label>
              <input type="password" formControlName="password" class="input-field w-full" placeholder="••••••••" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Role</label>
              <select formControlName="role" class="input-field w-full">
                <option *ngFor="let r of roles" [value]="r">{{ r | titlecase }}</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Primary Station Assignment</label>
              <select formControlName="stationId" class="input-field w-full">
                <option value="">Unassigned</option>
                <option *ngFor="let s of stations()" [value]="s.id">{{ s.name }} ({{ s.city }})</option>
              </select>
            </div>
          </div>
          <div class="pt-4 flex justify-end items-center gap-4">
            <span *ngIf="staffForm.invalid && staffForm.touched" class="text-xs text-[var(--sp-error)] font-medium">
              Check required fields above.
            </span>
            <button type="button" (click)="createStaff()" [disabled]="authService.isLoading()" class="btn-primary min-w-[140px]">
              {{ authService.isLoading() ? 'Creating User...' : 'Register Staff' }}
            </button>
          </div>
        </form>
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
  imports: [CommonModule, ReactiveFormsModule]
})
export class UserManager {
  private fuelService = inject(FuelEntryService);
  public authService = inject(AuthService); // Public for template
  private fb = inject(FormBuilder);

  roles: UserRole[] = ['staff', 'manager', 'owner'];
  userProfile = this.authService.userProfile;
  showForm = signal(false);

  staffForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['staff' as UserRole, Validators.required],
    stationId: ['']
  });

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

  async createStaff() {
    this.staffForm.markAllAsTouched();
    console.log('Attempting to create staff...', this.staffForm.value);

    if (this.staffForm.invalid) {
      console.warn('Form is invalid');
      alert('Please fill in all fields correctly (Password min 6 chars).');
      return;
    }

    const profile = this.userProfile();
    console.log('Current Profile:', profile);
    if (!profile?.orgId) {
      alert('Error: Your session/organization profile is not loaded.');
      return;
    }

    const val = this.staffForm.value;
    try {
      await this.authService.createStaff({
        name: val.name!,
        email: val.email!,
        role: val.role as UserRole,
        stationId: val.stationId!,
        orgId: profile.orgId,
        isActive: true
      }, val.password!);

      alert('Staff member registered successfully! 🚀');
      this.staffForm.reset({ role: 'staff', stationId: '' });
      this.showForm.set(false);
    } catch (err: any) {
      alert('Registration failed: ' + (err.message || 'Unknown error'));
    }
  }

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
