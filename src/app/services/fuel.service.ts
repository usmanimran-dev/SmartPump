import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, orderBy, Timestamp, serverTimestamp, doc, setDoc } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

export type UserRole = 'owner' | 'manager' | 'staff';

export interface UserRecord {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  stationId: string;
  orgId: string;
  isActive: boolean;
}

export interface Station {
  id?: string;
  orgId: string;
  name: string;
  city: string;
  isActive: boolean;
}

export interface Shift {
  id?: string;
  stationId: string;
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

    // Severity detection
    const v = Math.abs(entry.variance);
    entry.severity = v > 50 ? 'high' : v > 15 ? 'medium' : 'low';
    entry.createdAt = serverTimestamp();

    const fuelCollection = collection(this.firestore, 'fuelEntries');
    return addDoc(fuelCollection, entry).then(docRef => {
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

  getStations(orgId: string) {
    const stationsCollection = collection(this.firestore, 'stations');
    const q = query(stationsCollection, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map(s => s as Station[]));
  }

  updateStation(id: string, data: Partial<Station>) {
    const stationDocRef = doc(this.firestore, `stations/${id}`);
    return setDoc(stationDocRef, data, { merge: true });
  }

  // Users
  getOrgUsers(orgId: string) {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('orgId', '==', orgId));
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
}
