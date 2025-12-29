import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { FuelEntryService, Alert } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  templateUrl: './alerts.html',
  imports: [CommonModule]
})
export class Alerts {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);
  userProfile = this.authService.userProfile;

  alertsSignal = toSignal(
    toObservable(computed(() => this.userProfile()?.stationId)).pipe(
      switchMap(stationId => {
        return stationId
          ? this.fuelService.getStationAlerts(stationId)
          : this.fuelService.getAllAlerts();
      })
    ),
    { initialValue: [] as Alert[] }
  );

  getSeverityBadge(severity: string) {
    switch (severity) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  }
}
