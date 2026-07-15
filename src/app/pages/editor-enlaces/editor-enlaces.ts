import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EditorLoading } from '../../components/editor-loading/editor-loading';
import { SidebarLink } from '../../models/sidebar-link';
import { SidebarLinksService } from '../../services/sidebar-links.service';

@Component({
  selector: 'app-editor-enlaces',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, EditorLoading],
  templateUrl: './editor-enlaces.html',
  styleUrl: './editor-enlaces.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorEnlaces {
  private readonly fb = inject(FormBuilder);
  private readonly sidebarLinksService = inject(SidebarLinksService);
  protected readonly sidebarLinks = signal<SidebarLink[]>([]);
  protected readonly editingLink = signal<SidebarLink | null>(null);
  protected readonly saveError = signal('');
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly linkForm = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
  });

  constructor() { this.loadLinks(); }

  protected saveLink(): void {
    if (this.linkForm.invalid) { this.linkForm.markAllAsTouched(); return; }
    const editingLink = this.editingLink();
    const request = editingLink
      ? this.sidebarLinksService.updateLink(editingLink.id, this.linkForm.getRawValue())
      : this.sidebarLinksService.createLink(this.linkForm.getRawValue());

    this.saveError.set('');
    request.subscribe({
      next: () => { this.resetForm(); this.loadLinks(); },
      error: () => this.saveError.set('No se pudo guardar el enlace. Intentá nuevamente.'),
    });
  }

  protected startEdit(link: SidebarLink): void {
    this.editingLink.set(link);
    this.linkForm.setValue({ titulo: link.titulo, url: link.url });
  }

  protected deleteLink(link: SidebarLink): void {
    if (!window.confirm(`¿Eliminar "${link.titulo}"?`)) {
      return;
    }

    this.sidebarLinksService.deleteLink(link.id).subscribe({
      next: () => {
        if (this.editingLink()?.id === link.id) {
          this.resetForm();
        }
        this.loadLinks();
      },
      error: () => this.saveError.set('No se pudo eliminar el enlace. Intentá nuevamente.'),
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  private loadLinks(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.sidebarLinksService.getLinks().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (links) => this.sidebarLinks.set(links),
      error: () => this.loadError.set('No se pudieron cargar los enlaces.'),
    });
  }

  private resetForm(): void {
    this.editingLink.set(null);
    this.linkForm.reset({ titulo: '', url: '' });
  }
}
