import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CompartirEventoService {
  private readonly document = inject(DOCUMENT);

  urlEvento(slug: string, version?: string): string {
    const origin = this.document.location?.origin ?? 'https://ajedrezvm.com.ar';
    const url = new URL(`/eventos/${encodeURIComponent(slug)}`, origin);
    if (version) url.searchParams.set('v', version);
    return url.toString();
  }

  urlWhatsApp(slug: string, titulo: string, version?: string): string {
    const url = this.urlEvento(slug, version);
    return `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`;
  }

  urlFacebook(slug: string, version?: string): string {
    const url = this.urlEvento(slug, version);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  urlTwitter(slug: string, titulo: string, version?: string): string {
    const url = this.urlEvento(slug, version);
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`;
  }

  copiar(url: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    return clipboard
      ? clipboard.writeText(url)
      : Promise.reject(new Error('El portapapeles no está disponible.'));
  }
}
