import { Injectable, NgZone } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  user,
  browserLocalPersistence,
  setPersistence
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<User | null>;

  /**
   * Hard ceiling: the moment the app boots (or the tab becomes visible) and
   * the user has been inactive longer than this, sign them out, no matter
   * what Firebase persistence has restored.
   */
  private readonly MAX_INACTIVITY_MS = 20 * 60_000; // 20 minutes

  /** Soft idle timeout while the tab is open and JS is running. */
  private readonly IDLE_MINUTES = 20;
  private readonly IDLE_CHECK_MS = 10_000;
  private readonly TOKEN_REFRESH_BUFFER_MS = 5 * 60_000;
  private readonly LAST_ACTIVITY_KEY = 'winserve:admin:lastActivity';

  private idleCheckTimer: any = null;

  private onUserActivity = () => this.markActivity();
  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.zone.run(() => { void this.enforceAbsoluteInactivity(); });
    }
  };
  private onWindowFocus = () => {
    this.zone.run(() => { void this.enforceAbsoluteInactivity(); });
  };

  constructor(private fireAuth: Auth, private router: Router, private zone: NgZone) {
    // Use LOCAL persistence so the absolute-inactivity check is the single
    // source of truth for when a session should end (rather than relying on
    // the browser closing the tab to clear session storage).
    setPersistence(this.fireAuth, browserLocalPersistence).catch(() => {});

    this.user$ = user(this.fireAuth);

    // First emission: enforce inactivity ceiling, then validate token.
    this.user$.pipe(take(1)).subscribe(async u => {
      if (!u) return;
      const expired = await this.enforceAbsoluteInactivity();
      if (expired) return;

      try {
        await u.getIdToken(true);
      } catch {
        await this.logout();
        await this.router.navigate(['/login']);
      }
    });

    this.user$.subscribe(u => {
      if (u) this.startIdleWatch();
      else this.stopIdleWatch();
    });

    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('pageshow', this.onVisibilityChange);
    window.addEventListener('focus', this.onWindowFocus);
  }

  async loginWithGoogle(): Promise<User> {
    const result = await signInWithPopup(this.fireAuth, new GoogleAuthProvider());
    this.markActivity();
    return result.user;
  }

  async logout(): Promise<void> {
    this.stopIdleWatch();
    this.clearActivity();
    await signOut(this.fireAuth);
  }

  isAuthenticated(): boolean {
    return this.fireAuth.currentUser !== null;
  }

  async getIdToken(): Promise<string | null> {
    const u = this.fireAuth.currentUser;
    return u ? u.getIdToken() : null;
  }

  /**
   * If a signed-in user has been inactive longer than MAX_INACTIVITY_MS
   * (across reloads, sleeps, browser restarts), force a logout.
   * Returns true if the user was signed out.
   */
  private async enforceAbsoluteInactivity(): Promise<boolean> {
    const u = await firstValueFrom(this.user$);
    if (!u) return false;

    const last = this.readLastActivity();
    const now = Date.now();

    if (last == null || now - last >= this.MAX_INACTIVITY_MS) {
      await this.logout();
      await this.router.navigate(['/login']);
      return true;
    }
    return false;
  }

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
    try { localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString()); } catch {}
  }

  private clearActivity(): void {
    try { localStorage.removeItem(this.LAST_ACTIVITY_KEY); } catch {}
  }

  private readLastActivity(): number | null {
    try {
      const v = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      return v ? Number(v) : null;
    } catch { return null; }
  }
}
