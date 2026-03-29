export interface Evento {
  id: number;
  slug: string;
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
  modalidad: 'Presencial' | 'Online' | 'Hibrido';
  precio: string;
  tags: string[];
  views: number;
}
