import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  searches: any[] = [];
  loading = true;
  page = 0;
  size = 50;
  totalPages = 0;
  totalElements = 0;

  // Filters
  filterEmail = '';
  filterLpiCode = '';
  filterSuccess: '' | 'true' | 'false' = '';
  filterDeedsOffice = '';
  filterDateFrom = '';
  filterDateTo = '';

  deedsOffices = ['Johannesburg', 'Pretoria', 'Cape Town', 'Pietermaritzburg', 'Bloemfontein'];

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;

    this.api.getActivity({
      page: this.page,
      size: this.size,
      email: this.filterEmail || undefined,
      lpiCode: this.filterLpiCode || undefined,
      success: this.filterSuccess === '' ? null : this.filterSuccess === 'true',
      deedsOffice: this.filterDeedsOffice || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    }).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.searches = data;
          this.totalElements = data.length;
          this.totalPages = 1;
        } else {
          this.searches = data.content;
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
    this.filterSuccess = '';
    this.filterDeedsOffice = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 0;
    this.load();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterEmail || this.filterLpiCode || this.filterSuccess
      || this.filterDeedsOffice || this.filterDateFrom || this.filterDateTo);
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
    const headers = ['Email', 'LPI Code', 'Deeds Office', 'Status', 'Success', 'Cost', 'Date'];
    const rows = this.searches.map(s => [
      s.email,
      s.lpiCode,
      s.deedsOffice,
      s.status,
      s.success ? 'Yes' : 'No',
      s.costCredits ?? '',
      s.createdAt ? new Date(s.createdAt).toISOString().replace('T', ' ').slice(0, 19) : ''
    ]);
    this.downloadCsv([headers, ...rows], 'winserve-activity');
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
