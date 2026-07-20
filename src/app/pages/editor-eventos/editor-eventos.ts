import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FlatpickrDefaultsInterface, FlatpickrDirective, provideFlatpickrDefaults } from 'angularx-flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { QuillEditorComponent } from 'ngx-quill';
import { finalize, take } from 'rxjs';
import {
  MAX_EVENT_IMAGE_BYTES,
  readImageDimensions,
  validateEventImage,
} from '../../core/event-image.validation';
import { EventoAdjunto, EventoEstadoEditorial, EventoModalidad } from '../../models/evento';
import { EventoEditorDraft, EventoEditorInput } from '../../models/editor';
import { EditorEventosService } from '../../services/editor-eventos.service';

interface PendingAttachment {
  id: string;
  nombre: string;
  file: File;
}

const buenosAiresDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getBuenosAiresDateTimeParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    buenosAiresDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

function toBuenosAiresInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = getBuenosAiresDateTimeParts(date);
  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
}

function fromBuenosAiresInput(value: string): Date {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desiredWallTime;

  for (let attempt = 0; attempt < 3; attempt++) {
    const represented = getBuenosAiresDateTimeParts(new Date(instant));
    const representedWallTime = Date.UTC(
      Number(represented['year']),
      Number(represented['month']) - 1,
      Number(represented['day']),
      Number(represented['hour']),
      Number(represented['minute']),
    );
    const adjustment = desiredWallTime - representedWallTime;
    instant += adjustment;
    if (adjustment === 0) {
      break;
    }
  }

  return new Date(instant);
}

function isValidBuenosAiresDateTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const instant = fromBuenosAiresInput(value);
  return !Number.isNaN(instant.getTime()) && toBuenosAiresInput(instant.toISOString()) === value;
}

const buenosAiresDateTimeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return value === '' || isValidBuenosAiresDateTime(value) ? null : { fechaInvalida: true };
};

const eventDateRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const start = control.get('fechaInicio')?.value;
  const end = control.get('fechaFin')?.value;
  if (!end || !isValidBuenosAiresDateTime(start) || !isValidBuenosAiresDateTime(end)) {
    return null;
  }
  return end > start ? null : { fechaFinAnterior: true };
};

function toEventInstant(value: string): string {
  return fromBuenosAiresInput(value).toISOString();
}

@Component({
  selector: 'app-editor-eventos',
  standalone: true,
  imports: [A11yModule, ReactiveFormsModule, RouterLink, QuillEditorComponent, FlatpickrDirective],
  providers: [provideFlatpickrDefaults()],
  templateUrl: './editor-eventos.html',
  styleUrl: './editor-eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorEventos {
  private readonly fb = inject(FormBuilder);
  private readonly editorEventosService = inject(EditorEventosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly maxFilesBytes = 4 * 1024 * 1024;
  private readonly maxAttachments = 5;
  private imageSelectionId = 0;
  private richEditorRoot: HTMLElement | null = null;

  protected readonly minShortDescription = 20;
  protected readonly maxShortDescription = 180;
  protected readonly editingEvent = signal<EventoEditorDraft | null>(null);
  protected readonly createdEvent = signal<EventoEditorDraft | null>(null);
  protected readonly formSubmitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly imageFileName = signal('');
  protected readonly imageError = signal('');
  protected readonly attachmentError = signal('');
  protected readonly imageWarning = signal('');
  protected readonly validatingImage = signal(false);
  protected readonly attachments = signal<EventoAdjunto[]>([]);
  protected readonly pendingAttachments = signal<PendingAttachment[]>([]);
  protected readonly imageFile = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal('');
  protected readonly imagePreview = computed(
    () => this.imagePreviewUrl() || this.editingEvent()?.imagenUrl || '',
  );
  protected readonly attachmentRows = computed(() => [
    ...this.attachments().map((attachment) => ({
      id: attachment.id,
      nombre: attachment.nombre,
      pending: false,
    })),
    ...this.pendingAttachments().map((attachment) => ({
      id: attachment.id,
      nombre: attachment.nombre,
      pending: true,
    })),
  ]);
  protected readonly dateTimeOptions: FlatpickrDefaultsInterface = {
    enableTime: true,
    time24hr: true,
    dateFormat: 'Y-m-d\\TH:i',
    altInput: true,
    altInputClass: 'editor-date-input',
    altFormat: 'd/m/Y H:i',
    minuteIncrement: 15,
    allowInput: true,
    disableMobile: true,
    locale: Spanish,
    ariaDateFormat: 'j \u0064\u0065 F \u0064\u0065 Y, H:i',
  };
  protected readonly quillModules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link', 'clean'],
    ],
  };
  protected readonly eventForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(6)]],
    slug: [''], categoria: ['', Validators.required],
    descripcionCorta: ['', [Validators.required, Validators.minLength(this.minShortDescription), Validators.maxLength(this.maxShortDescription)]],
    descripcionLarga: ['', Validators.required],
    fechaInicio: ['', [Validators.required, buenosAiresDateTimeValidator]],
    fechaFin: ['', buenosAiresDateTimeValidator], ubicacion: ['', Validators.required],
    organizador: ['', Validators.required],
    imagenUrl: ['', Validators.required],
    destacado: [false], modalidad: ['Presencial' as EventoModalidad, Validators.required],
    tags: ['torneo, magistral, comunidad'],
    estadoEditorial: ['draft' as EventoEstadoEditorial, Validators.required],
  }, { validators: eventDateRangeValidator });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.imageSelectionId++;
      this.revokeImagePreview();
    });
    this.loadEditingEvent();
  }

  protected saveEvent(): void {
    this.formSubmitted.set(true);
    this.syncRichEditorAccessibility();

    if (this.validatingImage()) {
      this.saveError.set('Esperá a que termine la validación de la imagen.');
      return;
    }

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.saveError.set('Revisá los campos marcados antes de guardar.');
      this.focusFirstInvalidControl();
      return;
    }

    const editingEvent = this.editingEvent();
    const selectedImage = this.imageFile();
    if (!editingEvent && !selectedImage) {
      this.eventForm.controls.imagenUrl.setErrors({ required: true });
      this.saveError.set('Seleccioná una imagen principal.');
      this.focusFirstInvalidControl();
      return;
    }

    const value = this.eventForm.getRawValue();
    const input: EventoEditorInput = {
      ...value,
      imagenUrl: editingEvent?.imagenUrl ?? '',
      fechaInicio: toEventInstant(value.fechaInicio),
      fechaFin: value.fechaFin ? toEventInstant(value.fechaFin) : undefined,
      tags: value.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      linksExternos: [],
      adjuntos: this.attachments(),
    };
    const pendingFiles = this.pendingAttachments().map((attachment) => attachment.file);
    const request = editingEvent
      ? this.editorEventosService.updateEvent(editingEvent.id, input, selectedImage, pendingFiles)
      : this.editorEventosService.createEvent(input, selectedImage!, pendingFiles);

    this.saving.set(true);
    this.saveError.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (event) => {
        const wasCreating = !editingEvent;
        this.resetForm();

        if (wasCreating) {
          this.createdEvent.set(event);
        } else {
          void this.router.navigate(['/editor/eventos']);
        }
      },
      error: () => this.saveError.set('No se pudo guardar el evento. Intentá nuevamente.'),
    });
  }

  protected cancelEdit(): void {
    this.revokeImagePreview();
    void this.router.navigate(['/editor/eventos']);
  }

  protected async selectImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const selectionId = ++this.imageSelectionId;
    this.validatingImage.set(false);

    if (!file) {
      return;
    }

    this.discardSelectedImage();
    this.imageError.set('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    const knownMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const acceptableGenericType = ['', 'application/octet-stream'].includes(file.type)
      && ['jpg', 'jpeg', 'png', 'webp'].includes(extension ?? '');
    if (!knownMimeType && !acceptableGenericType) {
      this.imageError.set('Seleccioná una imagen JPG, PNG o WebP.');
      this.imageWarning.set('');
      return;
    }
    if (file.size > MAX_EVENT_IMAGE_BYTES) {
      const validation = validateEventImage(file, { width: 800, height: 800 });
      this.imageError.set(validation.error);
      this.imageWarning.set('');
      return;
    }
    if (!this.fitsTotalLimit(file.size, this.pendingAttachments().map((item) => item.file))) {
      this.imageError.set('La imagen y los PDF no pueden superar 4 MiB en total.');
      this.imageWarning.set('');
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
        this.imageError.set(validation.error);
        this.imageWarning.set('');
        return;
      }
      if (!this.fitsTotalLimit(file.size, this.pendingAttachments().map((item) => item.file))) {
        this.imageError.set('La imagen y los PDF no pueden superar 4 MiB en total.');
        this.imageWarning.set('');
        return;
      }
      this.imageWarning.set(validation.warning);
    } catch {
      if (selectionId !== this.imageSelectionId) {
        return;
      }

      this.imageError.set('No se pudieron leer las dimensiones de la imagen. Elegí otro archivo.');
      this.imageWarning.set('');
      return;
    } finally {
      if (selectionId === this.imageSelectionId) {
        this.validatingImage.set(false);
      }
    }

    const previewUrl = URL.createObjectURL(file);
    this.imageFile.set(file);
    this.imagePreviewUrl.set(previewUrl);
    this.imageFileName.set(file.name);
    this.eventForm.controls.imagenUrl.setValue(previewUrl);
    this.eventForm.controls.imagenUrl.markAsDirty();
    this.imageError.set('');
  }

  protected selectAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.attachmentError.set('Solo se pueden adjuntar archivos PDF.');
      return;
    }
    if (this.attachments().length + this.pendingAttachments().length >= this.maxAttachments) {
      this.attachmentError.set(`Podés adjuntar hasta ${this.maxAttachments} archivos PDF.`);
      return;
    }
    if (!this.fitsTotalLimit(this.imageFile()?.size ?? 0, [
      ...this.pendingAttachments().map((item) => item.file),
      file,
    ])) {
      this.attachmentError.set('La imagen y los PDF no pueden superar 4 MiB en total.');
      return;
    }

    this.pendingAttachments.update((items) => [
      ...items,
      { id: crypto.randomUUID(), nombre: file.name, file },
    ]);
    this.attachmentError.set('');
  }

  protected removeAttachment(id: string, pending: boolean): void {
    if (pending) {
      this.pendingAttachments.update((items) => items.filter((item) => item.id !== id));
    } else {
      this.attachments.update((items) => items.filter((item) => item.id !== id));
    }
  }

  protected configureEditorAccessibility(editor: { root: HTMLElement }): void {
    this.richEditorRoot = editor.root;
    editor.root.id = 'descripcion-larga-editor';
    editor.root.setAttribute('aria-labelledby', 'descripcion-larga-label');
    editor.root.setAttribute('aria-describedby', 'descripcion-larga-help descripcion-larga-error');
    editor.root.setAttribute('aria-required', 'true');
    this.syncRichEditorAccessibility();
  }

  protected configureDateInputAccessibility(event: {
    instance: { input: HTMLInputElement; altInput?: HTMLInputElement };
  }): void {
    const { input, altInput } = event.instance;
    if (!altInput) {
      return;
    }
    altInput.id = `${input.id}-visible`;
    altInput.setAttribute('aria-describedby', input.getAttribute('aria-describedby') ?? '');
    altInput.setAttribute('aria-required', input.getAttribute('aria-required') ?? 'false');
    this.syncDateInputsAccessibility();
  }

  protected hasError(controlName: string): boolean {
    const control = this.eventForm.get(controlName);
    const dateRangeError = controlName === 'fechaFin' && this.eventForm.hasError('fechaFinAnterior');
    return !!control && (control.invalid || dateRangeError) && (control.touched || this.formSubmitted());
  }

  protected errorMessage(controlName: string): string {
    const control = this.eventForm.get(controlName);

    if (controlName === 'fechaFin' && this.eventForm.hasError('fechaFinAnterior')) {
      return 'La fecha de fin debe ser posterior al inicio.';
    }

    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['minlength']) {
      return `Usá al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors['maxlength']) {
      return `Usá como máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (control.errors['fechaInvalida']) {
      return 'Ingresá una fecha y hora válidas.';
    }
    return 'Revisá este campo.';
  }

  protected closeCreatedModal(): void {
    this.createdEvent.set(null);
    void this.router.navigate(['/editor']);
  }

  private startEdit(event: EventoEditorDraft): void {
    this.editingEvent.set(event);
    this.imageFileName.set(event.imagenUrl ? 'Imagen actual' : '');
    this.attachments.set(event.adjuntos ?? []);
    this.eventForm.reset({
      ...event,
      fechaInicio: toBuenosAiresInput(event.fechaInicio),
      fechaFin: event.fechaFin ? toBuenosAiresInput(event.fechaFin) : '',
      tags: event.tags.join(', '),
    });
  }

  private loadEditingEvent(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('id'));

    if (!eventId) {
      return;
    }

    this.editorEventosService.drafts$.pipe(take(1)).subscribe((events) => {
      const event = events.find((draft) => draft.id === eventId);

      if (event) {
        this.startEdit(event);
      } else {
        this.saveError.set('No se encontró el evento que querés editar.');
      }
    });
  }

  private resetForm(): void {
    this.revokeImagePreview();
    this.editingEvent.set(null);
    this.formSubmitted.set(false);
    this.imageFile.set(null);
    this.imageFileName.set('');
    this.imageError.set('');
    this.imageWarning.set('');
    this.validatingImage.set(false);
    this.imageSelectionId++;
    this.attachments.set([]);
    this.pendingAttachments.set([]);
    this.eventForm.reset({ titulo: '', slug: '', categoria: '', descripcionCorta: '', descripcionLarga: '', fechaInicio: '', fechaFin: '', ubicacion: '', organizador: '', imagenUrl: '', destacado: false, modalidad: 'Presencial', tags: 'torneo, magistral, comunidad', estadoEditorial: 'draft' });
    this.syncRichEditorAccessibility();
  }

  private focusFirstInvalidControl(): void {
    queueMicrotask(() => {
      this.syncDateInputsAccessibility();
      const firstInvalid = this.host.nativeElement.querySelector<HTMLElement>(
        '.field-invalid input:not([type="hidden"]), .field-invalid select, .field-invalid textarea, .field-invalid .ql-editor',
      );
      firstInvalid?.focus();
    });
  }

  private syncRichEditorAccessibility(): void {
    this.richEditorRoot?.setAttribute(
      'aria-invalid',
      this.hasError('descripcionLarga') ? 'true' : 'false',
    );
  }

  protected syncDateInputsAccessibility(): void {
    for (const controlName of ['fechaInicio', 'fechaFin']) {
      const input = this.host.nativeElement.querySelector<HTMLInputElement>(
        `#${controlName === 'fechaInicio' ? 'fecha-inicio' : 'fecha-fin'}-visible`,
      );
      input?.setAttribute('aria-invalid', this.hasError(controlName) ? 'true' : 'false');
    }
  }

  private fitsTotalLimit(imageBytes: number, attachments: File[]): boolean {
    return imageBytes + attachments.reduce((total, file) => total + file.size, 0) <= this.maxFilesBytes;
  }

  private revokeImagePreview(): void {
    const previewUrl = this.imagePreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.imagePreviewUrl.set('');
    }
  }

  private discardSelectedImage(): void {
    this.revokeImagePreview();
    this.imageFile.set(null);
    const currentImage = this.editingEvent()?.imagenUrl ?? '';
    this.imageFileName.set(currentImage ? 'Imagen actual' : '');
    this.eventForm.controls.imagenUrl.setValue(currentImage);
  }
}
