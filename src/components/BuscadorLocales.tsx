"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Campo, Tarjeta, Vacio } from "@/components/ui";
import { filtrarLocales } from "@/lib/buscar";
import type { Local } from "@/lib/tipos";

export function BuscadorLocales({ locales }: { locales: Local[] }) {
  const [busqueda, setBusqueda] = useState(useSearchParams().get("q") ?? "");
  const resultados = filtrarLocales(locales, busqueda);

  function buscar(valor: string) {
    setBusqueda(valor);
    // Queda en la URL para no perder la búsqueda al volver desde un local.
    const consulta = valor ? `?q=${encodeURIComponent(valor)}` : window.location.pathname;
    window.history.replaceState(null, "", consulta);
  }

  return (
    <>
      <Campo
        etiqueta="Buscar"
        type="search"
        placeholder="Nombre, dirección, rubro o teléfono"
        value={busqueda}
        onChange={(evento) => buscar(evento.target.value)}
      />
      {resultados.length === 0 && <Vacio>Ningún local coincide con la búsqueda.</Vacio>}
      {resultados.map((local) => (
        <Link key={local.id} href={`/locales/${local.id}`}>
          <Tarjeta>
            <span className="font-medium">{local.nombre}</span>
            {local.direccion && (
              <span className="text-zinc-600 dark:text-zinc-400">{local.direccion}</span>
            )}
          </Tarjeta>
        </Link>
      ))}
    </>
  );
}
