const MAXIMO = 9_999_999_999.99;

/**
 * Lee un precio escrito a mano. Con coma, la coma es el decimal y los puntos son de miles ("1.500,50").
 * Sin coma, un punto seguido de exactamente tres dígitos es de miles ("15.000"); si no, es decimal ("15.5").
 * Devuelve null si está vacío y undefined si no se entiende.
 */
export function parsearPrecio(texto: string): number | null | undefined {
  let limpio = texto.replace(/[\s$]/g, "");
  if (limpio === "") return null;

  if (limpio.includes(",")) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    limpio = limpio.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return undefined;
  const valor = Number(limpio);
  return valor <= MAXIMO ? valor : undefined;
}

const formato = (decimales: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
const enteros = formato(0);
const conCentavos = formato(2);

/** Sin centavos si es un número redondo; si no, siempre con dos ("$ 1.500,50"). */
export function formatearPrecio(valor: number): string {
  return (Number.isInteger(valor) ? enteros : conCentavos).format(valor);
}

/** Para precargar un formulario: sin separador de miles y con coma decimal. */
export function precioEditable(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return (Number.isInteger(valor) ? String(valor) : valor.toFixed(2)).replace(".", ",");
}

export const ERROR_PRECIO = "El precio no se entiende. Escribilo como 15000 o 15.000,50.";
