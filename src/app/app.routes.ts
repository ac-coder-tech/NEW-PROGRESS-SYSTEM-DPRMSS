import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'patients',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/patients/patients.component').then(m => m.PatientsComponent)
      },
      {
        path: 'records',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/records/records.component').then(m => m.RecordsComponent)
      },
      {
        path: 'calendar',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent)
      },
      {
        path: 'manage-staff',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./components/manage-staff/manage-staff.component').then(m => m.ManageStaffComponent)
      },
      {
        path: 'search',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/search/search.component').then(m => m.SearchComponent)
      },
      {
        path: 'print',
        canActivate: [roleGuard(['staff'])],
        loadComponent: () => import('./components/print/print.component').then(m => m.PrintComponent)
      },
      {
        path: 'doctor-dashboard',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () => import('./components/doctor/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];