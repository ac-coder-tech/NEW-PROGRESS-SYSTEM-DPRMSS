import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { Appointment } from '../../models/models';

@Component({
  selector: 'app-all-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">

        <div class="topbar">
          <div class="topbar-title">📋 All Appointments</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="topbar-date">{{ todayStr }}</span>
            <button class="btn btn-secondary btn-sm" (click)="goBack()">◀ Back to Calendar</button>
          </div>
        </div>

        <div class="page-content page-slide-enter">

          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <!-- Stats Row -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
            <div class="stat-card">
              <div class="stat-num">{{ countByStatus('Scheduled') }}</div>
              <div class="stat-label">Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-num" style="color:#1e8449;">{{ countByStatus('Completed') }}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-num" style="color:#c0392b;">{{ countByStatus('Cancelled') }}</div>
              <div class="stat-label">Cancelled</div>
            </div>
            <div class="stat-card">
              <div class="stat-num" style="color:#b7950b;">{{ countByStatus('No Show') }}</div>
              <div class="stat-label">No Show</div>
            </div>
          </div>

          <!-- Filters -->
          <div class="card" style="margin-bottom:18px;">
            <div class="card-title">🔍 Filter Appointments</div>
            <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">

              <div class="form-group" style="margin-bottom:0;min-width:130px;">
                <label>Year</label>
                <select [(ngModel)]="filterYear" (ngModelChange)="applyFilters()">
                  <option value="">All Years</option>
                  <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;min-width:150px;">
                <label>Month</label>
                <select [(ngModel)]="filterMonth" (ngModelChange)="applyFilters()">
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
              </div>

              <div class="form-group" style="margin-bottom:0;min-width:150px;">
                <label>Status</label>
                <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
                  <option value="">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;flex:1;min-width:200px;">
                <label>Search Patient / Purpose</label>
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()"
                  placeholder="Type to search..." />
              </div>

              <button class="btn btn-secondary" style="margin-bottom:0;" (click)="clearFilters()">
                🔄 Clear Filters
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="card">
            <div class="card-title" style="justify-content:space-between;">
              <span>📄 Appointment Records</span>
              <span style="font-size:12px;font-weight:500;color:#7a96b8;">
                Showing {{ filteredAppointments.length }} record{{ filteredAppointments.length !== 1 ? 's' : '' }}
                <span *ngIf="filteredAppointments.length !== allAppointments.length">
                  of {{ allAppointments.length }} total
                </span>
              </span>
            </div>

            <div *ngIf="loading" class="loading"><div class="spinner"></div>Loading appointments...</div>

            <div *ngIf="!loading">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient Name</th>
                      <th>Patient ID</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let a of pagedAppointments; let i = index">
                      <td style="color:#aaa;font-size:12px;">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                      <td>{{ a.appointmentDate }}</td>
                      <td>{{ formatTime(a.appointmentTime) }}</td>
                      <td style="font-weight:600;">{{ a.patientName }}</td>
                      <td>
                        <span *ngIf="a.patientId" class="patient-id-badge">{{ a.patientId }}</span>
                        <span *ngIf="!a.patientId" class="text-muted">—</span>
                      </td>
                      <td>{{ a.purpose || '—' }}</td>
                      <td><span class="badge" [ngClass]="getStatusClass(a.status)">{{ a.status }}</span></td>
                      <td style="font-size:12px;color:#888;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        {{ a.notes || '—' }}
                      </td>
                      <td>
                        <div class="d-flex gap-8">
                          <button class="btn btn-secondary btn-sm" (click)="editAppointment(a)">✏️</button>
                          <button class="btn btn-danger btn-sm" (click)="deleteAppointment(a)">🗑</button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="pagedAppointments.length === 0">
                      <td colspan="9" style="text-align:center;padding:40px;color:#aaa;">
                        <div style="font-size:32px;margin-bottom:8px;">📭</div>
                        No appointments found for the selected filters.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div *ngIf="totalPages > 1"
                style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" (click)="goPage(currentPage - 1)" [disabled]="currentPage === 1">◀</button>
                <ng-container *ngFor="let p of pageNumbers">
                  <button
                    class="btn btn-sm"
                    [class.btn-primary]="p === currentPage"
                    [class.btn-secondary]="p !== currentPage"
                    (click)="goPage(p)">{{ p }}</button>
                </ng-container>
                <button class="btn btn-secondary btn-sm" (click)="goPage(currentPage + 1)" [disabled]="currentPage === totalPages">▶</button>
                <span style="font-size:12px;color:#aaa;margin-left:8px;">
                  Page {{ currentPage }} of {{ totalPages }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div *ngIf="editingAppt"
      style="position:fixed;inset:0;background:rgba(13,59,114,0.45);z-index:999;display:flex;align-items:center;justify-content:center;">
      <div class="card" style="width:480px;max-width:95vw;margin:0;box-shadow:0 12px 40px rgba(13,59,114,0.35);">
        <div class="card-title">✏️ Edit Appointment</div>

        <div class="form-grid">
          <div class="form-group">
            <label>Patient Name *</label>
            <input type="text" [(ngModel)]="editForm.patientName" />
          </div>
          <div class="form-group">
            <label>Patient ID</label>
            <input type="text" [(ngModel)]="editForm.patientId" />
          </div>
          <div class="form-group">
            <label>Date *</label>
            <input type="date" [(ngModel)]="editForm.appointmentDate" />
          </div>
          <div class="form-group">
            <label>Time</label>
            <input type="time" [(ngModel)]="editForm.appointmentTime" />
          </div>
        </div>

        <div class="form-group">
          <label>Purpose</label>
          <input type="text" [(ngModel)]="editForm.purpose" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select [(ngModel)]="editForm.status">
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea [(ngModel)]="editForm.notes" rows="2"></textarea>
        </div>

        <div class="d-flex gap-10">
          <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving">
            {{ saving ? '⏳ Saving...' : '💾 Save Changes' }}
          </button>
          <button class="btn btn-secondary" (click)="cancelEdit()">✖ Cancel</button>
        </div>
      </div>
    </div>
  `
})
export class AllAppointmentsComponent implements OnInit {
  private db = inject(FirestoreService);
  private router = inject(Router);

  today = new Date();
  todayStr = this.today.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  allAppointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];

  loading = true;
  saving = false;
  successMsg = '';
  errorMsg = '';

  filterYear = '';
  filterMonth = '';
  filterStatus = '';
  searchQuery = '';
  availableYears: number[] = [];

  currentPage = 1;
  pageSize = 10;

  editingAppt: Appointment | null = null;
  editForm: any = {};

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get pagedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAppointments.slice(start, start + this.pageSize);
  }

  async ngOnInit() {
    await this.loadAppointments();
  }

  async loadAppointments() {
    this.loading = true;
    try {
      const raw = await this.db.getAllAppointments();
      // Newest first
      this.allAppointments = raw.sort((a, b) => {
        const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
        if (dateCompare !== 0) return dateCompare;
        return (b.appointmentTime || '').localeCompare(a.appointmentTime || '');
      });
      const years = [...new Set(this.allAppointments.map(a => a.appointmentDate?.split('-')[0]).filter(Boolean))];
      this.availableYears = years.map(Number).sort((a, b) => b - a);
      this.applyFilters();
    } catch {
      this.errorMsg = 'Failed to load appointments.';
    }
    this.loading = false;
  }

  applyFilters() {
    let result = [...this.allAppointments];
    if (this.filterYear) result = result.filter(a => a.appointmentDate?.startsWith(this.filterYear));
    if (this.filterMonth) result = result.filter(a => a.appointmentDate?.split('-')[1] === this.filterMonth);
    if (this.filterStatus) result = result.filter(a => a.status === this.filterStatus);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(a =>
        a.patientName?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q) ||
        a.patientId?.toLowerCase().includes(q)
      );
    }
    this.filteredAppointments = result;
    this.currentPage = 1;
  }

  clearFilters() {
    this.filterYear = '';
    this.filterMonth = '';
    this.filterStatus = '';
    this.searchQuery = '';
    this.applyFilters();
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  countByStatus(status: string): number {
    return this.filteredAppointments.filter(a => a.status === status).length;
  }

  goBack() {
    this.router.navigate(['/calendar']);
  }

  editAppointment(a: Appointment) {
    this.editingAppt = a;
    this.editForm = { ...a };
  }

  cancelEdit() {
    this.editingAppt = null;
    this.editForm = {};
  }

  async saveEdit() {
    if (!this.editForm.patientName || !this.editForm.appointmentDate) {
      this.errorMsg = 'Patient name and date are required.'; return;
    }
    this.saving = true;
    this.clearAlerts();
    try {
      await this.db.updateAppointment(this.editingAppt!.id!, this.editForm);
      this.successMsg = 'Appointment updated successfully!';
      this.editingAppt = null;
      this.editForm = {};
      await this.loadAppointments();
    } catch {
      this.errorMsg = 'Failed to update appointment.';
    }
    this.saving = false;
  }

  async deleteAppointment(a: Appointment) {
    if (!a.id || !confirm(`Delete appointment for ${a.patientName}?`)) return;
    this.clearAlerts();
    try {
      await this.db.deleteAppointment(a.id);
      this.successMsg = 'Appointment deleted.';
      await this.loadAppointments();
    } catch {
      this.errorMsg = 'Failed to delete appointment.';
    }
  }

  getStatusClass(status: string) {
    return {
      'badge-success': status === 'Completed',
      'badge-danger': status === 'Cancelled',
      'badge-warning': status === 'No Show',
      'badge-info': status === 'Scheduled'
    };
  }

  clearAlerts() { this.successMsg = ''; this.errorMsg = ''; }

  formatTime(time: string): string {
    if (!time) return '—';
    const [hourStr, minute] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }
}