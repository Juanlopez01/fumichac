"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/locales", texto: "Locales" },
  { href: "/ajustes", texto: "Ajustes" },
];

function Enlaces({ ruta }: { ruta?: string }) {
  return (
    <ul className="mx-auto flex max-w-lg">
      {ENLACES.map(({ href, texto }) => {
        const activo = href === "/" ? ruta === "/" : ruta?.startsWith(href);
        return (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={activo ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center font-medium ${
                activo ? "text-green-800 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {texto}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function EnlacesConRuta() {
  return <Enlaces ruta={usePathname()} />;
}

export function Navegacion() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-background pb-[env(safe-area-inset-bottom)] dark:border-zinc-800">
      <Suspense fallback={<Enlaces />}>
        <EnlacesConRuta />
      </Suspense>
    </nav>
  );
}
