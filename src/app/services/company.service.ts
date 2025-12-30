import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Company {
    id?: string;
    name: string;
    ownerId: string;
    // add other fields as needed
}

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private firestore = inject(Firestore);

    /**
     * Returns an observable of a single company document.
     */
    getCompany(companyId: string): Observable<Company | null> {
        const docRef = doc(this.firestore, `companies/${companyId}`);
        return from(getDoc(docRef)).pipe(
            map(snapshot => {
                if (!snapshot.exists()) return null;
                return { id: snapshot.id, ...(snapshot.data() as any) } as Company;
            })
        );
    }
}
