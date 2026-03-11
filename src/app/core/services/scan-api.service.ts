import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ScoreData, HistoryScan } from '../../shared/models/score-data.model';

@Injectable({ providedIn: 'root' })
export class ScanApiService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  private getHeaders(accessToken?: string, apiKeys?: Record<string, string>): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (accessToken) {
      headers = headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (apiKeys?.['openrouter']) headers = headers.set('X-OpenRouter-Key', apiKeys['openrouter']);
    if (apiKeys?.['nvidia']) headers = headers.set('X-NVIDIA-Key', apiKeys['nvidia']);
    if (apiKeys?.['openai']) headers = headers.set('X-OpenAI-Key', apiKeys['openai']);
    if (apiKeys?.['anthropic']) headers = headers.set('X-Anthropic-Key', apiKeys['anthropic']);
    if (apiKeys?.['google']) headers = headers.set('X-Google-Key', apiKeys['google']);
    return headers;
  }

  analyse(
    externalPatientId: string,
    imageUrl: string,
    modelSelection: string,
    accessToken?: string,
    apiKeys?: Record<string, string>
  ): Observable<ScoreData> {
    const url = `${this.baseUrl}/api/v1/smilescan`;
    return this.http.post<ScoreData>(url, {
      externalPatientId,
      imageUrl,
      modelSelection
    }, { headers: this.getHeaders(accessToken, apiKeys) });
  }

  getHistory(patientId: string, accessToken?: string): Observable<HistoryScan[]> {
    const url = `${this.baseUrl}/api/v1/smilescan/${patientId}`;
    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : undefined;
    return this.http.get<HistoryScan[]>(url, { headers });
  }

  getUsageStats(accessToken?: string): Observable<{
    totalScans: number;
    totalTokensUsed: number;
    totalCost: number;
    averageProcessingTimeMs: number;
  }> {
    const url = `${this.baseUrl}/api/v1/observability/stats`;
    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : undefined;
    return this.http.get<{
      totalScans: number;
      totalTokensUsed: number;
      totalCost: number;
      averageProcessingTimeMs: number;
    }>(url, { headers });
  }
}
