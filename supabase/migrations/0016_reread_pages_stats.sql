-- "Páginas leídas" y "Tiempo escuchado" del perfil público ahora suman por CADA lectura
-- completada (una relectura vuelve a sumar las mismas páginas/duración), en vez de sumar una
-- sola vez por libro distinto — releer un libro sí cuenta como más páginas/tiempo leído en
-- la vida real de la persona, aunque siga siendo el mismo libro. "Libros terminados" se deja
-- IGUAL (sigue contando libros distintos con status='terminado'): un libro releído sigue
-- siendo un mismo libro terminado, no dos.

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
      'pagesRead', (
        select coalesce(sum(b.total_pages), 0)
        from reading_history rh
        join books b on b.id = rh.book_id
        where rh.user_id = target_user_id
      ),
      'audioSeconds', (
        select coalesce(sum(b.total_duration_seconds), 0)
        from reading_history rh
        join books b on b.id = rh.book_id
        where rh.user_id = target_user_id and b.format = 'audiolibro'
      ),
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
