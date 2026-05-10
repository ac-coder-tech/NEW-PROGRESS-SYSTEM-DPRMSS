import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc,
  addDoc, updateDoc, deleteDoc, query, where, orderBy,
  getDocs, getDoc, Timestamp, limit,
  getCountFromServer, getDocsFromCache, getDocFromCache
} from '@angular/fire/firestore';
import { Patient, MedicalRecord, Appointment, StaffUser } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  private async getDocsWithOffline(q: any): Promise<any> {
    try {
      return await getDocs(q);
    } catch (e) {
      console.warn('Offline — reading from cache...');
      return await getDocsFromCache(q);
    }
  }

  async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const col = collection(this.firestore, 'patients');
    const snap = await this.getDocsWithOffline(col);
    let maxNum = 0;
    snap.docs.forEach((d: any) => {
      const data = d.data() as any;
      const id: string = data.patientId || '';
      const parts = id.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const num = String(maxNum + 1).padStart(4, '0');
    return `PAT-${year}-${num}`;
  }

  async addPatient(patient: any): Promise<string> {
    try {
      const ref = await addDoc(collection(this.firestore, 'patients'), {
        ...(patient as any),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return ref.id;
    } catch (err) {
      console.error('FIRESTORE ERROR:', err);
      throw err;
    }
  }

  async updatePatient(id: string, data: any): Promise<void> {
    await updateDoc(doc(this.firestore, 'patients', id), {
      ...(data as any),
      updatedAt: Timestamp.now()
    });
  }

  async deletePatient(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'patients', id));
    const q = query(
      collection(this.firestore, 'medicalRecords'),
      where('patientId', '==', id)
    );
    const snap = await this.getDocsWithOffline(q);
    const deletes = snap.docs.map((d: any) => deleteDoc(d.ref));
    await Promise.all(deletes);
  }

  async getPatient(id: string): Promise<Patient | null> {
    try {
      const snap = await getDoc(doc(this.firestore, 'patients', id));
      return snap.exists() ? { id: snap.id, ...(snap.data() as any) } as Patient : null;
    } catch (e) {
      const snap = await getDocFromCache(doc(this.firestore, 'patients', id));
      return snap.exists() ? { id: snap.id, ...(snap.data() as any) } as Patient : null;
    }
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | null> {
    const q = query(collection(this.firestore, 'patients'), where('patientId', '==', patientId));
    const snap = await this.getDocsWithOffline(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) } as Patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    const q = query(collection(this.firestore, 'patients'), orderBy('createdAt', 'desc'));
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as Patient));
  }

  async searchPatients(term: string): Promise<Patient[]> {
    const all = await this.getAllPatients();
    const t = term.toLowerCase();
    return all.filter((p: any) =>
      p.firstName?.toLowerCase().includes(t) ||
      p.lastName?.toLowerCase().includes(t) ||
      p.patientId?.toLowerCase().includes(t) ||
      p.contactNumber?.includes(t)
    );
  }

  async getTotalPatients(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(this.firestore, 'patients'));
      return snap.data().count;
    } catch (e) {
      const snap = await getDocsFromCache(collection(this.firestore, 'patients'));
      return snap.size;
    }
  }

  async getMonthNewPatients(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const q = query(
      collection(this.firestore, 'patients'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    );
    try {
      const snap = await getCountFromServer(q);
      return snap.data().count;
    } catch (e) {
      const snap = await getDocsFromCache(q);
      return snap.size;
    }
  }

  async getRecentPatients(count: number = 5): Promise<Patient[]> {
    const q = query(collection(this.firestore, 'patients'), orderBy('createdAt', 'desc'), limit(count));
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as Patient));
  }

  async addMedicalRecord(record: any): Promise<string> {
    try {
      const ref = await addDoc(collection(this.firestore, 'medicalRecords'), {
        ...(record as any),
        createdAt: Timestamp.now()
      });
      return ref.id;
    } catch (err) {
      console.error('FIRESTORE MEDICAL ERROR:', err);
      throw err;
    }
  }

  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    const q = query(collection(this.firestore, 'medicalRecords'), orderBy('createdAt', 'desc'));
    const snap = await this.getDocsWithOffline(q);
    const all = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as MedicalRecord));
    console.log("ALL FIREBASE RECORDS:", all);
    console.log("LOOKING FOR patientId:", patientId);
    return all;
  }

  async getTodayVisits(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(this.firestore, 'medicalRecords'), where('visitDate', '==', today));
    try {
      const snap = await getCountFromServer(q);
      return snap.data().count;
    } catch (e) {
      const snap = await getDocsFromCache(q);
      return snap.size;
    }
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'medicalRecords', id));
  }

  async updateMedicalRecord(id: string, data: any): Promise<void> {
    await updateDoc(doc(this.firestore, 'medicalRecords', id), {
      ...(data as any),
      updatedAt: Timestamp.now()
    });
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    const q = query(
      collection(this.firestore, 'medicalRecords'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as MedicalRecord));
  }

  async addAppointment(appt: any): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'appointments'), {
      ...(appt as any),
      createdAt: Timestamp.now()
    });
    return ref.id;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const q = query(collection(this.firestore, 'appointments'), orderBy('appointmentDate', 'asc'));
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as Appointment));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const q = query(collection(this.firestore, 'appointments'), where('appointmentDate', '==', date));
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as Appointment));
  }

  async getTodayAppointments(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(this.firestore, 'appointments'),
      where('appointmentDate', '==', today)
    );
    try {
      const snap = await getCountFromServer(q);
      return snap.data().count;
    } catch (e) {
      const snap = await getDocsFromCache(q);
      return snap.size;
    }
  }

  async updateAppointment(id: string, data: any): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), data);
  }

  async deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'appointments', id));
  }

  async getAllStaff(): Promise<StaffUser[]> {
    const q = query(collection(this.firestore, 'staff'), orderBy('createdAt', 'desc'));
    const snap = await this.getDocsWithOffline(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as StaffUser));
  }

  async updateStaff(id: string, data: any): Promise<void> {
    await updateDoc(doc(this.firestore, 'staff', id), data);
  }

  async deleteStaff(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'staff', id));
  }

  calcBMI(height: number, weight: number): number {
    if (!height || !weight) return 0;
    return parseFloat((weight / Math.pow(height / 100, 2)).toFixed(2));
  }

  getBMIStatus(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  calcAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}