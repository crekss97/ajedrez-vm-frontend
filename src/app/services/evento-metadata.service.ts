import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Evento } from '../models/evento';

const TITULO_PREDETERMINADO = 'Ajedrez VM';
const DESCRIPCION_PREDETERMINADA = 'Agenda de eventos y noticias de la comunidad de Ajedrez VM.';

@Injectable({ providedIn: 'root' })
export class EventoMetadataService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  actualizar(evento: Evento): void {
    const titulo = `${evento.titulo} | Ajedrez VM`;
    const url = this.urlEvento(evento.slug);
    const imagen = this.urlImagenSocial(evento);

    this.title.setTitle(titulo);
    this.actualizarDescripcion(evento.descripcionCorta);
    this.actualizarCanonical(url);
    this.actualizarMeta('property', 'og:type', 'article');
    this.actualizarMeta('property', 'og:site_name', TITULO_PREDETERMINADO);
    this.actualizarMeta('property', 'og:locale', 'es_AR');
    this.actualizarMeta('property', 'og:title', titulo);
    this.actualizarMeta('property', 'og:description', evento.descripcionCorta);
    this.actualizarMeta('property', 'og:url', url);
    this.actualizarMeta('property', 'og:image', imagen);
    this.actualizarMeta('property', 'og:image:width', '1200');
    this.actualizarMeta('property', 'og:image:height', '630');
    this.actualizarMeta('property', 'og:image:type', 'image/jpeg');
    this.actualizarMeta('property', 'og:image:alt', `Tarjeta de ${evento.titulo}`);
    this.actualizarMeta('name', 'twitter:card', 'summary_large_image');
    this.actualizarMeta('name', 'twitter:title', titulo);
    this.actualizarMeta('name', 'twitter:description', evento.descripcionCorta);
    this.actualizarMeta('name', 'twitter:image', imagen);
    this.actualizarMeta('name', 'twitter:image:alt', `Tarjeta de ${evento.titulo}`);
  }

  restablecerDetalle(): void {
    const url = new URL(
      '/',
      this.document.location?.origin ?? 'https://ajedrez-vm-frontend.vercel.app',
    ).toString();

    this.title.setTitle(TITULO_PREDETERMINADO);
    this.actualizarDescripcion(DESCRIPCION_PREDETERMINADA);
    this.actualizarCanonical(url);
    this.actualizarMeta('property', 'og:type', 'website');
    this.actualizarMeta('property', 'og:site_name', TITULO_PREDETERMINADO);
    this.actualizarMeta('property', 'og:locale', 'es_AR');
    this.actualizarMeta('property', 'og:title', TITULO_PREDETERMINADO);
    this.actualizarMeta('property', 'og:description', DESCRIPCION_PREDETERMINADA);
    this.actualizarMeta('property', 'og:url', url);
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:width"');
    this.meta.removeTag('property="og:image:height"');
    this.meta.removeTag('property="og:image:type"');
    this.meta.removeTag('property="og:image:alt"');
    this.actualizarMeta('name', 'twitter:card', 'summary');
    this.actualizarMeta('name', 'twitter:title', TITULO_PREDETERMINADO);
    this.actualizarMeta('name', 'twitter:description', DESCRIPCION_PREDETERMINADA);
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('name="twitter:image:alt"');
  }

  private urlEvento(slug: string): string {
    const origin = this.document.location?.origin ?? 'https://ajedrez-vm-frontend.vercel.app';
    return new URL(`/eventos/${encodeURIComponent(slug)}`, origin).toString();
  }

  private urlImagenSocial(evento: Evento): string {
    const url = new URL(
      `/api/social/events/${encodeURIComponent(evento.slug)}/image`,
      this.document.location?.origin ?? 'https://ajedrez-vm-frontend.vercel.app',
    );
    if (evento.actualizadoEn) url.searchParams.set('v', evento.actualizadoEn);
    return url.toString();
  }

  private actualizarDescripcion(contenido: string): void {
    this.actualizarMeta('name', 'description', contenido);
  }

  private actualizarMeta(atributo: 'name' | 'property', clave: string, content: string): void {
    this.meta.updateTag({ [atributo]: clave, content }, `${atributo}="${clave}"`);
  }

  private actualizarCanonical(href: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = href;
  }
}
