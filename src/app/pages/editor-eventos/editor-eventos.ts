import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FlatpickrDirective, provideFlatpickrDefaults } from 'angularx-flatpickr';
import { QuillEditorComponent } from 'ngx-quill';
import { finalize, take } from 'rxjs';
import { EventoAdjunto, EventoEstadoEditorial, EventoModalidad } from '../../models/evento';
import { EventoEditorDraft, EventoEditorInput } from '../../models/editor';
import { EditorAuthService } from '../../services/editor-auth.service';
import { EditorEventosService } from '../../services/editor-eventos.service';

interface PendingAttachment {
  id: string;
  nombre: string;
  file: File;
}

@Component({
  selector: 'app-editor-eventos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, QuillEditorComponent, FlatpickrDirective],
  providers: [provideFlatpickrDefaults()],
  templateUrl: './editor-eventos.html',
  styleUrl: './editor-eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorEventos {
  private readonly fb = inject(FormBuilder);
  private readonly editorEventosService = inject(EditorEventosService);
  private readonly authService = inject(EditorAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly maxFilesBytes = 4 * 1024 * 1024;
  private readonly maxAttachments = 5;

  protected readonly session = this.authService.getSession();
  protected readonly minShortDescription = 20;
  protected readonly maxShortDescription = 180;
  protected readonly editingEvent = signal<EventoEditorDraft | null>(null);
  protected readonly createdEvent = signal<EventoEditorDraft | null>(null);
  protected readonly formSubmitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly imageFileName = signal('');
  protected readonly attachmentError = signal('');
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
  protected readonly dateTimeOptions = {
    enableTime: true,
    time_24hr: true,
    dateFormat: 'Y-m-d\\TH:i',
    altInput: true,
    altInputClass: 'editor-date-input',
    altFormat: 'd/m/Y H:i',
    minuteIncrement: 15,
    allowInput: true,
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
    fechaInicio: ['', Validators.required], fechaFin: [''], ubicacion: ['', Validators.required],
    organizador: ['', Validators.required],
    imagenUrl: ['', Validators.required],
    destacado: [true], modalidad: ['Presencial' as EventoModalidad, Validators.required],
    precio: ['Entrada libre', Validators.required], tags: ['torneo, magistral, comunidad'],
    estadoEditorial: ['published' as EventoEstadoEditorial, Validators.required],
  });
  protected readonly formTitle = computed(() => this.editingEvent()?.titulo || this.eventForm.controls.titulo.value.trim() || 'Nuevo evento editorial');

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeImagePreview());
    this.loadEditingEvent();
  }

  protected saveEvent(): void {
    this.formSubmitted.set(true);

    if (!this.session) {
      this.saveError.set('La sesión editorial no está disponible. Volvé a iniciar sesión.');
      return;
    }
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.saveError.set('Revisá los campos marcados antes de guardar.');
      return;
    }

    const editingEvent = this.editingEvent();
    const selectedImage = this.imageFile();
    if (!editingEvent && !selectedImage) {
      this.eventForm.controls.imagenUrl.setErrors({ required: true });
      this.saveError.set('Seleccioná una imagen principal.');
      return;
    }

    const value = this.eventForm.getRawValue();
    const input: EventoEditorInput = {
      ...value,
      imagenUrl: editingEvent?.imagenUrl ?? '',
      fechaFin: value.fechaFin || undefined,
      tags: value.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      linksExternos: [],
      adjuntos: this.attachments(),
    };
    const pendingFiles = this.pendingAttachments().map((attachment) => attachment.file);
    const request = editingEvent
      ? this.editorEventosService.updateEvent(editingEvent.id, input, selectedImage, pendingFiles)
      : this.editorEventosService.createEvent(input, this.session.email, selectedImage!, pendingFiles);

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

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.attachmentError.set('Seleccioná una imagen JPG, PNG o WebP.');
      return;
    }
    if (!this.fitsTotalLimit(file.size, this.pendingAttachments().map((item) => item.file))) {
      this.attachmentError.set('La imagen y los PDF no pueden superar 4 MB en total.');
      return;
    }

    this.revokeImagePreview();
    const previewUrl = URL.createObjectURL(file);
    this.imageFile.set(file);
    this.imagePreviewUrl.set(previewUrl);
    this.imageFileName.set(file.name);
    this.eventForm.controls.imagenUrl.setValue(previewUrl);
    this.eventForm.controls.imagenUrl.markAsDirty();
    this.attachmentError.set('');
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
      this.attachmentError.set('La imagen y los PDF no pueden superar 4 MB en total.');
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

  protected hasError(controlName: string): boolean {
    const control = this.eventForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted());
  }

  protected errorMessage(controlName: string): string {
    const control = this.eventForm.get(controlName);

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
      fechaInicio: event.fechaInicio.slice(0, 16),
      fechaFin: event.fechaFin?.slice(0, 16) ?? '',
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
    this.attachments.set([]);
    this.pendingAttachments.set([]);
    this.eventForm.reset({ titulo: '', slug: '', categoria: '', descripcionCorta: '', descripcionLarga: '', fechaInicio: '', fechaFin: '', ubicacion: '', organizador: '', imagenUrl: '', destacado: true, modalidad: 'Presencial', precio: 'Entrada libre', tags: 'torneo, magistral, comunidad', estadoEditorial: 'published' });
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
}
