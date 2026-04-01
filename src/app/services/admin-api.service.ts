import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private base = environment.apiBase + '/api/admin';

  constructor(private http: HttpClient) {}

  // ── Users ──
  getUsers(filters: {
    page?: number;
    size?: number;
    email?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 50);
    if (filters.email) params = params.set('email', filters.email);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get(`${this.base}/users`, { params });
  }

  banUser(email: string): Observable<any> {
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/ban`, null);
  }

  unbanUser(email: string): Observable<any> {
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/unban`, null);
  }

  grantCredits(email: string, amount: number, reason: string): Observable<any> {
    const params = new HttpParams().set('amount', amount).set('reason', reason);
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/grant-credits`, null, { params });
  }

  // ── Activity ──
  getActivity(filters: {
    page?: number;
    size?: number;
    email?: string;
    lpiCode?: string;
    success?: boolean | null;
    deedsOffice?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 50);
    if (filters.email) params = params.set('email', filters.email);
    if (filters.lpiCode) params = params.set('lpiCode', filters.lpiCode);
    if (filters.success !== null && filters.success !== undefined) params = params.set('success', filters.success);
    if (filters.deedsOffice) params = params.set('deedsOffice', filters.deedsOffice);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get(`${this.base}/activity`, { params });
  }

  // ── Config ──
  getVatRate(): Observable<{ ratePercent: number }> {
    return this.http.get<{ ratePercent: number }>(`${this.base}/config/vat-rate`);
  }

  updateVatRate(ratePercent: number): Observable<any> {
    const params = new HttpParams().set('ratePercent', ratePercent);
    return this.http.put(`${this.base}/config/vat-rate`, null, { params });
  }

  getSearchCost(): Observable<{ cost: number }> {
    return this.http.get<{ cost: number }>(`${this.base}/config/search-cost`);
  }

  updateSearchCost(cost: number): Observable<any> {
    const params = new HttpParams().set('cost', cost);
    return this.http.put(`${this.base}/config/search-cost`, null, { params });
  }

  // ── Template pricing ──
  getDefaultTemplateCost(): Observable<{ cost: number }> {
    return this.http.get<{ cost: number }>(`${this.base}/config/template-cost-default`);
  }

  updateDefaultTemplateCost(cost: number): Observable<any> {
    const params = new HttpParams().set('cost', cost);
    return this.http.put(`${this.base}/config/template-cost-default`, null, { params });
  }

  getTemplatePricing(): Observable<{ [path: string]: number }> {
    return this.http.get<{ [path: string]: number }>(`${this.base}/config/template-pricing`);
  }

  updateTemplatePricing(templatePath: string, cost: number): Observable<any> {
    const params = new HttpParams().set('templatePath', templatePath).set('cost', cost);
    return this.http.put(`${this.base}/config/template-pricing`, null, { params });
  }

  // ── Templates list (from deeds API) ──
  getTemplateList(): Observable<string[]> {
    const apiBase = this.base.replace('/api/admin', '');
    return this.http.get<string[]>(`${apiBase}/api/deeds/templates`);
  }

  // ── Generation History ──
  getGenerationHistory(filters: {
    page?: number;
    size?: number;
    email?: string;
    lpiCode?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 50);
    if (filters.email) params = params.set('email', filters.email);
    if (filters.lpiCode) params = params.set('lpiCode', filters.lpiCode);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get(`${this.base}/generation-history`, { params });
  }

  // ── Bulk Uploads ──
  getBulkUploads(filters: {
    page?: number;
    size?: number;
    email?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 50);
    if (filters.email) params = params.set('email', filters.email);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get(`${this.base}/bulk-uploads`, { params });
  }

  // ── Newsletter / Email ──
  getNewsletterStats(): Observable<any> {
    return this.http.get(`${this.base}/newsletter/stats`);
  }

  sendEmail(payload: { subject: string; body: string; target: string; emails?: string[] }, attachments?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('subject', payload.subject);
    formData.append('body', payload.body);
    formData.append('target', payload.target);
    if (payload.emails) {
      payload.emails.forEach(e => formData.append('emails', e));
    }
    if (attachments) {
      attachments.forEach(f => formData.append('attachments', f, f.name));
    }
    return this.http.post(`${this.base}/send-email`, formData);
  }
}
