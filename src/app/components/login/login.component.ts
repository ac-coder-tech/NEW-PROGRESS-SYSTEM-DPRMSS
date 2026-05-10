import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-wrapper">

        <div class="logo-area">
          <div class="logo-circle"><span>+</span></div>
          <h1>DPRMS</h1>
          <p>Digital Patient Record Management System</p>
          <div class="health-center-name">Barangay Health Center</div>
        </div>

        <!-- Role Selector Tabs -->
        <div class="role-tabs">
          <button class="role-tab" [class.active]="selectedRole === 'staff'" (click)="selectRole('staff')">
            <span class="role-tab-icon">👤</span>
            <span class="role-tab-label">Staff</span>
          </button>
          <button class="role-tab" [class.active]="selectedRole === 'admin'" (click)="selectRole('admin')">
            <span class="role-tab-icon">🛡️</span>
            <span class="role-tab-label">Admin</span>
          </button>
          <button class="role-tab" [class.active]="selectedRole === 'doctor'" (click)="selectRole('doctor')">
            <span class="role-tab-icon">🩺</span>
            <span class="role-tab-label">Doctor</span>
          </button>
        </div>

        <div class="login-card">
          <h2>{{ roleLabel }} Login</h2>
          <div class="sub">Sign in to access the {{ roleLabel }} portal</div>

          <div *ngIf="error" class="alert alert-danger">⚠️ {{ error }}</div>
          <div *ngIf="roleWarning" class="alert alert-info">⚠️ {{ roleWarning }}</div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email"
              placeholder="Enter your email" [disabled]="loading" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password"
              placeholder="Enter your password" [disabled]="loading"
              (keyup.enter)="login()" />
          </div>

          <button class="btn btn-primary w-100" (click)="login()" [disabled]="loading"
            style="width:100%; padding:13px; font-size:15px; justify-content:center;">
            <span *ngIf="loading">🔄 Signing in...</span>
            <span *ngIf="!loading">🔐 Sign In as {{ roleLabel }}</span>
          </button>
        </div>

        <div class="footer-note">
          For authorized health center personnel only &bull; DPRMS &copy; {{ currentYear }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      width: 100%;
    }
    .role-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 8px;
      border-radius: 14px;
      border: 2px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.75);
      cursor: pointer;
      font-family: inherit;
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
      backdrop-filter: blur(6px);
    }
    .role-tab:hover {
      background: rgba(255,255,255,0.22);
      border-color: rgba(255,255,255,0.55);
      color: white;
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    .role-tab.active {
      background: rgba(255,255,255,0.95);
      border-color: white;
      color: #1a56a0;
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(0,0,0,0.25);
    }
    .role-tab-icon { font-size: 22px; }
    .role-tab-label { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = '';
  password = '';
  error = '';
  roleWarning = '';
  loading = false;
  selectedRole: 'staff' | 'admin' | 'doctor' = 'staff';
  currentYear = new Date().getFullYear();

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