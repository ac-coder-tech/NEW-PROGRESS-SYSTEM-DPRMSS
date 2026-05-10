import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Patient, MedicalRecord } from '../../models/models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">📋 Record Updates</div>
          <div class="topbar-date">{{ today }}</div>
        </div>
        <div class="page-content">

          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <!-- Search Patient -->
          <div *ngIf="!patient" class="card">
            <div class="card-title">🔍 Find Patient to Update</div>
            <div class="search-bar">
              <input type="text" [(ngModel)]="searchPid"
                placeholder="Enter Patient ID (e.g. PAT-2024-0001)" />
              <button class="btn btn-primary" (click)="loadPatient()" [disabled]="loadingPatient">
                {{ loadingPatient ? '⏳ Loading...' : '🔍 Load Patient' }}
              </button>
            </div>
            <p style="font-size:13px;color:#888;margin-top:8px;">
              Or go to <strong>Patients</strong> page, find the patient, and click "Records".
            </p>
          </div>

          <!-- Patient Info Card -->
          <div *ngIf="patient">

          <div *ngIf="!showHistory">
          <div class="card" style="background:linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0);color:white;border:none;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-size:18px;font-weight:700;color:white;">
                    {{ patient.lastName }}, {{ patient.firstName }} {{ patient.middleName }}
                  </div>
                  <div style="color:rgba(255,255,255,0.8);margin-top:4px;font-size:13px;">
                    <span class="patient-id-badge" style="background:rgba(255,255,255,0.2);color:white;">
                      {{ patient.patientId }}
                    </span>
                    &nbsp; Age: {{ patient.age }} &nbsp;|&nbsp;
                    {{ patient.gender }} &nbsp;|&nbsp;
                    Blood: {{ patient.bloodType }}
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="patient=null;records=[];showHistory=false">✖ Close</button>
              </div>
            </div>

            <!-- Add New Record Form -->
            <div class="card">
              <div class="card-title">➕ Add Medical Record / Checkup</div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Visit Date *</label>
                  <input type="date" [(ngModel)]="recordForm.visitDate" />
                </div>
                <div class="form-group">
                  <label>Attending Staff</label>
                  <input type="text" [(ngModel)]="recordForm.attendingStaff" readonly style="background:#f5f7fc;" />
                </div>
              </div>

              <div class="form-section-title">📏 Vital Signs & Anthropometrics</div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label>Height (cm)</label>
                  <input type="number" [(ngModel)]="recordForm.heightCm" (input)="calcBMI()" placeholder="e.g. 165" />
                </div>
                <div class="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" [(ngModel)]="recordForm.weightKg" (input)="calcBMI()" placeholder="e.g. 60" />
                </div>
                <div class="form-group">
                  <label>BMI</label>
                  <input type="text" [value]="bmiDisplay" readonly style="background:#f5f7fc;" />
                </div>
                <div class="form-group">
                  <label>Blood Pressure</label>
                  <input type="text" [(ngModel)]="recordForm.bloodPressure" placeholder="e.g. 120/80" />
                </div>
                <div class="form-group">
                  <label>Temperature (°C)</label>
                  <input type="number" [(ngModel)]="recordForm.temperature" placeholder="e.g. 36.5" step="0.1" />
                </div>
                <div class="form-group">
                  <label>Pulse Rate (bpm)</label>
                  <input type="number" [(ngModel)]="recordForm.pulseRate" placeholder="e.g. 72" />
                </div>
              </div>

              <div class="form-section-title">🩺 Clinical Notes</div>
              <div class="form-group">
                <label>Chief Complaint</label>
                <textarea [(ngModel)]="recordForm.chiefComplaint" placeholder="Patient's main complaint..." rows="2"></textarea>
              </div>

              <div class="locked-field-block">
                <div style="font-weight:600;margin-bottom:6px;">🔒 Doctor Only Fields</div>
                <div>Diagnosis, Prescription, and Doctor's Notes can only be filled in by the attending Doctor.</div>
              </div>

              <div *ngIf="duplicateWarning" class="duplicate-warning">
                ⚠️ A record already exists for this visit date. Please check before saving.
              </div>

              <button class="btn btn-primary" (click)="saveRecord()" [disabled]="saving">
                {{ saving ? '⏳ Saving...' : '💾 Save as Draft' }}
              </button>

              <!-- History Preview -->
              <div class="card" *ngIf="!showHistory" style="margin-top:16px;">
                <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
                  <span>📂 Medical History ({{ records.length }} records)</span>
                  <button class="btn btn-primary btn-sm" (click)="showHistory = true">
                    View all records →
                  </button>
                </div>
                <div *ngIf="records.length === 0" class="text-muted" style="padding:20px 0;">
                  No medical records yet for this patient.
                </div>
                <div *ngFor="let r of records.slice(0,2)"
                     style="border:1px solid #eef2fb;border-radius:10px;padding:12px;margin-bottom:10px;font-size:13px;">
                  <strong style="color:#1a56a0;">📅 {{ formatDate(r.visitDate) }}</strong>
                  <span style="color:#888;margin-left:8px;">by {{ r.attendingStaff }}</span>
                  <span *ngIf="r.status === 'finalized'" class="badge-finalized" style="margin-left:8px;">✅ Finalized</span>
                  <span *ngIf="r.status !== 'finalized'" class="badge-draft" style="margin-left:8px;">🟡 Draft</span>
                  <div *ngIf="r.chiefComplaint" style="margin-top:6px;color:#555;">{{ r.chiefComplaint }}</div>
                </div>
                <div *ngIf="records.length > 2" style="text-align:center;font-size:12px;color:#888;padding:8px;border:1px dashed #cce0f5;border-radius:8px;margin-top:4px;">
                  + {{ records.length - 2 }} more record(s) — click "View all records" to see full history
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Full History Page -->
        <div *ngIf="showHistory && patient" class="page-slide-enter">
          <div style="background:linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0);border-radius:16px;padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <button class="btn btn-secondary btn-sm" (click)="showHistory = false">← Back</button>
            <div style="color:white;">
              <div style="font-weight:600;font-size:15px;">
                {{ patient.lastName }}, {{ patient.firstName }} — Medical History
              </div>
              <div style="font-size:11px;opacity:0.75;">
                ID: {{ patient.patientId }} · Age: {{ patient.age }} · Blood: {{ patient.bloodType }}
              </div>
            </div>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <select [(ngModel)]="filterYear" (change)="applyFilter()" style="padding:8px 12px;border:1.5px solid #c2dff5;border-radius:8px;font-size:13px;color:#1a56a0;background:#f8fcff;">
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select [(ngModel)]="filterMonth" (change)="applyFilter()" style="padding:8px 12px;border:1.5px solid #c2dff5;border-radius:8px;font-size:13px;color:#1a56a0;background:#f8fcff;">
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input type="text" [(ngModel)]="filterSearch" (input)="applyFilter()"
                placeholder="🔍 Search complaint, diagnosis..."
                style="flex:1;min-width:200px;padding:8px 12px;border:1.5px solid #c2dff5;border-radius:8px;font-size:13px;background:#f8fcff;" />
              <span style="font-size:12px;color:#888;white-space:nowrap;">
                {{ filteredRecords.length }} record(s) found
              </span>
            </div>
          </div>

          <div class="card">
            <div *ngIf="loadingRecords" class="loading"><div class="spinner"></div>Loading records...</div>
            <div *ngIf="!loadingRecords && filteredRecords.length === 0" class="text-muted" style="padding:20px 0;text-align:center;">
              No records match your search.
            </div>
            <div *ngFor="let r of filteredRecords"
                 style="border:1px solid #eef2fb;border-radius:10px;padding:14px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div>
                  <strong style="color:#1a56a0;">📅 {{ formatDate(r.visitDate) }}</strong>
                  <span style="font-size:12px;color:#888;margin-left:10px;">by {{ r.attendingStaff }}</span>
                  <span *ngIf="r.status === 'finalized'" class="badge-finalized" style="margin-left:8px;">✅ Finalized</span>
                  <span *ngIf="r.status !== 'finalized'" class="badge-draft" style="margin-left:8px;">🟡 Awaiting Doctor</span>
                </div>
                <button class="btn btn-danger btn-sm" (click)="deleteRecord(r)">🗑 Delete</button>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px;">
                <div *ngIf="r.heightCm"><strong>Height:</strong> {{ r.heightCm }} cm</div>
                <div *ngIf="r.weightKg"><strong>Weight:</strong> {{ r.weightKg }} kg</div>
                <div *ngIf="r.bmi"><strong>BMI:</strong> {{ r.bmi }} <span class="badge badge-info">{{ r.bmiStatus }}</span></div>
                <div *ngIf="r.bloodPressure"><strong>BP:</strong> {{ r.bloodPressure }}</div>
                <div *ngIf="r.temperature"><strong>Temp:</strong> {{ r.temperature }}°C</div>
                <div *ngIf="r.pulseRate"><strong>Pulse:</strong> {{ r.pulseRate }} bpm</div>
              </div>
              <div *ngIf="r.chiefComplaint" style="margin-top:8px;font-size:13px;"><strong>Complaint:</strong> {{ r.chiefComplaint }}</div>
              <div *ngIf="r.diagnosis" style="margin-top:4px;font-size:13px;"><strong>Diagnosis:</strong> {{ r.diagnosis }}</div>
              <div *ngIf="r.prescription" style="margin-top:4px;font-size:13px;"><strong>Rx:</strong> {{ r.prescription }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecordsComponent implements OnInit {
  private db = inject(FirestoreService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  searchPid = '';
  patient: Patient | null = null;
  records: MedicalRecord[] = [];
  filterYear = '';
  filterMonth = '';
  filterSearch = '';
  filteredRecords: MedicalRecord[] = [];
  loadingPatient = false;
  showHistory = false;
  loadingRecords = false;
  saving = false;
  successMsg = '';
  errorMsg = '';
  duplicateWarning = false;

  get bmiDisplay() {
    const bmi = this.db.calcBMI(this.recordForm.heightCm, this.recordForm.weightKg);
    return bmi > 0 ? `${bmi} (${this.db.getBMIStatus(bmi)})` : '—';
  }

  recordForm: any = this.emptyRecord();

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      if (params['pid']) {
        this.searchPid = params['pid'];
        await this.loadPatient();
      }
    });
  }

  async loadPatient() {
    if (!this.searchPid.trim()) {
      this.errorMsg = 'Enter a Patient ID.';
      return;
    }
    this.loadingPatient = true;
    this.clearAlerts();
    try {
      this.patient = await this.db.getPatientByPatientId(this.searchPid.trim());
      if (!this.patient) {
        this.errorMsg = `Patient "${this.searchPid}" not found.`;
      } else {
        await this.loadRecords();
      }
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Failed to load patient.';
    }
    this.loadingPatient = false;
  }

  async loadRecords() {
    if (!this.patient?.patientId) return;  // ✅ use patientId not id
    this.loadingRecords = true;
    try {
      // ✅ FIX: use patientId (PAT-2026-0001) consistently for querying
      const data = await this.db.getMedicalRecordsByPatient(this.patient.patientId);
      this.records = [...data].sort((a, b) => b.visitDate.localeCompare(a.visitDate));
      this.applyFilter();
    } catch (e) {
      console.error('LOAD RECORD ERROR:', e);
      this.errorMsg = 'Failed to load records.';
    }
    this.loadingRecords = false;
  }

  async saveRecord() {
    if (!this.patient || !this.recordForm.visitDate) {
      this.errorMsg = 'Visit date is required.';
      return;
    }
    this.saving = true;
    this.clearAlerts();
    try {
      const duplicate = this.records.find(r => r.visitDate === this.recordForm.visitDate);
      if (duplicate) { this.duplicateWarning = true; this.saving = false; return; }
      this.duplicateWarning = false;

      const bmi = this.db.calcBMI(this.recordForm.heightCm, this.recordForm.weightKg);
      const rec: any = {
        patientId: this.patient.patientId,  // ✅ always store patientId (PAT-2026-0001)
        visitDate: this.recordForm.visitDate,
        heightCm: this.recordForm.heightCm || null,
        weightKg: this.recordForm.weightKg || null,
        bmi: bmi || null,
        bmiStatus: bmi ? this.db.getBMIStatus(bmi) : null,
        bloodPressure: this.recordForm.bloodPressure || null,
        temperature: this.recordForm.temperature || null,
        pulseRate: this.recordForm.pulseRate || null,
        chiefComplaint: this.recordForm.chiefComplaint || null,
        diagnosis: null,
        prescription: null,
        doctorNotes: null,
        attendingStaff: this.auth.getStaffName(),
        status: 'draft',
        createdByRole: 'staff'
      };
      await this.db.addMedicalRecord(rec);
      this.successMsg = 'Draft saved! Awaiting doctor to finalize.';
      this.recordForm = this.emptyRecord();
      await this.loadRecords();
    } catch {
      this.errorMsg = 'Failed to save record.';
    }
    this.saving = false;
  }

  async deleteRecord(r: MedicalRecord) {
    if (!r.id || !confirm('Delete this medical record?')) return;
    try {
      await this.db.deleteMedicalRecord(r.id);
      this.successMsg = 'Record deleted.';
      await this.loadRecords();
    } catch {
      this.errorMsg = 'Failed to delete record.';
    }
  }

  clearAlerts() { this.successMsg = ''; this.errorMsg = ''; }

  emptyRecord() {
    return {
      visitDate: new Date().toISOString().split('T')[0],
      heightCm: null, weightKg: null,
      bloodPressure: '', temperature: null, pulseRate: null,
      chiefComplaint: '', diagnosis: '', prescription: '', doctorNotes: '',
      attendingStaff: this.auth.getStaffName()
    };
  }

  calcBMI() {}

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  applyFilter() {
    this.filteredRecords = this.records.filter(r => {
      const matchYear = !this.filterYear || r.visitDate.startsWith(this.filterYear);
      const matchMonth = !this.filterMonth || r.visitDate.substring(5, 7) === this.filterMonth;
      const matchSearch = !this.filterSearch ||
        (r.chiefComplaint || '').toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        (r.diagnosis || '').toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        (r.prescription || '').toLowerCase().includes(this.filterSearch.toLowerCase());
      return matchYear && matchMonth && matchSearch;
    });
  }
}