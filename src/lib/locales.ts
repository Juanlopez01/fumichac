import { createClient } from "@/lib/supabase/server";
import type { Local } from "@/lib/tipos";

const FILAS_POR_PEDIDO = 1000;

/** Todos los locales: la búsqueda y las coincidencias se calculan en el navegador. Supabase corta en 1000 filas. */
export async function listarLocales(): Promise<Local[]> {
  const supabase = await createClient();
  const locales: Local[] = [];

  for (let desde = 0; ; desde += FILAS_POR_PEDIDO) {
    const { data, error } = await supabase
      .from("locales")
      .select("id, nombre, direccion, rubro, telefono, frecuencia_dias")
      .order("nombre")
      .order("id")
      .range(desde, desde + FILAS_POR_PEDIDO - 1);
    if (error) throw error;

    locales.push(...(data as Local[]));
    if (data.length < FILAS_POR_PEDIDO) return locales;
  }
}
