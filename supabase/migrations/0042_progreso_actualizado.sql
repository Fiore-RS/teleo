-- Último libro actualizado (V.4.0.0).
--
-- En pantallas grandes, La mesa muestra abierto el libro en curso que se actualizó por última
-- vez (decidido por Fiorella, 12 nov 2026). books no guardaba cuándo cambió el progreso, así
-- que se suma progress_updated_at y un trigger que la pone al día sola: al cambiar la página,
-- el porcentaje o el tiempo escuchado, y al pasar un libro a "leyendo".
--
-- Los libros que ya están en curso arrancan con su fecha de inicio (o la de creación), así el
-- orden de hoy no cambia de golpe.

alter table books add column progress_updated_at timestamptz;

update books
set progress_updated_at = coalesce(start_date::timestamptz, created_at, now())
where status = 'leyendo';

create or replace function public.touch_book_progress()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'leyendo' and new.progress_updated_at is null then
      new.progress_updated_at := now();
    end if;
  elsif new.current_page is distinct from old.current_page
     or new.progress_percent is distinct from old.progress_percent
     or new.current_duration_seconds is distinct from old.current_duration_seconds
     or (new.status = 'leyendo' and old.status is distinct from 'leyendo') then
    new.progress_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger books_touch_progress
  before insert or update on books
  for each row execute function public.touch_book_progress();
