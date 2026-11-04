"use client";

import { useTransition } from "react";
import { claseBotonSecundario } from "@/components/ui";
import { borrarSuscripcion, cerrarSesion } from "@/lib/acciones";

export function BotonSalir() {
  const [saliendo, iniciar] = useTransition();

  function salir() {
    iniciar(async () => {
      // Quien cierra sesión deja de recibir avisos en este celular.
      try {
        const registro = await navigator.serviceWorker?.getRegistration();
        const suscripcion = await registro?.pushManager.getSubscription();
        if (suscripcion) {
          await borrarSuscripcion(suscripcion.endpoint);
          await suscripcion.unsubscribe();
        }
      } catch (e) {
        console.error("No se pudo dar de baja la suscripción", e);
      }
      await cerrarSesion();
    });
  }

  return (
    <button type="button" onClick={salir} disabled={saliendo} className={claseBotonSecundario}>
      Cerrar sesión
    </button>
  );
}
