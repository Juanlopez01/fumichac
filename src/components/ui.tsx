import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { precioEditable } from "@/lib/precio";

export const claseBoton =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center bg-green-800 font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-60";

export const claseBotonSecundario =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center border border-zinc-300 font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800";

const claseEntrada =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-green-800 focus:ring-1 focus:ring-green-800 dark:border-zinc-700";

type PropsCampo = { etiqueta: string; ayuda?: string } & ComponentProps<"input">;

export function Campo({ etiqueta, ayuda, ...input }: PropsCampo) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      <input className={claseEntrada} {...input} />
      {ayuda && <span className="text-sm text-zinc-600 dark:text-zinc-400">{ayuda}</span>}
    </label>
  );
}

type PropsAreaTexto = { etiqueta: string } & ComponentProps<"textarea">;

export function AreaTexto({ etiqueta, ...textarea }: PropsAreaTexto) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      <textarea className={claseEntrada} rows={4} {...textarea} />
    </label>
  );
}

type PropsSelector = { etiqueta: string } & ComponentProps<"select">;

export function Selector({ etiqueta, children, ...select }: PropsSelector) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{etiqueta}</span>
      <select className={claseEntrada} {...select}>
        {children}
      </select>
    </label>
  );
}

export function Titulo({ children, volver }: { children: ReactNode; volver?: string }) {
  return (
    <header className="flex flex-col gap-1">
      {volver && (
        <Link href={volver} className="text-sm text-green-800 dark:text-green-400">
          ← Volver
        </Link>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
    </header>
  );
}

export function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      {children}
    </div>
  );
}

/** Dato con su etiqueta. Si no hay valor, no muestra nada. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <p>
      <span className="text-zinc-600 dark:text-zinc-400">{etiqueta}: </span>
      <span className="whitespace-pre-wrap">{children}</span>
    </p>
  );
}

/** Nombre y dirección del local, para que el formulario muestre a quién corresponde la carga. */
export function DatosDelLocal({
  nombre,
  direccion,
}: {
  nombre: string;
  direccion: string | null;
}) {
  return (
    <Tarjeta>
      <Dato etiqueta="Apellido y nombre / Razón social">{nombre}</Dato>
      <Dato etiqueta="Dirección">{direccion}</Dato>
    </Tarjeta>
  );
}

export function Cargando() {
  return <p className="text-zinc-600 dark:text-zinc-400">Cargando…</p>;
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="text-zinc-600 dark:text-zinc-400">{children}</p>;
}

const COLORES = {
  rojo: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  ambar: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  verde: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  gris: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export function Etiqueta({
  color,
  children,
}: {
  color: keyof typeof COLORES;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${COLORES[color]}`}>
      {children}
    </span>
  );
}

export function EtiquetaVencimiento({ dias }: { dias: number }) {
  if (dias < 0) {
    return <Etiqueta color="rojo">Vencido hace {-dias === 1 ? "1 día" : `${-dias} días`}</Etiqueta>;
  }
  if (dias === 0) return <Etiqueta color="rojo">Vence hoy</Etiqueta>;
  if (dias <= 30) {
    return <Etiqueta color="ambar">Vence en {dias === 1 ? "1 día" : `${dias} días`}</Etiqueta>;
  }
  return <Etiqueta color="verde">Vigente</Etiqueta>;
}

export function MensajeError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

export function CampoPrecio({ precio }: { precio?: number | null }) {
  return (
    <Campo
      etiqueta="Precio"
      ayuda="Opcional. Por ejemplo 15000 o 15.000,50."
      name="precio"
      inputMode="decimal"
      autoComplete="off"
      defaultValue={precioEditable(precio)}
    />
  );
}
