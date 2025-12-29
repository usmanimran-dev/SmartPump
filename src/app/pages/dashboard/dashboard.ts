import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { FuelEntryService, FuelEntry, Alert } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { SmartInsightsWidget } from './smart-insights/smart-insights.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  imports: [CommonModule, SmartInsightsWidget]
})
export class Dashboard {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  userProfile = this.authService.userProfile;

  // Real-time signals from Firestore (Reactive Switch)
  entriesSignal = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap(profile => {
        return profile?.role === 'owner'
          ? this.fuelService.getAllFuelEntries()
          : this.fuelService.getStationEntries(profile?.stationId || '');
      })
    ),
    { initialValue: [] as FuelEntry[] }
  );

  alertsSignal = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap(profile => {
        return profile?.role === 'owner'
          ? this.fuelService.getAllAlerts()
          : this.fuelService.getStationAlerts(profile?.stationId || '');
      })
    ),
    { initialValue: [] as Alert[] }
  );

  // Computed Statistics (AI Schema)
  totalStock = computed(() => {
    const entries = this.entriesSignal();
    return entries.length > 0 ? entries[0].closingStock : 0;
  });

  fuelSoldToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entriesSignal()
      .filter((e: FuelEntry) => e.date === today)
      .reduce((sum: number, e: FuelEntry) => sum + (Number(e.soldLitres) || 0), 0);
  });

  totalVariance = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entriesSignal()
      .filter((e: FuelEntry) => e.date === today)
      .reduce((sum: number, e: FuelEntry) => sum + (Number(e.variance) || 0), 0);
  });

  activeAlertsCount = computed(() => this.alertsSignal().length);

  recentActivities = computed(() => {
    return this.alertsSignal().slice(0, 5).map((a: Alert) =>
      `${a.createdAt?.toDate()?.toLocaleTimeString() || 'Just now'}: ${a.message}`
    );
  });

  stats = computed(() => [
    { title: 'System Stock', value: `${this.totalStock()?.toFixed(2)} L` },
    { title: 'Dispensed Today', value: `${this.fuelSoldToday().toFixed(2)} L` },
    { title: 'Total Variance', value: `${this.totalVariance().toFixed(2)} L` },
    { title: 'AI Alerts', value: this.activeAlertsCount().toString() }
  ]);

  constructor() {
    console.log('Dashboard Data Engine: Live Sync Engaged');
  }
}
