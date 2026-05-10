import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/models';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">👥 Patients</div>
          <div class="topbar-date">{{ today }}</div>
        </div>
        <div class="page-content">

          <!-- Alerts -->
          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <!-- Toggle: List / Register -->
          <div class="card" style="padding:12px 16px;margin-bottom:18px;">
            <div class="d-flex gap-10">
              <button class="btn" [class.btn-primary]="view==='list'" [class.btn-secondary]="view!='list'"
                (click)="view='list'">📋 Patient List</button>
              <button class="btn" [class.btn-primary]="view==='register'" [class.btn-secondary]="view!='register'"
                (click)="openRegisterForm()">➕ Register New Patient</button>
              <button *ngIf="view==='edit'" class="btn btn-secondary" disabled>✏️ Edit Patient</button>
            </div>
          </div>

          <!-- PATIENT LIST -->
          <div *ngIf="view === 'list'" class="card">
            <div class="card-title">👥 All Registered Patients</div>
            <div class="search-bar" style="margin-bottom:14px;">
              <input type="text" [(ngModel)]="searchTerm" placeholder="Search name or patient ID..."
                (input)="filterPatients()" />
              <button class="btn btn-secondary" (click)="loadPatients()">🔄 Refresh</button>
            </div>
            <div *ngIf="loadingList" class="loading"><div class="spinner"></div>Loading patients...</div>
            <div *ngIf="!loadingList">
              <div *ngIf="filteredPatients.length === 0" class="text-muted text-center" style="padding:30px;">
                No patients found.
              </div>
              <div *ngIf="filteredPatients.length > 0" class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th>
                      <th>Contact</th><th>Blood Type</th><th>Registered</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of filteredPatients">
                      <td><span class="patient-id-badge">{{ p.patientId }}</span></td>
                      <td><strong>{{ p.lastName }}, {{ p.firstName }}</strong> {{ p.middleName }}</td>
                      <td>{{ p.age }}</td>
                      <td>{{ p.gender }}</td>
                      <td>{{ p.contactNumber || '—' }}</td>
                      <td><span class="badge badge-info">{{ p.bloodType }}</span></td>
                      <td>{{ formatDate(p.createdAt) }}</td>
                      <td>
                        <div class="d-flex gap-8">
                          <button class="btn btn-secondary btn-sm" (click)="editPatient(p)">✏️ Edit</button>
                          <a [routerLink]="'/records'" [queryParams]="{pid: p.patientId}" class="btn btn-secondary btn-sm">📋 Records</a>
                          <button class="btn btn-danger btn-sm" (click)="confirmDelete(p)">🗑</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="margin-top:10px;font-size:13px;color:#888;">
                Showing {{ filteredPatients.length }} of {{ allPatients.length }} patients
              </div>
            </div>
          </div>

          <!-- REGISTER / EDIT FORM -->
          <div *ngIf="view === 'register' || view === 'edit'" class="card">
            <div class="card-title">{{ view === 'edit' ? '✏️ Edit Patient' : '➕ Register New Patient' }}</div>

            <div class="form-section-title">👤 Personal Information</div>
            <div class="form-grid-3">
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" [(ngModel)]="form.lastName" placeholder="Dela Cruz" />
              </div>
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" [(ngModel)]="form.firstName" placeholder="Juan" />
              </div>
              <div class="form-group">
                <label>Middle Name <span style="color:#aaa;font-size:11px;">(optional)</span></label>
                <input type="text" [(ngModel)]="form.middleName" placeholder="Santos" />
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Date of Birth *</label>
                <input type="date" [(ngModel)]="form.dateOfBirth" (change)="updateAge()" />
              </div>
              <div class="form-group">
                <label>Age</label>
                <input type="number" [(ngModel)]="form.age" readonly style="background:#f5f7fc;" />
              </div>
              <div class="form-group">
                <label>Gender *</label>
                <select [(ngModel)]="form.gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Civil Status</label>
                <select [(ngModel)]="form.civilStatus">
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>

            <div class="form-section-title">📞 Contact Information</div>
            <div class="form-grid">
              <div class="form-group">
                <label>Address</label>
                <input type="text" [(ngModel)]="form.address" placeholder="Purok 1, Barangay..." />
              </div>
              <div class="form-group">
                <label>Contact Number</label>
                <input type="text" [(ngModel)]="form.contactNumber" placeholder="09XX-XXX-XXXX" />
              </div>
              <div class="form-group">
                <label>Emergency Contact Name <span style="color:#aaa;font-size:11px;">(optional)</span></label>
                <input type="text" [(ngModel)]="form.emergencyContactName" />
              </div>
              <div class="form-group">
                <label>Emergency Contact Number <span style="color:#aaa;font-size:11px;">(optional)</span></label>
                <input type="text" [(ngModel)]="form.emergencyContactNumber" />
              </div>
            </div>

            <div class="form-section-title">🏥 Medical Information</div>
            <div class="form-grid">
              <div class="form-group">
                <label>Blood Type</label>
                <select [(ngModel)]="form.bloodType">
                  <option *ngFor="let bt of bloodTypes" [value]="bt">{{ bt }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>PhilHealth Number <span style="color:#aaa;font-size:11px;">(optional)</span></label>
                <input type="text" [(ngModel)]="form.philhealthNumber" placeholder="XX-XXXXXXXXX-X" />
              </div>
            </div>

            <div class="d-flex gap-10 mt-2">
              <button class="btn btn-primary" (click)="savePatient()" [disabled]="saving">
                {{ saving ? '⏳ Saving...' : (view === 'edit' ? '💾 Update Patient' : '💾 Register Patient') }}
              </button>
              <button class="btn btn-secondary" (click)="view='list'">✖ Cancel</button>
            </div>
          </div>

          <!-- Delete Confirm Modal -->
          <div *ngIf="deleteTarget" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;display:flex;align-items:center;justify-content:center;">
            <div class="card" style="max-width:400px;width:90%;margin:0;">
              <div class="card-title" style="color:#c0392b;">🗑 Delete Patient</div>
              <p style="font-size:14px;margin-bottom:16px;">
                Are you sure you want to delete <strong>{{ deleteTarget.lastName }}, {{ deleteTarget.firstName }}</strong>?
                This will also delete all their medical records. This cannot be undone.
              </p>
              <div class="d-flex gap-10">
                <button class="btn btn-danger" (click)="deletePatient()" [disabled]="saving">
                  {{ saving ? 'Deleting...' : 'Yes, Delete' }}
                </button>
                <button class="btn btn-secondary" (click)="deleteTarget = null">Cancel</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class PatientsComponent implements OnInit {
  private db = inject(FirestoreService);

  view: 'list' | 'register' | 'edit' = 'list';

  today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  loadingList = true;
  saving = false;
  successMsg = '';
  errorMsg = '';
  searchTerm = '';
  allPatients: Patient[] = [];
  filteredPatients: Patient[] = [];
  deleteTarget: Patient | null = null;
  editingId: string | null = null;
  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  form: any = this.emptyForm();

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    this.loadingList = true;
    try {
      this.allPatients = await this.db.getAllPatients();
      this.filterPatients();
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Failed to load patients.';
    }
    this.loadingList = false;
  }

  filterPatients() {
    const t = this.searchTerm.toLowerCase();
    this.filteredPatients = t
      ? this.allPatients.filter(p =>
          p.firstName?.toLowerCase().includes(t) ||
          p.lastName?.toLowerCase().includes(t) ||
          p.patientId?.toLowerCase().includes(t)
        )
      : [...this.allPatients];
  }

  openRegisterForm() {
    this.form = this.emptyForm();
    this.editingId = null;
    this.view = 'register';
    this.clearAlerts();
  }

  editPatient(p: Patient) {
    this.form = { ...p };
    this.editingId = p.id!;
    this.view = 'edit';
    this.clearAlerts();
  }

  updateAge() {
    if (this.form.dateOfBirth) {
      this.form.age = this.db.calcAge(this.form.dateOfBirth);
    }
  }

  async savePatient() {
  // ✅ CONSISTENCY: Validate all required fields before saving
const patientData = { ...this.form };
if (!patientData.lastName?.trim()) { this.errorMsg = '⚠️ Last Name is required!'; return; }
if (!patientData.firstName?.trim()) { this.errorMsg = '⚠️ First Name is required!'; return; }
if (!patientData.dateOfBirth) { this.errorMsg = '⚠️ Date of Birth is required!'; return; }
if (!patientData.gender) { this.errorMsg = '⚠️ Gender is required!'; return; }
if (!patientData.civilStatus) { this.errorMsg = '⚠️ Civil Status is required!'; return; }
if (!patientData.address?.trim()) { this.errorMsg = '⚠️ Address is required!'; return; }
if (!patientData.contactNumber?.trim()) { this.errorMsg = '⚠️ Contact Number is required!'; return; }
if (!patientData.bloodType || patientData.bloodType === 'Unknown') { this.errorMsg = '⚠️ Please select a Blood Type!'; return; }
const age = this.db.calcAge(patientData.dateOfBirth);
if (age < 0 || age > 150) { this.errorMsg = '⚠️ Invalid Date of Birth!'; return; }

    this.saving = true;
    this.clearAlerts();

    try {
      if (this.view === 'edit' && this.editingId) {
        // ✅ ISOLATION: Update uses transaction internally
        await this.db.updatePatient(this.editingId, this.form);
        this.successMsg = 'Patient updated successfully!';
      } else {
        // ✅ ATOMICITY: Generate ID + save patient + audit log atomically
        const patientId = await this.db.generatePatientId();
        const fullPatient = { ...this.form, patientId };

        const docId = await this.db.addPatientAtomic(fullPatient);

        // ✅ DURABILITY: Verify data was actually saved
        await this.db.verifyPatientSaved(docId);

        this.successMsg = `Patient registered! ID: ${patientId}`;
      }

      await this.loadPatients();
      this.view = 'list';

    } catch (e) {
      console.error('SAVE ERROR:', e);
      // ✅ ATOMICITY: If anything failed, nothing was saved
      this.errorMsg = 'Failed to save patient. Transaction was rolled back.';
    } finally {
      this.saving = false;
    }
  }

  confirmDelete(p: Patient) {
    this.deleteTarget = p;
  }

  async deletePatient() {
    if (!this.deleteTarget?.id || !this.deleteTarget?.patientId) return;

    this.saving = true;

    try {
      // ✅ ATOMICITY: Delete patient + all records atomically via batch
      await this.db.deletePatientAtomic(
        this.deleteTarget.id,
        this.deleteTarget.patientId
      );
      this.successMsg = 'Patient and all records deleted successfully.';
      this.deleteTarget = null;
      await this.loadPatients();
    } catch (e) {
      console.error(e);
      // ✅ ATOMICITY: If batch failed, nothing was deleted
      this.errorMsg = 'Failed to delete. Transaction was rolled back.';
    }

    this.saving = false;
  }

  formatDate(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH');
  }

  clearAlerts() {
    this.successMsg = '';
    this.errorMsg = '';
  }

  emptyForm() {
    return {
      lastName: '', firstName: '', middleName: '',
      dateOfBirth: '', age: 0, gender: 'Male',
      civilStatus: 'Single', address: '',
      contactNumber: '', emergencyContactName: '',
      emergencyContactNumber: '', bloodType: 'Unknown',
      philhealthNumber: ''
    };
  }
}