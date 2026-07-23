import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { BehaviorSubject, catchError, of, shareReplay, switchMap, tap } from 'rxjs';
import {
  addBuenosAiresDays,
  diasEntreFechasBuenosAires,
  getTodayBuenosAires,
  isValidBuenosAiresDate,
} from '../../core/fechas-buenos-aires';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import {
  EditorMetrics,
  EditorMetricsRange,
} from '../../models/editor-metrics';
import {
  DEFAULT_METRICS_DAYS,
  EditorMetricsService,
  MAX_METRICS_DAYS,
} from '../../services/editor-metrics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-editor-metricas',
  standalone: true,
  imports: [BaseChartDirective, EditorLoading],
  templateUrl: './editor-metricas.html',
  styleUrl: './editor-metricas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorMetricas {
  private readonly metricsService = inject(EditorMetricsService);
  private readonly initialRange = this.metricsService.getDefaultRange();
  private readonly rangeSubject = new BehaviorSubject<EditorMetricsRange>(this.initialRange);

  protected readonly today = getTodayBuenosAires();
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly draftRange = signal<EditorMetricsRange>(this.initialRange);
  protected readonly appliedRange = signal<EditorMetricsRange>(this.initialRange);
  protected readonly rangeError = computed(() => this.validateRange(this.draftRange()));
  protected readonly metrics = toSignal(
    this.rangeSubject.pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((range) => this.metricsService.getMetrics(range).pipe(
        catchError(() => {
          this.error.set('No se pudieron calcular las métricas para este período.');
          return of(null);
        }),
      )),
      tap(() => this.loading.set(false)),
      shareReplay({ bufferSize: 1, refCount: true }),
    ),
    { initialValue: undefined },
  );

  private readonly emptyMetrics: EditorMetrics = {
    desde: '',
    hasta: '',
    dias: 0,
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    featuredEvents: 0,
    totalViews: 0,
    uniqueViews: 0,
    averageViews: 0,
    viewsByDay: [],
    eventsByViews: [],
  };

  protected readonly periodLabel = computed(() => {
    const range = this.appliedRange();
    return `${this.formatDate(range.desde)} al ${this.formatDate(range.hasta)}`;
  });

  protected readonly dailyChartData = computed<ChartData<'line'>>(() => {
    const metrics = this.metrics() ?? this.emptyMetrics;
    return {
      labels: metrics.viewsByDay.map((day) => this.formatDayLabel(day.fecha)),
      datasets: [
        {
          data: metrics.viewsByDay.map((day) => day.views),
          label: 'Vistas',
          borderColor: '#e4573f',
          backgroundColor: 'rgba(228, 87, 63, 0.16)',
          pointBackgroundColor: '#e4573f',
          pointRadius: 3,
          fill: true,
          tension: 0.3,
        },
        {
          data: metrics.viewsByDay.map((day) => day.uniqueViews),
          label: 'Visitantes únicos',
          borderColor: '#142d3d',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#142d3d',
          pointRadius: 3,
          fill: false,
          tension: 0.3,
        },
      ],
    };
  });

  protected readonly eventsChartData = computed<ChartData<'bar'>>(() => {
    const events = (this.metrics() ?? this.emptyMetrics).eventsByViews.slice(0, 10);
    return {
      labels: events.map((event) => event.titulo),
      datasets: [
        {
          data: events.map((event) => event.views),
          label: 'Vistas',
          backgroundColor: '#e4573f',
          borderRadius: 7,
          maxBarThickness: 34,
        },
        {
          data: events.map((event) => event.uniqueViews),
          label: 'Visitantes únicos',
          backgroundColor: '#142d3d',
          borderRadius: 7,
          maxBarThickness: 34,
        },
      ],
    };
  });

  protected readonly statusChartData = computed<ChartData<'doughnut'>>(() => {
    const metrics = this.metrics() ?? this.emptyMetrics;
    return {
      labels: ['Publicados', 'Borradores'],
      datasets: [{
        data: [metrics.publishedEvents, metrics.draftEvents],
        backgroundColor: ['#142d3d', '#e6bd55'],
        borderWidth: 0,
      }],
    };
  });

  protected readonly dailyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(20, 45, 61, 0.08)' } },
    },
  };

  protected readonly eventsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { ticks: { display: false }, grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(20, 45, 61, 0.08)' } },
    },
  };

  protected readonly statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { position: 'bottom' } },
  };

  protected setPreset(days: number): void {
    const range = this.createRange(days);
    this.draftRange.set(range);
    this.applyRange(range);
  }

  protected isPresetActive(days: number): boolean {
    const range = this.draftRange();
    const today = getTodayBuenosAires();
    return range.hasta === today
      && range.desde === addBuenosAiresDays(today, 1 - days);
  }

  protected updateDate(field: keyof EditorMetricsRange, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draftRange.update((range) => ({ ...range, [field]: value }));
  }

  protected applyFilters(event: Event): void {
    event.preventDefault();
    if (this.rangeError()) {
      return;
    }

    this.applyRange(this.draftRange());
  }

  protected retry(): void {
    this.rangeSubject.next(this.appliedRange());
  }

  private applyRange(range: EditorMetricsRange): void {
    this.appliedRange.set({ ...range });
    this.rangeSubject.next({ ...range });
  }

  private createRange(days: number): EditorMetricsRange {
    const hasta = getTodayBuenosAires();
    return { desde: addBuenosAiresDays(hasta, 1 - days), hasta };
  }

  private validateRange(range: EditorMetricsRange): string | null {
    if (!isValidBuenosAiresDate(range.desde) || !isValidBuenosAiresDate(range.hasta)) {
      return 'Ingresá fechas válidas en formato calendario.';
    }
    if (range.desde > range.hasta) {
      return 'La fecha inicial no puede ser posterior a la fecha final.';
    }
    if (range.hasta > this.today) {
      return 'La fecha final no puede ser futura.';
    }
    if (diasEntreFechasBuenosAires(range.desde, range.hasta) > MAX_METRICS_DAYS) {
      return `El período no puede superar ${MAX_METRICS_DAYS} días.`;
    }
    return null;
  }

  private formatDate(value: string): string {
    if (!value) {
      return '';
    }
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  private formatDayLabel(value: string): string {
    const [, month, day] = value.split('-');
    return `${day}/${month}`;
  }
}
