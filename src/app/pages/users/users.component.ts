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
  page = 0;
  size = 50;
  totalPages = 0;
  totalElements = 0;

  // Filters
  filterEmail = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';

  statuses = ['ACTIVE', 'BANNED', 'DEACTIVATION_PENDING', 'DELETE_PENDING'];

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
    this.api.getUsers({
      page: this.page,
      size: this.size,
      email: this.filterEmail || undefined,
      status: this.filterStatus || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    }).subscribe({
      next: (data: any) => {
        this.users = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.page = 0;
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterEmail = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 0;
    this.loadUsers();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterEmail || this.filterStatus || this.filterDateFrom || this.filterDateTo);
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.loadUsers();
    }
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.page - 2);
    const end = Math.min(this.totalPages - 1, this.page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
