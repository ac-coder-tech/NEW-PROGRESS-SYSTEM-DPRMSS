import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { Patient, MedicalRecord } from '../../models/models';

@Component({
  selector: 'app-print',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar no-print">
          <div class="topbar-title">🖨 Print Patient Records</div>
          <div class="topbar-date">{{ today }}</div>
        </div>
        <div class="page-content">

          <!-- Search -->
          <div class="card no-print" *ngIf="!patient">
            <div class="card-title">🔍 Find Patient to Print</div>
            <div class="search-bar">
              <input type="text" [(ngModel)]="searchPid"
                placeholder="Enter Patient ID (e.g. PAT-2024-0001)" />
              <button class="btn btn-primary" (click)="loadPatient()" [disabled]="loading">
                {{ loading ? '⏳ Loading...' : '🔍 Load Patient' }}
              </button>
            </div>
            <div *ngIf="errorMsg" class="alert alert-danger mt-1">⚠️ {{ errorMsg }}</div>
          </div>

          <!-- Print Preview -->
          <div *ngIf="patient">
           <!-- Print Type Selector -->
<div class="card no-print" style="margin-bottom:16px;">
  <div class="card-title">📄 Select Document to Print</div>

  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">

    <button class="print-type-btn" (click)="printType='record'" 
     (mouseover)="recBtn.style.transform='translateY(-2px)';recBtn.style.boxShadow='0 6px 18px rgba(26,86,160,0.35)'"
     (mouseout)="recBtn.style.transform='';recBtn.style.boxShadow=''"
     #recBtn
      [style.background]="printType==='record' ? 'linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0)' : 'linear-gradient(135deg,#eef7fd,#d6eefb)'"
      [style.color]="printType==='record' ? 'white' : '#1a56a0'"
      style="padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.22s ease;">
      📋 Medical Record
    </button>

    <button class="print-type-btn" (click)="printType='certificate'"
    (mouseover)="certBtn.style.transform='translateY(-2px)';certBtn.style.boxShadow='0 6px 18px rgba(30,132,73,0.35)'"
    (mouseout)="certBtn.style.transform='';certBtn.style.boxShadow=''"
     #certBtn
      [style.background]="printType==='certificate' ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'linear-gradient(135deg,#eef7fd,#d6eefb)'"
      [style.color]="printType==='certificate' ? 'white' : '#1a56a0'"
      style="padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.22s ease;">
      🏥 Medical Certificate
    </button>

  </div>

  <!-- Two Column Layout for Certificate -->
  <div *ngIf="printType==='certificate'" style="display:flex;gap:24px;align-items:flex-start;margin-top:8px;">

    <!-- LEFT: Certificate Details Form -->
    <div style="width:320px;min-width:280px;background:#f0fff4;border:1.5px solid #a9dfbf;border-radius:12px;padding:16px;position:sticky;top:80px;">
      <div style="font-size:13px;font-weight:700;color:#1e8449;margin-bottom:12px;">📝 Certificate Details</div>
      <div class="form-group">
        <label>Purpose (e.g. School, Employer)</label>
        <input type="text" [(ngModel)]="certPurpose" placeholder="e.g. School Requirement" />
      </div>
      <div class="form-group">
        <label>Date(s) of Absence</label>
        <input type="text" [(ngModel)]="certAbsenceDates" placeholder="e.g. May 8–10, 2026" />
      </div>
      <div class="form-group">
        <label>Attending Doctor Name</label>
        <input type="text" [(ngModel)]="certDoctorName" placeholder="e.g. Dr. Juan dela Cruz" />
      </div>
      <div class="form-group">
        <label>License No. (optional)</label>
        <input type="text" [(ngModel)]="certLicenseNo" placeholder="e.g. PRC No. 12345" />
      </div>
      <div class="form-group">
        <label>Base Certificate On Visit</label>
        <select [(ngModel)]="certRecordIndex">
          <option [value]="i" *ngFor="let r of records; let i = index">
            {{ r.visitDate }} — {{ r.chiefComplaint || 'No complaint noted' }}
          </option>
        </select>
      </div>
    </div>

    <!-- RIGHT: Certificate Preview -->
    <div style="flex:1;min-width:0;">
      <div *ngIf="certRecord"
        style="background:white;border-radius:14px;border:2px solid #1a56a0;padding:40px;font-family:'Times New Roman',serif;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:15px;font-weight:700;color:#1a56a0;text-transform:uppercase;">Republic of the Philippines</div>
          <div style="font-size:13px;color:#333;">Barangay Health Center — DPRMS</div>
          <div style="border-top:3px double #1a56a0;border-bottom:3px double #1a56a0;padding:8px 0;margin-top:8px;">
            <div style="font-size:20px;font-weight:700;color:#1a56a0;letter-spacing:3px;">MEDICAL CERTIFICATE</div>
          </div>
          <div style="font-size:12px;color:#888;font-style:italic;margin-top:4px;">For Official Use — Valid Absence Certification</div>
        </div>

        <!-- Cert No & Date -->
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:20px;">
          <div><strong>Cert No.:</strong> CERT-{{ patient!.patientId }}-{{ certRecord.visitDate }}</div>
          <div><strong>Date Issued:</strong> {{ printDate }}</div>
        </div>

        <!-- Body -->
        <div style="font-size:14px;line-height:2;color:#222;margin-bottom:20px;">
          <p>This is to certify that <strong style="text-decoration:underline;">
            {{ patient!.lastName }}, {{ patient!.firstName }} {{ patient!.middleName }}</strong>,
            <strong>{{ patient!.age }}</strong> years old, <strong>{{ patient!.gender }}</strong>,
            residing at <strong>{{ patient!.address || '______________________' }}</strong>,
            was examined and found to be suffering from:
          </p>
          <div style="border:1px solid #1a56a0;border-radius:8px;padding:14px;background:#f0f8ff;margin:14px 0;">
            <div style="font-size:12px;font-weight:700;color:#1a56a0;margin-bottom:4px;">DIAGNOSIS / CONDITION:</div>
            <div>{{ certRecord.diagnosis || certRecord.chiefComplaint || '______________________________' }}</div>
            <div *ngIf="certRecord.prescription" style="font-size:12px;color:#555;margin-top:6px;">
              <strong>Prescribed:</strong> {{ certRecord.prescription }}
            </div>
          </div>
          <p *ngIf="certAbsenceDates">
            Patient is advised to rest and is excused from duties for
            <strong style="text-decoration:underline;">{{ certAbsenceDates }}</strong>.
          </p>
          <p *ngIf="!certAbsenceDates">
            Patient is advised to rest as medically necessary.
          </p>
          <p style="margin-top:12px;">
            This certificate is issued upon the patient's request for
            <strong>{{ certPurpose || 'whatever legal purpose it may serve' }}</strong>.
          </p>
        </div>

        <!-- Vital Signs -->
        <div style="border:1px solid #dde3f0;border-radius:8px;padding:10px 14px;background:#fafcff;font-size:12px;margin-bottom:24px;">
          <div style="font-weight:700;color:#1a56a0;margin-bottom:6px;font-size:11px;text-transform:uppercase;">
            Vital Signs at Visit ({{ certRecord.visitDate }})
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:16px;color:#444;">
            <span *ngIf="certRecord.bloodPressure">BP: <strong>{{ certRecord.bloodPressure }}</strong></span>
            <span *ngIf="certRecord.temperature">Temp: <strong>{{ certRecord.temperature }}°C</strong></span>
            <span *ngIf="certRecord.pulseRate">Pulse: <strong>{{ certRecord.pulseRate }} bpm</strong></span>
            <span *ngIf="certRecord.weightKg">Weight: <strong>{{ certRecord.weightKg }} kg</strong></span>
            <span *ngIf="certRecord.heightCm">Height: <strong>{{ certRecord.heightCm }} cm</strong></span>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:40px;font-size:13px;text-align:center;">
          <div>
            <div style="margin-bottom:50px;font-size:12px;color:#888;font-style:italic;">(Physician's Signature)</div>
            <div style="border-top:1.5px solid #333;padding-top:6px;">
              <strong>{{ certDoctorName || '____________________________' }}</strong>
              <div style="font-size:11px;color:#555;">Attending Physician</div>
              <div *ngIf="certLicenseNo" style="font-size:11px;color:#555;">{{ certLicenseNo }}</div>
            </div>
          </div>
          <div>
            <div style="margin-bottom:50px;font-size:12px;color:#888;font-style:italic;">(Officer-in-Charge)</div>
            <div style="border-top:1.5px solid #333;padding-top:6px;">
              <strong>____________________________</strong>
              <div style="font-size:11px;color:#555;">Health Center Officer</div>
            </div>
          </div>
        </div>

        <!-- Stamp -->
        <div style="margin-top:24px;padding:10px;border:1px dashed #aaa;border-radius:8px;text-align:center;font-size:11px;color:#aaa;font-style:italic;">
          Official stamp / dry seal to be affixed here
        </div>

      </div>
    </div>

  </div>

  <div style="display:flex;gap:10px;margin-top:16px;">
    <button class="btn btn-primary" onclick="window.print()">🖨 Print This Page</button>
    <button class="btn btn-secondary" (click)="patient=null;records=[];printType='record'">✖ Clear</button>
  </div>
</div>
          <!-- CERTIFICATE PRINT AREA -->
            <div *ngIf="printType==='certificate' && certRecord" class="print-only"
              style="background:white;padding:40px;max-width:720px;font-family:'Times New Roman',serif;">

              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:15px;font-weight:700;color:#1a56a0;text-transform:uppercase;">Republic of the Philippines</div>
                <div style="font-size:13px;color:#333;">Barangay Health Center — DPRMS</div>
                <div style="border-top:3px double #1a56a0;border-bottom:3px double #1a56a0;padding:8px 0;margin-top:8px;">
                  <div style="font-size:20px;font-weight:700;color:#1a56a0;letter-spacing:3px;">MEDICAL CERTIFICATE</div>
                </div>
                <div style="font-size:12px;color:#888;font-style:italic;margin-top:4px;">For Official Use — Valid Absence Certification</div>
              </div>

              <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:20px;">
                <div><strong>Cert No.:</strong> CERT-{{ patient!.patientId }}-{{ certRecord.visitDate }}</div>
                <div><strong>Date Issued:</strong> {{ printDate }}</div>
              </div>

              <div style="font-size:14px;line-height:2;color:#222;margin-bottom:20px;">
                <p>This is to certify that <strong style="text-decoration:underline;">
                  {{ patient!.lastName }}, {{ patient!.firstName }} {{ patient!.middleName }}</strong>,
                  <strong>{{ patient!.age }}</strong> years old, <strong>{{ patient!.gender }}</strong>,
                  residing at <strong>{{ patient!.address || '______________________' }}</strong>,
                  was examined and found to be suffering from:
                </p>
                <div style="border:1px solid #1a56a0;border-radius:8px;padding:14px;background:#f0f8ff;margin:14px 0;">
                  <div style="font-size:12px;font-weight:700;color:#1a56a0;margin-bottom:4px;">DIAGNOSIS / CONDITION:</div>
                  <div>{{ certRecord.diagnosis || certRecord.chiefComplaint || '______________________________' }}</div>
                  <div *ngIf="certRecord.prescription" style="font-size:12px;color:#555;margin-top:6px;">
                    <strong>Prescribed:</strong> {{ certRecord.prescription }}
                  </div>
                </div>
                <p *ngIf="certAbsenceDates">
                  Patient is advised to rest and is excused from duties for
                  <strong style="text-decoration:underline;">{{ certAbsenceDates }}</strong>.
                </p>
                <p *ngIf="!certAbsenceDates">Patient is advised to rest as medically necessary.</p>
                <p style="margin-top:12px;">
                  This certificate is issued upon the patient's request for
                  <strong>{{ certPurpose || 'whatever legal purpose it may serve' }}</strong>.
                </p>
              </div>

              <div style="border:1px solid #dde3f0;border-radius:8px;padding:10px 14px;background:#fafcff;font-size:12px;margin-bottom:24px;">
                <div style="font-weight:700;color:#1a56a0;margin-bottom:6px;font-size:11px;text-transform:uppercase;">Vital Signs at Visit ({{ certRecord.visitDate }})</div>
                <div style="display:flex;flex-wrap:wrap;gap:16px;color:#444;">
                  <span *ngIf="certRecord.bloodPressure">BP: <strong>{{ certRecord.bloodPressure }}</strong></span>
                  <span *ngIf="certRecord.temperature">Temp: <strong>{{ certRecord.temperature }}°C</strong></span>
                  <span *ngIf="certRecord.pulseRate">Pulse: <strong>{{ certRecord.pulseRate }} bpm</strong></span>
                  <span *ngIf="certRecord.weightKg">Weight: <strong>{{ certRecord.weightKg }} kg</strong></span>
                  <span *ngIf="certRecord.heightCm">Height: <strong>{{ certRecord.heightCm }} cm</strong></span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:40px;font-size:13px;text-align:center;">
                <div>
                  <div style="margin-bottom:50px;font-size:12px;color:#888;font-style:italic;">(Physician's Signature)</div>
                  <div style="border-top:1.5px solid #333;padding-top:6px;">
                    <strong>{{ certDoctorName || '____________________________' }}</strong>
                    <div style="font-size:11px;color:#555;">Attending Physician</div>
                    <div *ngIf="certLicenseNo" style="font-size:11px;color:#555;">{{ certLicenseNo }}</div>
                  </div>
                </div>
                <div>
                  <div style="margin-bottom:50px;font-size:12px;color:#888;font-style:italic;">(Officer-in-Charge)</div>
                  <div style="border-top:1.5px solid #333;padding-top:6px;">
                    <strong>____________________________</strong>
                    <div style="font-size:11px;color:#555;">Health Center Officer</div>
                  </div>
                </div>
              </div>

              <div style="margin-top:24px;padding:10px;border:1px dashed #aaa;border-radius:8px;text-align:center;font-size:11px;color:#aaa;font-style:italic;">
                Official stamp / dry seal to be affixed here
              </div>

            </div>

            <!-- PRINTABLE RECORD -->
            <div *ngIf="printType==='record'" style="background:white;border-radius:14px;border:1px solid #dde3f0;padding:32px;max-width:800px;">

              <!-- Header -->
              <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a56a0;">
                <div style="font-size:28px;font-weight:900;color:#1a56a0;letter-spacing:2px;">DPRMS</div>
                <div style="font-size:13px;color:#555;margin-top:2px;">Digital Patient Record Management System</div>
                <div style="font-size:14px;font-weight:700;color:#333;margin-top:4px;">Barangay Health Center — Patient Medical Record</div>
                <div style="font-size:12px;color:#888;margin-top:4px;">Printed: {{ printDate }}</div>
              </div>

              <!-- Patient Info -->
              <div style="margin-bottom:20px;">
                <div style="font-size:14px;font-weight:700;color:#1a56a0;border-bottom:1px solid #eef2fb;padding-bottom:6px;margin-bottom:12px;">
                  PATIENT INFORMATION
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
                  <div><strong>Patient ID:</strong> {{ patient.patientId }}</div>
                  <div><strong>Full Name:</strong> {{ patient.lastName }}, {{ patient.firstName }} {{ patient.middleName }}</div>
                  <div><strong>Date of Birth:</strong> {{ patient.dateOfBirth }}</div>
                  <div><strong>Age:</strong> {{ patient.age }} years old</div>
                  <div><strong>Gender:</strong> {{ patient.gender }}</div>
                  <div><strong>Civil Status:</strong> {{ patient.civilStatus }}</div>
                  <div><strong>Blood Type:</strong> {{ patient.bloodType }}</div>
                  <div><strong>PhilHealth No.:</strong> {{ patient.philhealthNumber || 'N/A' }}</div>
                  <div><strong>Address:</strong> {{ patient.address || 'N/A' }}</div>
                  <div><strong>Contact:</strong> {{ patient.contactNumber || 'N/A' }}</div>
                  <div><strong>Emergency Contact:</strong> {{ patient.emergencyContactName || 'N/A' }}</div>
                  <div><strong>Emergency No.:</strong> {{ patient.emergencyContactNumber || 'N/A' }}</div>
                </div>
              </div>

              <!-- Medical Records -->
              <div>
                <div style="font-size:14px;font-weight:700;color:#1a56a0;border-bottom:1px solid #eef2fb;padding-bottom:6px;margin-bottom:12px;">
                  MEDICAL RECORDS / VISIT HISTORY ({{ records.length }} visits)
                </div>
                <div *ngIf="records.length === 0" style="font-size:13px;color:#888;padding:16px 0;">
                  No medical records on file for this patient.
                </div>
                <div *ngFor="let r of records; let i = index"
                  style="margin-bottom:18px;padding:12px;border:1px solid #eee;border-radius:8px;">
                  <div style="font-weight:700;font-size:13px;color:#1a56a0;margin-bottom:8px;">
                    Visit #{{ records.length - i }} — {{ r.visitDate }}
                    <span style="font-weight:400;color:#888;font-size:12px;"> by {{ r.attendingStaff }}</span>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12.5px;margin-bottom:8px;">
                    <div *ngIf="r.heightCm">Height: {{ r.heightCm }} cm</div>
                    <div *ngIf="r.weightKg">Weight: {{ r.weightKg }} kg</div>
                    <div *ngIf="r.bmi">BMI: {{ r.bmi }} ({{ r.bmiStatus }})</div>
                    <div *ngIf="r.bloodPressure">BP: {{ r.bloodPressure }}</div>
                    <div *ngIf="r.temperature">Temp: {{ r.temperature }}°C</div>
                    <div *ngIf="r.pulseRate">Pulse: {{ r.pulseRate }} bpm</div>
                  </div>
                  <div *ngIf="r.chiefComplaint" style="font-size:12.5px;"><strong>Chief Complaint:</strong> {{ r.chiefComplaint }}</div>
                  <div *ngIf="r.diagnosis" style="font-size:12.5px;margin-top:4px;"><strong>Diagnosis:</strong> {{ r.diagnosis }}</div>
                  <div *ngIf="r.prescription" style="font-size:12.5px;margin-top:4px;"><strong>Prescription:</strong> {{ r.prescription }}</div>
                  <div *ngIf="r.doctorNotes" style="font-size:12.5px;margin-top:4px;"><strong>Notes:</strong> {{ r.doctorNotes }}</div>
                </div>
              </div>

              <!-- Footer -->
              <div style="margin-top:32px;border-top:1px solid #eee;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:12.5px;">
                <div>
                  <div style="margin-top:40px;border-top:1px solid #333;width:70%;text-align:center;">
                    Attending Staff Signature
                  </div>
                </div>
                <div>
                  <div style="margin-top:40px;border-top:1px solid #333;width:70%;text-align:center;">
                    Patient / Guardian Signature
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class PrintComponent implements OnInit {
  private db = inject(FirestoreService);
  private route = inject(ActivatedRoute);

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  printDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  searchPid = '';
  patient: Patient | null = null;
  records: MedicalRecord[] = [];
  loading = false;
  errorMsg = '';
  printType: 'record' | 'certificate' = 'record';
  certPurpose = '';
  certAbsenceDates = '';
  certDoctorName = '';
  certLicenseNo = '';
  certRecordIndex = 0;

  get certRecord(): MedicalRecord | null {
    return this.records[this.certRecordIndex] ?? null;
  }

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      if (params['pid']) {
        this.searchPid = params['pid'];
        await this.loadPatient();
      }
    });
  }

  async loadPatient() {
    if (!this.searchPid.trim()) { this.errorMsg = 'Enter a Patient ID.'; return; }
    this.loading = true;
    this.errorMsg = '';
    try {
      this.patient = await this.db.getPatientByPatientId(this.searchPid.trim());
      if (!this.patient) { this.errorMsg = `Patient "${this.searchPid}" not found.`; }
      else {
       this.records = await this.db.getMedicalRecordsByPatient(this.patient.patientId!); 
      }
    } catch { this.errorMsg = 'Failed to load patient.'; }
    this.loading = false;
  }
}