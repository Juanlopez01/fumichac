import { Suspense } from "react";
import { CargaGuiada } from "@/components/CargaGuiada";
import { Cargando, Titulo } from "@/components/ui";
import { hoyArgentina } from "@/lib/avisos/calcular";
import { listarLocales } from "@/lib/locales";

export default function Cargar() {
  return (
    <>
      <Titulo volver="/">Cargar fumigación</Titulo>
      <Suspense fallback={<Cargando />}>
        <Contenido />
      </Suspense>
    </>
  );
}

async function Contenido() {
  const locales = await listarLocales();
  return <CargaGuiada tipo="fumigacion" locales={locales} hoy={hoyArgentina()} />;
}
