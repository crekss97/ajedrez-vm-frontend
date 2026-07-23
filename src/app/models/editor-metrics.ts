export interface EditorMetricEvent {
  id: number;
  titulo: string;
  estadoEditorial: 'draft' | 'published';
  views: number;
  uniqueViews: number;
}

export interface EditorMetricDay {
  fecha: string;
  views: number;
  uniqueViews: number;
}

export interface EditorMetricsRange {
  desde: string;
  hasta: string;
}

export interface EditorMetrics {
  desde: string;
  hasta: string;
  dias: number;
  zonaHoraria: string;
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  featuredEvents: number;
  totalViews: number;
  uniqueViews: number;
  averageViews: number;
  viewsByDay: EditorMetricDay[];
  eventsByViews: EditorMetricEvent[];
}
