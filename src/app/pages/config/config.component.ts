import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

interface TemplateCostRow {
  path: string;
  name: string;
  cost: number;
  saving: boolean;
}

interface TemplateGroup {
  label: string;
  rows: TemplateCostRow[];
  collapsed: boolean;
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
  templateGroups: TemplateGroup[] = [];
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
        this.loadTemplatePricing();
      });
    });
  }

  private loadTemplatePricing(): void {
    this.api.getTemplateList().subscribe(templates => {
      this.api.getTemplatePricing().subscribe(overrides => {
        this.api.getDefaultTemplateCost().subscribe(d => {
          const defaultCost = d.cost ?? 1;
          this.templateCosts = templates.map(path => ({
            path,
            name: path.replace(/\.docx$/i, ''),
            cost: overrides[path] ?? defaultCost,
            saving: false,
          }));
          this.buildGroups();
          this.loading = false;
        });
      });
    });
  }

  private buildGroups(): void {
    const groupMap = new Map<string, TemplateCostRow[]>();
    const order = ['Afrikaans', 'English', 'IPP'];

    for (const row of this.templateCosts) {
      const slashIdx = row.name.indexOf('/');
      const groupKey = slashIdx > 0 ? row.name.substring(0, slashIdx) : 'Other';
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)!.push(row);
    }

    this.templateGroups = [...groupMap.entries()]
      .sort(([a], [b]) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([label, rows]) => ({ label, rows, collapsed: false }));
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
