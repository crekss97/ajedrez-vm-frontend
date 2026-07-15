import { Evento, EventoAdjunto, EventoEstadoEditorial, EventoLinkExterno, EventoModalidad } from './evento';

export const MOCK_EDITOR_EMAIL = 'editor@ajedrezvm.com';
export const MOCK_EDITOR_PASSWORD = 'editor123';

export interface EditorCredentials {
  email: string;
  password: string;
}

export type EditorRole = 'editor';

export interface EditorSession {
  email: string;
  displayName: string;
  role: EditorRole;
}

export interface EventoEditorInput {
  slug?: string;
  titulo: string;
  categoria: string;
  descripcionCorta: string;
  descripcionLarga: string;
  fechaInicio: string;
  fechaFin?: string;
  ubicacion: string;
  organizador: string;
  imagenUrl: string;
  destacado: boolean;
  modalidad: EventoModalidad;
  precio: string;
  tags: string[];
  linksExternos: EventoLinkExterno[];
  adjuntos: EventoAdjunto[];
  estadoEditorial: EventoEstadoEditorial;
}

export interface EventoEditorDraft extends Evento {
  estadoEditorial: EventoEstadoEditorial;
  fuente: 'editor';
  creadoPor: string;
  actualizadoEn: string;
}
