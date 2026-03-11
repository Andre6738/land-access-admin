import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'admin_authenticated';

  login(email: string, password: string): boolean {
    if (email === environment.adminEmail && password === environment.adminPassword) {
      sessionStorage.setItem(this.STORAGE_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
