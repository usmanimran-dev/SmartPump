import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { FuelEntryService, FuelEntry, Alert } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';

import { PumpService, Pump } from '../../services/pump.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  imports: [CommonModule]
})
export class Dashboard implements OnInit {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);
  private pumpService = inject(PumpService);
  private route = inject(ActivatedRoute);

  userProfile = this.authService.userProfile;
  pumpId = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.pumpId.set(params['pumpId'] || null);
    });
  }

  // Real-time signals from Firestore (Reactive Switch)
  entriesSignal = toSignal(
    toObservable(computed(() => ({ profile: this.userProfile(), pumpId: this.pumpId() }))).pipe(
      switchMap(({ profile, pumpId }) => {
        if (pumpId) {
          // Filter by specific pump
          return this.fuelService.getAllFuelEntries().pipe(
            map(entries => entries.filter(e => e.pumpId === pumpId))
          );
        }
        return profile?.role === 'owner' || profile?.role === 'super-admin'
          ? this.fuelService.getAllFuelEntries()
          : this.fuelService.getStationEntries(profile?.stationId || '');
      })
    ),
    { initialValue: [] as FuelEntry[] }
  );

  alertsSignal = toSignal(
    toObservable(computed(() => ({ profile: this.userProfile(), pumpId: this.pumpId() }))).pipe(
      switchMap(({ profile, pumpId }) => {
        if (pumpId) {
          return this.fuelService.getAllAlerts().pipe(
            map(alerts => alerts.filter(a => a.stationId === pumpId)) // Assuming alerts might be linked to pump or station
          );
        }
        return profile?.role === 'owner' || profile?.role === 'super-admin'
          ? this.fuelService.getAllAlerts()
          : this.fuelService.getStationAlerts(profile?.stationId || '');
      })
    ),
    { initialValue: [] as Alert[] }
  );

  // Reactive Pumps list
  pumpsSignal = toSignal(
    toObservable(computed(() => ({ profile: this.userProfile(), pumpId: this.pumpId() }))).pipe(
      switchMap(({ profile, pumpId }) => {
        const companyId = profile?.orgId;
        if (!companyId) return of([] as Pump[]);

        return this.pumpService.getPumpsByCompany(companyId).pipe(
          map(pumps => pumpId ? pumps.filter((p: Pump) => p.id === pumpId) : pumps)
        );
      })
    ),
    { initialValue: [] as Pump[] }
  );

  // Computed Statistics
  totalStockValue = computed(() => {
    const entries = this.entriesSignal();
    // In a real app, we'd sum up tank levels. Here we use the latest entry or a default.
    return entries.length > 0 ? Number(entries[0].closingStock) : 65000;
  });

  fuelSoldTodayValue = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entriesSignal()
      .filter((e: FuelEntry) => e.date === today)
      .reduce((sum: number, e: FuelEntry) => sum + (Number(e.soldLitres) || 0), 0);
  });

  totalVarianceValue = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entriesSignal()
      .filter((e: FuelEntry) => e.date === today)
      .reduce((sum: number, e: FuelEntry) => sum + (Number(e.variance) || 0), 0);
  });

  stats = computed(() => [
    { title: 'Total Sales (Today)', value: `$${(this.fuelSoldTodayValue() * 1.24).toLocaleString()}`, trend: '↑ 12%' },
    { title: 'Active Pumps', value: `${this.pumpsSignal().filter((p: Pump) => p.status === 'active').length} / ${this.pumpsSignal().length}`, subtitle: `${this.pumpsSignal().filter((p: Pump) => p.status !== 'active').length} Inactive` },
    { title: 'Low Stock Alerts', value: this.alertsSignal().length.toString(), critical: this.alertsSignal().length > 0 },
    { title: 'System Stock', value: `${this.totalStockValue().toLocaleString()} L`, subtitle: 'Tank Level Opt.' }
  ]);

  recentActivities = computed(() => {
    return this.alertsSignal().slice(0, 5).map((a: Alert) =>
      `${a.createdAt?.toDate()?.toLocaleTimeString() || 'Just now'}: ${a.message}`
    );
  });

  constructor() {
    console.log('Dashboard Data Engine: Live Sync Engaged');
  }
}
