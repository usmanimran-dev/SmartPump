import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, orderBy, Timestamp, serverTimestamp, doc, setDoc, limit, deleteDoc } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

export type UserRole = 'super-admin' | 'owner' | 'manager' | 'staff';

export interface UserRecord {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  stationId: string;
  orgId: string;
  companyId?: string; // New: link to companies collection
  isActive: boolean;
}

export interface Station {
  id?: string;
  companyId: string; // Renamed from orgId
  name: string;
  city: string;
  isActive: boolean;
}

export interface Shift {
  id?: string;
  stationId: string;
  pumpId?: string; // Added pumpId
  staffId: string;
  shiftStart: Timestamp;
  shiftEnd?: Timestamp;
  openingMeter: number;
  closingMeter: number;
  totalDispensed: number;
  createdAt: Timestamp;
  isActive: boolean;
}

export interface FuelEntry {
  id?: string;
  stationId: string;
  pumpId?: string; // Added pumpId
  shiftId: string;
  date: string; // ISO or Date
  openingStock: number;
  closingStock: number;
  soldLitres: number;
  pricePerLitre: number;
  revenue: number;
  expectedClosingStock: number;
  variance: number;
  severity: 'low' | 'medium' | 'high';
  createdAt: any;
}

// ... (FuelEntry interface ending)

export interface Alert {
  id?: string;
  stationId: string;
  entryId: string;
  message: string;
  variance: number;
  severity: 'low' | 'medium' | 'high';
  createdAt: any;
  resolved: boolean;
}

export interface Company {
  id?: string;
  name: string;
  logo?: string;
  ownerId: string;
  region?: string;
  createdAt: any;
  isActive: boolean;
}

export interface Expense {
  id?: string;
  stationId: string;
  category: 'electricity' | 'maintenance' | 'salary' | 'other';
  amount: number;
  description: string;
  date: string;
  createdAt: any;
}

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class FuelEntryService {
  private firestore = inject(Firestore);

  // --- Fuel Entries ---
  saveFuelEntry(entry: Partial<FuelEntry>) {
    // Basic AI Calculation (will be refined by python backend later)
    entry.expectedClosingStock = (entry.openingStock || 0) - (entry.soldLitres || 0);
    entry.variance = (entry.closingStock || 0) - entry.expectedClosingStock;
    entry.revenue = (entry.soldLitres || 0) * (entry.pricePerLitre || 0);

    const v = Math.abs(entry.variance || 0);

    // AI Logic Enhancement: Trend analysis & Fraud triggers

    // Check for "Sharp Variance" (Possible Fraud)
    const isSuspicious = v > 100; // >100L variance is highly irregular
    if (isSuspicious) {
      entry.severity = 'high';
      this.logAction({
        userId: 'SYSTEM',
        userName: 'AI_AGENT',
        action: 'FRAUD_DETECTED',
        details: `Irregular variance of ${entry.variance}L at Station ${entry.stationId}. Flagging for immediate audit.`
      });
    } else {
      entry.severity = v > 50 ? 'high' : v > 15 ? 'medium' : 'low';
    }

    entry.createdAt = serverTimestamp();

    const fuelCollection = collection(this.firestore, 'fuelEntries');
    return addDoc(fuelCollection, entry).then(docRef => {
      this.logAction({
        action: 'FUEL_ENTRY_CREATED',
        details: `Entry created for station ${entry.stationId}. Variance: ${entry.variance}L`
      });
      if (entry.severity !== 'low') {
        this.createAlert(entry as FuelEntry, docRef.id);
      }
      return docRef.id;
    });
  }

  getStationEntries(stationId: string) {
    const fuelCollection = collection(this.firestore, 'fuelEntries');
    const q = query(fuelCollection, where('stationId', '==', stationId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(records => records as FuelEntry[]));
  }

  // --- Alerts ---
  private createAlert(entry: FuelEntry, entryId: string) {
    const alert: Partial<Alert> = {
      stationId: entry.stationId,
      entryId: entryId,
      message: `Anomaly detected: Variance of ${entry.variance.toFixed(2)}L in shift ${entry.shiftId}`,
      variance: entry.variance,
      severity: entry.severity,
      createdAt: serverTimestamp(),
      resolved: false
    };
    const alertsCollection = collection(this.firestore, 'alerts');
    addDoc(alertsCollection, alert);
  }

  getStationAlerts(stationId: string) {
    const alertsCollection = collection(this.firestore, 'alerts');
    const q = query(alertsCollection, where('stationId', '==', stationId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(alerts => alerts as Alert[]));
  }

  // --- Global (Owner View) ---
  getAllFuelEntries() {
    const fuelCollection = collection(this.firestore, 'fuelEntries');
    const q = query(fuelCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(records => records as FuelEntry[]));
  }

  getAllAlerts() {
    const alertsCollection = collection(this.firestore, 'alerts');
    const q = query(alertsCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(alerts => alerts as Alert[]));
  }

  // --- Management (Owner/Admin) ---

  // Stations
  createStation(station: Partial<Station>) {
    const stationsCollection = collection(this.firestore, 'stations');
    return addDoc(stationsCollection, {
      ...station,
      createdAt: serverTimestamp(),
      isActive: true
    });
  }

  getStations(companyId: string) {
    const stationsCollection = collection(this.firestore, 'stations');
    const q = query(stationsCollection, where('companyId', '==', companyId));
    return collectionData(q, { idField: 'id' }).pipe(map(s => s as Station[]));
  }

  updateStation(id: string, data: Partial<Station>) {
    const stationDocRef = doc(this.firestore, `stations/${id}`);
    return setDoc(stationDocRef, data, { merge: true });
  }

  deleteStation(id: string) {
    const stationDocRef = doc(this.firestore, `stations/${id}`);
    return deleteDoc(stationDocRef);
  }

  // Users
  getOrgUsers(companyId: string) {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('orgId', '==', companyId));
    return collectionData(q, { idField: 'id' }).pipe(map(u => u as UserRecord[]));
  }

  updateUser(uid: string, data: Partial<UserRecord>) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return setDoc(userDocRef, data, { merge: true });
  }

  // Shifts Management
  createShift(shift: Partial<Shift>) {
    const shiftsCollection = collection(this.firestore, 'shifts');
    return addDoc(shiftsCollection, {
      ...shift,
      createdAt: serverTimestamp(),
      isActive: true
    });
  }

  getStationShifts(stationId: string) {
    const shiftsCollection = collection(this.firestore, 'shifts');
    const q = query(shiftsCollection, where('stationId', '==', stationId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(s => s as Shift[]));
  }

  getActiveShifts(stationId: string) {
    const shiftsCollection = collection(this.firestore, 'shifts');
    const q = query(shiftsCollection,
      where('stationId', '==', stationId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }).pipe(map(s => s as Shift[]));
  }

  updateShift(id: string, data: Partial<Shift>) {
    const shiftDocRef = doc(this.firestore, `shifts/${id}`);
    return setDoc(shiftDocRef, data, { merge: true });
  }

  // --- Multi-Company (Super Admin) ---
  getAllCompanies() {
    const companiesCollection = collection(this.firestore, 'companies');
    const q = query(companiesCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(c => c as Company[]));
  }

  // --- Expenses ---
  addExpense(expense: Partial<Expense>) {
    const expensesCollection = collection(this.firestore, 'expenses');
    return addDoc(expensesCollection, {
      ...expense,
      createdAt: serverTimestamp()
    });
  }

  getStationExpenses(stationId: string) {
    const expensesCollection = collection(this.firestore, 'expenses');
    const q = query(expensesCollection, where('stationId', '==', stationId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(e => e as Expense[]));
  }

  // --- Audit Logs ---
  logAction(log: Partial<AuditLog>) {
    const logsCollection = collection(this.firestore, 'auditLogs');
    return addDoc(logsCollection, {
      ...log,
      timestamp: serverTimestamp()
    });
  }

  getStationLogs(stationId: string) {
    const logsCollection = collection(this.firestore, 'auditLogs');
    const q = query(logsCollection, where('details', '>=', stationId), orderBy('timestamp', 'desc')); // Simple filter
    return collectionData(q, { idField: 'id' }).pipe(map(l => l as AuditLog[]));
  }

  // --- AI & Predictive Analytics ---
  getAIRecommendations(stationId: string) {
    // Current: Real-time calculation based on last 7 entries
    // Future: Python-based ML inference
    const fuelCollection = collection(this.firestore, 'fuelEntries');
    const q = query(fuelCollection, where('stationId', '==', stationId), orderBy('createdAt', 'desc'), limit(7));

    return collectionData(q).pipe(
      map(entries => {
        const avgVariance = entries.reduce((s, e: any) => s + Math.abs(e.variance), 0) / (entries.length || 1);
        const recommendations = [];

        if (avgVariance > 20) {
          recommendations.push({
            type: 'alert',
            message: 'High consistent variance detected. Inspect pump calibration or check for unauthorized extraction.',
            priority: 'high'
          });
        }

        const lastStock = entries.length > 0 ? (entries[0] as any).closingStock : 1000;
        if (lastStock < 500) {
          recommendations.push({
            type: 'stock',
            message: `Fuel levels critical (${lastStock.toFixed(0)}L). Recommended order: ${(5000 - lastStock).toFixed(0)}L immediately.`,
            priority: 'medium'
          });
        }

        return recommendations;
      })
    );
  }
}
