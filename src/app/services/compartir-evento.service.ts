import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CompartirEventoService {
  private readonly document = inject(DOCUMENT);

  urlEvento(slug: string): string {
    const origin = this.document.location?.origin ?? 'https://ajedrez-vm-frontend.vercel.app';
    return new URL(`/eventos/${encodeURIComponent(slug)}`, origin).toString();
  }

  copiar(url: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    return clipboard
      ? clipboard.writeText(url)
      : Promise.reject(new Error('El portapapeles no está disponible.'));
  }
}
