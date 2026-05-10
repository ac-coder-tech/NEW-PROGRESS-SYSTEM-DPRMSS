import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-brand">

        <div class="brand-icon" style="background:transparent;box-shadow:none;width:42px;height:42px;min-width:42px;">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="dprms-logo-svg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#56ccf2"/>
                <stop offset="60%"  stop-color="#2f80ed"/>
                <stop offset="100%" stop-color="#1a56a0"/>
              </linearGradient>
            </defs>
            <circle cx="21" cy="21" r="20" fill="none" stroke="#56ccf2" stroke-width="0.8" opacity="0.4"/>
            <path d="M21 4 L35 11 L35 24 Q35 34 21 38 Q7 34 7 24 L7 11 Z" fill="url(#shieldGrad)" stroke="#56ccf2" stroke-width="0.8"/>
            <path d="M21 8 L32 14 L32 23 Q32 31 21 35 Q10 31 10 23 L10 14 Z" fill="#072248" opacity="0.3"/>
            <rect x="18.5" y="14" width="5" height="14" rx="2.5" fill="white"/>
            <rect x="14" y="18.5" width="14" height="5" rx="2.5" fill="white"/>
            <line x1="21" y1="0.5" x2="21" y2="3" stroke="#56ccf2" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="38.5" y1="9" x2="36.5" y2="11" stroke="#56ccf2" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="3.5" y1="9" x2="5.5" y2="11" stroke="#2f9fd4" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="brand-text">
          <div class="brand-name">DPRMS</div>
          <div class="brand-sub">Digital Patient Record<br>Management System</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Dashboard</span>
        </a>

        <div class="nav-section-label">Patients</div>
        <a routerLink="/patients" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-label">Patients</span>
        </a>
        <a routerLink="/records" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Record Updates</span>
        </a>
        <a routerLink="/search" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🔍</span>
          <span class="nav-label">Search Patient</span>
        </a>
        <a routerLink="/print" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🖨</span>
          <span class="nav-label">Print Records</span>
        </a>

        <div class="nav-section-label">Schedule</div>
        <a routerLink="/calendar" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Calendar</span>
        </a>

        <div class="nav-section-label">Admin</div>
        <a routerLink="/manage-staff" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">Manage Staff</span>
        </a>
      </nav>

     <div class="sidebar-footer" style="flex-direction:column;align-items:flex-start;gap:10px;">
  <div style="display:flex;align-items:center;gap:12px;width:100%;">
    <div class="footer-avatar">{{ initials }}</div>
    <div class="footer-text">
      <div class="staff-name">{{ authService.getStaffName() }}</div>
      <div class="staff-role">{{ authService.getStaffRole() }}</div>
    </div>
  </div>
  <button class="btn-logout" (click)="logout()" style="width:100%;">
    <span class="nav-icon">🚪</span>
    <span class="nav-label">Logout</span>
  </button>
</div>
  `,
  styles: [`
    .dprms-logo-svg {
      filter: drop-shadow(0 2px 6px rgba(86, 204, 242, 0.45));
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar:hover .dprms-logo-svg {
      filter: drop-shadow(0 3px 12px rgba(86, 204, 242, 0.70));
      transform: scale(1.08);
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);

  get initials(): string {
    const name = this.authService.getStaffName() || 'S';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  async logout() {
    await this.authService.logout();
  }
}