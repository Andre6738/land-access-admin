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

  // Grant/Deduct credits dialog
  showGrantDialog = false;
  grantMode: 'grant' | 'deduct' = 'grant';
  grantEmail = '';
  grantAmount: number | null = null;
  grantReason = 'Admin grant';

  // Confirm dialog
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  // Toast
  toasts: { message: string; type: string }[] = [];

  // Transaction history dialog
  showTxnDialog = false;
  txnEmail = '';
  txnList: any[] = [];
  txnLoading = false;
  txnPage = 0;
  txnTotalPages = 0;
  txnTypeFilter = '';
  txnTypes = ['TOP_UP', 'DEDUCTION', 'REFUND', 'ADJUSTMENT'];

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
        if (Array.isArray(data)) {
          this.users = data;
          this.totalElements = data.length;
          this.totalPages = 1;
        } else {
          this.users = data.content;
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
        }
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
    this.confirmTitle = 'Ban User';
    this.confirmMessage = `Are you sure you want to ban ${email}? They will no longer be able to access the platform.`;
    this.confirmAction = () => {
      this.api.banUser(email).subscribe(() => {
        this.showToast(`${email} has been banned`, 'success');
        this.loadUsers();
      });
    };
    this.showConfirmDialog = true;
  }

  unban(email: string): void {
    this.confirmTitle = 'Unban User';
    this.confirmMessage = `Restore access for ${email}?`;
    this.confirmAction = () => {
      this.api.unbanUser(email).subscribe(() => {
        this.showToast(`${email} has been unbanned`, 'success');
        this.loadUsers();
      });
    };
    this.showConfirmDialog = true;
  }

  // Hard-delete dialog state
  showDeleteDialog = false;
  deleteEmail = '';
  deleteConfirmText = '';
  deleting = false;

  openHardDelete(email: string): void {
    this.deleteEmail = email;
    this.deleteConfirmText = '';
    this.showDeleteDialog = true;
  }

  confirmHardDelete(): void {
    if (this.deleteConfirmText.trim().toLowerCase() !== this.deleteEmail.toLowerCase()) {
      this.showToast('Confirmation email does not match', 'error');
      return;
    }
    this.deleting = true;
    this.api.hardDeleteUser(this.deleteEmail).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteDialog = false;
        this.showToast(`${this.deleteEmail} and all their data have been permanently deleted`, 'success');
        this.loadUsers();
      },
      error: (err) => {
        this.deleting = false;
        this.showToast(err?.error?.message || 'Failed to delete user', 'error');
      }
    });
  }

  executeConfirm(): void {
    if (this.confirmAction) this.confirmAction();
    this.showConfirmDialog = false;
  }

  openGrant(email: string): void {
    this.grantMode = 'grant';
    this.grantEmail = email;
    this.grantAmount = null;
    this.grantReason = 'Admin grant';
    this.showGrantDialog = true;
  }

  openDeduct(email: string): void {
    this.grantMode = 'deduct';
    this.grantEmail = email;
    this.grantAmount = null;
    this.grantReason = 'Admin deduction';
    this.showGrantDialog = true;
  }

  confirmGrant(): void {
    if (!this.grantAmount || this.grantAmount <= 0) return;
    const amount = this.grantMode === 'deduct' ? -this.grantAmount : this.grantAmount;
    this.api.grantCredits(this.grantEmail, amount, this.grantReason).subscribe({
      next: () => {
        this.showGrantDialog = false;
        const verb = this.grantMode === 'deduct' ? 'deducted from' : 'granted to';
        this.showToast(`${this.grantAmount} credits ${verb} ${this.grantEmail}`, 'success');
        this.loadUsers();
      },
      error: () => {
        this.showToast(`Failed to ${this.grantMode} credits`, 'error');
      }
    });
  }

  openTransactions(email: string): void {
    this.txnEmail = email;
    this.txnList = [];
    this.txnPage = 0;
    this.txnTotalPages = 0;
    this.txnTypeFilter = '';
    this.showTxnDialog = true;
    this.loadTxnPage(0);
  }

  loadTxnPage(page: number): void {
    this.txnLoading = true;
    this.api.getUserTransactions(this.txnEmail, page, 20, this.txnTypeFilter || undefined).subscribe({
      next: (data: any) => {
        this.txnList = data.content ?? [];
        this.txnPage = page;
        this.txnTotalPages = data.totalPages ?? 1;
        this.txnLoading = false;
      },
      error: () => {
        this.txnLoading = false;
        this.showToast('Failed to load transactions', 'error');
      }
    });
  }

  showToast(message: string, type: string = 'info'): void {
    const toast = { message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      const idx = this.toasts.indexOf(toast);
      if (idx > -1) this.toasts.splice(idx, 1);
    }, 4000);
  }

  exportCsv(): void {
    const headers = ['Email', 'Status', 'Credits', 'Total Paid (ZAR)', 'Created'];
    const rows = this.users.map(u => [
      u.email,
      u.status,
      u.balanceCredits ?? 0,
      ((u.totalMoneyPaidCents ?? 0) / 100).toFixed(2),
      u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : ''
    ]);
    this.downloadCsv([headers, ...rows], 'winserve-users');
  }

  private downloadCsv(data: any[][], filename: string): void {
    const csv = data.map(row => row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
