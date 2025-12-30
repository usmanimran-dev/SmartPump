import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto space-y-10 page-fade-in py-8 px-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--sp-border)] pb-10">
        <div>
          <h1 class="text-4xl font-extrabold text-[var(--sp-text-main)] tracking-tight">System Control</h1>
          <p class="text-[var(--sp-text-muted)] text-md font-medium mt-1">Cross-platform resource coordination and global configuration hub</p>
        </div>
      </div>

      <!-- Sub-Navigation Grid -->
      <nav class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <a routerLink="stations" routerLinkActive="!border-[var(--sp-primary)] bg-[var(--sp-light-blue)] !text-[var(--sp-primary)]"
           class="dashboard-card !p-5 flex flex-col items-center justify-center gap-3 group border-transparent hover:border-[var(--sp-border)] transition-all">
           <svg class="w-8 h-8 text-[var(--sp-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
           <span class="text-[11px] font-bold uppercase tracking-wider">Stations</span>
        </a>

        <a routerLink="users" routerLinkActive="!border-[var(--sp-primary)] bg-[var(--sp-light-blue)] !text-[var(--sp-primary)]"
           class="dashboard-card !p-5 flex flex-col items-center justify-center gap-3 group border-transparent hover:border-[var(--sp-border)] transition-all">
           <svg class="w-8 h-8 text-[var(--sp-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
           </svg>
           <span class="text-[11px] font-bold uppercase tracking-wider">Staff</span>
        </a>

        <a routerLink="pumps" routerLinkActive="!border-[var(--sp-primary)] bg-[var(--sp-light-blue)] !text-[var(--sp-primary)]"
           class="dashboard-card !p-5 flex flex-col items-center justify-center gap-3 group border-transparent hover:border-[var(--sp-border)] transition-all">
           <svg class="w-8 h-8 text-[var(--sp-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
           <span class="text-[11px] font-bold uppercase tracking-wider">Pumps</span>
        </a>

        <a routerLink="shifts" routerLinkActive="!border-[var(--sp-primary)] bg-[var(--sp-light-blue)] !text-[var(--sp-primary)]"
           class="dashboard-card !p-5 flex flex-col items-center justify-center gap-3 group border-transparent hover:border-[var(--sp-border)] transition-all">
           <svg class="w-8 h-8 text-[var(--sp-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <span class="text-[11px] font-bold uppercase tracking-wider">Shifts</span>
        </a>

        <a routerLink="financials" routerLinkActive="!border-[var(--sp-primary)] bg-[var(--sp-light-blue)] !text-[var(--sp-primary)]"
           class="dashboard-card !p-5 flex flex-col items-center justify-center gap-3 group border-transparent hover:border-[var(--sp-border)] transition-all">
           <svg class="w-8 h-8 text-[var(--sp-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
           </svg>
           <span class="text-[11px] font-bold uppercase tracking-wider">Financials</span>
        </a>
      </nav>

      <!-- Content Area -->
      <div class="mt-8 bg-white/50 rounded-xl">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  imports: [CommonModule, RouterModule]
})
export class AdminComponent { }
