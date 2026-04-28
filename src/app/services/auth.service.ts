import { Injectable, NgZone } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user, browserSessionPersistence, setPersistence } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<User | null>;

  private readonly IDLE_MINUTES = 30;
  private readonly IDLE_CHECK_MS = 10_000;
  private readonly TOKEN_REFRESH_BUFFER_MS = 5 * 60_000; // refresh if < 5 min left
  private readonly LAST_ACTIVITY_KEY = 'winserve:admin:lastActivity';

  private idleCheckTimer: any = null;
  private onUserActivity = () => this.markActivity();

  constructor(private fireAuth: Auth, private router: Router, private zone: NgZone) {
    // Session-only persistence: auth is cleared when browser/tab closes
    setPersistence(this.fireAuth, browserSessionPersistence).catch(() => {});

    this.user$ = user(this.fireAuth);

    this.user$.subscribe(u => {
      if (u) {
        this.startIdleWatch();
      } else {
        this.stopIdleWatch();
      }
    });
  }

  async loginWithGoogle(): Promise<User> {
    const result = await signInWithPopup(this.fireAuth, new GoogleAuthProvider());
    return result.user;
  }

  async logout(): Promise<void> {
    this.stopIdleWatch();
    await signOut(this.fireAuth);
  }

  isAuthenticated(): boolean {
    return this.fireAuth.currentUser !== null;
  }

  async getIdToken(): Promise<string | null> {
    const u = this.fireAuth.currentUser;
    return u ? u.getIdToken() : null;
  }

  // ===== Idle / token-refresh handling =====

  private startIdleWatch(): void {
    this.stopIdleWatch();
    this.markActivity();

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    events.forEach(evt =>
      window.addEventListener(evt, this.onUserActivity, { passive: true })
    );

    this.idleCheckTimer = setInterval(async () => {
      const last = this.readLastActivity();
      const maxIdleMs = this.IDLE_MINUTES * 60_000;

      if (!last || (Date.now() - last) >= maxIdleMs) {
        this.zone.run(() => this.logout().then(() => this.router.navigate(['/login'])));
        return;
      }

      // User is active - proactively refresh token if near expiry
      const u = this.fireAuth.currentUser;
      if (u) {
        try {
          const result = await u.getIdTokenResult();
          const expiresAt = new Date(result.expirationTime).getTime();
          if (expiresAt - Date.now() < this.TOKEN_REFRESH_BUFFER_MS) {
            await u.getIdToken(true);
          }
        } catch { /* 401 interceptor handles failures */ }
      }
    }, this.IDLE_CHECK_MS);
  }

  private stopIdleWatch(): void {
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }
    ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(evt =>
      window.removeEventListener(evt, this.onUserActivity as EventListener)
    );
  }

  private markActivity(): void {
    try { sessionStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString()); } catch {}
  }

  private readLastActivity(): number | null {
    try {
      const v = sessionStorage.getItem(this.LAST_ACTIVITY_KEY);
      return v ? Number(v) : null;
    } catch { return null; }
  }
}
