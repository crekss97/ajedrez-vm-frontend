import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CompartirEventoService } from '../../services/compartir-evento.service';

@Component({
  selector: 'app-compartir-evento',
  standalone: true,
  templateUrl: './compartir-evento.html',
  styleUrl: './compartir-evento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompartirEvento {
  private readonly compartirService = inject(CompartirEventoService);

  readonly slug = input.required<string>();
  readonly titulo = input.required<string>();

  protected readonly url = computed(() => this.compartirService.urlEvento(this.slug()));
  protected readonly urlWhatsApp = computed(() =>
    this.compartirService.urlWhatsApp(this.slug(), this.titulo()),
  );
  protected readonly urlFacebook = computed(() => this.compartirService.urlFacebook(this.slug()));
  protected readonly urlTwitter = computed(() =>
    this.compartirService.urlTwitter(this.slug(), this.titulo()),
  );
  protected readonly mensaje = signal('');
  protected readonly error = signal('');
  protected readonly mostrarUrlManual = signal(false);

  protected async copiar(): Promise<void> {
    this.limpiarEstado();
    try {
      await this.compartirService.copiar(this.url());
      this.mensaje.set('Enlace copiado.');
    } catch {
      this.error.set('No se pudo copiar el enlace. Seleccionalo y copialo manualmente.');
      this.mostrarUrlManual.set(true);
    }
  }

  protected seleccionarUrl(input: HTMLInputElement): void {
    input.select();
  }

  private limpiarEstado(): void {
    this.mensaje.set('');
    this.error.set('');
    this.mostrarUrlManual.set(false);
  }
}
