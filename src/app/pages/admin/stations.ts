import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuelEntryService, Station } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-station-manager',
  standalone: true,
  template: `
    <div class="space-y-8 page-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-black text-white tracking-tight">Station Management</h2>
          <p class="text-slate-500 font-medium">Configure and monitor your gas stations</p>
        </div>
        <button (click)="showForm.set(!showForm())" class="btn-primary flex items-center gap-2">
          <span>{{ showForm() ? 'Close Form' : 'Add Station' }}</span>
        </button>
      </div>

      <!-- Station Form -->
      <div *ngIf="showForm()" class="dashboard-card max-w-xl mx-auto border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
        <h3 class="text-xl font-bold text-white mb-6">New Station Details</h3>
        <form [formGroup]="stationForm" (ngSubmit)="createStation()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Station Name</label>
            <input type="text" formControlName="name" placeholder="e.g. Skyline Main Station" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Location / City</label>
            <input type="text" formControlName="city" placeholder="e.g. Islamabad" class="input-field" />
          </div>
          <button type="submit" [disabled]="stationForm.invalid" class="btn-primary w-full">
            Register Station
          </button>
        </form>
      </div>

      <!-- List -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let station of stations()" class="dashboard-card group relative">
          <div class="absolute top-4 right-4">
            <span class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border"
                  [ngClass]="station.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'">
              {{ station.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <h4 class="text-xl font-bold text-white mb-1">{{ station.name }}</h4>
          <p class="text-slate-500 text-sm mb-4">{{ station.city }}</p>
          
          <div class="pt-4 border-t border-white/5 flex gap-2">
            <button (click)="toggleStationStatus(station)" 
                    class="flex-1 text-xs font-bold transition-colors uppercase tracking-widest"
                    [ngClass]="station.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'">
              {{ station.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button class="flex-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
              Manage Staff
            </button>
          </div>
        </div>
        
        <div *ngIf="stations().length === 0" class="col-span-full py-20 text-center">
          <p class="text-slate-500">No stations registered. Click "Add Station" to begin.</p>
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule, ReactiveFormsModule]
})
export class StationManager {
  private fb = inject(FormBuilder);
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  showForm = signal(false);
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

  stationForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    city: ['', Validators.required]
  });

  async toggleStationStatus(station: Station) {
    if (!station.id) return;
    await this.fuelService.updateStation(station.id, { isActive: !station.isActive });
  }

  async createStation() {
    if (this.stationForm.invalid) return;

    const profile = this.userProfile();
    if (!profile?.orgId) return;

    const val = this.stationForm.value;
    try {
      await this.fuelService.createStation({
        name: val.name!,
        city: val.city!,
        orgId: profile.orgId
      });
      this.stationForm.reset();
      this.showForm.set(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create station');
    }
  }
}
