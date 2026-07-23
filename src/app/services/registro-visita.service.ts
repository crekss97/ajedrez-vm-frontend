import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { EMPTY, catchError, take } from 'rxjs';
import { EventosService } from './evento.service';

const MIN_VISIBLE_DURATION_MS = 3_000;
const REGISTERED_TTL_MS = 30 * 60 * 1_000;
const PENDING_TTL_MS = 60 * 1_000;
const VISITOR_STORAGE_KEY = 'ajedrez-vm:visitor-id:v1';
const EVENT_STATE_PREFIX = 'ajedrez-vm:event-view:v1:';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EstadoVisita = {
  estado: 'pendiente' | 'registrada';
  requestId: string;
  timestamp: number;
};

@Injectable({
  providedIn: 'root',
})
export class RegistroVisitaService {
  private readonly document = inject(DOCUMENT);
  private readonly eventosService = inject(EventosService);

  programar(slug: string): () => void {
    if (!slug || this.obtenerEstadoVigente(slug)) {
      return () => undefined;
    }

    const visitorId = this.obtenerVisitorId();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visibleStartedAt = 0;
    let disposed = false;
    let requestStarted = false;

    const cancelarTemporizador = (): void => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      visibleStartedAt = 0;
    };

    const enviarVisita = (): void => {
      if (
        disposed
        || requestStarted
        || this.document.visibilityState !== 'visible'
      ) {
        return;
      }

      requestStarted = true;
      const requestId = crypto.randomUUID();
      const visibleDurationMs = Math.max(
        MIN_VISIBLE_DURATION_MS,
        Date.now() - visibleStartedAt,
      );
      this.guardarEstado(slug, {
        estado: 'pendiente',
        requestId,
        timestamp: Date.now(),
      });

      this.eventosService
        .registrarConsulta(slug, visibleDurationMs, visitorId, requestId)
        .pipe(
          take(1),
          catchError(() => {
            this.eliminarEstado(slug, requestId);
            return EMPTY;
          }),
        )
        .subscribe(() => {
          this.guardarEstado(slug, {
            estado: 'registrada',
            requestId,
            timestamp: Date.now(),
          });
        });
    };

    const iniciarTemporizador = (): void => {
      if (
        disposed
        || requestStarted
        || timer !== undefined
        || this.document.visibilityState !== 'visible'
      ) {
        return;
      }

      visibleStartedAt = Date.now();
      timer = setTimeout(() => {
        timer = undefined;
        enviarVisita();
      }, MIN_VISIBLE_DURATION_MS);
    };

    const alCambiarVisibilidad = (): void => {
      cancelarTemporizador();
      iniciarTemporizador();
    };

    this.document.addEventListener('visibilitychange', alCambiarVisibilidad);
    iniciarTemporizador();

    return () => {
      disposed = true;
      cancelarTemporizador();
      this.document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }

  private obtenerVisitorId(): string {
    const storage = this.obtenerStorage('local');
    const existing = this.leerStorage(storage, VISITOR_STORAGE_KEY);
    if (existing && UUID_PATTERN.test(existing)) {
      return existing;
    }

    const visitorId = crypto.randomUUID();
    this.escribirStorage(storage, VISITOR_STORAGE_KEY, visitorId);
    return visitorId;
  }

  private obtenerEstadoVigente(slug: string): EstadoVisita | null {
    const storage = this.obtenerStorage('session');
    const key = this.claveEvento(slug);
    const value = this.leerStorage(storage, key);
    if (!value) {
      return null;
    }

    try {
      const estado = JSON.parse(value) as Partial<EstadoVisita>;
      const ttl = estado.estado === 'pendiente' ? PENDING_TTL_MS : REGISTERED_TTL_MS;
      if (
        (estado.estado === 'pendiente' || estado.estado === 'registrada')
        && typeof estado.requestId === 'string'
        && UUID_PATTERN.test(estado.requestId)
        && typeof estado.timestamp === 'number'
        && Date.now() - estado.timestamp < ttl
      ) {
        return estado as EstadoVisita;
      }
    } catch {
      // Un estado corrupto no debe impedir una nueva visita.
    }

    this.eliminarEstado(slug);
    return null;
  }

  private guardarEstado(slug: string, estado: EstadoVisita): void {
    this.escribirStorage(
      this.obtenerStorage('session'),
      this.claveEvento(slug),
      JSON.stringify(estado),
    );
  }

  private eliminarEstado(slug: string, requestId?: string): void {
    const storage = this.obtenerStorage('session');
    if (!storage) {
      return;
    }

    try {
      if (requestId) {
        const current = this.leerStorage(storage, this.claveEvento(slug));
        if (current) {
          const state = JSON.parse(current) as Partial<EstadoVisita>;
          if (state.requestId !== requestId) {
            return;
          }
        }
      }
      storage.removeItem(this.claveEvento(slug));
    } catch {
      // El almacenamiento puede estar bloqueado por la configuración del navegador.
    }
  }

  private claveEvento(slug: string): string {
    return `${EVENT_STATE_PREFIX}${encodeURIComponent(slug)}`;
  }

  private obtenerStorage(tipo: 'local' | 'session'): Storage | null {
    try {
      const window = this.document.defaultView;
      return tipo === 'local' ? window?.localStorage ?? null : window?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private leerStorage(storage: Storage | null, key: string): string | null {
    if (!storage) {
      return null;
    }
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  private escribirStorage(storage: Storage | null, key: string, value: string): void {
    if (!storage) {
      return;
    }
    try {
      storage.setItem(key, value);
    } catch {
      // El registro de visitas debe seguir siendo opcional para la interfaz.
    }
  }
}
