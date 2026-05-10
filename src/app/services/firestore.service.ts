import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc,
  addDoc, updateDoc, deleteDoc, query, where, orderBy,
  getDocs, getDoc, Timestamp, limit,
  getCountFromServer, getDocsFromCache, getDocFromCache,
  runTransaction, writeBatch
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

  // ============================================================
  // ACID - ATOMICITY
  // ============================================================

  async addPatientAtomic(patient: any): Promise<string> {
    try {
      const patientRef = doc(collection(this.firestore, 'patients'));
      const auditRef = doc(collection(this.firestore, 'auditLog'));

      await runTransaction(this.firestore, async (transaction) => {
        transaction.set(patientRef, {
          ...(patient as any),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        transaction.set(auditRef, {
          action: 'REGISTER_PATIENT',
          patientId: patient.patientId,
          patientName: `${patient.lastName}, ${patient.firstName}`,
          performedAt: Timestamp.now(),
          status: 'SUCCESS'
        });
      });

      console.log('✅ ATOMICITY: Patient + audit log saved atomically');
      return patientRef.id;

    } catch (err: any) {
      if (!navigator.onLine) {
        console.warn('⚠️ Offline — saving patient without transaction, will sync when online');
        const ref = await addDoc(collection(this.firestore, 'patients'), {
          ...(patient as any),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return ref.id;
      }
      console.error('❌ ATOMICITY FAILED — transaction rolled back:', err);
      throw err;
    }
  }

  async deletePatientAtomic(patientDocId: string, patientId: string): Promise<void> {
    try {
      const batch = writeBatch(this.firestore);
      const q = query(
        collection(this.firestore, 'medicalRecords'),
        where('patientId', '==', patientId)
      );
      const snap = await this.getDocsWithOffline(q);
      batch.delete(doc(this.firestore, 'patients', patientDocId));
      snap.docs.forEach((d: any) => { batch.delete(d.ref); });
      const auditRef = doc(collection(this.firestore, 'auditLog'));
      batch.set(auditRef, {
        action: 'DELETE_PATIENT',
        patientId: patientId,
        recordsDeleted: snap.size,
        performedAt: Timestamp.now(),
        status: 'SUCCESS'
      });
      await batch.commit();
      console.log('✅ ATOMICITY: Patient + records deleted atomically');
    } catch (err) {
      console.error('❌ ATOMICITY FAILED — batch rolled back:', err);
      throw err;
    }
  }

  async addMedicalRecordAtomic(record: any, patientDocId: string): Promise<string> {
    try {
      const recordRef = doc(collection(this.firestore, 'medicalRecords'));
      const patientRef = doc(this.firestore, 'patients', patientDocId);
      const auditRef = doc(collection(this.firestore, 'auditLog'));

      await runTransaction(this.firestore, async (transaction) => {
        const patientSnap = await transaction.get(patientRef);
        if (!patientSnap.exists()) {
          throw new Error('CONSISTENCY ERROR: Patient no longer exists!');
        }
        transaction.set(recordRef, {
          ...(record as any),
          createdAt: Timestamp.now()
        });
        transaction.update(patientRef, {
          lastVisit: record.visitDate,
          updatedAt: Timestamp.now()
        });
        transaction.set(auditRef, {
          action: 'ADD_MEDICAL_RECORD',
          patientId: record.patientId,
          visitDate: record.visitDate,
          performedAt: Timestamp.now(),
          status: 'SUCCESS'
        });
      });

      console.log('✅ ATOMICITY: Medical record + patient update saved atomically');
      return recordRef.id;

    } catch (err: any) {
      if (!navigator.onLine) {
        console.warn('⚠️ Offline — saving record without transaction');
        const ref = await addDoc(collection(this.firestore, 'medicalRecords'), {
          ...(record as any),
          createdAt: Timestamp.now()
        });
        return ref.id;
      }
      console.error('❌ ATOMICITY FAILED — transaction rolled back:', err);
      throw err;
    }
  }

  // ============================================================
  // ACID - CONSISTENCY
  // ============================================================

  validatePatient(patient: any): string | null {
    if (!patient.firstName?.trim()) return 'First name is required';
    if (!patient.lastName?.trim()) return 'Last name is required';
    if (!patient.dateOfBirth) return 'Date of birth is required';
    if (!patient.gender) return 'Gender is required';
    if (!patient.patientId) return 'Patient ID is required';
    const age = this.calcAge(patient.dateOfBirth);
    if (age < 0 || age > 150) return 'Invalid date of birth';
    return null;
  }

  validateMedicalRecord(record: any): string | null {
    if (!record.patientId) return 'Patient ID is required';
    if (!record.visitDate) return 'Visit date is required';
    if (record.temperature && (record.temperature < 30 || record.temperature > 45))
      return 'Temperature must be between 30°C and 45°C';
    if (record.pulseRate && (record.pulseRate < 20 || record.pulseRate > 300))
      return 'Pulse rate must be between 20 and 300 bpm';
    if (record.heightCm && (record.heightCm < 30 || record.heightCm > 250))
      return 'Height must be between 30cm and 250cm';
    if (record.weightKg && (record.weightKg < 1 || record.weightKg > 500))
      return 'Weight must be between 1kg and 500kg';
    return null;
  }

  // ============================================================
  // ACID - ISOLATION
  // ============================================================

  async updateAppointmentIsolated(id: string, data: any): Promise<void> {
    try {
      await runTransaction(this.firestore, async (transaction) => {
        const apptRef = doc(this.firestore, 'appointments', id);
        const apptSnap = await transaction.get(apptRef);
        if (!apptSnap.exists()) {
          throw new Error('ISOLATION ERROR: Appointment no longer exists!');
        }
        transaction.update(apptRef, {
          ...(data as any),
          updatedAt: Timestamp.now()
        });
      });
      console.log('✅ ISOLATION: Appointment updated safely');
    } catch (err) {
      console.error('❌ ISOLATION FAILED:', err);
      throw err;
    }
  }

  async updateMedicalRecordIsolated(id: string, data: any): Promise<void> {
    try {
      await runTransaction(this.firestore, async (transaction) => {
        const recordRef = doc(this.firestore, 'medicalRecords', id);
        const recordSnap = await transaction.get(recordRef);
        if (!recordSnap.exists()) {
          throw new Error('ISOLATION ERROR: Medical record no longer exists!');
        }
        transaction.update(recordRef, {
          ...(data as any),
          updatedAt: Timestamp.now()
        });
      });
      console.log('✅ ISOLATION: Medical record updated safely');
    } catch (err) {
      console.error('❌ ISOLATION FAILED:', err);
      throw err;
    }
  }

  // ============================================================
  // ACID - DURABILITY
  // ============================================================

  async verifyPatientSaved(patientDocId: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(this.firestore, 'patients', patientDocId));
      const saved = snap.exists();
      console.log(saved
        ? '✅ DURABILITY: Patient data confirmed saved'
        : '❌ DURABILITY: Patient data NOT found after save!'
      );
      return saved;
    } catch (e) {
      console.warn('⚠️ DURABILITY: Could not verify (offline) — data queued for sync');
      return true;
    }
  }

  // ============================================================
  // PATIENTS
  // ============================================================

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

  // ============================================================
  // MEDICAL RECORDS
  // ============================================================

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

  // ============================================================
  // APPOINTMENTS
  // ============================================================

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

  // ============================================================
  // STAFF
  // ============================================================

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