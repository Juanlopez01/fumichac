// Calcula qué avisos corresponden en una fecha. Sin dependencias, para poder testearlo.
// Las fechas son strings YYYY-MM-DD, igual que las columnas `date` de la base.

export type CertificadoParaAviso = {
  id: string;
  local_id: string;
  local_nombre: string;
  vencimiento: string;
};

export type LocalParaAviso = {
  id: string;
  nombre: string;
  frecuencia_dias: number | null;
  ultima_fumigacion: string | null;
};

export type Aviso = {
  clave: string;
  tipo: "certificado" | "fumigacion";
  local_id: string;
  certificado_id: string | null;
  titulo: string;
  cuerpo: string;
  url: string;
};

/** Días antes del vencimiento en los que se avisa, de menor a mayor. */
const UMBRALES_VENCIMIENTO = [0, 7, 15, 30];

/** Días hacia atrás que se siguen mirando certificados ya vencidos. */
export const DIAS_MAXIMOS_VENCIDO = 30;

const MS_POR_DIA = 86_400_000;

export function hoyArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(ahora);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / MS_POR_DIA);
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(fecha) + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function plural(dias: number): string {
  return dias === 1 ? "1 día" : `${dias} días`;
}

function avisoDeCertificado(c: CertificadoParaAviso, hoy: string): Aviso | null {
  const dias = diasEntre(hoy, c.vencimiento);
  const fecha = formatearFecha(c.vencimiento);

  // Solo el umbral más cercano: un certificado cargado a 5 días del vencimiento avisa una vez.
  let etapa: string;
  let titulo: string;
  if (dias < 0) {
    if (-dias > DIAS_MAXIMOS_VENCIDO) return null;
    etapa = "vencido";
    titulo = `Certificado vencido: ${c.local_nombre}`;
  } else {
    const umbral = UMBRALES_VENCIMIENTO.find((u) => dias <= u);
    if (umbral === undefined) return null;
    etapa = String(umbral);
    titulo =
      dias === 0
        ? `Certificado vence hoy: ${c.local_nombre}`
        : `Certificado vence en ${plural(dias)}: ${c.local_nombre}`;
  }

  return {
    // Incluye el vencimiento: si se corrige la fecha, los avisos vuelven a salir.
    clave: `certificado:${c.id}:${c.vencimiento}:${etapa}`,
    tipo: "certificado",
    local_id: c.local_id,
    certificado_id: c.id,
    titulo,
    cuerpo: `Fecha de vencimiento: ${fecha}`,
    url: `/locales/${c.local_id}`,
  };
}

function avisoDeFumigacion(l: LocalParaAviso, hoy: string): Aviso | null {
  if (l.frecuencia_dias === null || l.ultima_fumigacion === null) return null;

  const dias = diasEntre(l.ultima_fumigacion, hoy);
  if (dias < l.frecuencia_dias) return null;

  return {
    // Se avisa una vez por cada última fumigación; una fumigación nueva reinicia el ciclo.
    clave: `fumigacion:${l.id}:${l.ultima_fumigacion}`,
    tipo: "fumigacion",
    local_id: l.id,
    certificado_id: null,
    titulo: `Toca fumigar: ${l.nombre}`,
    cuerpo: `Pasaron ${plural(dias)} desde la última fumigación (${formatearFecha(l.ultima_fumigacion)})`,
    url: `/locales/${l.id}`,
  };
}

export function calcularAvisos(
  hoy: string,
  certificados: CertificadoParaAviso[],
  locales: LocalParaAviso[],
): Aviso[] {
  return [
    ...certificados.map((c) => avisoDeCertificado(c, hoy)),
    ...locales.map((l) => avisoDeFumigacion(l, hoy)),
  ].filter((a) => a !== null);
}
