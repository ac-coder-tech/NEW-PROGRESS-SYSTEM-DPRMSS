import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar.component';
import { FirestoreService } from '../../services/firestore.service';
import { Patient } from '../../models/models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  template: `
    <div class="app-wrapper">
      <app-sidebar></app-sidebar>

      <div class="main-content">
        <div class="topbar">
          <div class="topbar-title">🔍 Search Patient</div>
          <div class="topbar-date">{{ today }}</div>
        </div>

        <div class="page-content">

          <div class="card">
            <div class="card-title">🔍 Search Patient Records</div>

            <div class="search-bar" style="margin-bottom:20px;">
              <input type="text" [(ngModel)]="searchTerm"
                placeholder="Search by name, patient ID, or contact number..."
                (keyup.enter)="search()"
                style="font-size:15px;padding:12px;" />

              <button class="btn btn-primary" (click)="search()" [disabled]="searching">
                {{ searching ? '⏳ Searching...' : '🔍 Search' }}
              </button>

              <button class="btn btn-secondary" (click)="clear()" *ngIf="searchTerm">
                ✖ Clear
              </button>
            </div>

            <div *ngIf="!searched && !searching" style="text-align:center;padding:40px;color:#888;">
              <div style="font-size:48px;margin-bottom:12px;">🔍</div>
              <div style="font-size:15px;">Enter a name, Patient ID, or contact number to search</div>
            </div>

            <div *ngIf="searching" class="loading">
              <div class="spinner"></div>
              Searching Firestore...
            </div>

            <div *ngIf="searched && !searching">
              <div style="margin-bottom:12px;font-size:13px;color:#888;">
                Found <strong>{{ results.length }}</strong> result(s) for "<strong>{{ lastSearch }}</strong>"
              </div>

              <div *ngIf="results.length === 0" style="text-align:center;padding:30px;color:#888;">
                No patients found matching your search.
              </div>

              <div *ngFor="let p of results"
                class="patient-card"
                (mouseenter)="onHover($event)"
                (mouseleave)="onLeave($event)">

                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">

                  <div>
                    <div style="font-size:16px;font-weight:700;color:#222;">
                      {{ p.lastName }}, {{ p.firstName }} {{ p.middleName }}
                    </div>

                    <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;font-size:13px;color:#555;">
                      <span><strong>ID:</strong> <span class="patient-id-badge">{{ p.patientId }}</span></span>
                      <span><strong>Age:</strong> {{ p.age }}</span>
                      <span><strong>Gender:</strong> {{ p.gender }}</span>
                      <span><strong>Blood:</strong> <span class="badge badge-info">{{ p.bloodType }}</span></span>
                    </div>

                    <div style="margin-top:6px;font-size:13px;color:#888;">
                      <span *ngIf="p.address">📍 {{ p.address }}</span>
                      <span *ngIf="p.contactNumber"> &nbsp;|&nbsp; 📞 {{ p.contactNumber }}</span>
                    </div>
                  </div>

                  <div class="d-flex gap-10 flex-wrap">
                    <a [routerLink]="'/records'" [queryParams]="{pid: p.patientId}" class="btn btn-primary btn-sm">
                      📋 Records
                    </a>

                    <a [routerLink]="'/print'" [queryParams]="{pid: p.patientId}" class="btn btn-secondary btn-sm">
                      🖨 Print
                    </a>

                    <a routerLink="/patients" class="btn btn-secondary btn-sm">
                      ✏️ Edit
                    </a>
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
export class SearchComponent {

  private db = inject(FirestoreService);

  today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  searchTerm = '';
  lastSearch = '';
  results: Patient[] = [];
  searching = false;
  searched = false;

  async search() {
    if (!this.searchTerm.trim()) return;

    this.searching = true;
    this.lastSearch = this.searchTerm.trim();

    try {
      this.results = await this.db.searchPatients(this.lastSearch);
      this.searched = true;
    } catch (err) {
      console.error(err);
    }

    this.searching = false;
  }

  clear() {
    this.searchTerm = '';
    this.results = [];
    this.searched = false;
  }

  // ✅ FIXED HOVER HANDLERS (Angular-safe)
  onHover(event: Event) {
    const el = event.currentTarget as HTMLElement;
    if (el) {
      el.style.borderColor = '#1a56a0';
    }
  }

  onLeave(event: Event) {
    const el = event.currentTarget as HTMLElement;
    if (el) {
      el.style.borderColor = '#eef2fb';
    }
  }
}