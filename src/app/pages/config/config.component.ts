import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

interface TemplateCostRow {
  path: string;
  name: string;
  cost: number;
  saving: boolean;
}

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  vatRate: number | null = null;
  searchCost: number | null = null;
  defaultTemplateCost: number | null = null;
  templateCosts: TemplateCostRow[] = [];
  loading = true;
  toasts: { message: string; type: string }[] = [];

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getVatRate().subscribe(r => {
      this.vatRate = r.ratePercent;
      this.api.getSearchCost().subscribe(c => {
        this.searchCost = c.cost;
        this.api.getDefaultTemplateCost().subscribe(d => {
          this.defaultTemplateCost = d.cost;
          this.loadTemplatePricing();
        });
      });
    });
  }

  private loadTemplatePricing(): void {
    this.api.getTemplateList().subscribe(templates => {
      this.api.getTemplatePricing().subscribe(overrides => {
        this.templateCosts = templates.map(path => ({
          path,
          name: path.replace(/\.docx$/i, ''),
          cost: overrides[path] ?? this.defaultTemplateCost ?? 1,
          saving: false,
        }));
        this.loading = false;
      });
    });
  }

  saveVat(): void {
    if (this.vatRate == null) return;
    this.api.updateVatRate(this.vatRate).subscribe(() => {
      this.showToast('VAT rate updated successfully', 'success');
    });
  }

  saveSearchCost(): void {
    if (this.searchCost == null) return;
    this.api.updateSearchCost(this.searchCost).subscribe(() => {
      this.showToast('Search cost updated successfully', 'success');
    });
  }

  saveDefaultTemplateCost(): void {
    if (this.defaultTemplateCost == null) return;
    this.api.updateDefaultTemplateCost(this.defaultTemplateCost).subscribe(() => {
      this.showToast('Default template cost updated', 'success');
      // Refresh per-template costs that are using the default
      this.loadTemplatePricing();
    });
  }

  saveTemplateCost(row: TemplateCostRow): void {
    row.saving = true;
    this.api.updateTemplatePricing(row.path, row.cost).subscribe({
      next: () => {
        row.saving = false;
        this.showToast(`Price updated for ${row.name}`, 'success');
      },
      error: () => {
        row.saving = false;
        this.showToast(`Failed to update ${row.name}`, 'error');
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
}
