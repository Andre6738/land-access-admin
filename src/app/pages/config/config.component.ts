import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  vatRate: number | null = null;
  searchCost: number | null = null;
  loading = true;
  saved = '';

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
        this.loading = false;
      });
    });
  }

  saveVat(): void {
    if (this.vatRate == null) return;
    this.api.updateVatRate(this.vatRate).subscribe(() => {
      this.saved = 'VAT rate updated';
      setTimeout(() => this.saved = '', 3000);
    });
  }

  saveSearchCost(): void {
    if (this.searchCost == null) return;
    this.api.updateSearchCost(this.searchCost).subscribe(() => {
      this.saved = 'Search cost updated';
      setTimeout(() => this.saved = '', 3000);
    });
  }
}
