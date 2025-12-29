import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, orderBy, limit, collectionData, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

interface Insight {
    id?: string;
    orgId: string;
    date: string;
    message: string;
    type: 'positive' | 'negative' | 'neutral';
    icon: string;
    createdAt: Timestamp;
}

@Component({
    selector: 'app-smart-insights',
    standalone: true,
    template: `
    <div class="dashboard-card border-l-4 border-indigo-500/50 space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span class="text-xl">🧠</span> Smart Insights
        </h3>
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
          {{ generatedTime() }}
        </span>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="space-y-3 animate-pulse">
        <div class="h-12 bg-slate-800 rounded-lg"></div>
        <div class="h-12 bg-slate-800 rounded-lg"></div>
        <div class="h-12 bg-slate-800 rounded-lg"></div>
      </div>

      <!-- Insights List -->
      <div *ngIf="!isLoading()" class="space-y-3">
        <div *ngFor="let insight of insights()" 
             class="flex items-start gap-3 p-3 rounded-lg transition-all duration-300"
             [ngClass]="{
               'bg-emerald-500/10 border border-emerald-500/20': insight.type === 'positive',
               'bg-rose-500/10 border border-rose-500/20': insight.type === 'negative',
               'bg-slate-800/50 border border-slate-700/30': insight.type === 'neutral'
             }">
          <span class="text-xl flex-shrink-0">{{ insight.icon }}</span>
          <p class="text-sm text-slate-300 leading-relaxed">{{ insight.message }}</p>
        </div>

        <div *ngIf="insights().length === 0" class="text-center py-6 text-slate-500 text-sm">
          <p>No insights generated yet.</p>
          <p class="text-xs mt-1">Insights are generated daily at midnight.</p>
        </div>
      </div>
    </div>
  `,
    imports: [CommonModule]
})
export class SmartInsightsWidget {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    userProfile = this.authService.userProfile;

    private insightsQuery$ = toObservable(computed(() => this.userProfile())).pipe(
        switchMap((profile): Observable<Insight[]> => {
            if (!profile?.orgId) return of([]);

            const today = new Date().toISOString().split('T')[0];
            const insightsCollection = collection(this.firestore, 'insights');
            const q = query(
                insightsCollection,
                where('orgId', '==', profile.orgId),
                where('date', '==', today),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            return collectionData(q, { idField: 'id' }).pipe(
                map(docs => docs as Insight[])
            );
        })
    );

    insights = toSignal(this.insightsQuery$, { initialValue: [] as Insight[] });

    isLoading = computed(() => !this.authService.isInitialized());

    generatedTime = computed(() => {
        const list = this.insights();
        if (list.length > 0 && list[0].createdAt) {
            const date = list[0].createdAt.toDate();
            return `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return 'Awaiting data...';
    });
}
