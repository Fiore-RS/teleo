-- Historial de lecturas completas: permite "releer" un libro sin perder el registro de
-- cuándo se terminó la primera vez. Antes, releer un libro significaba volver a poner
-- start_date/end_date en la MISMA fila de `books`, así que la fecha original se perdía y
-- la relectura no sumaba nada en "Mis años en libros" ni en la meta anual del año en que se
-- termina de releer (seguía contando solo para el año de la última fecha guardada).
--
-- A partir de ahora, cada vez que un libro pasa a "terminado" (la primera vez o cualquier
-- relectura) se agrega una fila acá. `books.status/start_date/end_date` siguen reflejando
-- el ciclo de lectura ACTUAL; este historial es la fuente de verdad para "¿cuántos libros
-- terminé en el año X?" (incluyendo relecturas) y para "¿cuántas veces he leído este libro?"
-- (contando las filas de este libro).

create table reading_history (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  start_date date,
  end_date date not null,
  created_at timestamptz default now()
);

create index reading_history_user_id_idx on reading_history (user_id);
create index reading_history_book_id_idx on reading_history (book_id);

alter table reading_history enable row level security;

create policy "dueño gestiona su historial de lecturas"
  on reading_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "visitante ve historial de lecturas segun toggle del perfil"
  on reading_history for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = reading_history.user_id
      and profiles.show_years_in_books = true
    )
  );

-- Backfill: cada libro que ya está marcado como "terminado" tiene registrada su lectura
-- completa (la única que existe hasta ahora) con las fechas que ya tenía guardadas.
insert into reading_history (book_id, user_id, start_date, end_date)
select id, user_id, start_date, end_date
from books
where status = 'terminado' and end_date is not null;

-- "Mis años en libros" del perfil público ahora se calcula desde reading_history en vez de
-- books.end_date, para que las relecturas sumen en el año en que se completaron.
create or replace function public.get_public_profile_extras(target_user_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  result jsonb := '{}'::jsonb;
  v_show_stats boolean;
  v_show_years boolean;
  v_show_streak boolean;
  v_show_goal boolean;
begin
  select show_stats, show_years_in_books, show_daily_streak, show_annual_goal
  into v_show_stats, v_show_years, v_show_streak, v_show_goal
  from profiles where id = target_user_id;

  if v_show_stats then
    result := result || jsonb_build_object(
      'pagesRead', (select coalesce(sum(total_pages),0) from books where user_id = target_user_id and status='terminado'),
      'audioSeconds', (select coalesce(sum(total_duration_seconds),0) from books where user_id = target_user_id and status='terminado' and format='audiolibro'),
      'finishedCount', (select count(*) from books where user_id = target_user_id and status='terminado'),
      'readingCount', (select count(*) from books where user_id = target_user_id and status='leyendo'),
      'wishlistCount', (select count(*) from books where user_id = target_user_id and status='deseado'),
      'abandonedCount', (select count(*) from books where user_id = target_user_id and status='abandonado'),
      'sagaCount', (select count(*) from sagas where user_id = target_user_id),
      'reviewCount', (select count(*) from reviews where user_id = target_user_id)
    );
  end if;

  if v_show_years then
    result := result || jsonb_build_object(
      'yearsBreakdown', (
        select coalesce(jsonb_agg(jsonb_build_object('year', yr, 'count', cnt) order by yr desc), '[]'::jsonb)
        from (
          select extract(year from end_date)::int as yr, count(*) as cnt
          from reading_history where user_id = target_user_id
          group by yr
        ) t
      )
    );
  end if;

  if v_show_streak then
    result := result || jsonb_build_object(
      'longestStreak', (
        select coalesce(max(streak_len), 0) from (
          select count(*) as streak_len from (
            select session_date, session_date - (row_number() over (order by session_date))::int as grp
            from reading_sessions where user_id = target_user_id
          ) g group by grp
        ) s
      )
    );
  end if;

  if v_show_goal then
    result := result || jsonb_build_object(
      'annualGoal', (
        select goal from reading_goals
        where user_id = target_user_id and year = extract(year from now())::int
      ),
      'annualFinishedCount', (
        select count(*) from reading_history
        where user_id = target_user_id
        and end_date >= date_trunc('year', now())::date
        and end_date < (date_trunc('year', now()) + interval '1 year')::date
      )
    );
  end if;

  return result;
end;
$$;

grant execute on function public.get_public_profile_extras(uuid) to anon, authenticated;
