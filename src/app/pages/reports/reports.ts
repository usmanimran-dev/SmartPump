import { Component, effect, inject, computed, OnDestroy, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { FuelEntryService, FuelEntry } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.html',
  imports: [CommonModule]
})
export class ReportsComponent implements OnDestroy {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  userProfile = this.authService.userProfile;

  // Real-time Data Signal (Filtered per Station) - Reactive Switch
  reportsSignal = toSignal(
    toObservable(computed(() => this.userProfile())).pipe(
      switchMap(profile => {
        return profile?.role === 'owner'
          ? this.fuelService.getAllFuelEntries()
          : this.fuelService.getStationEntries(profile?.stationId || '');
      })
    ),
    { initialValue: [] as FuelEntry[] }
  );

  chart: any;
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('fuelChart');

  // Computed Totals
  totalSold = computed(() => this.reportsSignal().reduce((sum: number, r: FuelEntry) => sum + (Number(r.soldLitres) || 0), 0));
  totalVariance = computed(() => this.reportsSignal().reduce((sum: number, r: FuelEntry) => sum + (Number(r.variance) || 0), 0));

  constructor() {
    effect(() => {
      const data = this.reportsSignal();
      const canvasEl = this.chartCanvas()?.nativeElement;
      if (data && data.length > 0 && canvasEl) {
        this.updateChart(data as FuelEntry[], canvasEl);
      }
    });
  }

  updateChart(reports: FuelEntry[], ctx: HTMLCanvasElement) {
    if (this.chart) this.chart.destroy();

    const recent = reports.slice(0, 7).reverse();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: recent.map(r => r.date),
        datasets: [
          {
            label: 'Dispensed (L)',
            data: recent.map(r => r.soldLitres),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: '#6366f1',
            borderWidth: 1
          },
          {
            label: 'AI Variance (L)',
            data: recent.map(r => r.variance),
            backgroundColor: 'rgba(244, 63, 94, 0.6)',
            borderColor: '#f43f5e',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1' } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          }
        }
      }
    });
  }

  getLossClass(loss: number) {
    if (Math.abs(loss) > 15) return 'text-rose-400 font-bold';
    if (Math.abs(loss) > 5) return 'text-amber-400 font-bold';
    return 'text-slate-400';
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}
