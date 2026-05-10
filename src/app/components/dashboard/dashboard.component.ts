
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Patient, Appointment } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">🏠 Dashboard</div>
          <div class="topbar-date">{{ today }}</div>
        </div>
        <div class="page-content">

          <!-- Welcome Banner -->
          <div class="card" style="background:linear-gradient(135deg,#56ccf2,#2f80ed,#1a56a0);border:none;color:white;margin-bottom:22px;">
            <h2 style="color:white;font-size:20px;">Good day, {{ staffName }}! 👋</h2>
            <p style="color:rgba(255,255,255,0.8);margin-top:6px;font-size:14px;">
              Welcome to the Digital Patient Record Management System of Barangay Health Center.
              <span style="font-size:11px;display:block;margin-top:4px;opacity:0.7;">Powered by Angular + Firebase ✅</span>
            </p>
          </div>

          <!-- Stats -->
          <div *ngIf="loading" class="loading"><div class="spinner"></div>Loading dashboard...</div>

          <div *ngIf="!loading" class="stats-grid">
            <div class="stat-card">
              <div class="stat-num">{{ stats.totalPatients }}</div>
              <div class="stat-label">👥 Total Patients</div>
            </div>
            <div class="stat-card">
              <div class="stat-num">{{ stats.todayVisits }}</div>
              <div class="stat-label">🩺 Today's Checkups</div>
            </div>
            <div class="stat-card">
              <div class="stat-num">{{ stats.todayAppointments }}</div>
              <div class="stat-label">📅 Today's Appointments</div>
            </div>
            <div class="stat-card accent">
              <div class="stat-num">{{ stats.monthNewPatients }}</div>
              <div class="stat-label">📅 New This Month</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <div class="card-title">⚡ Quick Actions</div>
            <div class="d-flex gap-10 flex-wrap">
              <a routerLink="/patients" class="btn btn-primary">➕ Register Patient</a>
              <a routerLink="/search" class="btn btn-secondary">🔍 Search Patient</a>
              <a routerLink="/calendar" class="btn btn-secondary">📅 Add Appointment</a>
              <a routerLink="/print" class="btn btn-secondary">🖨 Print Records</a>
              <a routerLink="/records" class="btn btn-secondary">📋 Record Update</a>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <!-- Recent Patients -->
            <div class="card mb-0">
              <div class="card-title">👥 Recent Patients</div>
              <div *ngIf="recentPatients.length === 0" class="text-muted" style="font-size:13px;padding:12px 0;">
                No patients registered yet.
              </div>
              <table *ngIf="recentPatients.length > 0" class="data-table">
                <thead>
                  <tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of recentPatients">
                    <td><span class="patient-id-badge">{{ p.patientId }}</span></td>
                    <td>{{ p.lastName }}, {{ p.firstName }}</td>
                    <td>{{ p.age }}</td>
                    <td>{{ p.gender }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Today's Appointments -->
            <div class="card mb-0">
              <div class="card-title">📅 Today's Appointments</div>
              <div *ngIf="todayAppts.length === 0" class="text-muted" style="font-size:13px;padding:12px 0;">
                No appointments scheduled for today.
              </div>
              <table *ngIf="todayAppts.length > 0" class="data-table">
                <thead>
                  <tr><th>Time</th><th>Patient</th><th>Purpose</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let a of todayAppts">
                    <!-- ✅ NEW -->
                    <td>{{ formatTime(a.appointmentTime) }}</td>
                    <td>{{ a.patientName }}</td>
                    <td>{{ a.purpose || '—' }}</td>
                    <td><span class="badge" [ngClass]="getStatusClass(a.status)">{{ a.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Firebase Status Badge -->
          <div style="margin-top:20px;padding:12px 16px;background:#d5f5e3;border:1px solid #a9dfbf;border-radius:10px;font-size:13px;color:#1e8449;display:flex;align-items:center;gap:8px;">
            ✅ <strong>Firebase Connected</strong> — Firestore database active &nbsp;|&nbsp; Angular Framework ✅
          </div>

        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private db = inject(FirestoreService);
  private auth = inject(AuthService);

  loading = true;
  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  staffName = '';
  stats = { totalPatients: 0, todayVisits: 0, todayAppointments: 0, monthNewPatients: 0 };
  recentPatients: Patient[] = [];
  todayAppts: Appointment[] = [];

  async ngOnInit() {
    this.staffName = this.auth.getStaffName();
    try {
      const [total, visits, appts, monthNew, recent, todayApptsList] = await Promise.all([
        this.db.getTotalPatients(),
        this.db.getTodayVisits(),
        this.db.getTodayAppointments(),
        this.db.getMonthNewPatients(),
        this.db.getRecentPatients(5),
        this.db.getAppointmentsByDate(new Date().toISOString().split('T')[0])
      ]);
      this.stats = { totalPatients: total, todayVisits: visits, todayAppointments: appts, monthNewPatients: monthNew };
      this.recentPatients = recent;
      this.todayAppts = todayApptsList;
    } catch (e) { console.error(e); }
    this.loading = false;
  }

  getStatusClass(status: string) {
    return {
      'badge-success': status === 'Completed',
      'badge-danger': status === 'Cancelled',
      'badge-warning': status === 'No Show',
      'badge-info': status === 'Scheduled'
    };
  }
  
  formatTime(time: string): string {
  if (!time) return '—';
  const [hourStr, minute] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}
}
