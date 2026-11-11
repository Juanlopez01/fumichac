"use client";

import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { claseBoton, MensajeError } from "@/components/ui";
import type { EstadoForm } from "@/lib/tipos";
import { usePaginaLista } from "@/lib/usePaginaLista";

type Props = {
  accion: (estado: EstadoForm, datos: FormData) => Promise<EstadoForm>;
  textoBoton: string;
  children: ReactNode;
};

export function Formulario({ accion, textoBoton, children }: Props) {
  const [estado, despachar, enviando] = useActionState(accion, {});
  const lista = usePaginaLista();

  // Se despacha a mano porque <form action> vacía los campos aunque el servidor devuelva error.
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => despachar(datos));
  }

  return (
    <form method="post" onSubmit={enviar} className="flex flex-col gap-4">
      {children}
      {estado.error && <MensajeError>{estado.error}</MensajeError>}
      <button type="submit" disabled={!lista || enviando} className={claseBoton}>
        {enviando ? "Enviando…" : textoBoton}
      </button>
    </form>
  );
}
