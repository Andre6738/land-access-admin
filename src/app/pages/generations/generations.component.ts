import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-generations',
  templateUrl: './generations.component.html',
  styleUrls: ['./generations.component.scss']
})
export class GenerationsComponent implements OnInit {
  records: any[] = [];
  loading = true;
  page = 0;
  size = 50;
  totalPages = 0;
  totalElements = 0;

  filterEmail = '';
  filterLpiCode = '';
  filterDateFrom = '';
  filterDateTo = '';

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getGenerationHistory({
      page: this.page,
      size: this.size,
      email: this.filterEmail || undefined,
      lpiCode: this.filterLpiCode || undefined,
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
    this.filterLpiCode = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 0;
    this.load();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterEmail || this.filterLpiCode || this.filterDateFrom || this.filterDateTo);
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

  exportCsv(): void {
    const headers = ['Email', 'LPI Code', 'Templates', 'Documents', 'Credits Charged', 'Date'];
    const rows = this.records.map(r => [
      r.email,
      r.lpiCode ?? '',
      r.templateNames,
      r.documentCount,
      r.creditsCharged,
      r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 19) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generation-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
