"use client";

import { useState, useTransition, type ReactNode } from "react";
import { claseBotonSecundario, MensajeError } from "@/components/ui";
import type { EstadoForm } from "@/lib/tipos";

type Props = {
  accion: () => Promise<EstadoForm>;
  confirmacion?: string;
  children: ReactNode;
};

export function BotonAccion({ accion, confirmacion, children }: Props) {
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string>();

  function ejecutar() {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setError(undefined);
    iniciar(async () => {
      const resultado = await accion();
      setError(resultado?.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={ejecutar} disabled={enviando} className={claseBotonSecundario}>
        {children}
      </button>
      {error && <MensajeError>{error}</MensajeError>}
    </div>
  );
}
