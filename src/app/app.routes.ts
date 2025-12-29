import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { FuelEntryc } from './pages/fuel-entry/fuel-entry';
import { Alerts } from './pages/alerts/alerts';
import { ReportsComponent } from './pages/reports/reports';
import { AdminComponent } from './pages/admin/admin';
import { StationManager } from './pages/admin/stations';
import { UserManager } from './pages/admin/users';
import { ShiftManager } from './pages/admin/shifts';



import { authGuard } from './guards/auth.guard';

import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'fuel-entry', component: FuelEntryc, canActivate: [authGuard] },
  {
    path: 'alerts',
    component: Alerts,
    canActivate: [authGuard, roleGuard(['owner', 'manager'])]
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard, roleGuard(['owner'])]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard(['owner'])],
    children: [
      { path: '', redirectTo: 'stations', pathMatch: 'full' },
      { path: 'stations', component: StationManager },
      { path: 'users', component: UserManager },
      { path: 'shifts', component: ShiftManager }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
