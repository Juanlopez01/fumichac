import { Campo } from "@/components/ui";
import type { Local } from "@/lib/tipos";

export function CamposLocal({ local }: { local?: Local }) {
  return (
    <>
      <Campo
        etiqueta="Apellido y nombre / Razón social"
        name="nombre"
        defaultValue={local?.nombre}
        required
      />
      <Campo etiqueta="Dirección" name="direccion" defaultValue={local?.direccion ?? ""} />
      <Campo etiqueta="Rubro" name="rubro" defaultValue={local?.rubro ?? ""} />
      <Campo
        etiqueta="Teléfono"
        name="telefono"
        type="tel"
        autoComplete="off"
        defaultValue={local?.telefono ?? ""}
      />
      <Campo
        etiqueta="Avisar cada (días)"
        ayuda="Días desde la última fumigación hasta avisar. Vacío: no avisa."
        name="frecuencia_dias"
        type="number"
        inputMode="numeric"
        min={1}
        defaultValue={local ? (local.frecuencia_dias ?? "") : 30}
      />
    </>
  );
}
