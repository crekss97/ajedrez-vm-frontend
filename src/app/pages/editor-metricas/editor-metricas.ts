import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { EditorMetrics } from '../../models/editor-metrics';
import { EditorMetricsService } from '../../services/editor-metrics.service';

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
  private readonly emptyMetrics: EditorMetrics = {
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    featuredEvents: 0,
    totalViews: 0,
    averageViews: 0,
    eventsByViews: [],
  };
  protected readonly metrics = toSignal(this.metricsService.getMetrics(), { initialValue: undefined });
  protected readonly viewsChartData = computed<ChartData<'bar'>>(() => ({
    labels: (this.metrics() ?? this.emptyMetrics).eventsByViews.map((event) => event.titulo),
    datasets: [{
      data: (this.metrics() ?? this.emptyMetrics).eventsByViews.map((event) => event.views),
      label: 'Vistas',
      backgroundColor: '#e4573f',
      borderRadius: 7,
      maxBarThickness: 34,
    }],
  }));
  protected readonly statusChartData = computed<ChartData<'doughnut'>>(() => {
    const metrics = this.metrics() ?? this.emptyMetrics;
    return {
      labels: ['Publicados', 'Borradores'],
      datasets: [{ data: [metrics.publishedEvents, metrics.draftEvents], backgroundColor: ['#142d3d', '#e6bd55'], borderWidth: 0 }],
    };
  });
  protected readonly viewsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { display: false }, grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(20, 45, 61, 0.08)' } } },
  };
  protected readonly statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { position: 'bottom' } },
  };

}
