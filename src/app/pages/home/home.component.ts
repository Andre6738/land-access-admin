import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  loading = true;
  totalUsers = 0;
  totalSearches = 0;
  successfulSearches = 0;
  failedSearches = 0;
  recentUsers: any[] = [];
  recentSearches: any[] = [];

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;

    forkJoin({
      users: this.api.getUsers({ page: 0, size: 5 }),
      allSearches: this.api.getActivity({ page: 0, size: 5 }),
      successSearches: this.api.getActivity({ page: 0, size: 1, success: true }),
      failedSearches: this.api.getActivity({ page: 0, size: 1, success: false }),
    }).subscribe({
      next: (data) => {
        this.totalUsers = data.users.totalElements;
        this.recentUsers = data.users.content;

        this.totalSearches = data.allSearches.totalElements;
        this.recentSearches = data.allSearches.content;

        this.successfulSearches = data.successSearches.totalElements;
        this.failedSearches = data.failedSearches.totalElements;

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get successRate(): number {
    if (this.totalSearches === 0) return 0;
    return Math.round((this.successfulSearches / this.totalSearches) * 100);
  }
}
