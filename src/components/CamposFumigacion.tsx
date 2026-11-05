import { AreaTexto, Campo } from "@/components/ui";
import type { Fumigacion } from "@/lib/tipos";

export function CamposFumigacion({ fumigacion, hoy }: { fumigacion?: Fumigacion; hoy?: string }) {
  return (
    <>
      <Campo
        etiqueta="Fecha"
        name="fecha"
        type="date"
        defaultValue={fumigacion?.fecha ?? hoy}
        required
      />
      <Campo
        etiqueta="Veneno utilizado"
        name="veneno"
        defaultValue={fumigacion?.veneno ?? ""}
        required
      />
      <Campo
        etiqueta="Quiénes fueron"
        name="operarios"
        defaultValue={fumigacion?.operarios ?? ""}
        required
      />
      <AreaTexto
        etiqueta="Anotaciones"
        name="anotaciones"
        defaultValue={fumigacion?.anotaciones ?? ""}
      />
    </>
  );
}
