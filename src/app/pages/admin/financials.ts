import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuelEntryService, Expense, FuelEntry } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pt-4 page-fade-in">
      <div class="grid gap-6 md:grid-cols-3">
        <!-- Revenue Card -->
        <div class="dashboard-card border-l-4 border-l-[var(--sp-success)]">
          <span class="text-[11px] uppercase font-bold text-[var(--sp-text-muted)] tracking-wider block mb-1">Gross Revenue</span>
          <span class="text-3xl font-bold text-[var(--sp-success)]">Rs. {{ totalRevenue() | number:'1.0-0' }}</span>
        </div>
        <!-- Expenses Card -->
        <div class="dashboard-card border-l-4 border-l-[var(--sp-error)]">
          <span class="text-[11px] uppercase font-bold text-[var(--sp-text-muted)] tracking-wider block mb-1">Total Expenses</span>
          <span class="text-3xl font-bold text-[var(--sp-error)]">Rs. {{ totalExpenses() | number:'1.0-0' }}</span>
        </div>
        <!-- Net Profit Card -->
        <div class="dashboard-card border-l-4 border-l-[var(--sp-primary)] bg-[var(--sp-light-blue)]/50">
          <span class="text-[11px] uppercase font-bold text-[var(--sp-text-muted)] tracking-wider block mb-1">Estimated Net Profit</span>
          <span class="text-3xl font-bold text-[var(--sp-primary)]">Rs. {{ (totalRevenue() - totalExpenses()) | number:'1.0-0' }}</span>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Add Expense Form -->
        <div class="dashboard-card shadow-sm">
          <h3 class="text-lg font-bold text-[var(--sp-text-main)] mb-6">Log Operational Expense</h3>
          <form (submit)="saveExpense()" class="space-y-4">
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Expense Category</label>
              <select name="category" [(ngModel)]="newExpense.category" class="input-field w-full">
                <option value="electricity">Electricity / Utilities</option>
                <option value="maintenance">Maintenance & Repairs</option>
                <option value="salary">Staff Salaries</option>
                <option value="other">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Amount (PKR)</label>
              <input type="number" name="amount" [(ngModel)]="newExpense.amount" class="input-field w-full" placeholder="0.00">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Transaction Description</label>
              <textarea name="description" [(ngModel)]="newExpense.description" class="input-field w-full" rows="3" placeholder="e.g. Generator repair or monthly utility bill"></textarea>
            </div>
            <button type="submit" class="btn-primary w-full mt-2">Record Transaction</button>
          </form>
        </div>

        <!-- Recent Expenses List -->
        <div class="dashboard-card !p-0 overflow-hidden shadow-sm">
          <div class="p-6 border-b border-[var(--sp-bg)]">
            <h3 class="text-lg font-bold text-[var(--sp-text-main)]">Electronic Outflow Ledger</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="table-header">
                <tr>
                  <th class="px-6 py-4">Date</th>
                  <th class="px-6 py-4">Category</th>
                  <th class="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="text-sm divide-y divide-[var(--sp-bg)]">
                <tr *ngFor="let exp of expenses()" class="group hover:bg-[var(--sp-light-blue)]/30 transition-all">
                  <td class="px-6 py-4 text-[var(--sp-text-muted)] font-medium">{{ exp.date }}</td>
                  <td class="px-6 py-4">
                    <span class="badge" [ngClass]="'bg-amber-50 text-amber-700 border-amber-200'">{{ exp.category }}</span>
                    <div class="text-[11px] text-[var(--sp-text-muted)] mt-1">{{ exp.description }}</div>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-[var(--sp-text-main)]">Rs. {{ exp.amount | number }}</td>
                </tr>
                <tr *ngIf="expenses().length === 0">
                    <td colspan="3" class="px-6 py-12 text-center text-[var(--sp-text-muted)] italic">No recent outflows recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Financials {
  private fuelService = inject(FuelEntryService);
  private authService = inject(AuthService);

  userProfile = this.authService.userProfile;

  expenses = toSignal(
    toObservable(this.userProfile).pipe(
      switchMap(p => this.fuelService.getStationExpenses(p?.stationId || ''))
    ),
    { initialValue: [] as Expense[] }
  );

  entries = toSignal(
    toObservable(this.userProfile).pipe(
      switchMap(p => this.fuelService.getStationEntries(p?.stationId || ''))
    ),
    { initialValue: [] as FuelEntry[] }
  );

  totalRevenue = computed(() => this.entries().reduce((sum, e) => sum + (e.revenue || 0), 0));
  totalExpenses = computed(() => this.expenses().reduce((sum, e) => sum + (e.amount || 0), 0));

  newExpense: Partial<Expense> = {
    category: 'other',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  async saveExpense() {
    if (!this.newExpense.amount || this.newExpense.amount <= 0) return;

    await this.fuelService.addExpense({
      ...this.newExpense,
      stationId: this.userProfile()?.stationId
    });

    this.newExpense = {
      category: 'other',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
  }
}
