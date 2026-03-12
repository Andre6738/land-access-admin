import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-bulk-uploads',
  templateUrl: './bulk-uploads.component.html',
  styleUrls: ['./bulk-uploads.component.scss']
})
export class BulkUploadsComponent implements OnInit {
  records: any[] = [];
  loading = true;
  page = 0;
  size = 50;
  totalPages = 0;
  totalElements = 0;

  filterEmail = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getBulkUploads({
      page: this.page,
      size: this.size,
      email: this.filterEmail || undefined,
      status: this.filterStatus || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    }).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.records = data;
          this.totalElements = data.length;
          this.totalPages = 1;
        } else {
          this.records = data.content;
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
    this.load();
  }

  clearFilters(): void {
    this.filterEmail = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 0;
    this.load();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterEmail || this.filterStatus || this.filterDateFrom || this.filterDateTo);
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.load();
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

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'badge-success';
      case 'PROCESSING': return 'badge-warning';
      case 'PENDING': return 'badge-info';
      case 'FAILED': return 'badge-danger';
      default: return '';
    }
  }

  exportCsv(): void {
    const headers = ['Email', 'Name', 'Template Group', 'Status', 'Total LPIs', 'Successful', 'Failed', 'Credits Used', 'Date'];
    const rows = this.records.map(r => [
      r.email,
      r.name,
      r.templateGroup,
      r.status,
      r.totalLpiCodes,
      r.successfulCount,
      r.failedCount,
      r.totalCostCredits,
      r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 19) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-uploads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
