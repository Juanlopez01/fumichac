import Link from "next/link";
import { Suspense } from "react";
import { BuscadorLocales } from "@/components/BuscadorLocales";
import { Cargando, claseBoton, Titulo, Vacio } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { Local } from "@/lib/tipos";

const FILAS_POR_PEDIDO = 1000;

export default function Locales() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Titulo>Locales</Titulo>
        <Link href="/locales/nuevo" className={claseBoton}>
          Nuevo local
        </Link>
      </div>
      <Suspense fallback={<Cargando />}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  const supabase = await createClient();
  const locales: Local[] = [];

  // El buscador filtra en el navegador, así que tienen que llegar todos: Supabase corta en 1000 filas.
  for (let desde = 0; ; desde += FILAS_POR_PEDIDO) {
    const { data, error } = await supabase
      .from("locales")
      .select("id, nombre, direccion, rubro, telefono, frecuencia_dias")
      .order("nombre")
      .order("id")
      .range(desde, desde + FILAS_POR_PEDIDO - 1);
    if (error) throw error;

    locales.push(...(data as Local[]));
    if (data.length < FILAS_POR_PEDIDO) break;
  }

  if (locales.length === 0) return <Vacio>Todavía no hay locales cargados.</Vacio>;

  return <BuscadorLocales locales={locales} />;
}
