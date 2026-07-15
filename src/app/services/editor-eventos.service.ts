import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, shareReplay, switchMap, tap } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { EventoEditorDraft, EventoEditorInput } from '../models/editor';

@Injectable({
  providedIn: 'root',
})
export class EditorEventosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/events`;
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  readonly drafts$ = this.refreshSubject.pipe(
    switchMap(() => this.http.get<EventoEditorDraft[]>(this.apiUrl)),
    map((events) => events.map((event) => this.toEditorEvent(event))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly publishedEvents$ = this.drafts$.pipe(
    map((drafts) => drafts.filter((draft) => draft.estadoEditorial === 'published')),
  );

  createEvent(
    input: EventoEditorInput,
    editorEmail: string,
    image: File,
    attachments: File[],
  ): Observable<EventoEditorDraft> {
    const formData = this.toFormData({ ...input, creadoPor: editorEmail }, image, attachments);

    return this.http.post<EventoEditorDraft>(this.apiUrl, formData).pipe(
      map((event) => this.toEditorEvent(event)),
      tap(() => this.refresh()),
    );
  }

  updateEvent(
    id: number,
    input: EventoEditorInput,
    image: File | null,
    attachments: File[],
  ): Observable<EventoEditorDraft> {
    const formData = this.toFormData(input, image, attachments);

    return this.http.put<EventoEditorDraft>(`${this.apiUrl}/${id}`, formData).pipe(
      map((event) => this.toEditorEvent(event)),
      tap(() => this.refresh()),
    );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.refresh()));
  }

  private refresh(): void {
    this.refreshSubject.next();
  }

  private toEditorEvent(event: EventoEditorDraft): EventoEditorDraft {
    return {
      ...event,
      imagenUrl: this.resolveMediaUrl(event.imagenUrl),
      adjuntos: (event.adjuntos ?? []).map((attachment) => ({
        ...attachment,
        url: this.resolveMediaUrl(attachment.url),
      })),
      fuente: 'editor',
      estadoEditorial: event.estadoEditorial ?? 'published',
      creadoPor: event.creadoPor ?? 'Editor',
      actualizadoEn: event.actualizadoEn ?? new Date().toISOString(),
    };
  }

  private toFormData(
    input: EventoEditorInput & { creadoPor?: string },
    image: File | null,
    attachments: File[],
  ): FormData {
    const formData = new FormData();
    formData.append('evento', JSON.stringify(input));

    if (image) {
      formData.append('imagen', image, image.name);
    }
    for (const attachment of attachments) {
      formData.append('adjuntos', attachment, attachment.name);
    }

    return formData;
  }

  private resolveMediaUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const apiBase = new URL(API_URL, window.location.origin);
    return new URL(url, apiBase.origin).toString();
  }
}
