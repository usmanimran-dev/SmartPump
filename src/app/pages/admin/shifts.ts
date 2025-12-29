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
    <div class="space-y-8 page-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-black text-white tracking-tight">Shift Configuration</h2>
          <p class="text-slate-500 font-medium">Create and assign operation windows</p>
        </div>
        
        <div class="flex gap-4">
          <select [(ngModel)]="selectedStationId" class="input-field max-w-[200px]">
            <option value="">All Stations</option>
            <option *ngFor="let s of stations()" [value]="s.id">{{ s.name }}</option>
          </select>
          <button (click)="showForm.set(!showForm())" class="btn-primary">
            {{ showForm() ? 'Hide Form' : 'New Shift' }}
          </button>
        </div>
      </div>

      <!-- Shift Form -->
      <div *ngIf="showForm()" class="dashboard-card max-w-xl mx-auto border-indigo-500/20 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-6">Create Operating Shift</h3>
        <form [formGroup]="shiftForm" (ngSubmit)="createShift()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Station</label>
            <select formControlName="stationId" class="input-field">
              <option value="" disabled>Select Station...</option>
              <option *ngFor="let s of stations()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Shift Name (e.g. Morning SA-1)</label>
            <input type="text" formControlName="id" class="input-field" />
          </div>
          <div>
             <label class="block text-sm font-medium text-slate-400 mb-1">Assigned Staff</label>
             <select formControlName="staffId" class="input-field">
               <option value="" disabled>Select Staff...</option>
               <option *ngFor="let u of users()" [value]="u.uid">{{ u.name }} ({{ u.role }})</option>
             </select>
          </div>
          <button type="submit" [disabled]="shiftForm.invalid" class="btn-primary w-full">
            Save Shift Template
          </button>
        </form>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div *ngFor="let shift of shifts()" class="dashboard-card border-l-4" 
             [ngClass]="shift.isActive ? 'border-indigo-500' : 'border-slate-500 opacity-60'">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-lg font-bold text-white">{{ shift.id }}</h4>
              <p class="text-xs text-slate-500 tracking-wider font-black uppercase">{{ shift.stationId }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-slate-500 uppercase font-black">Staff ID</p>
              <p class="text-sm font-bold text-indigo-400 mb-2">{{ shift.staffId }}</p>
              <button (click)="toggleShift(shift)" 
                      [class]="shift.isActive ? 'text-rose-400' : 'text-emerald-400'"
                      class="text-[10px] font-black uppercase tracking-widest hover:underline">
                {{ shift.isActive ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        </div>
        
        <div *ngIf="shifts().length === 0" class="col-span-full py-12 text-center text-slate-500">
           No shifts defined for this station.
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
