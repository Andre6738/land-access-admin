import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean> {
    return user(this.auth).pipe(
      take(1),
      map(u => {
        if (u) return true;
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
