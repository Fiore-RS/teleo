-- Bitácora > Resumen > Favoritos (fase 6): el libro favorito de cada mes y el del año.
--
-- Una fila por usuaria, año y mes:
--   - month 1 a 12: favorito de ese mes.
--   - month nulo: favorito del año (se elige entre los favoritos de los meses).
--   - book_id nulo: se eligió "dejar vacío" a propósito (distinto de no haber elegido,
--     que es simplemente no tener fila).
-- Si se borra el libro, se borra su fila y ese mes vuelve a quedar sin elegir.

create table period_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  year int not null check (year between 1900 and 2200),
  month int check (month between 1 and 12),
  book_id uuid references books on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- "nulls not distinct": solo puede haber un favorito del año (month nulo) por año.
  constraint period_favorites_unique unique nulls not distinct (user_id, year, month)
);

create index period_favorites_user_year_idx on period_favorites (user_id, year);

alter table period_favorites enable row level security;

create policy "dueña gestiona sus favoritos por periodo"
  on period_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
