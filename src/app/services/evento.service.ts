import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../core/config/api.config';
import { OMITIR_CARGADOR_GLOBAL } from '../core/interceptors/app-loading.interceptor';
import { Evento } from '../models/evento';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/events`;

  getEventos(): Observable<Evento[]> {
    return this.getEventosEditoriales().pipe(
      map((events) => events.filter((event) => event.estadoEditorial !== 'draft')),
    );
  }

  getEventosEditoriales(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl).pipe(
      map((events) => events.map((event) => this.toPublicEvent(event))),
    );
  }

  getEvento(slug: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${encodeURIComponent(slug)}`).pipe(
      map((event) => this.toPublicEvent(event)),
    );
  }

  registrarConsulta(slug: string): Observable<{ views: number }> {
    return this.http.post<{ views: number }>(`${this.apiUrl}/${encodeURIComponent(slug)}/view`, {}, {
      context: new HttpContext().set(OMITIR_CARGADOR_GLOBAL, true),
    });
  }

  private toPublicEvent(event: Evento): Evento {
    return {
      ...event,
      imagenUrl: this.resolveMediaUrl(event.imagenUrl),
      adjuntos: (event.adjuntos ?? []).map((attachment) => ({
        ...attachment,
        url: this.resolveMediaUrl(attachment.url),
      })),
      fuente: 'api',
      linksExternos: event.linksExternos ?? [],
      estadoEditorial: event.estadoEditorial ?? 'published',
    };
  }

  private resolveMediaUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const apiBase = new URL(API_URL, window.location.origin);
    return new URL(url, apiBase.origin).toString();
  }
}
