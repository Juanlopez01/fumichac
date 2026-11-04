import Link from "next/link";
import { Suspense } from "react";
import { Cargando, claseBoton, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { Local } from "@/lib/tipos";

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
  const { data, error } = await supabase
    .from("locales")
    .select("id, nombre, direccion, frecuencia_dias")
    .order("nombre");
  if (error) throw error;

  if (data.length === 0) return <Vacio>Todavía no hay locales cargados.</Vacio>;

  return (data as Local[]).map((local) => (
    <Link key={local.id} href={`/locales/${local.id}`}>
      <Tarjeta>
        <span className="font-medium">{local.nombre}</span>
        {local.direccion && (
          <span className="text-zinc-600 dark:text-zinc-400">{local.direccion}</span>
        )}
      </Tarjeta>
    </Link>
  ));
}
