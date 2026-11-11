"use client";

import { useSyncExternalStore } from "react";

const nadaQueEscuchar = () => () => {};

/**
 * False en el HTML del servidor y hasta que React toma la página; true después.
 * Sirve para deshabilitar los botones de envío mientras tanto: si no, el navegador manda
 * el formulario por su cuenta, sin pasar por la app.
 */
export function usePaginaLista(): boolean {
  return useSyncExternalStore(
    nadaQueEscuchar,
    () => true,
    () => false,
  );
}
