import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { EditorEventosService } from '../../services/editor-eventos.service';
import { EditorMetricsService } from '../../services/editor-metrics.service';

@Component({
  selector: 'app-editor-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, EditorLoading],
  templateUrl: './editor-dashboard.html',
  styleUrl: './editor-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorDashboard {
  private readonly editorEventosService = inject(EditorEventosService);
  private readonly metricsService = inject(EditorMetricsService);

  protected readonly metricsError = signal(false);
  protected readonly metrics$ = this.metricsService.getMetrics().pipe(
    catchError(() => {
      this.metricsError.set(true);
      return EMPTY;
    }),
  );
  protected readonly drafts$ = this.editorEventosService.drafts$;
}
