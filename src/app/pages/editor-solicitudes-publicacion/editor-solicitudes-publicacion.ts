import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { SolicitudPublicacion } from '../../models/solicitud-publicacion';
import { SolicitudesPublicacionService } from '../../services/solicitudes-publicacion.service';

@Component({
  selector: 'app-editor-solicitudes-publicacion',
  standalone: true,
  imports: [DatePipe, EditorLoading],
  templateUrl: './editor-solicitudes-publicacion.html',
  styleUrl: './editor-solicitudes-publicacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorSolicitudesPublicacion {
  private readonly solicitudesService = inject(SolicitudesPublicacionService);

  protected readonly solicitudes = signal<SolicitudPublicacion[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly brokenImages = signal<ReadonlySet<number>>(new Set());

  constructor() {
    this.loadSolicitudes();
  }

  protected retry(): void {
    this.loadSolicitudes();
  }

  protected imageIsBroken(id: number): boolean {
    return this.brokenImages().has(id);
  }

  protected markImageAsBroken(id: number): void {
    this.brokenImages.update((ids) => new Set(ids).add(id));
  }

  private loadSolicitudes(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.solicitudesService.getSolicitudes().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (solicitudes) => this.solicitudes.set(solicitudes),
      error: () => this.loadError.set('No se pudieron cargar las solicitudes. Intentá nuevamente.'),
    });
  }
}
