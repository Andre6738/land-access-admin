import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-infrastructure',
  templateUrl: './infrastructure.component.html',
  styleUrls: ['./infrastructure.component.scss']
})
export class InfrastructureComponent implements OnInit, OnDestroy {
  loading = true;
  error = '';
  lastUpdated: Date | null = null;
  refreshInterval: any;

  // DB Stats
  dbSizeMB = 0;
  maxSizeMB = 0;
  usagePercent = 0;
  databaseName = '';
  tables: any[] = [];
  connections = { active: 0, total: 0, max: 0 };

  // Infrastructure links
  infraLinks = [
    {
      name: 'Aiven Console',
      description: 'PostgreSQL database management',
      url: 'https://console.aiven.io/',
      icon: 'database',
      color: '#ff3554'
    },
    {
      name: 'Render Dashboard',
      description: 'Backend API hosting',
      url: 'https://dashboard.render.com/web/srv-d3qbmkbipnbc73aedp2g',
      icon: 'server',
      color: '#46e3b7'
    },
    {
      name: 'Firebase Console',
      description: 'Frontend hosting & authentication',
      url: 'https://console.firebase.google.com/u/0/project/winserve-5b277/overview',
      icon: 'firebase',
      color: '#ffca28'
    },
    {
      name: 'Yoco Dashboard',
      description: 'Payment processing',
      url: 'https://portal.yoco.com/',
      icon: 'payment',
      color: '#00b0ff'
    },
    {
      name: 'Frontend (Live)',
      description: 'winserve-5b277.web.app',
      url: 'https://winserve-5b277.web.app/',
      icon: 'globe',
      color: '#094164'
    },
    {
      name: 'Backend API (Live)',
      description: 'land-access-service.onrender.com',
      url: 'https://land-access-service.onrender.com/actuator/health',
      icon: 'api',
      color: '#7c4dff'
    }
  ];

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadStats();
    // Auto-refresh every 5 minutes
    this.refreshInterval = setInterval(() => this.loadStats(), 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.api.getDbStats().subscribe({
      next: (data) => {
        this.dbSizeMB = data.databaseSizeMB || 0;
        this.maxSizeMB = data.maxSizeMB || 1024;
        this.usagePercent = data.usagePercent || 0;
        this.databaseName = data.databaseName || '';
        this.tables = (data.tables || []).map((t: any) => ({
          name: t.table_name,
          totalBytes: t.total_bytes,
          totalMB: (t.total_bytes / (1024 * 1024)).toFixed(2),
          tableBytes: t.table_bytes,
          indexBytes: t.index_bytes,
          rows: t.row_estimate
        }));
        this.connections = data.connections || { active: 0, total: 0, max: 0 };
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load database statistics';
        this.loading = false;
      }
    });
  }

  get usageClass(): string {
    if (this.usagePercent >= 80) return 'critical';
    if (this.usagePercent >= 60) return 'warning';
    return 'healthy';
  }

  get gaugeOffset(): number {
    // SVG circle circumference for r=54 = 339.292
    const circumference = 339.292;
    return circumference - (circumference * Math.min(this.usagePercent, 100)) / 100;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
