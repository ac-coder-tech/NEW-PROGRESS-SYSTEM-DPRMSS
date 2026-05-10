import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { Patient, MedicalRecord } from '../../../models/models';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-wrapper">
      <div class="main-content">

        <!-- Topbar -->
        <div class="topbar">
          <div class="topbar-title">🩺 Doctor Portal</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="color:rgba(255,255,255,0.8);font-size:13px;">Dr. {{ doctorName }}</span>
            <button class="btn btn-sm" (click)="logout()"
              style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);">
              🚪 Logout
            </button>
          </div>
        </div>

        <div class="page-content">

          <!-- Nav Tabs -->
          <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
            <button class="btn" [class.btn-primary]="activeTab==='dashboard'"
              [class.btn-secondary]="activeTab!=='dashboard'" (click)="activeTab='dashboard'">
              🏠 Dashboard
            </button>
            <button class="btn" [class.btn-primary]="activeTab==='patients'"
              [class.btn-secondary]="activeTab!=='patients'" (click)="activeTab='patients';loadPatients()">
              👥 Patients
            </button>
            <button class="btn" [class.btn-primary]="activeTab==='appointments'"
              [class.btn-secondary]="activeTab!=='appointments'" (click)="activeTab='appointments';loadAppointments()">
              📅 Appointments
            </button>
            <button class="btn" [class.btn-primary]="activeTab==='records'"
              [class.btn-secondary]="activeTab!=='records'" (click)="activeTab='records'">
              📋 Records & Notes
            </button>
          </div>

          <!-- Alerts -->
          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <!-- ─── DASHBOARD TAB ─── -->
          <div *ngIf="activeTab==='dashboard'">
            <div class="card" style="background:linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0);border:none;color:white;margin-bottom:18px;">
              <h2 style="color:white;margin:0;">Good day, Dr. {{ doctorName }}! 🩺</h2>
              <p style="color:rgba(255,255,255,0.8);margin-top:6px;font-size:14px;">{{ today }}</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:18px;">
              <div class="card" style="text-align:center;padding:24px 16px;">
                <div style="font-size:32px;">👥</div>
                <div style="font-size:28px;font-weight:700;color:#1a56a0;">{{ totalPatients }}</div>
                <div style="font-size:13px;color:#888;">Total Patients</div>
              </div>
              <div class="card" style="text-align:center;padding:24px 16px;">
                <div style="font-size:32px;">📅</div>
                <div style="font-size:28px;font-weight:700;color:#1a56a0;">{{ todayAppointments.length }}</div>
                <div style="font-size:13px;color:#888;">Today's Appointments</div>
              </div>
              <div class="card" style="text-align:center;padding:24px 16px;">
                <div style="font-size:32px;">📋</div>
                <div style="font-size:28px;font-weight:700;color:#1a56a0;">{{ totalRecords }}</div>
                <div style="font-size:13px;color:#888;">Medical Records</div>
              </div>
            </div>

            <!-- Today's appointments preview -->
            <div class="card">
              <div class="card-title">📅 Today's Appointments</div>
              <div *ngIf="todayAppointments.length===0" class="text-muted" style="padding:16px 0;">
                No appointments scheduled for today.
              </div>
              <div *ngFor="let a of todayAppointments"
                style="border:1px solid #eef2fb;border-radius:10px;padding:12px;margin-bottom:10px;font-size:13px;">
                <strong style="color:#1a56a0;">{{ a.patientName }}</strong>
                <span style="margin-left:10px;color:#888;">{{ formatTime(a.appointmentTime) }}</span>
                <span class="badge badge-info" style="margin-left:8px;">{{ a.purpose }}</span>
                <div *ngIf="a.notes" style="margin-top:4px;color:#555;">📝 {{ a.notes }}</div>
              </div>
            </div>
          </div>

          <!-- ─── PATIENTS TAB ─── -->
          <div *ngIf="activeTab==='patients'">
            <div class="card">
              <div class="card-title">👥 Patient List</div>
              <div class="search-bar" style="margin-bottom:14px;">
                <input type="text" [(ngModel)]="searchTerm"
                  placeholder="Search name or patient ID..." (input)="filterPatients()" />
                <button class="btn btn-secondary" (click)="loadPatients()">🔄 Refresh</button>
              </div>
              <div *ngIf="loadingPatients" class="loading"><div class="spinner"></div>Loading...</div>
              <div *ngIf="!loadingPatients">
                <div *ngIf="filteredPatients.length===0" class="text-muted text-center" style="padding:30px;">
                  No patients found.
                </div>
                <div class="table-responsive" *ngIf="filteredPatients.length>0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th><th>Name</th><th>Age</th>
                        <th>Gender</th><th>Blood Type</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let p of filteredPatients">
                        <td><span class="patient-id-badge">{{ p.patientId }}</span></td>
                        <td><strong>{{ p.lastName }}, {{ p.firstName }}</strong> {{ p.middleName }}</td>
                        <td>{{ p.age }}</td>
                        <td>{{ p.gender }}</td>
                        <td><span class="badge badge-info">{{ p.bloodType }}</span></td>
                        <td>
                          <button class="btn btn-secondary btn-sm"
                            (click)="viewPatientRecords(p)">📋 View Records</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── APPOINTMENTS TAB ─── -->
          <div *ngIf="activeTab==='appointments'">
            <div class="card">
              <div class="card-title">📅 All Appointments</div>
              <div *ngIf="loadingAppointments" class="loading"><div class="spinner"></div>Loading...</div>
              <div *ngIf="!loadingAppointments">
                <div *ngIf="allAppointments.length===0" class="text-muted" style="padding:20px 0;">
                  No appointments found.
                </div>
                <div class="table-responsive" *ngIf="allAppointments.length>0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th><th>Date</th><th>Time</th>
                        <th>Purpose</th><th>Status</th><th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let a of allAppointments">
                        <td><strong>{{ a.patientName }}</strong></td>
                        <td>{{ a.appointmentDate }}</td>
                        <td>{{ formatTime(a.appointmentTime) }}</td>
                        <td>{{ a.purpose }}</td>
                        <td><span class="badge badge-info">{{ a.status }}</span></td>
                        <td>{{ a.notes || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── RECORDS & NOTES TAB ─── -->
          <div *ngIf="activeTab==='records'">

            <!-- Search patient -->
            <div *ngIf="!selectedPatient" class="card">
              <div class="card-title">🔍 Find Patient</div>
              <div class="search-bar">
                <input type="text" [(ngModel)]="searchPid"
                  placeholder="Enter Patient ID (e.g. PAT-2024-0001)" />
                <button class="btn btn-primary" (click)="loadPatientById()" [disabled]="loadingRecord">
                  {{ loadingRecord ? '⏳ Loading...' : '🔍 Load Patient' }}
                </button>
              </div>
              <p style="font-size:13px;color:#888;margin-top:8px;">
                Or go to <strong>Patients</strong> tab, find the patient, and click "View Records".
              </p>
            </div>

            <!-- Patient info + records -->
            <div *ngIf="selectedPatient">
              <div class="card" style="background:linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0);color:white;border:none;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:18px;font-weight:700;color:white;">
                      {{ selectedPatient.lastName }}, {{ selectedPatient.firstName }}
                    </div>
                    <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px;">
                      {{ selectedPatient.patientId }} &nbsp;|&nbsp;
                      Age: {{ selectedPatient.age }} &nbsp;|&nbsp;
                      {{ selectedPatient.gender }} &nbsp;|&nbsp;
                      Blood: {{ selectedPatient.bloodType }}
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-sm"
                    (click)="selectedPatient=null;patientRecords=[]">✖ Close</button>
                </div>
              </div>

             <!-- Pending Drafts -->
              <div class="card">
                <div class="card-title">📋 Draft Records — Awaiting Finalization</div>
                <div *ngIf="draftRecords.length === 0" class="text-muted" style="padding:16px 0;">
                  No pending drafts for this patient.
                </div>
                <div *ngFor="let r of draftRecords"
                  style="border:2px solid #ffc107;border-radius:10px;padding:14px;margin-bottom:12px;background:#fffdf0;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                      <strong style="color:#1a56a0;">📅 {{ formatDate(r.visitDate) }}</strong>
                      <span style="font-size:12px;color:#888;margin-left:10px;">by {{ r.attendingStaff }}</span>
                      <span class="badge-draft" style="margin-left:8px;">🟡 Draft</span>
                    </div>
                    <button class="btn btn-success btn-sm" (click)="startFinalize(r)">
                      ✏️ Finalize
                    </button>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px;">
                    <div *ngIf="r.heightCm"><strong>Height:</strong> {{ r.heightCm }} cm</div>
                    <div *ngIf="r.weightKg"><strong>Weight:</strong> {{ r.weightKg }} kg</div>
                    <div *ngIf="r.bmi"><strong>BMI:</strong> {{ r.bmi }}</div>
                    <div *ngIf="r.bloodPressure"><strong>BP:</strong> {{ r.bloodPressure }}</div>
                    <div *ngIf="r.temperature"><strong>Temp:</strong> {{ r.temperature }}°C</div>
                    <div *ngIf="r.pulseRate"><strong>Pulse:</strong> {{ r.pulseRate }} bpm</div>
                  </div>
                  <div *ngIf="r.chiefComplaint" style="margin-top:8px;font-size:13px;">
                    <strong>Complaint:</strong> {{ r.chiefComplaint }}
                  </div>
                </div>
              </div>

              <!-- Finalize Form (shown when doctor clicks Finalize) -->
              <div *ngIf="finalizeTarget" class="finalize-card">
                <div class="card-title" style="color:#1e8449;">✏️ Finalize Record — {{ formatDate(finalizeTarget.visitDate) }}</div>

                <!-- Read-only vitals summary -->
                <div class="vitals-readonly-block">
                  <div style="font-weight:600;margin-bottom:8px;color:#1a56a0;">📏 Vitals (entered by Staff)</div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px;">
                    <div *ngIf="finalizeTarget.heightCm"><strong>Height:</strong> {{ finalizeTarget.heightCm }} cm</div>
                    <div *ngIf="finalizeTarget.weightKg"><strong>Weight:</strong> {{ finalizeTarget.weightKg }} kg</div>
                    <div *ngIf="finalizeTarget.bmi"><strong>BMI:</strong> {{ finalizeTarget.bmi }}</div>
                    <div *ngIf="finalizeTarget.bloodPressure"><strong>BP:</strong> {{ finalizeTarget.bloodPressure }}</div>
                    <div *ngIf="finalizeTarget.temperature"><strong>Temp:</strong> {{ finalizeTarget.temperature }}°C</div>
                    <div *ngIf="finalizeTarget.pulseRate"><strong>Pulse:</strong> {{ finalizeTarget.pulseRate }} bpm</div>
                    <div *ngIf="finalizeTarget.chiefComplaint"><strong>Complaint:</strong> {{ finalizeTarget.chiefComplaint }}</div>
                  </div>
                </div>

                <!-- Doctor fills only clinical fields -->
                <div class="form-section-title">🩺 Clinical Assessment</div>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Diagnosis</label>
                    <textarea [(ngModel)]="finalizeForm.diagnosis" rows="2"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Prescription / Medication</label>
                    <textarea [(ngModel)]="finalizeForm.prescription" rows="2"></textarea>
                  </div>
                </div>
                <div class="form-group">
                  <label>Doctor's Notes</label>
                  <textarea [(ngModel)]="finalizeForm.doctorNotes" rows="2"></textarea>
                </div>

                <div style="display:flex;gap:10px;margin-top:10px;">
                  <button class="btn btn-success" (click)="finalizeRecord()" [disabled]="saving">
                    {{ saving ? '⏳ Saving...' : '✅ Finalize Record' }}
                  </button>
                  <button class="btn btn-secondary" (click)="finalizeTarget=null">Cancel</button>
                </div>
              </div>

             <!-- Medical History -->
              <div class="card">
                <div class="card-title">📂 Medical History ({{ patientRecords.length }} records)</div>
                <div *ngIf="patientRecords.length===0" class="text-muted" style="padding:16px 0;">
                  No records yet for this patient.
                </div>
                <div *ngFor="let r of patientRecords"
                  [style.border]="r.status === 'finalized' ? '1px solid #a9dfbf' : '1px solid #ffc107'"
                  style="border-radius:10px;padding:14px;margin-bottom:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div>
                      <strong style="color:#1a56a0;">📅 {{ formatDate(r.visitDate) }}</strong>
                      <span style="font-size:12px;color:#888;margin-left:10px;">by {{ r.attendingStaff }}</span>
                      <span *ngIf="r.status === 'finalized'" class="badge-finalized" style="margin-left:8px;">✅ Finalized</span>
                      <span *ngIf="r.status !== 'finalized'" class="badge-draft" style="margin-left:8px;">🟡 Draft</span>
                    </div>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px;">
                    <div *ngIf="r.heightCm"><strong>Height:</strong> {{ r.heightCm }} cm</div>
                    <div *ngIf="r.weightKg"><strong>Weight:</strong> {{ r.weightKg }} kg</div>
                    <div *ngIf="r.bloodPressure"><strong>BP:</strong> {{ r.bloodPressure }}</div>
                    <div *ngIf="r.temperature"><strong>Temp:</strong> {{ r.temperature }}°C</div>
                    <div *ngIf="r.pulseRate"><strong>Pulse:</strong> {{ r.pulseRate }} bpm</div>
                  </div>
                  <div *ngIf="r.chiefComplaint" style="margin-top:8px;font-size:13px;">
                    <strong>Complaint:</strong> {{ r.chiefComplaint }}</div>
                  <div *ngIf="r.diagnosis" style="margin-top:4px;font-size:13px;">
                    <strong>Diagnosis:</strong> {{ r.diagnosis }}</div>
                  <div *ngIf="r.prescription" style="margin-top:4px;font-size:13px;">
                    <strong>Rx:</strong> {{ r.prescription }}</div>
                  <div *ngIf="r.doctorNotes" style="margin-top:4px;font-size:13px;">
                    <strong>Notes:</strong> {{ r.doctorNotes }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private db = inject(FirestoreService);

  doctorName = '';
  activeTab = 'dashboard';
  today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  successMsg = '';
  errorMsg = '';
  saving = false;

  // Dashboard stats
  totalPatients = 0;
  totalRecords = 0;
  todayAppointments: any[] = [];

  // Patients tab
  allPatients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm = '';
  loadingPatients = false;

  // Appointments tab
  allAppointments: any[] = [];
  loadingAppointments = false;

  // Records tab
 selectedPatient: Patient | null = null;
  patientRecords: MedicalRecord[] = [];
  draftRecords: MedicalRecord[] = [];
  finalizeTarget: MedicalRecord | null = null;
  finalizeForm: any = { diagnosis: '', prescription: '', doctorNotes: '' };
  searchPid = '';
  loadingRecord = false;
  recordForm: any = this.emptyRecord();

  async ngOnInit() {
    this.doctorName = this.auth.getStaffName();
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const patients = await this.db.getAllPatients();
      this.totalPatients = patients.length;

      // ✅ FIXED: uses getAllAppointments() which exists in your firestore.service.ts
      const appts = await this.db.getAllAppointments();
      const todayStr = new Date().toISOString().split('T')[0];
      this.todayAppointments = appts.filter((a: any) => a.appointmentDate === todayStr);
      this.allAppointments = appts;

      // Count total records
      const allRecords = await this.db.getMedicalRecords('');
      this.totalRecords = allRecords.length;
    } catch (e) {
      console.error(e);
    }
  }

  async loadPatients() {
    this.loadingPatients = true;
    try {
      this.allPatients = await this.db.getAllPatients();
      this.filterPatients();
    } catch (e) { console.error(e); }
    this.loadingPatients = false;
  }

  filterPatients() {
    const t = this.searchTerm.toLowerCase();
    this.filteredPatients = t
      ? this.allPatients.filter(p =>
          p.firstName?.toLowerCase().includes(t) ||
          p.lastName?.toLowerCase().includes(t) ||
          p.patientId?.toLowerCase().includes(t))
      : [...this.allPatients];
  }

  async loadAppointments() {
    this.loadingAppointments = true;
    try {
      // ✅ FIXED: uses getAllAppointments() which exists in your firestore.service.ts
      this.allAppointments = await this.db.getAllAppointments();
    } catch (e) { console.error(e); }
    this.loadingAppointments = false;
  }

  viewPatientRecords(p: Patient) {
    this.selectedPatient = p;
    this.activeTab = 'records';
    this.loadRecords();
  }

  async loadPatientById() {
    if (!this.searchPid.trim()) { this.errorMsg = 'Enter a Patient ID.'; return; }
    this.loadingRecord = true;
    this.clearAlerts();
    try {
      this.selectedPatient = await this.db.getPatientByPatientId(this.searchPid.trim());
      if (!this.selectedPatient) {
        this.errorMsg = `Patient "${this.searchPid}" not found.`;
      } else {
        await this.loadRecords();
      }
    } catch (e) { this.errorMsg = 'Failed to load patient.'; }
    this.loadingRecord = false;
  }

  async loadRecords() {
  if (!this.selectedPatient?.patientId) return;
  try {
    // ✅ FIX: use getMedicalRecordsByPatient for correct filtering
    const all = await this.db.getMedicalRecordsByPatient(this.selectedPatient.patientId);
    this.patientRecords = [...all].sort((a: any, b: any) =>
      b.visitDate.localeCompare(a.visitDate));
    this.draftRecords = this.patientRecords.filter(r => r.status !== 'finalized');
  } catch (e) { console.error(e); }
}

  startFinalize(r: MedicalRecord) {
    this.finalizeTarget = r;
    this.finalizeForm = { diagnosis: '', prescription: '', doctorNotes: '' };
    this.clearAlerts();
  }

  async finalizeRecord() {
    if (!this.finalizeTarget?.id) { this.errorMsg = 'No record selected.'; return; }
    this.saving = true;
    this.clearAlerts();
    try {
      await this.db.updateMedicalRecord(this.finalizeTarget.id, {
        diagnosis: this.finalizeForm.diagnosis || null,
        prescription: this.finalizeForm.prescription || null,
        doctorNotes: this.finalizeForm.doctorNotes || null,
        status: 'finalized',
        finalizedBy: `Dr. ${this.auth.getStaffName()}`,
      });
      this.successMsg = 'Record finalized successfully!';
      this.finalizeTarget = null;
      this.finalizeForm = { diagnosis: '', prescription: '', doctorNotes: '' };
      await this.loadRecords();
    } catch { this.errorMsg = 'Failed to finalize record.'; }
    this.saving = false;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  formatTime(time: string): string {
  if (!time) return '—';
  const [hourStr, minute] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
  }


  clearAlerts() { this.successMsg = ''; this.errorMsg = ''; }

 emptyRecord() {
    return {};
  }

  logout() { this.auth.logout(); }
}