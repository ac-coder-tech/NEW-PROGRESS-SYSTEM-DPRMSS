import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, docData,
  addDoc, updateDoc, deleteDoc, query, where, orderBy,
  getDocs, getDoc, setDoc, Timestamp, limit, startAfter,
  getCountFromServer
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Patient, MedicalRecord, Appointment, StaffUser } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  // ============================================================
  // PATIENTS
  // ============================================================

  async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const col = collection(this.firestore, 'patients');
    const snap = await getDocs(col);
    const num = String(snap.size + 1).padStart(4, '0');
    return `PAT-${year}-${num}`;
  }

  async addPatient(patient: Patient): Promise<string> {
  try {
    console.log('ADDING PATIENT...', patient);

    const ref = await addDoc(collection(this.firestore, 'patients'), {
      ...patient,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('SUCCESS:', ref.id);
    return ref.id;

  } catch (err) {
    console.error('FIRESTORE ERROR:', err);
    throw err;
  }
}

  async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    await updateDoc(doc(this.firestore, 'patients', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async deletePatient(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'patients', id));
    // Also delete their medical records
    const q = query(
  collection(this.firestore, 'medicalRecords'),
  where('patientId', '==', id)
);
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletes);
  }

  async getPatient(id: string): Promise<Patient | null> {
    const snap = await getDoc(doc(this.firestore, 'patients', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Patient : null;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | null> {
    const q = query(collection(this.firestore, 'patients'), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    const q = query(collection(this.firestore, 'patients'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  }

  async searchPatients(term: string): Promise<Patient[]> {
    const all = await this.getAllPatients();
    const t = term.toLowerCase();
    return all.filter(p =>
      p.firstName?.toLowerCase().includes(t) ||
      p.lastName?.toLowerCase().includes(t) ||
      p.patientId?.toLowerCase().includes(t) ||
      p.contactNumber?.includes(t)
    );
  }

  async getTotalPatients(): Promise<number> {
    const snap = await getCountFromServer(collection(this.firestore, 'patients'));
    return snap.data().count;
  }

  async getMonthNewPatients(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const q = query(
      collection(this.firestore, 'patients'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }

  async getRecentPatients(count: number = 5): Promise<Patient[]> {
    const q = query(collection(this.firestore, 'patients'), orderBy('createdAt', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  }

  // ============================================================
  // MEDICAL RECORDS
  // ============================================================

  async addMedicalRecord(record: any): Promise<string> {
  try {
    console.log('ADDING MEDICAL RECORD...', record);

    const ref = await addDoc(collection(this.firestore, 'medicalRecords'), {
      ...record,
      createdAt: Timestamp.now()
    });

    console.log('SUCCESS MEDICAL RECORD ID:', ref.id);
    return ref.id;

  } catch (err) {
    console.error('FIRESTORE MEDICAL ERROR:', err);
    throw err;
  }
}

  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  const q = query(collection(this.firestore, 'medicalRecords'), orderBy('createdAt', 'desc'));

  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord));

  console.log("ALL FIREBASE RECORDS:", all);
  console.log("LOOKING FOR patientId:", patientId);

  return all;
}
  async getTodayVisits(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(this.firestore, 'medicalRecords'), where('visitDate', '==', today));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }

 async deleteMedicalRecord(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'medicalRecords', id));
  }
 

  async updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<void> {
    await updateDoc(doc(this.firestore, 'medicalRecords', id), {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    const q = query(
      collection(this.firestore, 'medicalRecords'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord));
  }

  // ============================================================
  // APPOINTMENTS
  // ============================================================

  async addAppointment(appt: Appointment): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'appointments'), {
      ...appt,
      createdAt: Timestamp.now()
    });
    return ref.id;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const q = query(collection(this.firestore, 'appointments'), orderBy('appointmentDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const q = query(collection(this.firestore, 'appointments'), where('appointmentDate', '==', date));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  }

 // AFTER (fixed - counts ALL today's appointments)
async getTodayAppointments(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(this.firestore, 'appointments'),
    where('appointmentDate', '==', today)  // ✅ No status filter
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), data);
  }

  async deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'appointments', id));
  }

  // ============================================================
  // STAFF
  // ============================================================

  async getAllStaff(): Promise<StaffUser[]> {
    const q = query(collection(this.firestore, 'staff'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffUser));
  }

  async updateStaff(id: string, data: Partial<StaffUser>): Promise<void> {
    await updateDoc(doc(this.firestore, 'staff', id), data);
  }

  async deleteStaff(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'staff', id));
  }

  // ============================================================
  // UTILITIES
  // ============================================================

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
