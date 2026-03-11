import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  loading = true;

  // Grant credits dialog
  showGrantDialog = false;
  grantEmail = '';
  grantAmount: number | null = null;
  grantReason = 'Admin grant';

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (data) => { this.users = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ban(email: string): void {
    if (!confirm(`Ban user ${email}?`)) return;
    this.api.banUser(email).subscribe(() => this.loadUsers());
  }

  unban(email: string): void {
    this.api.unbanUser(email).subscribe(() => this.loadUsers());
  }

  openGrant(email: string): void {
    this.grantEmail = email;
    this.grantAmount = null;
    this.grantReason = 'Admin grant';
    this.showGrantDialog = true;
  }

  confirmGrant(): void {
    if (!this.grantAmount || this.grantAmount <= 0) return;
    this.api.grantCredits(this.grantEmail, this.grantAmount, this.grantReason).subscribe(() => {
      this.showGrantDialog = false;
      this.loadUsers();
    });
  }
}
