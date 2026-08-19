-- Metas de lectura por año: reemplaza profiles.annual_goal (valor único, sin historial)
-- por una tabla con una fila por (usuario, año). Esto hace que el "reinicio" de la meta
-- cada 1 de enero sea algo natural (se consulta el año actual, no hay que resetear nada)
-- y de paso permite guardar un historial de metas/resultados por año.

create table reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  year int not null,
  goal int not null default 0,
  created_at timestamptz default now(),
  unique (user_id, year)
);

alter table reading_goals enable row level security;

create policy "dueño gestiona sus metas de lectura"
  on reading_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "visitante ve metas de lectura segun toggle del perfil"
  on reading_goals for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = reading_goals.user_id
      and profiles.show_annual_goal = true
    )
  );

-- Preserva la meta actual que cada usuario ya tenía configurada en profiles.annual_goal,
-- migrándola como la meta del año en curso (si ya tenía un valor mayor a 0).
insert into reading_goals (user_id, year, goal)
select id, extract(year from now())::int, annual_goal
from profiles
where annual_goal is not null and annual_goal > 0
on conflict (user_id, year) do nothing;

-- Actualiza get_public_profile_extras para leer la meta del año en curso desde
-- reading_goals en lugar de profiles.annual_goal.
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
          from books where user_id = target_user_id and status='terminado' and end_date is not null
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
        select count(*) from books
        where user_id = target_user_id and status = 'terminado'
        and end_date >= date_trunc('year', now())::date
        and end_date < (date_trunc('year', now()) + interval '1 year')::date
      )
    );
  end if;

  return result;
end;
$$;

grant execute on function public.get_public_profile_extras(uuid) to anon, authenticated;
