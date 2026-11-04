"use client";

import { useEffect, useState } from "react";
import { claseBoton, claseBotonSecundario, MensajeError, Tarjeta } from "@/components/ui";
import { borrarSuscripcion, guardarSuscripcion } from "@/lib/acciones";

type Situacion = "cargando" | "no-soportado" | "instalar-ios" | "inactivo" | "activo" | "bloqueado";

function claveABytes(clave: string) {
  const base64 = (clave + "=".repeat((4 - (clave.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0));
}

async function detectar(): Promise<Situacion> {
  const instalada = window.matchMedia("(display-mode: standalone)").matches;
  const esIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (esIos && !instalada) return "instalar-ios";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";

  const registro = await navigator.serviceWorker.ready;
  return (await registro.pushManager.getSubscription()) ? "activo" : "inactivo";
}

/** Con `compacto`, solo aparece cuando todavía se pueden activar: es el aviso de la pantalla de inicio. */
export function ActivarAvisos({ compacto = false }: { compacto?: boolean }) {
  const [situacion, setSituacion] = useState<Situacion>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    detectar().then(setSituacion, () => setSituacion("no-soportado"));
  }, []);

  async function activar() {
    setOcupado(true);
    setError(undefined);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setSituacion(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveABytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const { endpoint, keys } = suscripcion.toJSON();
      const resultado = await guardarSuscripcion({
        endpoint: endpoint!,
        p256dh: keys!.p256dh,
        auth: keys!.auth,
      });

      if (resultado.error) {
        await suscripcion.unsubscribe();
        setError(resultado.error);
        return;
      }
      setSituacion("activo");
    } catch (e) {
      console.error("No se pudieron activar los avisos", e);
      setError("No se pudieron activar los avisos.");
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    setError(undefined);
    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        const resultado = await borrarSuscripcion(suscripcion.endpoint);
        if (resultado.error) {
          setError(resultado.error);
          return;
        }
        await suscripcion.unsubscribe();
      }
      setSituacion("inactivo");
    } finally {
      setOcupado(false);
    }
  }

  if (situacion === "cargando") return null;
  if (compacto && situacion !== "inactivo" && situacion !== "instalar-ios") return null;

  return (
    <Tarjeta>
      <h2 className="font-semibold">Avisos en este celular</h2>
      {situacion === "instalar-ios" && (
        <p>
          Para recibir avisos en iPhone, agregá la app a la pantalla de inicio: botón Compartir y
          después “Agregar a inicio”.
        </p>
      )}
      {situacion === "no-soportado" && <p>Este navegador no permite recibir avisos.</p>}
      {situacion === "bloqueado" && (
        <p>Los avisos están bloqueados. Habilitalos en los permisos del navegador para esta app.</p>
      )}
      {situacion === "inactivo" && (
        <>
          <p>Recibí una notificación cuando se acerque un vencimiento o toque fumigar.</p>
          <button type="button" onClick={activar} disabled={ocupado} className={claseBoton}>
            Activar avisos
          </button>
        </>
      )}
      {situacion === "activo" && (
        <>
          <p>Los avisos están activados.</p>
          <button
            type="button"
            onClick={desactivar}
            disabled={ocupado}
            className={claseBotonSecundario}
          >
            Desactivar avisos
          </button>
        </>
      )}
      {error && <MensajeError>{error}</MensajeError>}
    </Tarjeta>
  );
}
