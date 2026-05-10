// ============================================================
// DPRMS Models - Data interfaces for Firebase/Firestore
// ============================================================

export interface Patient {
  id?: string;
  patientId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated';
  address?: string;
  contactNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  philhealthNumber?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface MedicalRecord {
  id?: string;
  patientId: string;
  visitDate: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bmiStatus?: string;
  bloodPressure?: string;
  temperature?: number;
  pulseRate?: number;
  chiefComplaint?: string;
  diagnosis?: string;
  prescription?: string;
  doctorNotes?: string;
 attendingStaff?: string;
  createdAt?: any;
  status?: 'draft' | 'finalized';
  createdByRole?: 'staff' | 'doctor';
  finalizedBy?: string;
  finalizedAt?: any;
  updatedAt?: any;
}

export interface Appointment {
  id?: string;
  patientId?: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime?: string;
  purpose?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  notes?: string;
  createdAt?: any;
}

export interface StaffUser {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Nurse' | 'Doctor' | 'Staff';
  createdAt?: any;
}

export interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  todayAppointments: number;
  monthNewPatients: number;
}
