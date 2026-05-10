import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { StaffUser } from '../../models/models';

@Component({
  selector: 'app-manage-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">👤 Manage Staff</div>
          <div class="topbar-date">{{ today }}</div>
        </div>
        <div class="page-content">

          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:20px;">

            <!-- Add Staff Form -->
            <div class="card">
              <div class="card-title">➕ Add New Staff Account</div>
              <div class="alert alert-info" style="margin-bottom:14px;font-size:12px;">
                📌 This creates a Firebase Auth account + staff profile in Firestore.
              </div>
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" [(ngModel)]="form.fullName" placeholder="e.g. Maria Santos" />
              </div>
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="form.email" placeholder="staff@health.gov.ph" />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input type="text" [(ngModel)]="form.username" placeholder="e.g. msantos" />
              </div>
              <div class="form-group">
                <label>Role</label>
                <select [(ngModel)]="form.role">
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" [(ngModel)]="form.password" placeholder="Min 6 characters" />
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input type="password" [(ngModel)]="form.confirmPassword" placeholder="Repeat password" />
              </div>
              <button class="btn btn-primary w-100" (click)="addStaff()" [disabled]="saving"
                style="width:100%;justify-content:center;">
                {{ saving ? '⏳ Creating...' : '➕ Create Account' }}
              </button>
            </div>

            <!-- Staff List -->
            <div class="card">
              <div class="card-title">👥 Current Staff Members</div>
              <div *ngIf="loading" class="loading"><div class="spinner"></div>Loading staff...</div>
              <div *ngIf="!loading && staffList.length === 0" class="text-muted" style="padding:20px 0;">
                No staff profiles in Firestore yet. Staff are created via Firebase Authentication.
              </div>
              <div *ngFor="let s of staffList"
                style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #eef2fb;border-radius:10px;margin-bottom:10px;">
                <div>
                  <div style="font-weight:600;font-size:14px;">{{ s.fullName }}</div>
                  <div style="font-size:12px;color:#888;margin-top:2px;">
                    📧 {{ s.email }} &nbsp;|&nbsp;
                    <span class="badge" [ngClass]="getRoleClass(s.role)">{{ s.role }}</span>
                  </div>
                </div>
                <div class="d-flex gap-8">
                  <select [(ngModel)]="s.role" (change)="updateRole(s)" class="btn btn-secondary btn-sm"
                    style="padding:5px 8px;border:1px solid #dde3f0;border-radius:6px;font-size:12px;">
                    <option value="Admin">Admin</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Staff">Staff</option>
                  </select>
                  <button class="btn btn-danger btn-sm" (click)="deleteStaff(s)">🗑</button>
                </div>
              </div>

              <div style="margin-top:16px;padding:12px;background:#f0f4fb;border-radius:8px;font-size:12.5px;color:#555;">
                <strong>📌 Note:</strong> To change passwords, go to the
                <strong>Firebase Console → Authentication → Users</strong>.
                Staff accounts are authenticated via Firebase Email/Password.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ManageStaffComponent implements OnInit {
  private db = inject(FirestoreService);
  private authService = inject(AuthService);

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  loading = true;
  saving = false;
  successMsg = '';
  errorMsg = '';
  staffList: StaffUser[] = [];

  form: any = { fullName: '', email: '', username: '', role: 'Staff', password: '', confirmPassword: '' };

  async ngOnInit() { await this.loadStaff(); }

  async loadStaff() {
    this.loading = true;
    try { this.staffList = await this.db.getAllStaff(); } catch { }
    this.loading = false;
  }

  async addStaff() {
    if (!this.form.fullName || !this.form.email || !this.form.password) {
      this.errorMsg = 'Full name, email, and password are required.'; return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMsg = 'Passwords do not match.'; return;
    }
    if (this.form.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.'; return;
    }
    this.saving = true;
    this.clearAlerts();
    try {
      await this.authService.createStaffAccount(this.form.email, this.form.password, {
        fullName: this.form.fullName,
        username: this.form.username,
        role: this.form.role
      });
      this.successMsg = `Staff account created for ${this.form.fullName}!`;
      this.form = { fullName: '', email: '', username: '', role: 'Staff', password: '', confirmPassword: '' };
      await this.loadStaff();
    } catch (e: any) {
      this.errorMsg = e.code === 'auth/email-already-in-use'
        ? 'This email is already registered.'
        : 'Failed to create account. ' + (e.message || '');
    }
    this.saving = false;
  }

  async updateRole(s: StaffUser) {
    if (!s.id) return;
    try {
      await this.db.updateStaff(s.id, { role: s.role });
      this.successMsg = `Role updated for ${s.fullName}.`;
    } catch { this.errorMsg = 'Failed to update role.'; }
  }

  async deleteStaff(s: StaffUser) {
    if (!s.id || !confirm(`Delete staff profile for ${s.fullName}?\n\nNote: This removes the Firestore profile. To also delete their login, go to Firebase Console → Authentication.`)) return;
    try {
      await this.db.deleteStaff(s.id);
      this.successMsg = 'Staff profile deleted.';
      await this.loadStaff();
    } catch { this.errorMsg = 'Failed to delete staff.'; }
  }

  getRoleClass(role: string) {
    return {
      'badge-danger': role === 'Admin',
      'badge-success': role === 'Doctor',
      'badge-info': role === 'Nurse',
      'badge-secondary': role === 'Staff'
    };
  }

  clearAlerts() { this.successMsg = ''; this.errorMsg = ''; }
}
