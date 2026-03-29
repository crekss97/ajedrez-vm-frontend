import { Routes } from '@angular/router';
import { EventoDetalle } from './pages/evento-detalle/evento-detalle';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Eventos destacados' },
  { path: 'eventos/:slug', component: EventoDetalle, title: 'Detalle del evento' },
  { path: '**', redirectTo: '' }
];
