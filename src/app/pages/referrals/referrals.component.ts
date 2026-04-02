import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-referrals',
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.scss']
})
export class ReferralsComponent implements OnInit {
  // ── Feature toggles ──
  toggles: { [key: string]: boolean } = {};
  canEditToggles = false;
  toggleKeys: string[] = [];

  // ── Tab navigation ──
  activeTab: 'campaigns' | 'rules' | 'codes' | 'events' | 'redemptions' = 'campaigns';

  // ── Campaigns ──
  campaigns: any[] = [];
  campaignPage = 0;
  campaignTotalPages = 0;
  showCampaignForm = false;
  editingCampaign = false;
  formCampaign: any = this.blankCampaign();

  // ── Reward rules ──
  rewardRules: any[] = [];
  showRuleForm = false;
  editingRule = false;
  formRule: any = this.blankRule();
  rewardTypes = ['FREE_CREDITS', 'FIXED_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'ONE_OFF_BENEFIT'];
  rewardTargets = ['REFERRER', 'REFERRED', 'BOTH'];

  // ── Codes ──
  codes: any[] = [];

  // ── Events ──
  events: any[] = [];
  eventPage = 0;
  eventTotalPages = 0;
  filterReferrerEmail = '';
  filterStatus = '';
  referralStatuses = ['PENDING', 'SIGNED_UP', 'QUALIFIED', 'REWARDED', 'REJECTED', 'EXPIRED'];

  // ── Redemptions ──
  redemptions: any[] = [];

  // ── Toasts ──
  toasts: { message: string; type: 'success' | 'error' }[] = [];

  constructor(private api: AdminApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadToggles();
    this.loadCampaigns();
  }

  // ── Toast ──

  toast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toasts.push({ message, type });
    setTimeout(() => this.toasts.shift(), 3500);
  }

  // ── Feature toggles ──

  loadToggles(): void {
    this.api.getReferralToggles().subscribe({
      next: (res: any) => {
        this.canEditToggles = res.canEditToggles;
        delete res.canEditToggles;
        this.toggles = res;
        this.toggleKeys = Object.keys(this.toggles);
      },
      error: () => this.toast('Failed to load toggles', 'error')
    });
  }

  saveToggles(): void {
    this.api.updateReferralToggles(this.toggles).subscribe({
      next: (res: any) => {
        this.canEditToggles = res.canEditToggles;
        delete res.canEditToggles;
        this.toggles = res;
        this.toggleKeys = Object.keys(this.toggles);
        this.toast('Toggles updated');
      },
      error: (err: any) => {
        if (err.status === 403) {
          this.toast('You do not have permission to change toggles', 'error');
        } else {
          this.toast('Failed to update toggles', 'error');
        }
      }
    });
  }

  prettyToggleKey(key: string): string {
    return key.replace('referrals.', '').replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Campaigns ──

  loadCampaigns(): void {
    this.api.getReferralCampaigns({ page: this.campaignPage }).subscribe({
      next: (res: any) => {
        this.campaigns = res.content || [];
        this.campaignTotalPages = res.totalPages || 0;
      },
      error: () => this.toast('Failed to load campaigns', 'error')
    });
  }

  blankCampaign(): any {
    return { name: '', description: '', active: false, startDate: '', endDate: '' };
  }

  openCreateCampaign(): void {
    this.formCampaign = this.blankCampaign();
    this.editingCampaign = false;
    this.showCampaignForm = true;
  }

  openEditCampaign(c: any): void {
    this.formCampaign = {
      ...c,
      startDate: c.startDate ? c.startDate.substring(0, 16) : '',
      endDate: c.endDate ? c.endDate.substring(0, 16) : ''
    };
    this.editingCampaign = true;
    this.showCampaignForm = true;
  }

  cancelCampaignForm(): void {
    this.showCampaignForm = false;
  }

  saveCampaign(): void {
    const payload = {
      ...this.formCampaign,
      startDate: this.formCampaign.startDate ? new Date(this.formCampaign.startDate).toISOString() : null,
      endDate: this.formCampaign.endDate ? new Date(this.formCampaign.endDate).toISOString() : null
    };
    const obs = this.editingCampaign
      ? this.api.updateReferralCampaign(this.formCampaign.id, payload)
      : this.api.createReferralCampaign(payload);
    obs.subscribe({
      next: () => {
        this.toast(this.editingCampaign ? 'Campaign updated' : 'Campaign created');
        this.showCampaignForm = false;
        this.loadCampaigns();
      },
      error: () => this.toast('Failed to save campaign', 'error')
    });
  }

  toggleCampaignActive(c: any): void {
    this.api.toggleReferralCampaignActive(c.id).subscribe({
      next: () => { this.loadCampaigns(); this.toast('Campaign toggled'); },
      error: () => this.toast('Failed to toggle campaign', 'error')
    });
  }

  deleteCampaign(c: any): void {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    this.api.deleteReferralCampaign(c.id).subscribe({
      next: () => { this.loadCampaigns(); this.toast('Campaign deleted'); },
      error: () => this.toast('Failed to delete campaign', 'error')
    });
  }

  // ── Reward Rules ──

  loadRules(): void {
    this.api.getReferralRewardRules().subscribe({
      next: (rules: any[]) => this.rewardRules = rules,
      error: () => this.toast('Failed to load reward rules', 'error')
    });
  }

  blankRule(): any {
    return {
      campaignId: '', name: '', rewardType: 'FREE_CREDITS', rewardTarget: 'BOTH',
      rewardValue: 0, minReferrals: 1, repeatable: false, maxRedemptionsPerUser: null, active: true
    };
  }

  openCreateRule(): void {
    this.formRule = this.blankRule();
    if (this.campaigns.length > 0) this.formRule.campaignId = this.campaigns[0].id;
    this.editingRule = false;
    this.showRuleForm = true;
  }

  openEditRule(r: any): void {
    this.formRule = { ...r };
    this.editingRule = true;
    this.showRuleForm = true;
  }

  cancelRuleForm(): void {
    this.showRuleForm = false;
  }

  saveRule(): void {
    const obs = this.editingRule
      ? this.api.updateReferralRewardRule(this.formRule.id, this.formRule)
      : this.api.createReferralRewardRule(this.formRule);
    obs.subscribe({
      next: () => {
        this.toast(this.editingRule ? 'Rule updated' : 'Rule created');
        this.showRuleForm = false;
        this.loadRules();
        this.loadCampaigns(); // refresh campaign rule counts
      },
      error: () => this.toast('Failed to save rule', 'error')
    });
  }

  toggleRuleActive(r: any): void {
    this.api.toggleReferralRewardRuleActive(r.id).subscribe({
      next: () => { this.loadRules(); this.toast('Rule toggled'); },
      error: () => this.toast('Failed to toggle rule', 'error')
    });
  }

  deleteRule(r: any): void {
    if (!confirm(`Delete rule "${r.name}"?`)) return;
    this.api.deleteReferralRewardRule(r.id).subscribe({
      next: () => { this.loadRules(); this.toast('Rule deleted'); },
      error: () => this.toast('Failed to delete rule', 'error')
    });
  }

  getCampaignName(campaignId: string): string {
    const c = this.campaigns.find((x: any) => x.id === campaignId);
    return c ? c.name : campaignId;
  }

  // ── Codes ──

  loadCodes(): void {
    this.api.getReferralCodes().subscribe({
      next: (codes: any[]) => this.codes = codes,
      error: () => this.toast('Failed to load codes', 'error')
    });
  }

  // ── Events ──

  loadEvents(): void {
    this.api.getReferralEvents({
      page: this.eventPage,
      referrerEmail: this.filterReferrerEmail || undefined,
      status: this.filterStatus || undefined
    }).subscribe({
      next: (res: any) => {
        this.events = res.content || [];
        this.eventTotalPages = res.totalPages || 0;
      },
      error: () => this.toast('Failed to load events', 'error')
    });
  }

  applyEventFilters(): void {
    this.eventPage = 0;
    this.loadEvents();
  }

  clearEventFilters(): void {
    this.filterReferrerEmail = '';
    this.filterStatus = '';
    this.eventPage = 0;
    this.loadEvents();
  }

  // ── Redemptions ──

  loadRedemptions(): void {
    this.api.getReferralRedemptions().subscribe({
      next: (data: any[]) => this.redemptions = data,
      error: () => this.toast('Failed to load redemptions', 'error')
    });
  }

  // ── Tab switch ──

  switchTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    switch (tab) {
      case 'campaigns': this.loadCampaigns(); break;
      case 'rules': this.loadRules(); break;
      case 'codes': this.loadCodes(); break;
      case 'events': this.loadEvents(); break;
      case 'redemptions': this.loadRedemptions(); break;
    }
  }
}
