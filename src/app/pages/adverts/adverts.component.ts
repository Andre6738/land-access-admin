import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

interface Advert {
  id: string;
  title: string;
  advertiserName: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  ctaText: string;
  placement: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
  displayOrder: number;
  adType: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-adverts',
  templateUrl: './adverts.component.html',
  styleUrls: ['./adverts.component.scss']
})
export class AdvertsComponent implements OnInit {
  adverts: Advert[] = [];
  loading = true;
  advertsEnabled = true;
  toasts: { message: string; type: string }[] = [];

  // Filters
  filterTitle = '';
  filterPlacement = '';
  filterActive: boolean | null = null;

  // Form
  showForm = false;
  editing = false;
  formAdvert: any = this.blankAdvert();

  placements = ['HOME_BANNER', 'HOME_SIDEBAR', 'DASHBOARD_CARD', 'FOOTER_BANNER'];
  adTypes = ['CUSTOM', 'GOOGLE_ADS', 'PROVIDER'];

  // Preview
  showPreview = false;

  // Pagination
  page = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadAdverts();
  }

  loadConfig(): void {
    this.api.getAdvertsEnabled().subscribe({
      next: (r) => this.advertsEnabled = r.enabled,
      error: () => this.advertsEnabled = true
    });
  }

  toggleAdvertsEnabled(): void {
    this.api.updateAdvertsEnabled(!this.advertsEnabled).subscribe({
      next: (r) => {
        this.advertsEnabled = r.enabled;
        this.showToast(`Adverts ${this.advertsEnabled ? 'enabled' : 'disabled'}`, 'success');
      },
      error: () => this.showToast('Failed to update setting', 'error')
    });
  }

  loadAdverts(): void {
    this.loading = true;
    this.api.getAdverts({
      page: this.page,
      title: this.filterTitle || undefined,
      placement: this.filterPlacement || undefined,
      active: this.filterActive
    }).subscribe({
      next: (res) => {
        this.adverts = res.content || res;
        this.totalPages = res.totalPages || 1;
        this.totalElements = res.totalElements || this.adverts.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load adverts', 'error');
      }
    });
  }

  applyFilters(): void {
    this.page = 0;
    this.loadAdverts();
  }

  clearFilters(): void {
    this.filterTitle = '';
    this.filterPlacement = '';
    this.filterActive = null;
    this.page = 0;
    this.loadAdverts();
  }

  openCreate(): void {
    this.formAdvert = this.blankAdvert();
    this.editing = false;
    this.showForm = true;
    this.showPreview = false;
  }

  openEdit(advert: Advert): void {
    this.formAdvert = { ...advert };
    if (this.formAdvert.startDate) {
      this.formAdvert.startDate = this.formAdvert.startDate.substring(0, 16);
    }
    if (this.formAdvert.endDate) {
      this.formAdvert.endDate = this.formAdvert.endDate.substring(0, 16);
    }
    this.editing = true;
    this.showForm = true;
    this.showPreview = false;
  }

  cancelForm(): void {
    this.showForm = false;
    this.showPreview = false;
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  saveAdvert(): void {
    const payload = { ...this.formAdvert };
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
    else payload.endDate = null;

    if (this.editing) {
      this.api.updateAdvert(payload.id, payload).subscribe({
        next: () => {
          this.showToast('Advert updated', 'success');
          this.showForm = false;
          this.loadAdverts();
        },
        error: () => this.showToast('Failed to save advert', 'error')
      });
    } else {
      this.api.createAdvert(payload).subscribe({
        next: () => {
          this.showToast('Advert created', 'success');
          this.showForm = false;
          this.loadAdverts();
        },
        error: () => this.showToast('Failed to create advert', 'error')
      });
    }
  }

  toggleActive(advert: Advert): void {
    this.api.toggleAdvertActive(advert.id).subscribe({
      next: (updated) => {
        advert.active = updated.active;
        this.showToast(`Advert ${updated.active ? 'activated' : 'deactivated'}`, 'success');
      },
      error: () => this.showToast('Failed to toggle advert', 'error')
    });
  }

  confirmDelete(advert: Advert): void {
    if (confirm(`Delete advert "${advert.title}"? This cannot be undone.`)) {
      this.api.deleteAdvert(advert.id).subscribe({
        next: () => {
          this.showToast('Advert deleted', 'success');
          this.loadAdverts();
        },
        error: () => this.showToast('Failed to delete advert', 'error')
      });
    }
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadAdverts();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadAdverts();
    }
  }

  isFormValid(): boolean {
    const a = this.formAdvert;
    return a.title?.trim() && a.advertiserName?.trim() && a.targetUrl?.trim() && a.placement;
  }

  private blankAdvert(): any {
    return {
      title: '',
      advertiserName: '',
      description: '',
      imageUrl: '',
      targetUrl: '',
      ctaText: 'Learn More',
      placement: 'HOME_SIDEBAR',
      startDate: '',
      endDate: '',
      active: true,
      displayOrder: 0,
      adType: 'CUSTOM'
    };
  }

  private showToast(message: string, type: string): void {
    const toast = { message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      const idx = this.toasts.indexOf(toast);
      if (idx >= 0) this.toasts.splice(idx, 1);
    }, 4000);
  }
}
