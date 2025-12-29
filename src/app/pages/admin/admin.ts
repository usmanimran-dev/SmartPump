import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    template: `
    <div class="min-h-screen bg-[#0f172a] text-slate-200">
      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 border-r border-white/5 min-h-screen p-6 bg-slate-900/50 backdrop-blur-xl">
          <div class="mb-10">
            <h1 class="text-xl font-black text-white tracking-widest uppercase">Admin Terminal</h1>
            <p class="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Management Suite</p>
          </div>
          
          <nav class="space-y-2">
            <a routerLink="stations" routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/50" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent transition-all hover:bg-white/5 font-bold text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
               Stations
            </a>
            
            <a routerLink="users" routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/50" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent transition-all hover:bg-white/5 font-bold text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               Staff
            </a>
            
            <a routerLink="shifts" routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/50" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent transition-all hover:bg-white/5 font-bold text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Shifts
            </a>
          </nav>
        </aside>

        <!-- Content -->
        <main class="flex-1 p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
    imports: [CommonModule, RouterModule]
})
export class AdminComponent { }
