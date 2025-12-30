import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PumpService, Pump } from '../../services/pump.service';
import { AuthService } from '../../services/auth.service';
import { FuelEntryService, UserRecord, Station } from '../../services/fuel.service';

@Component({
    selector: 'app-pumps-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="space-y-6 page-fade-in pt-4">
            <div class="flex justify-between items-center mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-[var(--sp-text-main)]">Terminal Management</h2>
                  <p class="text-[var(--sp-text-muted)] text-sm font-medium">Configure and monitor fuel dispatch units</p>
                </div>
                <button 
                    (click)="toggleForm()" 
                    class="btn-primary">
                    {{ showForm ? 'Cancel Operation' : 'Add New Terminal' }}
                </button>
            </div>

            <!-- Add/Edit Pump Form -->
            <div *ngIf="showForm" class="dashboard-card max-w-4xl mx-auto shadow-lg mb-8">
                <h3 class="text-lg font-bold text-[var(--sp-text-main)] mb-6">{{ editingPump ? 'Modify Terminal Configuration' : 'Register New Terminal' }}</h3>
                <form (ngSubmit)="savePump()" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Terminal Name *</label>
                            <input 
                                type="text" 
                                [(ngModel)]="formData.name" 
                                name="name"
                                required
                                class="input-field w-full"
                                placeholder="e.g., North Wing Pump 01">
                        </div>

                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Primary Station *</label>
                            <select 
                                [(ngModel)]="formData.stationId" 
                                (change)="onStationChange()"
                                name="stationId"
                                required
                                class="input-field w-full">
                                <option value="">Select Station</option>
                                <option *ngFor="let station of stations" [value]="station.id">
                                    {{ station.name }} ({{ station.city || 'Location N/A' }})
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Geo-Location</label>
                            <input 
                                type="text" 
                                [(ngModel)]="formData.location" 
                                name="location"
                                class="input-field w-full"
                                placeholder="Auto-populated from station selection">
                        </div>

                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Organization ID</label>
                            <input 
                                type="text" 
                                [(ngModel)]="formData.companyId" 
                                name="companyId"
                                required
                                class="input-field w-full"
                                placeholder="Enter Org Reference">
                        </div>

                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Assigned Manager *</label>
                            <select 
                                [(ngModel)]="formData.managerId" 
                                name="managerId"
                                required
                                class="input-field w-full">
                                <option value="">Select Manager</option>
                                <option *ngFor="let user of allUsers" [value]="user.uid">
                                    {{ user.name }} ({{ user.role }})
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Operating Status *</label>
                            <select 
                                [(ngModel)]="formData.status" 
                                name="status"
                                required
                                class="input-field w-full">
                                <option value="active">Active / Operational</option>
                                <option value="inactive">Inactive / Under Maintenance</option>
                            </select>
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-[11px] font-bold text-[var(--sp-text-muted)] uppercase tracking-wider mb-2">Field Staff Access</label>
                            <select 
                                [(ngModel)]="selectedStaff" 
                                name="staff"
                                multiple
                                class="input-field w-full h-24">
                                <option *ngFor="let user of staffUsers" [value]="user.uid">
                                    {{ user.name }} ({{ user.email }})
                                </option>
                            </select>
                            <p class="text-[10px] text-[var(--sp-text-muted)] mt-2 italic">Hold Ctrl/Cmd to select multiple authorized personnel.</p>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-[var(--sp-bg)]">
                        <button 
                            type="submit" 
                            class="btn-primary min-w-[140px]">
                            {{ editingPump ? 'Update Configuration' : 'Create Terminal' }}
                        </button>
                        <button 
                            type="button" 
                            (click)="resetForm()" 
                            class="btn-secondary">
                            Reset Fields
                        </button>
                    </div>
                </form>
            </div>

            <!-- Pumps List -->
            <div class="dashboard-card !p-0 overflow-hidden shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="table-header">
                            <tr>
                                <th class="px-6 py-4">Terminal Name</th>
                                <th class="px-6 py-4">Station</th>
                                <th class="px-6 py-4">Manager</th>
                                <th class="px-6 py-4">Authorized Staff</th>
                                <th class="px-6 py-4 text-center">Status</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--sp-bg)]">
                            <tr *ngFor="let pump of pumps" class="group hover:bg-[var(--sp-light-blue)]/30 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap font-bold text-[var(--sp-text-main)]">{{ pump.name }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-[var(--sp-text-muted)] font-medium">
                                    {{ getStationName(pump.stationId) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-[var(--sp-text-muted)] font-medium">
                                    {{ getManagerName(pump.managerId) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-[var(--sp-text-main)] font-bold">
                                    {{ pump.assignedStaff?.length || 0 }} Users
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="badge" [ngClass]="pump.status === 'active' 
                                        ? 'bg-green-50 text-[var(--sp-success)] border-[var(--sp-success)]/20' 
                                        : 'bg-red-50 text-[var(--sp-error)] border-[var(--sp-error)]/20'">
                                        {{ pump.status }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                        (click)="editPump(pump)" 
                                        class="text-[var(--sp-primary)] font-bold hover:underline mr-4 uppercase text-[11px] tracking-wider">
                                        Edit
                                    </button>
                                    <button 
                                        (click)="deletePump(pump.id!)" 
                                        class="text-[var(--sp-error)] font-bold hover:underline uppercase text-[11px] tracking-wider">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            <tr *ngIf="pumps.length === 0">
                                <td colspan="6" class="px-6 py-12 text-center text-[var(--sp-text-muted)] italic">
                                    No dispatch terminals found. Click "Add New Terminal" to initialize the system.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class PumpsAdminComponent implements OnInit {
    private pumpService = inject(PumpService);
    private authService = inject(AuthService);
    private fuelService = inject(FuelEntryService);

    pumps: Pump[] = [];
    stations: Station[] = [];
    allUsers: UserRecord[] = [];
    staffUsers: UserRecord[] = [];
    showForm = false;
    editingPump: Pump | null = null;
    selectedStaff: string[] = [];

    formData: Partial<Pump> = {
        name: '',
        location: '',
        companyId: '',
        stationId: '',
        managerId: '',
        status: 'active',
        assignedStaff: []
    };

    ngOnInit(): void {
        this.loadPumps();
        this.loadData();
    }

    loadPumps(): void {
        this.pumpService.getAllPumps().subscribe(data => {
            this.pumps = data;
        });
    }

    loadData(): void {
        const profile = this.authService.userProfile();
        if (profile?.orgId) {
            // Load Users
            this.fuelService.getOrgUsers(profile.orgId).subscribe(users => {
                this.allUsers = users;
                this.staffUsers = users.filter(u => u.role === 'staff' || u.role === 'manager');
            });

            // Load Stations
            this.fuelService.getStations(profile.orgId).subscribe(stations => {
                this.stations = stations;
            });
        }
    }

    toggleForm(): void {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }

    onStationChange(): void {
        const stationId = this.formData.stationId;
        if (stationId) {
            const station = this.stations.find(s => s.id === stationId);
            if (station && !this.formData.location) {
                this.formData.location = station.city + ' - ' + station.name;
            }
        }
    }

    savePump(): void {
        // Update assignedStaff from selectedStaff
        this.formData.assignedStaff = this.selectedStaff;

        if (this.editingPump && this.editingPump.id) {
            // Update existing pump
            this.pumpService.updatePump(this.editingPump.id, this.formData).then(() => {
                alert('Pump updated successfully!');
                this.resetForm();
                this.showForm = false;
            }).catch(err => {
                console.error('Error updating pump:', err);
                alert('Failed to update pump');
            });
        } else {
            // Create new pump
            this.pumpService.createPump(this.formData as Omit<Pump, 'id' | 'createdAt' | 'updatedAt'>).then(() => {
                alert('Pump created successfully!');
                this.resetForm();
                this.showForm = false;
            }).catch(err => {
                console.error('Error creating pump:', err);
                alert('Failed to create pump');
            });
        }
    }

    editPump(pump: Pump): void {
        this.editingPump = pump;
        this.formData = { ...pump };
        this.selectedStaff = pump.assignedStaff || [];
        // Ensure stationId is set if missing (legacy data)
        if (!this.formData.stationId) this.formData.stationId = '';
        this.showForm = true;
    }

    deletePump(pumpId: string): void {
        if (confirm('Are you sure you want to delete this pump?')) {
            this.pumpService.deletePump(pumpId).then(() => {
                alert('Pump deleted successfully!');
            }).catch(err => {
                console.error('Error deleting pump:', err);
                alert('Failed to delete pump');
            });
        }
    }

    resetForm(): void {
        this.formData = {
            name: '',
            location: '',
            companyId: '',
            stationId: '',
            managerId: '',
            status: 'active',
            assignedStaff: []
        };
        this.selectedStaff = [];
        this.editingPump = null;
    }

    getManagerName(managerId: string): string {
        const manager = this.allUsers.find(u => u.uid === managerId);
        return manager ? manager.name : managerId;
    }

    getStationName(stationId?: string): string {
        if (!stationId) return 'N/A';
        const station = this.stations.find(s => s.id === stationId);
        return station ? station.name : stationId;
    }
}
