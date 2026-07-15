export interface EditorMetricEvent {
  id: number;
  titulo: string;
  views: number;
}

export interface EditorMetrics {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  featuredEvents: number;
  totalViews: number;
  averageViews: number;
  eventsByViews: EditorMetricEvent[];
}
