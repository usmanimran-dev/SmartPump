import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FuelEntryService, Shift, Station, UserRecord } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-shift-manager',
  standalone: true,
  template: `
    <div class="space-y-6 page-fade-in pt-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-[var(--sp-text-main)]">Shift Configuration</h2>
          <p class="text-[var(--sp-text-muted)] text-sm font-medium">Create and assign operation windows</p>
        </div>
        
        <div class="flex gap-3">
          <select [(ngModel)]="selectedStationId" class="input-field !py-1.5 !px-3 text-sm">
            <option value="">All Stations</option>
            <option *ngFor="let s of stations()" [value]="s.id">{{ s.name }}</option>
          </select>
          <button (click)="showForm.set(!showForm())" class="btn-primary">
            {{ showForm() ? 'Hide Form' : 'New Shift' }}
          </button>
        </div>
      </div>

      <!-- Shift Form -->
      <div *ngIf="showForm()" class="dashboard-card max-w-xl mx-auto shadow-lg mb-8">
        <h3 class="text-lg font-bold text-[var(--sp-text-main)] mb-6">Create Operating Shift</h3>
        <form [formGroup]="shiftForm" (ngSubmit)="createShift()" class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Primary Station</label>
            <select formControlName="stationId" class="input-field w-full">
              <option value="" disabled>Select Station...</option>
              <option *ngFor="let s of stations()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Shift Designation</label>
            <input type="text" formControlName="id" placeholder="e.g. Morning SA-1" class="input-field w-full" />
          </div>
          <div>
             <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Assigned Personnel</label>
             <select formControlName="staffId" class="input-field w-full">
               <option value="" disabled>Select Staff...</option>
               <option *ngFor="let u of users()" [value]="u.uid">{{ u.name }} ({{ u.role }})</option>
             </select>
          </div>
          <button type="submit" [disabled]="shiftForm.invalid" class="btn-primary w-full mt-4">
            Initialize Shift Template
          </button>
        </form>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div *ngFor="let shift of shifts()" class="dashboard-card border-l-4 group" 
             [ngClass]="shift.isActive ? 'border-l-[var(--sp-primary)]' : 'border-l-[var(--sp-text-muted)]/20 opacity-60'">
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <h4 class="text-lg font-bold text-[var(--sp-text-main)]">{{ shift.id }}</h4>
              <div class="flex items-center gap-2">
                 <span class="text-[10px] font-bold text-[var(--sp-text-muted)] uppercase tracking-widest">{{ shift.stationId }}</span>
                 <span class="badge" [ngClass]="shift.isActive ? 'bg-green-50 text-[var(--sp-success)]' : 'bg-gray-50 text-[var(--sp-text-muted)]'">
                    {{ shift.isActive ? 'OPERATIONAL' : 'STANDBY' }}
                 </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] font-bold text-[var(--sp-text-muted)] uppercase mb-1">Assigned Field Staff</div>
              <div class="text-sm font-bold text-[var(--sp-primary)] mb-4">{{ shift.staffId }}</div>
              <button (click)="toggleShift(shift)" 
                      [class]="shift.isActive ? 'text-[var(--sp-error)]' : 'text-[var(--sp-success)]'"
                      class="text-[11px] font-bold uppercase tracking-wider hover:underline transition-all">
                {{ shift.isActive ? 'Force Shutdown' : 'Activate Window' }}
              </button>
            </div>
          </div>
        </div>
        
        <div *ngIf="shifts().length === 0" class="col-span-full py-16 text-center text-[var(--sp-text-muted)] italic font-medium bg-white rounded-xl border border-dashed border-[var(--sp-border)]">
           No operational shifts defined for the selected station.
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  // Standard ngModel used for simplicity in selection
  providers: []
})
export class ShiftManager {
  private fb = inject(FormBuilder);
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  showForm = signal(false);
  selectedStationId = signal('');
  userProfile = this.authService.userProfile;

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

  shifts = toSignal(
    toObservable(this.selectedStationId).pipe(
      switchMap(id => id ? this.fuelService.getStationShifts(id) : of([]))
    ),
    { initialValue: [] as Shift[] }
  );

  shiftForm = this.fb.group({
    stationId: ['', Validators.required],
    id: ['', Validators.required], // Using name as ID for simplicity
    staffId: ['', Validators.required]
  });

  async createShift() {
    if (this.shiftForm.invalid) return;
    const val = this.shiftForm.value;
    try {
      await this.fuelService.createShift(val as any);
      this.shiftForm.reset();
      this.showForm.set(false);
    } catch (err) {
      console.error(err);
    }
  }

  async toggleShift(shift: Shift) {
    if (!shift.id) return;
    await this.fuelService.updateShift(shift.id, { isActive: !shift.isActive });
  }
}
