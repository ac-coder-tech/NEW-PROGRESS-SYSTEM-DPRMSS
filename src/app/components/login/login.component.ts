import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div style="display:flex;height:100vh;background:#f0f4fb;">

      <!-- Left Panel -->
      <div style="width:50%;min-height:100vh;background:linear-gradient(160deg,#1a56a0,#2f80ed);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;">
        <div style="margin-bottom:20px;">
  <svg width="80" height="80" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 12px rgba(86,204,242,0.70));">
    <defs>
      <linearGradient id="shieldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#56ccf2"/>
        <stop offset="60%"  stop-color="#2f80ed"/>
        <stop offset="100%" stop-color="#1a56a0"/>
      </linearGradient>
    </defs>
    <circle cx="21" cy="21" r="20" fill="none" stroke="#56ccf2" stroke-width="0.8" opacity="0.4"/>
    <path d="M21 4 L35 11 L35 24 Q35 34 21 38 Q7 34 7 24 L7 11 Z" fill="url(#shieldGrad2)" stroke="#56ccf2" stroke-width="0.8"/>
    <path d="M21 8 L32 14 L32 23 Q32 31 21 35 Q10 31 10 23 L10 14 Z" fill="#072248" opacity="0.3"/>
    <rect x="18.5" y="14" width="5" height="14" rx="2.5" fill="white"/>
    <rect x="14" y="18.5" width="14" height="5" rx="2.5" fill="white"/>
    <line x1="21" y1="0.5" x2="21" y2="3" stroke="#56ccf2" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="38.5" y1="9" x2="36.5" y2="11" stroke="#56ccf2" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="3.5" y1="9" x2="5.5" y2="11" stroke="#2f9fd4" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</div>
        <h1 style="color:white;font-size:28px;font-weight:700;margin:0 0 8px 0;letter-spacing:2px;">DPRMS</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:13px;text-align:center;margin:0 0 6px 0;">Digital Patient Record Management System</p>
        <div style="color:rgba(255,255,255,0.6);font-size:12px;text-align:center;margin-bottom:24px;">Barangay Health Center</div>

        <!-- Role Buttons -->
        <div style="width:100%;display:flex;flex-direction:column;gap:10px;align-items:center;">
          <button *ngFor="let r of roles"
            (click)="selectRole(r.key)"
            [style.background]="selectedRole === r.key ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)'"
            [style.color]="selectedRole === r.key ? '#1a56a0' : 'rgba(255,255,255,0.8)'"
            [style.border]="selectedRole === r.key ? '2px solid white' : '2px solid rgba(255,255,255,0.2)'"
            class="role-portal-btn"
            style="width:280px;padding:12px 20px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:12px;transition:all 0.2s;">
            <span style="font-size:20px;">{{ r.icon }}</span>
            <span>{{ r.label }} Portal</span>
          </button>
        </div>

        <div style="margin-top:24px;color:rgba(255,255,255,0.4);font-size:11px;text-align:center;">
          DPRMS &copy; {{ currentYear }}
        </div>
      </div>

      <!-- Right Panel -->
      <div style="width:50%;min-height:100vh;background:white;display:flex;align-items:center;justify-content:center;padding:40px;">
        <div style="width:100%;max-width:420px;">

          <div style="margin-bottom:32px;">
            <h2 style="font-size:24px;font-weight:700;color:#1a56a0;margin:0 0 6px 0;">{{ roleLabel }} Login</h2>
            <p style="color:#888;font-size:14px;margin:0;">Sign in to access the {{ roleLabel }} portal</p>
          </div>

          <div *ngIf="error" style="background:#fdecea;border:1px solid #f5c6cb;color:#c0392b;padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;">
            ⚠️ {{ error }}
          </div>
          <div *ngIf="roleWarning" style="background:#e8f4fd;border:1px solid #b8d4f0;color:#1a56a0;padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;">
            ⚠️ {{ roleWarning }}
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:13px;font-weight:600;color:#444;display:block;margin-bottom:6px;">Email Address</label>
            <input type="email" [(ngModel)]="email" placeholder="Enter your email"
              [disabled]="loading"
              style="width:100%;padding:12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;background:#f8faff;" />
          </div>

          <div style="margin-bottom:24px;">
            <label style="font-size:13px;font-weight:600;color:#444;display:block;margin-bottom:6px;">Password</label>
            <div style="position:relative;">
              <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password"
                placeholder="Enter your password"
                [disabled]="loading" (keyup.enter)="login()"
                style="width:100%;padding:12px 48px 12px 16px;border:1.5px solid #dde3f0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;background:#f8faff;" />
              <button type="button" (click)="showPassword = !showPassword"
                style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;padding:0;line-height:1;">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <button (click)="login()" [disabled]="loading"
            style="width:100%;padding:14px;background:linear-gradient(135deg,#2f80ed,#1a56a0);color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;">
            <span *ngIf="loading">🔄 Signing in...</span>
            <span *ngIf="!loading">🔐 Sign In as {{ roleLabel }}</span>
          </button>

          <div style="margin-top:24px;padding:14px 16px;background:#f0f4fb;border-radius:10px;font-size:12px;color:#888;text-align:center;">
            For authorized health center personnel only
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = '';
  password = '';
  error = '';
  roleWarning = '';
  loading = false;
  showPassword = false;
  selectedRole: 'staff' | 'admin' | 'doctor' = 'staff';
  currentYear = new Date().getFullYear();

  roles = [
    { key: 'staff' as const, label: 'Staff', icon: '👤' },
    { key: 'admin' as const, label: 'Admin', icon: '🛡️' },
    { key: 'doctor' as const, label: 'Doctor', icon: '🩺' }
  ];

  get roleLabel(): string {
    return { staff: 'Staff', admin: 'Admin', doctor: 'Doctor' }[this.selectedRole];
  }

  selectRole(role: 'staff' | 'admin' | 'doctor') {
    this.selectedRole = role;
    this.error = '';
    this.roleWarning = '';
    this.email = '';
    this.password = '';
  }

  async login() {
    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      return;
    }
    this.error = '';
    this.roleWarning = '';
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      const actualRole = this.authService.getStaffRole().toLowerCase();
      if (actualRole !== this.selectedRole) {
        await this.authService.logout();
        this.roleWarning = `This account is registered as "${actualRole}", not "${this.selectedRole}". Please select the correct role tab.`;
      }
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code);
    } finally {
      this.loading = false;
    }
  }

  private getFriendlyError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      default:
        return 'Login failed. Please try again.';
    }
  }
}