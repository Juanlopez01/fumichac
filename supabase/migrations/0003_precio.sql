-- Precio del servicio, en pesos. Opcional: los registros anteriores no lo tienen.

alter table public.certificados
  add column precio numeric(12, 2) check (precio >= 0);

alter table public.fumigaciones
  add column precio numeric(12, 2) check (precio >= 0);
