import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FuelEntryService, Company } from '../../services/fuel.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-companies-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">
      <div class="mb-10 flex justify-between items-end">
        <div>
          <h1 class="text-4xl font-black text-slate-100 tracking-tighter italic">Global Overview</h1>
          <p class="text-slate-500 font-medium">Multi-tenant Company Control Center</p>
        </div>
        <div class="flex gap-4">
          <div class="dashboard-card !py-2 !px-4 text-center">
            <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Companies</span>
            <span class="text-xl font-bold text-indigo-400">{{ companies().length }}</span>
          </div>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let company of companies()" 
             (click)="goToCompany(company.id!)"
             class="dashboard-card group hover:scale-[1.02] transition-all cursor-pointer border-indigo-500/0 hover:border-indigo-500/50">
          <div class="flex items-start justify-between mb-6">
            <div class="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4m0 10V4m0 10h1m-1 4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
            </div>
            <span class="badge" [ngClass]="company.isActive ? 'badge-success' : 'badge-danger'">
              {{ company.isActive ? 'Active' : 'Paused' }}
            </span>
          </div>
          
          <h2 class="text-xl font-bold text-slate-100 mb-1">{{ company.name }}</h2>
          <p class="text-slate-400 text-sm mb-6">{{ company.region || 'Global Reach' }}</p>
          
          <div class="pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-4">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Status</span>
              <span class="text-sm font-semibold text-slate-300">Operational</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Fleet Size</span>
              <span class="text-sm font-semibold text-slate-300">4 Pumps</span>
            </div>
          </div>
        </div>

        <button class="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="font-bold uppercase tracking-widest text-xs">Onboard New Company</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #030712; }
  `]
})
export class CompaniesOverview {
  private fuelService = inject(FuelEntryService);
  private router = inject(Router);
  companies = toSignal(this.fuelService.getAllCompanies(), { initialValue: [] as Company[] });

  goToCompany(id: string) {
    this.router.navigate(['/company', id]);
  }
}
