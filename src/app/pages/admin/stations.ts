import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuelEntryService, Station } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-station-manager',
  standalone: true,
  template: `
    <div class="space-y-8 page-fade-in">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-[var(--sp-text-main)]">Station Management</h2>
          <p class="text-[var(--sp-text-muted)] font-medium text-sm">Configure and monitor your gas stations</p>
        </div>
        <button (click)="showForm.set(!showForm())" class="btn-primary">
          <span>{{ showForm() ? 'Close Form' : 'Add Station' }}</span>
        </button>
      </div>

      <!-- Station Form -->
      <div *ngIf="showForm()" class="dashboard-card max-w-xl mx-auto shadow-lg mb-8">
        <h3 class="text-lg font-bold text-[var(--sp-text-main)] mb-6">New Station Details</h3>
        <form [formGroup]="stationForm" (ngSubmit)="createStation()" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-[var(--sp-text-muted)] mb-1 uppercase tracking-wider">Station Name</label>
            <input type="text" formControlName="name" placeholder="e.g. Skyline Main Station" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[var(--sp-text-muted)] mb-1 uppercase tracking-wider">Location / City</label>
            <input type="text" formControlName="city" placeholder="e.g. Islamabad" class="input-field w-full" />
          </div>
          <button type="submit" [disabled]="stationForm.invalid" class="btn-primary w-full">
            Register Station
          </button>
        </form>
      </div>

      <!-- List -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let station of stations()" class="dashboard-card group relative">
          <div class="flex justify-between items-start mb-4">
            <h4 class="text-lg font-bold text-[var(--sp-text-main)] mb-1">{{ station.name }}</h4>
            <span class="badge"
                  [ngClass]="station.isActive ? 'bg-green-50 text-[var(--sp-success)] border-[var(--sp-success)]/20' : 'bg-gray-50 text-[var(--sp-text-muted)] border-gray-200'">
              {{ station.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="text-[var(--sp-text-muted)] text-xs mb-4 flex items-center gap-1">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
             {{ station.city }}
          </p>
          
          <div class="pt-4 border-t border-[var(--sp-bg)] flex gap-2">
            <button (click)="toggleStationStatus(station)" 
                    class="flex-1 text-[11px] font-bold transition-colors uppercase tracking-wider"
                    [ngClass]="station.isActive ? 'text-[var(--sp-error)]' : 'text-[var(--sp-success)]'">
              {{ station.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button (click)="manageStaff()" 
                    class="flex-1 text-[11px] font-bold text-[var(--sp-primary)] hover:underline uppercase tracking-wider">
              Manage Staff
            </button>
            <button (click)="deleteStation(station)" 
                    class="p-2 text-[var(--sp-error)] hover:bg-red-50 rounded-lg transition-colors group/btn"
                    title="Delete Station">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
  private router = inject(Router);

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

  manageStaff() {
    this.router.navigate(['/admin/users']);
  }

  async toggleStationStatus(station: Station) {
    if (!station.id) return;
    await this.fuelService.updateStation(station.id, { isActive: !station.isActive });
  }

  async deleteStation(station: Station) {
    if (!station.id) return;
    if (confirm(`ARE YOU ABSOLUTELY SURE? Deleting "${station.name}" will remove it from the system. This action cannot be undone.`)) {
      try {
        await this.fuelService.deleteStation(station.id);
        console.log('Station deleted successfully');
      } catch (err) {
        console.error('Delete station error:', err);
        alert('Failed to delete station. It may have associated records preventing deletion.');
      }
    }
  }

  async createStation() {
    if (this.stationForm.invalid) return;

    this.authService.isLoading.set(true); // Reuse loading state
    const profile = this.userProfile();

    if (!profile?.orgId) {
      alert('User profile not loaded. Please wait a moment and try again.');
      this.authService.isLoading.set(false);
      return;
    }

    const val = this.stationForm.value;
    try {
      await this.fuelService.createStation({
        name: val.name!,
        city: val.city!,
        companyId: profile.orgId,
        isActive: true
      });
      this.stationForm.reset();
      this.showForm.set(false);
      console.log('Station registered successfully');
    } catch (err) {
      console.error('Create station error:', err);
      alert('Failed to register station. Please try again.');
    } finally {
      this.authService.isLoading.set(false);
    }
  }
}
