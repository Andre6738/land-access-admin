import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  async loginWithGoogle(): Promise<User> {
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    return result.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  async getIdToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    return u ? u.getIdToken() : null;
  }
}
