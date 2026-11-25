-- Avances de lectura (V.4.6.0).
--
-- Las páginas y el tiempo escuchado de un mes o un año se contaban enteros en el mes en que se
-- terminaba el libro: si se leyó casi todo en noviembre y se terminó en diciembre, todo caía
-- en diciembre, y lo que iba a medias al cierre no contaba (Fiorella, 20 nov 2026).
--
-- Desde ahora, cada vez que se guarda el progreso (o se termina un libro) se anota cuánto se
-- avanzó ese día: páginas y segundos, con el formato de la lectura. Las cifras de un periodo
-- suman lo que se avanzó en él. Lo leído antes de esta tabla (o sin anotar) se reparte en
-- partes iguales entre la fecha de inicio y el primer avance anotado (o la fecha de fin).
--
-- La fecha la pone la app, en la hora local de la persona (como reading_sessions).

create table progress_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references books on delete cascade not null,
  logged_on date not null,
  pages integer not null default 0,
  seconds integer not null default 0,
  format text check (format in ('fisico', 'digital', 'audiolibro')),
  created_at timestamptz default now()
);

create index progress_log_user_id_idx on progress_log (user_id, logged_on);
create index progress_log_book_id_idx on progress_log (book_id);

alter table progress_log enable row level security;

create policy "dueño gestiona sus avances"
  on progress_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Cambios en vivo entre dispositivos (como las demás tablas, migración 0043).
drop trigger if exists live_change on public.progress_log;
create trigger live_change after insert or update or delete on public.progress_log
  for each statement execute function public.notify_live_change();
