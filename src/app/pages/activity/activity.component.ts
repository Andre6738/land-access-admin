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
  totalPages = 0;
  filterEmail = '';

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const obs = this.filterEmail
      ? this.api.getUserActivity(this.filterEmail, this.page)
      : this.api.getActivity(this.page);

    obs.subscribe({
      next: (data) => {
        this.searches = data.content;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.page = 0;
    this.load();
  }

  clearFilter(): void {
    this.filterEmail = '';
    this.page = 0;
    this.load();
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.load();
    }
  }
}
