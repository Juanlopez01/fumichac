import { Navegacion } from "@/components/Navegacion";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-4 pb-24">
        {children}
      </main>
      <Navegacion />
    </>
  );
}
