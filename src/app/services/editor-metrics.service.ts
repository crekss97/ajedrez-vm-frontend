import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { EditorMetrics } from '../models/editor-metrics';
import { EditorEventosService } from './editor-eventos.service';

@Injectable({
  providedIn: 'root',
})
export class EditorMetricsService {
  private readonly editorEventosService = inject(EditorEventosService);

  getMetrics(): Observable<EditorMetrics> {
    return this.editorEventosService.drafts$.pipe(
      map((events) => {
        const publishedEvents = events.filter((event) => event.estadoEditorial !== 'draft');
        const totalViews = events.reduce((total, event) => total + event.views, 0);
        const eventsByViews = [...events]
          .sort((first, second) => second.views - first.views)
          .map(({ id, titulo, views }) => ({ id, titulo, views }));

        return {
          totalEvents: events.length,
          publishedEvents: publishedEvents.length,
          draftEvents: events.filter((event) => event.estadoEditorial === 'draft').length,
          featuredEvents: events.filter((event) => event.destacado).length,
          totalViews,
          averageViews: events.length ? Math.round(totalViews / events.length) : 0,
          eventsByViews,
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
