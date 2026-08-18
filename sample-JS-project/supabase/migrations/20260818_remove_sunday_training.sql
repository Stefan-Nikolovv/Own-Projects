begin;

create or replace function public.ensure_week_slots(p_week_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if extract(isodow from p_week_start) <> 1 then
    raise exception using errcode = '22023', message = 'WEEK_MUST_START_MONDAY';
  end if;

  if p_week_start < current_date - 7 or p_week_start > current_date + 182 then
    raise exception using errcode = '22023', message = 'WEEK_OUT_OF_RANGE';
  end if;

  insert into public.slots (
    day_key,
    day_name,
    time,
    capacity,
    booking_count,
    is_day_locked,
    is_slot_locked
  )
  values
    (p_week_start,     'Monday',    '17:00', 14, 0, false, false),
    (p_week_start,     'Monday',    '18:00', 14, 0, false, false),
    (p_week_start + 1, 'Tuesday',   '17:00', 14, 0, false, false),
    (p_week_start + 1, 'Tuesday',   '18:00', 14, 0, false, false),
    (p_week_start + 2, 'Wednesday', '17:00', 14, 0, false, false),
    (p_week_start + 2, 'Wednesday', '18:00', 14, 0, false, false),
    (p_week_start + 3, 'Thursday',  '17:00', 14, 0, false, false),
    (p_week_start + 3, 'Thursday',  '18:00', 14, 0, false, false),
    (p_week_start + 4, 'Friday',    '17:00', 14, 0, false, false),
    (p_week_start + 4, 'Friday',    '18:00', 14, 0, false, false),
    (p_week_start + 5, 'Saturday',  '10:00', 14, 0, false, false),
    (p_week_start + 5, 'Saturday',  '11:00', 14, 0, false, false),
    (p_week_start + 5, 'Saturday',  '12:00', 14, 0, false, false)
  on conflict (day_key, time) do nothing;

  update public.slots slot
  set is_day_locked = true
  where slot.day_key between p_week_start and p_week_start + 6
    and exists (
      select 1
      from public.slots locked_slot
      where locked_slot.day_key = slot.day_key
        and locked_slot.is_day_locked
    );
end;
$$;

revoke all on function public.ensure_week_slots(date) from public, anon, authenticated;
grant execute on function public.ensure_week_slots(date) to anon, authenticated;

delete from public.slots slot
where extract(isodow from slot.day_key) = 7
  and slot.time = '12:00'
  and not exists (
    select 1 from public.bookings booking where booking.slot_id = slot.id
  )
  and not exists (
    select 1 from public.waitlist waiting where waiting.slot_id = slot.id
  );

commit;
