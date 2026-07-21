import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompartirEvento } from '../../components/compartir-evento/compartir-evento';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { EditorEventosService } from '../../services/editor-eventos.service';

@Component({
  selector: 'app-editor-eventos-biblioteca',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, EditorLoading, CompartirEvento],
  templateUrl: './editor-eventos-biblioteca.html',
  styleUrl: './editor-eventos-biblioteca.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorEventosBiblioteca {
  private readonly editorEventosService = inject(EditorEventosService);

  protected readonly events$ = this.editorEventosService.drafts$;
  protected readonly actionError = signal('');

  protected deleteEvent(id: number, title: string): void {
    if (!window.confirm(`¿Eliminar "${title}"?`)) {
      return;
    }

    this.actionError.set('');
    this.editorEventosService.deleteEvent(id).subscribe({
      error: () => this.actionError.set('No se pudo eliminar el evento. Intentá nuevamente.'),
    });
  }
}
