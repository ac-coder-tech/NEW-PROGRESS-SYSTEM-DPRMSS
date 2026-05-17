import { Router } from '@angular/router';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { Appointment } from '../../models/models';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">📅 Appointment Calendar</div>
          <div class="topbar-date">{{ todayStr }}</div>
        </div>
        <div class="page-content">

          <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

          <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">

            <!-- Calendar -->
            <div class="card">
              <div class="card-title">
                <button class="btn btn-secondary btn-sm" (click)="prevMonth()">◀</button>
                &nbsp; {{ monthLabel }} &nbsp;
                <button class="btn btn-secondary btn-sm" (click)="nextMonth()">▶</button>
                <button class="btn btn-secondary btn-sm" style="margin-left:auto;" (click)="goToday()">Today</button>
              </div>

              <div class="cal-header">
                <div class="cal-day-name" *ngFor="let d of dayNames">{{ d }}</div>
              </div>
              <div class="calendar-grid">
                <div *ngFor="let day of calDays"
                  class="cal-day"
                  [class.today]="day.isToday"
                  [class.other-month]="!day.inMonth"
                  (click)="selectDay(day)">
                  <div class="day-num">{{ day.date.getDate() }}</div>
                  <div *ngFor="let appt of day.appointments" class="cal-event"
                    [title]="appt.patientName + ' - ' + appt.purpose">
                  {{ appt.appointmentTime ? formatTime(appt.appointmentTime) + ' ' : '' }}{{ appt.patientName }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Side Panel -->
            <div>
              <!-- Add Appointment -->
              <div class="card">
                <div class="card-title">➕ {{ editingAppt ? 'Edit' : 'Add' }} Appointment</div>
                <div class="form-group">
                  <label>Patient Name *</label>
                  <input type="text" [(ngModel)]="form.patientName" placeholder="Full name" />
                </div>
                <div class="form-group">
                  <label>Patient ID (optional)</label>
                  <input type="text" [(ngModel)]="form.patientId" placeholder="PAT-2024-0001" />
                </div>
                <div class="form-group">
                  <label>Date *</label>
                  <input type="date" [(ngModel)]="form.appointmentDate" />
                </div>
                <div class="form-group">
                  <label>Time</label>
                  <input type="time" [(ngModel)]="form.appointmentTime" />
                </div>
                <div class="form-group">
                  <label>Purpose</label>
                  <input type="text" [(ngModel)]="form.purpose" placeholder="e.g. General Checkup" />
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select [(ngModel)]="form.status">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Notes</label>
                  <textarea [(ngModel)]="form.notes" rows="2"></textarea>
                </div>
                <div class="d-flex gap-10">
                  <button class="btn btn-primary" (click)="saveAppointment()" [disabled]="saving">
                    {{ saving ? '⏳...' : '💾 Save' }}
                  </button>
                  <button *ngIf="editingAppt" class="btn btn-secondary" (click)="cancelEdit()">✖ Cancel</button>
                </div>
                <button class="btn btn-secondary w-100" style="margin-top:10px;justify-content:center;" (click)="goToAllAppointments()">
                  📋 View All Appointments
                </button>
              </div>

              <!-- Selected Day Appointments -->
              <div *ngIf="selectedDay" class="card">
                <div class="card-title">📅 {{ selectedDay.date | date:'MMMM d, y' }}</div>
                <div *ngIf="selectedDay.appointments.length === 0" class="text-muted" style="font-size:13px;">
                  No appointments on this day.
                </div>
                <div *ngFor="let a of selectedDay.appointments"
                  style="padding:10px;border:1px solid #eef2fb;border-radius:8px;margin-bottom:8px;">
                  <div style="font-weight:600;font-size:13.5px;">{{ a.patientName }}</div>
                  <div style="font-size:12px;color:#888;margin-top:2px;">
                   {{ formatTime(a.appointmentTime) }} &nbsp;|&nbsp; {{ a.purpose || 'No purpose' }}
                  <div style="margin-top:6px;">
                    <span class="badge" [ngClass]="getStatusClass(a.status)">{{ a.status }}</span>
                  </div>
                  <div style="margin-top:8px;display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm" (click)="editAppointment(a)">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="deleteAppointment(a)">🗑</button>
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
export class CalendarComponent implements OnInit {
  private db = inject(FirestoreService);
  private router = inject(Router);

  today = new Date();
  todayStr = this.today.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  viewYear = this.today.getFullYear();
  viewMonth = this.today.getMonth();
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calDays: any[] = [];
  allAppointments: Appointment[] = [];
  selectedDay: any = null;
  loadingAppts = true;
  saving = false;
  successMsg = '';
  errorMsg = '';
  editingAppt: Appointment | null = null;

  form: any = this.emptyForm();

  get monthLabel() {
    return new Date(this.viewYear, this.viewMonth).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }

  async ngOnInit() { await this.loadAppointments(); }

  async loadAppointments() {
    this.loadingAppts = true;
    try {
      this.allAppointments = await this.db.getAllAppointments();
      this.buildCalendar();
    } catch { }
    this.loadingAppts = false;
  }

  buildCalendar() {
    const firstDay = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const days: any[] = [];

    const prevDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(this.viewYear, this.viewMonth - 1, prevDays - i);
      days.push({ date: d, inMonth: false, isToday: false, appointments: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(this.viewYear, this.viewMonth, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const appts = this.allAppointments.filter(a => a.appointmentDate === dateStr);
      const isToday = d.toDateString() === this.today.toDateString();
      days.push({ date: d, inMonth: true, isToday, appointments: appts });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(this.viewYear, this.viewMonth + 1, i);
      days.push({ date: d, inMonth: false, isToday: false, appointments: [] });
    }

    this.calDays = days;
  }

  selectDay(day: any) {
    this.selectedDay = day;
    const d = day.date;
    this.form.appointmentDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  prevMonth() {
    if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
    else this.viewMonth--;
    this.buildCalendar();
  }

  nextMonth() {
    if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
    else this.viewMonth++;
    this.buildCalendar();
  }

  goToday() {
    this.viewYear = this.today.getFullYear();
    this.viewMonth = this.today.getMonth();
    this.buildCalendar();
  }

  goToAllAppointments() {
    this.router.navigate(['/all-appointments']);
  }

  editAppointment(a: Appointment) {
    this.editingAppt = a;
    this.form = { ...a };
  }

  cancelEdit() {
    this.editingAppt = null;
    this.form = this.emptyForm();
  }

  async saveAppointment() {
    if (!this.form.patientName || !this.form.appointmentDate) {
      this.errorMsg = 'Patient name and date are required.'; return;
    }
    this.saving = true;
    this.clearAlerts();
    try {
      if (this.editingAppt?.id) {
        await this.db.updateAppointment(this.editingAppt.id, this.form);
        this.successMsg = 'Appointment updated!';
        this.editingAppt = null;
      } else {
        await this.db.addAppointment(this.form as Appointment);
        this.successMsg = 'Appointment added!';
      }
      this.form = this.emptyForm();
      await this.loadAppointments();
    } catch { this.errorMsg = 'Failed to save appointment.'; }
    this.saving = false;
  }

  async deleteAppointment(a: Appointment) {
    if (!a.id || !confirm(`Delete appointment for ${a.patientName}?`)) return;
    try {
      await this.db.deleteAppointment(a.id);
      this.successMsg = 'Appointment deleted.';
      await this.loadAppointments();
    } catch { this.errorMsg = 'Failed to delete.'; }
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

  emptyForm() {
    return {
      patientName: '', patientId: '',
      appointmentDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
      appointmentTime: '', purpose: '', status: 'Scheduled', notes: ''
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