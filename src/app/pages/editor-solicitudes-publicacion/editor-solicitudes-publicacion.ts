import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { NotificacionCorreo, SolicitudPublicacion } from '../../models/solicitud-publicacion';
import { SolicitudesPublicacionService } from '../../services/solicitudes-publicacion.service';

interface ImagePreview {
  url: string;
  extension: string;
}

interface OpenImagePreview {
  solicitud: SolicitudPublicacion;
  url: string;
}

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly imageObjectUrls = new Map<number, string>();

  protected readonly solicitudes = signal<SolicitudPublicacion[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly brokenImages = signal<ReadonlySet<number>>(new Set());
  protected readonly imagePreviews = signal<ReadonlyMap<number, ImagePreview>>(new Map());
  protected readonly imageLoadingIds = signal<ReadonlySet<number>>(new Set());
  protected readonly previewImage = signal<OpenImagePreview | null>(null);
  protected readonly retryingNotificationIds = signal<ReadonlySet<number>>(new Set());
  protected readonly notificationRetryErrors = signal<ReadonlyMap<number, string>>(new Map());

  constructor() {
    this.destroyRef.onDestroy(() => this.clearImagePreviews());
    this.loadSolicitudes();
  }

  protected retry(): void {
    this.loadSolicitudes();
  }

  protected imageIsBroken(id: number): boolean {
    return this.brokenImages().has(id);
  }

  protected imageIsLoading(id: number): boolean {
    return this.imageLoadingIds().has(id);
  }

  protected imagePreviewUrl(id: number): string {
    return this.imagePreviews().get(id)?.url ?? '';
  }

  protected previewImageLabel(): string {
    return this.previewImage()?.solicitud.nombreTorneo ?? 'imagen';
  }

  protected notificationStatusLabel(notification: NotificacionCorreo | null): string {
    if (!notification) {
      return 'No registrado';
    }

    switch (notification.estado) {
      case 'enviada':
        return 'Correo enviado';
      case 'procesando':
        return 'Enviando correo';
      case 'fallida':
        return 'Error al enviar';
      default:
        return 'Correo pendiente';
    }
  }

  protected notificationIsRetryable(notification: NotificacionCorreo | null): boolean {
    return notification?.estado === 'fallida';
  }

  protected notificationIsRetrying(id: number): boolean {
    return this.retryingNotificationIds().has(id);
  }

  protected notificationRetryError(id: number): string {
    return this.notificationRetryErrors().get(id) ?? '';
  }

  protected retryNotification(solicitud: SolicitudPublicacion): void {
    if (!this.notificationIsRetryable(solicitud.notificacionCorreo) || this.notificationIsRetrying(solicitud.id)) {
      return;
    }

    this.retryingNotificationIds.update((ids) => new Set(ids).add(solicitud.id));
    this.notificationRetryErrors.update((errors) => {
      const next = new Map(errors);
      next.delete(solicitud.id);
      return next;
    });
    this.solicitudesService.reintentarNotificacion(solicitud.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.retryingNotificationIds.update((ids) => {
          const next = new Set(ids);
          next.delete(solicitud.id);
          return next;
        });
      }),
    ).subscribe({
      next: (notificacionCorreo) => {
        this.solicitudes.update((solicitudes) => solicitudes.map((item) => (
          item.id === solicitud.id ? { ...item, notificacionCorreo } : item
        )));
      },
      error: () => {
        this.notificationRetryErrors.update((errors) => {
          const next = new Map(errors);
          next.set(solicitud.id, 'No se pudo reintentar el envío.');
          return next;
        });
      },
    });
  }

  protected markImageAsBroken(id: number): void {
    this.brokenImages.update((ids) => new Set(ids).add(id));
  }

  protected openImagePreview(solicitud: SolicitudPublicacion, dialog: HTMLDialogElement): void {
    const preview = this.imagePreviews().get(solicitud.id);
    if (!preview) {
      return;
    }

    this.previewImage.set({
      solicitud,
      url: preview.url,
    });

    if (!dialog.open) {
      dialog.showModal();
    }
  }

  protected closeImagePreview(dialog: HTMLDialogElement): void {
    if (dialog.open) {
      dialog.close();
    }
    this.previewImage.set(null);
  }

  protected closeImagePreviewFromBackdrop(event: MouseEvent, dialog: HTMLDialogElement): void {
    if (event.target === dialog) {
      this.closeImagePreview(dialog);
    }
  }

  protected downloadImage(solicitud: SolicitudPublicacion): void {
    const preview = this.imagePreviews().get(solicitud.id);
    if (!preview) {
      return;
    }

    const link = document.createElement('a');
    link.href = preview.url;
    link.download = this.imageFileName(solicitud, preview.extension);
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
  }

  private loadSolicitudes(): void {
    this.clearImagePreviews();
    this.brokenImages.set(new Set());
    this.loading.set(true);
    this.loadError.set('');
    this.solicitudesService.getSolicitudes().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.loadImagePreviews(solicitudes);
      },
      error: () => this.loadError.set('No se pudieron cargar las solicitudes. Intentá nuevamente.'),
    });
  }

  private loadImagePreviews(solicitudes: SolicitudPublicacion[]): void {
    for (const solicitud of solicitudes) {
      if (!solicitud.imagenUrl) {
        continue;
      }

      this.imageLoadingIds.update((ids) => new Set(ids).add(solicitud.id));
      this.solicitudesService.getArchivo(solicitud.imagenUrl).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.imageLoadingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(solicitud.id);
            return next;
          });
        }),
      ).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.imageObjectUrls.set(solicitud.id, url);
          this.imagePreviews.update((previews) => {
            const next = new Map(previews);
            next.set(solicitud.id, {
              url,
              extension: this.imageExtension(blob.type),
            });
            return next;
          });
        },
        error: () => this.markImageAsBroken(solicitud.id),
      });
    }
  }

  private imageExtension(mimeType: string): string {
    if (mimeType === 'image/png') {
      return 'png';
    }
    if (mimeType === 'image/webp') {
      return 'webp';
    }
    return 'jpg';
  }

  private imageFileName(solicitud: SolicitudPublicacion, extension: string): string {
    const baseName = solicitud.nombreTorneo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    return `${baseName || 'torneo'}-portada.${extension}`;
  }

  private clearImagePreviews(): void {
    for (const url of this.imageObjectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.imageObjectUrls.clear();
    this.imagePreviews.set(new Map());
    this.imageLoadingIds.set(new Set());
    this.previewImage.set(null);
  }
}
