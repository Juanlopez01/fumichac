import { BotonSalir } from "@/components/BotonSalir";
import { ActivarAvisos } from "@/components/pwa/ActivarAvisos";
import { Titulo } from "@/components/ui";

export default function Ajustes() {
  return (
    <>
      <Titulo>Ajustes</Titulo>
      <ActivarAvisos />
      <BotonSalir />
    </>
  );
}
