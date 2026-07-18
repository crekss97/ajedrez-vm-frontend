import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  private readonly errorEventos = signal(false);
  private readonly errorLinks = signal(false);

  private readonly eventosCargados = toSignal(
    this.eventosService.getEventos().pipe(
      catchError(() => {
        this.errorEventos.set(true);
        return of([] as Evento[]);
      }),
    ),
  );

  private readonly linksCargados = toSignal(
    this.sidebarLinksService.getLinks().pipe(
      catchError(() => {
        this.errorLinks.set(true);
        return of([] as SidebarLink[]);
      }),
    ),
  );

  protected readonly eventos = computed(() => this.eventosCargados() ?? []);
  protected readonly linksDestacados = computed(() => this.linksCargados() ?? []);
  protected readonly cargandoEventos = computed(() => this.eventosCargados() === undefined);
  protected readonly cargandoLinks = computed(() => this.linksCargados() === undefined);
  protected readonly mostrarErrorEventos = this.errorEventos.asReadonly();
  protected readonly mostrarErrorLinks = this.errorLinks.asReadonly();

  protected readonly entradasPopulares = computed(() =>
    [...this.eventos()].sort((a, b) => b.views - a.views).slice(0, 5),
  );

}
