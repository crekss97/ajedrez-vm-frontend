import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_URL } from '../core/config/api.config';
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

  getEventosPopulares(limit = 5): Observable<Evento[]> {
    return this.getEventos().pipe(
      map((events) => [...events].sort((a, b) => b.views - a.views).slice(0, limit)),
    );
  }

  getEvento(slug: string): Observable<Evento> {
    return this.getEventos().pipe(
      map((events) => events.find((event) => event.slug === slug)),
      switchMap((event) =>
        event ? of(event) : throwError(() => new Error('Evento no encontrado.')),
      ),
    );
  }

  registrarConsulta(slug: string): Observable<{ views: number }> {
    return this.http.post<{ views: number }>(`${this.apiUrl}/${slug}/view`, {});
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
