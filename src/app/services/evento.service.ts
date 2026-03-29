import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { Evento } from '../models/evento';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/events`;

  getEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }

  getEventosPopulares(limit = 5): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/popular?limit=${limit}`);
  }

  getEvento(slug: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${slug}`);
  }

  registrarConsulta(slug: string): Observable<{ views: number }> {
    return this.http.post<{ views: number }>(`${this.apiUrl}/${slug}/view`, {});
  }
}
