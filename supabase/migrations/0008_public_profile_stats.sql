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
      'annualGoal', (select annual_goal from profiles where id = target_user_id),
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