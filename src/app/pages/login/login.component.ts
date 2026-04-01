import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  async loginWithGoogle(): Promise<void> {
    this.error = '';
    this.loading = true;
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e.message || 'Sign-in failed';
      this.loading = false;
    }
  }
}
