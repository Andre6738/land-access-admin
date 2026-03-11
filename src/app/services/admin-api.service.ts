import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private base = environment.apiBase + '/api/admin';

  private get headers(): HttpHeaders {
    const creds = btoa(`${environment.apiAdminUser}:${environment.apiAdminPass}`);
    return new HttpHeaders({ Authorization: `Basic ${creds}` });
  }

  constructor(private http: HttpClient) {}

  // ── Users ──
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users`, { headers: this.headers });
  }

  banUser(email: string): Observable<any> {
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/ban`, null, { headers: this.headers });
  }

  unbanUser(email: string): Observable<any> {
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/unban`, null, { headers: this.headers });
  }

  grantCredits(email: string, amount: number, reason: string): Observable<any> {
    const params = new HttpParams().set('amount', amount).set('reason', reason);
    return this.http.post(`${this.base}/users/${encodeURIComponent(email)}/grant-credits`, null, { headers: this.headers, params });
  }

  // ── Activity ──
  getActivity(page = 0, size = 50): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${this.base}/activity`, { headers: this.headers, params });
  }

  getUserActivity(email: string, page = 0, size = 50): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get(`${this.base}/activity/${encodeURIComponent(email)}`, { headers: this.headers, params });
  }

  // ── Config ──
  getVatRate(): Observable<{ ratePercent: number }> {
    return this.http.get<{ ratePercent: number }>(`${this.base}/config/vat-rate`, { headers: this.headers });
  }

  updateVatRate(ratePercent: number): Observable<any> {
    const params = new HttpParams().set('ratePercent', ratePercent);
    return this.http.put(`${this.base}/config/vat-rate`, null, { headers: this.headers, params });
  }

  getSearchCost(): Observable<{ cost: number }> {
    return this.http.get<{ cost: number }>(`${this.base}/config/search-cost`, { headers: this.headers });
  }

  updateSearchCost(cost: number): Observable<any> {
    const params = new HttpParams().set('cost', cost);
    return this.http.put(`${this.base}/config/search-cost`, null, { headers: this.headers, params });
  }
}
