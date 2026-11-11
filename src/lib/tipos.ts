export type EstadoForm = { error?: string };

export type Local = {
  id: string;
  nombre: string;
  direccion: string | null;
  rubro: string | null;
  telefono: string | null;
  frecuencia_dias: number | null;
};

export type Fumigacion = {
  id: string;
  fecha: string;
  veneno: string | null;
  precio: number | null;
  operarios: string | null;
  anotaciones: string | null;
};

export type Certificado = {
  id: string;
  local_id: string;
  fumigacion_id: string | null;
  fecha: string;
  vencimiento: string;
  realizado_por: string | null;
  precio: number | null;
  archivo_path: string | null;
  archivado: boolean;
};

export type AvisoGuardado = {
  id: string;
  titulo: string;
  cuerpo: string;
  url: string;
  created_at: string;
};
