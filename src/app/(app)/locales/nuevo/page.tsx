import { CamposLocal } from "@/components/CamposLocal";
import { Formulario } from "@/components/Formulario";
import { Titulo } from "@/components/ui";
import { crearLocal } from "@/lib/acciones";

export default function NuevoLocal() {
  return (
    <>
      <Titulo volver="/locales">Nuevo local</Titulo>
      <Formulario accion={crearLocal} textoBoton="Guardar local">
        <CamposLocal />
      </Formulario>
    </>
  );
}
