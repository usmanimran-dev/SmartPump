import { Component, computed, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FuelEntryService, FuelEntry, Shift } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-fuel-entry',
  standalone: true,
  templateUrl: './fuel-entry.html',
  imports: [ReactiveFormsModule, CommonModule]
})
export class FuelEntryc {
  private fb = inject(FormBuilder);
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  userProfile = this.authService.userProfile;

  // Active shifts for selection (Reactive Switch)
  shifts = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap(profile => {
        const stationId = profile?.stationId;
        return stationId ? this.fuelService.getActiveShifts(stationId) : of([]);
      })
    ),
    { initialValue: [] as Shift[] }
  );

  fuelForm: FormGroup = this.fb.group({
    stationId: ['', Validators.required],
    shiftId: ['', Validators.required],
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    openingStock: [0, [Validators.required, Validators.min(0)]],
    closingStock: [0, [Validators.required, Validators.min(0)]],
    soldLitres: [0, [Validators.required, Validators.min(0)]],
    pricePerLitre: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    // Auto-patch stationId from profile
    effect(() => {
      const profile = this.userProfile();
      if (profile?.stationId) {
        this.fuelForm.patchValue({ stationId: profile.stationId });
      }
    });
  }

  formValues = toSignal(this.fuelForm.valueChanges, { initialValue: this.fuelForm.value });

  variance = computed(() => {
    const val = this.formValues();
    const opening = Number(val?.openingStock) || 0;
    const closing = Number(val?.closingStock) || 0;
    const sold = Number(val?.soldLitres) || 0;
    return closing - (opening - sold);
  });

  revenue = computed(() => {
    const val = this.formValues();
    return (Number(val?.soldLitres) || 0) * (Number(val?.pricePerLitre) || 0);
  });

  async saveFuelEntry() {
    if (this.fuelForm.invalid) return;

    const val = this.fuelForm.value;
    const entry: Partial<FuelEntry> = {
      ...val,
      openingStock: Number(val.openingStock),
      closingStock: Number(val.closingStock),
      soldLitres: Number(val.soldLitres),
      pricePerLitre: Number(val.pricePerLitre),
      revenue: this.revenue(),
      variance: this.variance()
    };

    try {
      await this.fuelService.saveFuelEntry(entry);
      alert('AI Logged: System data updated successfully! 🚀');
      this.fuelForm.reset({
        stationId: val.stationId,
        shiftId: '',
        date: new Date().toISOString().substring(0, 10),
        openingStock: val.closingStock, // Auto-rollover
        closingStock: 0,
        soldLitres: 0,
        pricePerLitre: val.pricePerLitre
      });
    } catch (err) {
      console.error('Sync Error:', err);
      alert('Cloud Sync Failed. Check Connection.');
    }
  }
}
