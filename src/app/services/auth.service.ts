import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private staffProfileSubject = new BehaviorSubject<any>(null);
  public staffProfile$ = this.staffProfileSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        const profile = await this.getStaffProfile(user.uid);
        this.staffProfileSubject.next(profile);
      } else {
        this.staffProfileSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const profile = await this.getStaffProfile(cred.user.uid);
    this.staffProfileSubject.next(profile);
    this.router.navigate(['/dashboard']);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getStaffName(): string {
    const profile = this.staffProfileSubject.value;
    return profile?.fullName || this.currentUserSubject.value?.email || 'Staff';
  }

  getStaffRole(): string {
    return this.staffProfileSubject.value?.role || 'Staff';
  }

  private async getStaffProfile(uid: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, 'staff', uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch {
      return null;
    }
  }

  async createStaffAccount(email: string, password: string, profileData: any): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await setDoc(doc(this.firestore, 'staff', cred.user.uid), {
      ...profileData,
      email,
      createdAt: new Date()
    });
  }

  async checkAuthState(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}
