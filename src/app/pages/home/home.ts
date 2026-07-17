import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { EntradasPopularesComponent } from '../../components/entradas-populares/entradas-populares';
import { EventosPublicadosListComponent } from '../../components/eventos-publicados-list/eventos-publicados-list';
import { LinksDestacadosComponent } from '../../components/links-destacados/links-destacados';
import { Evento } from '../../models/evento';
import { SidebarLink } from '../../models/sidebar-link';
import { EventosService } from '../../services/evento.service';
import { SidebarLinksService } from '../../services/sidebar-links.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    EventosPublicadosListComponent,
    EntradasPopularesComponent,
    LinksDestacadosComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly eventosService = inject(EventosService);
  private readonly sidebarLinksService = inject(SidebarLinksService);
  private readonly hasError = signal(false);

  protected readonly eventos = toSignal(
    this.eventosService.getEventos().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as Evento[]);
      }),
    ),
    { initialValue: [] as Evento[] },
  );

  protected readonly entradasPopulares = toSignal(
    this.eventosService.getEventosPopulares(5).pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as Evento[]);
      }),
    ),
    { initialValue: [] as Evento[] },
  );

  protected readonly linksDestacados = toSignal(
    this.sidebarLinksService.getLinks().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as SidebarLink[]);
      }),
    ),
    { initialValue: [] as SidebarLink[] },
  );

  protected readonly mostrarError = this.hasError.asReadonly();
}
