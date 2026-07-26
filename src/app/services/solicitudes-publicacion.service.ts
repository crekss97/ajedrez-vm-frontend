import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { OMITIR_CARGADOR_GLOBAL } from '../core/interceptors/app-loading.interceptor';
import {
  SolicitudPublicacion,
  SolicitudPublicacionInput,
} from '../models/solicitud-publicacion';

interface SolicitudPublicacionApi {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nombreTorneo: string;
  imagenUrl?: string;
  pdfUrl?: string;
  creadoEn?: string;
  fecha?: string;
  fechaSolicitud?: string;
  createdAt?: string;
}

const SOLICITUD_FILE_PATH_PATTERN = /^[1-9]\d*\/archivos\/(imagen|pdf)$/;

@Injectable({ providedIn: 'root' })
export class SolicitudesPublicacionService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${API_URL}/solicitudes-publicacion`;
  private readonly editorUrl = `${API_URL}/editor/solicitudes-publicacion`;

  createSolicitud(
    input: SolicitudPublicacionInput,
    image: File,
    pdf: File,
  ): Observable<void> {
    const formData = new FormData();
    formData.append('solicitud', JSON.stringify(input));
    formData.append('imagen', image, image.name);
    formData.append('pdf', pdf, pdf.name);

    return this.http.post<{ message: string }>(this.publicUrl, formData, {
      headers: new HttpHeaders({ 'Idempotency-Key': globalThis.crypto.randomUUID() }),
      context: new HttpContext().set(OMITIR_CARGADOR_GLOBAL, true),
    }).pipe(map(() => undefined));
  }

  getSolicitudes(): Observable<SolicitudPublicacion[]> {
    return this.http.get<SolicitudPublicacionApi[]>(this.editorUrl).pipe(
      map((solicitudes) => solicitudes.map((solicitud) => this.toSolicitud(solicitud))),
    );
  }

  private toSolicitud(solicitud: SolicitudPublicacionApi): SolicitudPublicacion {
    return {
      id: solicitud.id,
      nombre: solicitud.nombre,
      apellido: solicitud.apellido,
      email: solicitud.email,
      nombreTorneo: solicitud.nombreTorneo,
      creadoEn: solicitud.creadoEn
        ?? solicitud.fechaSolicitud
        ?? solicitud.fecha
        ?? solicitud.createdAt
        ?? '',
       imagenUrl: this.resolveSolicitudFileUrl(solicitud.imagenUrl),
       pdfUrl: this.resolveSolicitudFileUrl(solicitud.pdfUrl),
     };
   }

  private resolveSolicitudFileUrl(url: string | undefined): string {
    if (!url) {
      return '';
    }

    try {
      const apiBase = new URL(API_URL, window.location.origin);
      const apiPath = apiBase.pathname.replace(/\/+$/, '');
      const resolved = new URL(url, apiBase);
      const solicitudPrefix = `${apiPath}/editor/solicitudes-publicacion/`;
      const solicitudFilePath = resolved.pathname.startsWith(solicitudPrefix)
        ? resolved.pathname.slice(solicitudPrefix.length)
        : '';

      if (
        resolved.origin !== apiBase.origin
        || !SOLICITUD_FILE_PATH_PATTERN.test(solicitudFilePath)
        || resolved.search
        || resolved.hash
      ) {
        return '';
      }

      return resolved.toString();
    } catch {
      return '';
    }
  }
}
