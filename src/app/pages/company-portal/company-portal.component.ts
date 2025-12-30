import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PumpService, Pump } from '../../services/pump.service';
import { FuelEntryService, Station } from '../../services/fuel.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-company-portal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './company-portal.component.html',
    styleUrls: ['./company-portal.component.scss']
})
export class CompanyPortalComponent implements OnInit {
    private pumpService = inject(PumpService);
    private fuelService = inject(FuelEntryService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    userProfile = this.authService.userProfile;
    selectedStationId = signal<string | null>(null);

    // Reactive Stations list
    stations = toSignal(
        toObservable(computed(() => ({
            profile: this.userProfile(),
            routeId: this.route.snapshot.params['companyId']
        }))).pipe(
            switchMap(({ profile, routeId }) => {
                const companyId = routeId || profile?.orgId;
                if (!companyId) return of([] as Station[]);
                return this.fuelService.getStations(companyId);
            })
        ),
        { initialValue: [] as Station[] }
    );

    // Reactive Pumps list based on selected station
    private pumps$ = toObservable(computed(() => ({
        stationId: this.selectedStationId(),
        profile: this.userProfile()
    }))).pipe(
        switchMap(({ stationId, profile }) => {
            const companyId = this.route.snapshot.params['companyId'] || profile?.orgId;
            if (!stationId || !companyId) return of([] as Pump[]);

            return this.pumpService.getPumpsByCompany(companyId).pipe(
                map(data => {
                    const stationPumps = data.filter(p => p.stationId === stationId);
                    const role = profile?.role;
                    const userId = profile?.uid;

                    if (role === 'owner' || role === 'super-admin') {
                        return stationPumps;
                    } else {
                        return stationPumps.filter(pump =>
                            pump.managerId === userId || (pump.assignedStaff?.includes(userId || ''))
                        );
                    }
                })
            );
        })
    );

    pumps = toSignal(this.pumps$, { initialValue: [] as Pump[] });

    ngOnInit(): void { }

    selectStation(stationId: string): void {
        this.selectedStationId.set(stationId);
    }

    goToPumpDashboard(pumpId: string): void {
        this.router.navigate([`/pump/${pumpId}`]);
    }
}
