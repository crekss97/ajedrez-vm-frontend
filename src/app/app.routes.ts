import { Routes } from '@angular/router';
import { EventoDetalle } from './pages/evento-detalle/evento-detalle';
import { editorAuthGuard } from './guards/editor-auth.guard';
import { EditorLogin } from './pages/editor-login/editor-login';
import { EditorPanel } from './pages/editor-panel/editor-panel';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Eventos destacados' },
  { path: 'eventos/:slug', component: EventoDetalle, title: 'Detalle del evento' },
  { path: 'editor/login', component: EditorLogin, title: 'Ingreso editorial' },
  {
    path: 'editor',
    component: EditorPanel,
    canActivate: [editorAuthGuard],
    title: 'Editor',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/editor-dashboard/editor-dashboard').then((m) => m.EditorDashboard),
        title: 'Resumen editorial',
      },
      {
        path: 'eventos',
        loadComponent: () => import('./pages/editor-eventos/editor-eventos-biblioteca').then((m) => m.EditorEventosBiblioteca),
        title: 'Eventos | Editor',
      },
      {
        path: 'eventos/nuevo',
        loadComponent: () => import('./pages/editor-eventos/editor-eventos').then((m) => m.EditorEventos),
        title: 'Crear evento | Editor',
      },
      {
        path: 'eventos/:id/editar',
        loadComponent: () => import('./pages/editor-eventos/editor-eventos').then((m) => m.EditorEventos),
        title: 'Editar evento | Editor',
      },
      {
        path: 'enlaces',
        loadComponent: () => import('./pages/editor-enlaces/editor-enlaces').then((m) => m.EditorEnlaces),
        title: 'Enlaces | Editor',
      },
      {
        path: 'metricas',
        loadComponent: () => import('./pages/editor-metricas/editor-metricas').then((m) => m.EditorMetricas),
        title: 'Métricas | Editor',
      },
    ],
  },
  { path: '**', redirectTo: '' }
];
