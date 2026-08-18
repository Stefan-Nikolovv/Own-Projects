begin;

create or replace function public.search_my_schedule(p_contact text)
returns table(
  item_type text,
  name text,
  day_key date,
  "time" text,
  attendance text,
  queue_position integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_contact text := lower(btrim(coalesce(p_contact, '')));
  v_digits text := regexp_replace(coalesce(p_contact, ''), '[^0-9]', '', 'g');
  v_local_now timestamp := timezone('Europe/Sofia', now());
begin
  if char_length(v_contact) < 5 or char_length(v_contact) > 160 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  if position('@' in v_contact) = 0 and char_length(v_digits) < 7 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  return query
  with matching_results as (
    select
      'booking'::text as item_type,
      b.name,
      s.day_key,
      s.time as slot_time,
      b.attendance,
      null::integer as queue_position
    from public.bookings b
    join public.slots s
      on s.id = b.slot_id
     and s.time ~ '^[0-9]{2}:[0-9]{2}$'
    where (position('@' in v_contact) > 0 and lower(coalesce(b.email, '')) = v_contact)
       or (position('@' in v_contact) = 0
           and right(regexp_replace(coalesce(b.phone, ''), '[^0-9]', '', 'g'), 9)
               = right(v_digits, 9))

    union all

    select
      'waitlist'::text,
      w.name,
      s.day_key,
      s.time,
      'waiting'::text,
      (select count(*)::integer
       from public.waitlist q
       where q.slot_id = w.slot_id and q.created_at <= w.created_at)
    from public.waitlist w
    join public.slots s
      on s.id = w.slot_id
     and s.time ~ '^[0-9]{2}:[0-9]{2}$'
    where (position('@' in v_contact) > 0 and lower(coalesce(w.email, '')) = v_contact)
       or (position('@' in v_contact) = 0
           and right(regexp_replace(coalesce(w.phone, ''), '[^0-9]', '', 'g'), 9)
               = right(v_digits, 9))
  ),
  classified as (
    select
      result.*,
      result.day_key::timestamp + result.slot_time::time as starts_at,
      result.day_key::timestamp + result.slot_time::time < v_local_now as is_past
    from matching_results result
  ),
  ranked as (
    select
      result.*,
      row_number() over (
        partition by result.is_past
        order by
          case when not result.is_past then result.starts_at end asc,
          case when result.is_past then result.starts_at end desc
      ) as result_rank
    from classified result
  )
  select
    result.item_type,
    result.name,
    result.day_key,
    result.slot_time,
    result.attendance,
    result.queue_position
  from ranked result
  where result.result_rank <= 3
  order by
    result.is_past,
    case when not result.is_past then result.starts_at end asc,
    case when result.is_past then result.starts_at end desc;
end;
$$;

revoke all on function public.search_my_schedule(text) from public, anon, authenticated;
grant execute on function public.search_my_schedule(text) to anon, authenticated;

commit;
