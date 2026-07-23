import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { addBuenosAiresDays, getTodayBuenosAires } from '../core/fechas-buenos-aires';
import { API_URL } from '../core/config/api.config';
import { EditorMetrics, EditorMetricsRange } from '../models/editor-metrics';

export const DEFAULT_METRICS_DAYS = 30;
export const MAX_METRICS_DAYS = 90;

@Injectable({
  providedIn: 'root',
})
export class EditorMetricsService {
  private readonly http = inject(HttpClient);
  private readonly metricsUrl = `${API_URL}/editor/visitas/resumen`;

  getMetrics(range: EditorMetricsRange = this.getDefaultRange()): Observable<EditorMetrics> {
    const params = new HttpParams()
      .set('desde', range.desde)
      .set('hasta', range.hasta);

    return this.http.get<EditorMetrics>(this.metricsUrl, { params }).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDefaultRange(days = DEFAULT_METRICS_DAYS): EditorMetricsRange {
    const hasta = getTodayBuenosAires();
    return {
      desde: addBuenosAiresDays(hasta, 1 - days),
      hasta,
    };
  }
}
