type LocalBuscable = {
  nombre: string;
  direccion: string | null;
  rubro: string | null;
  telefono: string | null;
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Cada palabra buscada tiene que aparecer en algún dato del local, sin importar acentos ni el orden. */
export function filtrarLocales<T extends LocalBuscable>(locales: T[], busqueda: string): T[] {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return locales;

  return locales.filter((local) => {
    const texto = normalizar(
      [local.nombre, local.direccion, local.rubro, local.telefono].filter(Boolean).join(" "),
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });
}

type LocalComparable = { nombre: string; direccion: string | null };

function palabrasDe(texto: string): string[] {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function contieneSeguidas(largo: string[], corto: string[]): boolean {
  for (let i = 0; i + corto.length <= largo.length; i++) {
    if (corto.every((palabra, j) => largo[i + j] === palabra)) return true;
  }
  return false;
}

/**
 * Parecidos si, sin acentos ni signos, uno contiene al otro palabra por palabra:
 * "Av. San Martín 123" y "san martin 123" sí; "San Martín 123" y "San Martín 1234" no.
 * Los textos muy cortos tienen que coincidir enteros, para no sugerir cualquier cosa.
 */
function parecidos(a: string, b: string): boolean {
  const pa = palabrasDe(a);
  const pb = palabrasDe(b);
  if (pa.length === 0 || pb.length === 0) return false;

  const [corto, largo] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  if (corto.join("").length < 4) return pa.join(" ") === pb.join(" ");
  return contieneSeguidas(largo, corto);
}

/** Locales ya guardados con un nombre o una dirección parecidos a los que se están cargando. */
export function buscarCoincidencias<T extends LocalComparable>(
  locales: T[],
  cargado: { nombre: string; direccion: string },
): T[] {
  return locales.filter(
    (local) =>
      parecidos(local.nombre, cargado.nombre) ||
      (local.direccion !== null && parecidos(local.direccion, cargado.direccion)),
  );
}
