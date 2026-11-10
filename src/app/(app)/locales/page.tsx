import Link from "next/link";
import { Suspense } from "react";
import { BuscadorLocales } from "@/components/BuscadorLocales";
import { Cargando, claseBoton, Titulo, Vacio } from "@/components/ui";
import { listarLocales } from "@/lib/locales";

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
  const locales = await listarLocales();
  if (locales.length === 0) return <Vacio>Todavía no hay locales cargados.</Vacio>;
  return <BuscadorLocales locales={locales} />;
}
