import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  MAX_EVENT_IMAGE_BYTES,
  readImageDimensions,
  validateEventImage,
} from '../../core/event-image.validation';
import { validatePublicationPdf } from '../../core/pdf.validation';
import { SolicitudesPublicacionService } from '../../services/solicitudes-publicacion.service';

@Component({
  selector: 'app-solicitar-publicacion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './solicitar-publicacion.html',
  styleUrl: './solicitar-publicacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarPublicacion {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudesService = inject(SolicitudesPublicacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private imageSelectionId = 0;
  private pdfSelectionId = 0;

  protected readonly solicitudForm = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    apellido: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(320)]),
    nombreTorneo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    imagen: this.fb.control<File | null>(null, Validators.required),
    pdf: this.fb.control<File | null>(null, Validators.required),
  });
  protected readonly formSubmitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly validatingImage = signal(false);
  protected readonly validatingPdf = signal(false);
  protected readonly imageError = signal('');
  protected readonly imageWarning = signal('');
  protected readonly pdfError = signal('');
  protected readonly imageFileName = signal('');
  protected readonly pdfFileName = signal('');
  protected readonly imagePreviewUrl = signal('');
  protected readonly submitError = signal('');
  protected readonly successMessage = signal('');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.imageSelectionId++;
      this.pdfSelectionId++;
      this.revokeImagePreview();
    });
  }

  protected async selectImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    const selectionId = ++this.imageSelectionId;
    this.clearImageSelection();

    if (!file) {
      return;
    }

    this.successMessage.set('');
    this.imageError.set('');
    this.imageWarning.set('');
    this.solicitudForm.controls.imagen.markAsTouched();

    if (!this.isSupportedImage(file)) {
      this.setImageError('Seleccioná una imagen JPG, PNG o WebP.');
      return;
    }

    if (file.size === 0) {
      this.setImageError('La imagen no puede estar vacía.');
      return;
    }

    if (file.size > MAX_EVENT_IMAGE_BYTES) {
      this.setImageError(validateEventImage(file, { width: 800, height: 800 }).error);
      return;
    }

    this.validatingImage.set(true);
    try {
      const dimensions = await readImageDimensions(file);

      if (selectionId !== this.imageSelectionId) {
        return;
      }

      const validation = validateEventImage(file, dimensions);
      if (validation.error) {
        this.setImageError(validation.error);
        return;
      }

      this.imageWarning.set(validation.warning);
      this.imageFileName.set(file.name);
      this.imagePreviewUrl.set(URL.createObjectURL(file));
      this.solicitudForm.controls.imagen.setValue(file);
      this.solicitudForm.controls.imagen.markAsDirty();
    } catch {
      if (selectionId === this.imageSelectionId) {
        this.setImageError('No se pudieron leer las dimensiones de la imagen. Elegí otro archivo.');
      }
    } finally {
      if (selectionId === this.imageSelectionId) {
        this.validatingImage.set(false);
      }
    }
  }

  protected async selectPdf(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    const selectionId = ++this.pdfSelectionId;
    this.clearPdfSelection();

    if (!file) {
      return;
    }

    this.successMessage.set('');
    this.pdfError.set('');
    this.solicitudForm.controls.pdf.markAsTouched();
    this.validatingPdf.set(true);

    try {
      const error = await validatePublicationPdf(file);
      if (selectionId !== this.pdfSelectionId) {
        return;
      }

      if (error) {
        this.pdfError.set(error);
        return;
      }

      this.pdfFileName.set(file.name);
      this.solicitudForm.controls.pdf.setValue(file);
      this.solicitudForm.controls.pdf.markAsDirty();
    } finally {
      if (selectionId === this.pdfSelectionId) {
        this.validatingPdf.set(false);
      }
    }
  }

  protected submitSolicitud(): void {
    this.formSubmitted.set(true);
    this.submitError.set('');
    this.successMessage.set('');

    if (this.validatingImage() || this.validatingPdf()) {
      this.submitError.set('Esperá a que termine la validación de los archivos.');
      return;
    }

    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      this.submitError.set('Completá los campos marcados.');
      this.focusFirstInvalidControl();
      return;
    }

    const value = this.solicitudForm.getRawValue();
    const image = value.imagen;
    const pdf = value.pdf;

    if (!image || !pdf) {
      this.submitError.set('Seleccioná los dos archivos.');
      this.focusFirstInvalidControl();
      return;
    }

    this.submitting.set(true);
    this.solicitudesService.createSolicitud(
      {
        nombre: value.nombre.trim(),
        apellido: value.apellido.trim(),
        email: value.email.trim(),
        nombreTorneo: value.nombreTorneo.trim(),
      },
      image,
      pdf,
    ).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.resetFormAfterSuccess();
        this.successMessage.set('Solicitud enviada.');
        queueMicrotask(() => {
          this.host.nativeElement.querySelector<HTMLElement>('#solicitud-success')?.focus();
        });
      },
      error: () => {
        this.submitError.set('No se pudo enviar la solicitud. Intentá nuevamente sin cerrar esta página.');
      },
    });
  }

  protected hasError(controlName: string): boolean {
    const control = this.solicitudForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted());
  }

  protected errorMessage(controlName: string): string {
    const control = this.solicitudForm.get(controlName);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Campo obligatorio.';
    }
    if (control.errors['email']) {
      return 'Ingresá un email válido.';
    }
    if (control.errors['maxlength']) {
      return `No puede superar ${control.errors['maxlength'].requiredLength} caracteres.`;
    }
    return 'Revisá este campo.';
  }

  protected describedBy(controlName: string, ...descriptionIds: string[]): string {
    const ids = descriptionIds.filter(Boolean);
    if (this.hasError(controlName)) {
      ids.push(`${controlName}-error`);
    }
    if (controlName === 'imagen' && this.imageWarning()) {
      ids.push('imagen-warning');
    }
    return ids.join(' ');
  }

  private isSupportedImage(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const knownMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const acceptableGenericType = ['', 'application/octet-stream'].includes(file.type)
      && ['jpg', 'jpeg', 'png', 'webp'].includes(extension ?? '');
    return knownMimeType || acceptableGenericType;
  }

  private setImageError(message: string): void {
    this.imageError.set(message);
    this.solicitudForm.controls.imagen.setErrors({ archivo: true });
  }

  private clearImageSelection(): void {
    this.revokeImagePreview();
    this.imageFileName.set('');
    this.imageError.set('');
    this.imageWarning.set('');
    this.solicitudForm.controls.imagen.setValue(null);
    this.solicitudForm.controls.imagen.markAsPristine();
  }

  private clearPdfSelection(): void {
    this.pdfFileName.set('');
    this.pdfError.set('');
    this.solicitudForm.controls.pdf.setValue(null);
    this.solicitudForm.controls.pdf.markAsPristine();
  }

  private resetFormAfterSuccess(): void {
    this.clearImageSelection();
    this.clearPdfSelection();
    this.solicitudForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      nombreTorneo: '',
      imagen: null,
      pdf: null,
    });
    this.formSubmitted.set(false);
  }

  private focusFirstInvalidControl(): void {
    queueMicrotask(() => {
      const firstInvalid = this.host.nativeElement.querySelector<HTMLElement>(
        '.field-invalid input:not([type="hidden"]), .field-invalid textarea',
      );
      firstInvalid?.focus();
    });
  }

  private revokeImagePreview(): void {
    const previewUrl = this.imagePreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.imagePreviewUrl.set('');
    }
  }
}
