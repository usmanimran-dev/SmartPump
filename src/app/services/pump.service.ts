import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, collectionData, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

export interface Pump {
    id?: string;
    name: string;
    companyId: string;
    stationId?: string; // Link to parent Station
    managerId: string;
    assignedStaff?: string[];
    location?: string; // Optional override, otherwise inherits from Station
    status: 'active' | 'inactive';
    createdAt?: any;
    updatedAt?: any;
}

@Injectable({
    providedIn: 'root'
})
export class PumpService {
    private firestore = inject(Firestore);

    /**
     * Returns an observable of pumps belonging to a specific company.
     */
    getPumpsByCompany(companyId: string): Observable<Pump[]> {
        const pumpsCol = collection(this.firestore, 'pumps');
        const q = query(pumpsCol, where('companyId', '==', companyId));
        return collectionData(q, { idField: 'id' }) as Observable<Pump[]>;
    }

    /**
     * Get all pumps (for admin view)
     */
    getAllPumps(): Observable<Pump[]> {
        const pumpsCol = collection(this.firestore, 'pumps');
        return collectionData(pumpsCol, { idField: 'id' }) as Observable<Pump[]>;
    }

    /**
     * Create a new pump
     */
    createPump(pump: Omit<Pump, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> {
        const pumpsCol = collection(this.firestore, 'pumps');
        return addDoc(pumpsCol, {
            ...pump,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Update an existing pump
     */
    updatePump(pumpId: string, pump: Partial<Pump>): Promise<void> {
        const pumpDoc = doc(this.firestore, `pumps/${pumpId}`);
        return updateDoc(pumpDoc, {
            ...pump,
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Delete a pump
     */
    deletePump(pumpId: string): Promise<void> {
        const pumpDoc = doc(this.firestore, `pumps/${pumpId}`);
        return deleteDoc(pumpDoc);
    }
}
