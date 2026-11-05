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
