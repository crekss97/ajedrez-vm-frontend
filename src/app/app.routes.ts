import { Routes } from '@angular/router';
import { editorAuthGuard } from './guards/editor-auth.guard';
import { EditorLogin } from './pages/editor-login/editor-login';
import { EditorPanel } from './pages/editor-panel/editor-panel';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Ajedrez VM' },
  {
    path: 'eventos/:slug',
    loadComponent: () => import('./pages/evento-detalle/evento-detalle').then((m) => m.EventoDetalle),
    title: 'Detalle del evento',
  },
  { path: 'login', component: EditorLogin, title: 'Ingreso editorial' },
  { path: 'editor/login', redirectTo: 'login', pathMatch: 'full' },
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
