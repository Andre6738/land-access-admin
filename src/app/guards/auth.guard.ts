import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      switchMap(u => {
        if (!u) return from(Promise.resolve(null));
        return from(u.getIdToken());
      }),
      map(token => {
        if (token) return true;
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
