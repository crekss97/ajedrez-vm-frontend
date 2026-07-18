import { Injectable, computed, signal } from '@angular/core';

export const RETARDO_CARGADOR_MS = 150;
export const MINIMO_VISIBLE_CARGADOR_MS = 400;

@Injectable({ providedIn: 'root' })
export class AppLoadingService {
  private readonly cantidadActiva = signal(0);
  private readonly estadoVisible = signal(false);
  private temporizadorMostrar: ReturnType<typeof setTimeout> | undefined;
  private temporizadorOcultar: ReturnType<typeof setTimeout> | undefined;
  private visibleDesde = 0;

  readonly cargando = computed(() => this.cantidadActiva() > 0);
  readonly visible = this.estadoVisible.asReadonly();

  iniciar(inmediato = false): () => void {
    this.cancelarOcultamiento();
    this.cantidadActiva.update((cantidad) => cantidad + 1);

    if (inmediato && !this.estadoVisible()) {
      this.cancelarAparicion();
      this.mostrar();
    } else if (!this.estadoVisible() && !this.temporizadorMostrar) {
      this.temporizadorMostrar = setTimeout(() => {
        this.temporizadorMostrar = undefined;

        if (this.cantidadActiva() > 0) {
          this.mostrar();
        }
      }, RETARDO_CARGADOR_MS);
    }

    let finalizada = false;

    return () => {
      if (finalizada) {
        return;
      }

      finalizada = true;
      this.cantidadActiva.update((cantidad) => Math.max(0, cantidad - 1));

      if (this.cantidadActiva() === 0) {
        this.programarOcultamiento();
      }
    };
  }

  private programarOcultamiento(): void {
    this.cancelarAparicion();

    if (!this.estadoVisible()) {
      return;
    }

    const tiempoVisible = Date.now() - this.visibleDesde;
    const esperaRestante = Math.max(0, MINIMO_VISIBLE_CARGADOR_MS - tiempoVisible);

    this.temporizadorOcultar = setTimeout(() => {
      this.temporizadorOcultar = undefined;

      if (this.cantidadActiva() === 0) {
        this.estadoVisible.set(false);
      }
    }, esperaRestante);
  }

  private cancelarOcultamiento(): void {
    if (!this.temporizadorOcultar) {
      return;
    }

    clearTimeout(this.temporizadorOcultar);
    this.temporizadorOcultar = undefined;
  }

  private cancelarAparicion(): void {
    if (!this.temporizadorMostrar) {
      return;
    }

    clearTimeout(this.temporizadorMostrar);
    this.temporizadorMostrar = undefined;
  }

  private mostrar(): void {
    this.visibleDesde = Date.now();
    this.estadoVisible.set(true);
  }
}
