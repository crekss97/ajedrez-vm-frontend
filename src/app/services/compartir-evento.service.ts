import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CompartirEventoService {
  private readonly document = inject(DOCUMENT);

  urlEvento(slug: string): string {
    const origin = this.document.location?.origin ?? 'https://ajedrez-vm-frontend.vercel.app';
    return new URL(`/eventos/${encodeURIComponent(slug)}`, origin).toString();
  }

  urlWhatsApp(slug: string, titulo: string): string {
    const url = this.urlEvento(slug);
    return `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`;
  }

  urlFacebook(slug: string): string {
    const url = this.urlEvento(slug);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  urlTwitter(slug: string, titulo: string): string {
    const url = this.urlEvento(slug);
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`;
  }

  copiar(url: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    return clipboard
      ? clipboard.writeText(url)
      : Promise.reject(new Error('El portapapeles no está disponible.'));
  }
}
