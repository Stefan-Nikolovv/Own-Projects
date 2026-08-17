begin;

alter table public.slots
  add column if not exists is_slot_locked boolean not null default false;

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
    (p_week_start + 5, 'Saturday',  '12:00', 14, 0, false, false),
    (p_week_start + 6, 'Sunday',    '12:00', 14, 0, false, false)
  on conflict (day_key, time) do nothing;

  -- A newly added hour inherits an existing whole-day lock.
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

create or replace function public.book_slot(
  p_slot_id uuid,
  p_name text,
  p_phone text default null
)
returns table(id uuid, name text, phone text, booking_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.slots%rowtype;
  v_booking public.bookings%rowtype;
  v_name text := btrim(p_name);
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_local_now timestamp := timezone('Europe/Sofia', now());
begin
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception using errcode = '22023', message = 'INVALID_NAME';
  end if;

  if v_phone is not null and char_length(v_phone) > 30 then
    raise exception using errcode = '22023', message = 'INVALID_PHONE';
  end if;

  select * into v_slot
  from public.slots
  where slots.id = p_slot_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'SLOT_NOT_FOUND';
  end if;

  if v_slot.day_key < v_local_now::date
     or (
       v_slot.day_key = v_local_now::date
       and v_slot.time::time <= v_local_now::time
     ) then
    raise exception using errcode = 'P0001', message = 'SLOT_IN_PAST';
  end if;

  if v_slot.is_day_locked then
    raise exception using errcode = 'P0001', message = 'DAY_LOCKED';
  end if;

  if v_slot.is_slot_locked then
    raise exception using errcode = 'P0001', message = 'SLOT_LOCKED';
  end if;

  if v_slot.booking_count >= v_slot.capacity then
    raise exception using errcode = 'P0001', message = 'SLOT_FULL';
  end if;

  begin
    insert into public.bookings (slot_id, name, phone)
    values (p_slot_id, v_name, v_phone)
    returning * into v_booking;
  exception when unique_violation then
    raise exception using errcode = '23505', message = 'DUPLICATE_BOOKING';
  end;

  return query
  select
    v_booking.id,
    v_booking.name,
    case when public.is_app_admin() then v_booking.phone else null end,
    v_slot.booking_count + 1;
end;
$$;

revoke all on function public.book_slot(uuid, text, text) from public, anon, authenticated;
grant execute on function public.book_slot(uuid, text, text) to anon, authenticated;

create or replace function public.book_slot_v2(
  p_slot_id uuid,
  p_name text,
  p_phone text default null,
  p_email text default null,
  p_recurring_weeks integer default 1
)
returns table(
  id uuid,
  name text,
  phone text,
  email text,
  access_token uuid,
  booking_count integer,
  booked_slots jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.slots%rowtype;
  v_slot public.slots%rowtype;
  v_booking public.bookings%rowtype;
  v_name text := btrim(p_name);
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_weeks integer := greatest(1, least(coalesce(p_recurring_weeks, 1), 6));
  v_local_now timestamp := timezone('Europe/Sofia', now());
  v_target_date date;
  v_created jsonb := '[]'::jsonb;
  v_first public.bookings%rowtype;
  v_first_count integer := 0;
  v_index integer;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception using errcode = '22023', message = 'INVALID_NAME';
  end if;
  if v_phone is not null and char_length(v_phone) > 30 then
    raise exception using errcode = '22023', message = 'INVALID_PHONE';
  end if;
  if v_email is not null and (char_length(v_email) > 160 or position('@' in v_email) < 2) then
    raise exception using errcode = '22023', message = 'INVALID_EMAIL';
  end if;

  select * into v_source from public.slots where slots.id = p_slot_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'SLOT_NOT_FOUND';
  end if;

  for v_index in 0..(v_weeks - 1) loop
    v_target_date := v_source.day_key + (v_index * 7);
    perform public.ensure_week_slots(
      v_target_date - ((extract(isodow from v_target_date)::integer - 1))
    );

    select * into v_slot
    from public.slots
    where day_key = v_target_date and time = v_source.time
    for update;

    if not found then
      continue;
    end if;

    if (v_slot.day_key::timestamp + v_slot.time::time)
       <= v_local_now + interval '2 hours' then
      if v_index = 0 then
        raise exception using errcode = 'P0001', message = 'BOOKING_CUTOFF';
      end if;
      continue;
    end if;

    if v_slot.is_day_locked then
      if v_index = 0 then
        raise exception using errcode = 'P0001', message = 'DAY_LOCKED';
      end if;
      continue;
    end if;

    if v_slot.is_slot_locked then
      if v_index = 0 then
        raise exception using errcode = 'P0001', message = 'SLOT_LOCKED';
      end if;
      continue;
    end if;

    if v_slot.booking_count >= v_slot.capacity then
      if v_index = 0 then
        raise exception using errcode = 'P0001', message = 'SLOT_FULL';
      end if;
      continue;
    end if;

    begin
      insert into public.bookings (slot_id, name, phone, email)
      values (v_slot.id, v_name, v_phone, v_email)
      returning * into v_booking;
    exception when unique_violation then
      if v_index = 0 then
        raise exception using errcode = '23505', message = 'DUPLICATE_BOOKING';
      end if;
      continue;
    end;

    if v_index = 0 then
      v_first := v_booking;
      v_first_count := v_slot.booking_count + 1;
    end if;

    v_created := v_created || jsonb_build_array(jsonb_build_object(
      'id', v_booking.id,
      'access_token', v_booking.access_token,
      'day_key', v_slot.day_key,
      'time', v_slot.time
    ));
  end loop;

  return query select
    v_first.id,
    v_first.name,
    case when public.is_app_admin() then v_first.phone else null end,
    case when public.is_app_admin() then v_first.email else null end,
    v_first.access_token,
    v_first_count,
    v_created;
end;
$$;

revoke all on function public.book_slot_v2(uuid, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.book_slot_v2(uuid, text, text, text, integer) to anon, authenticated;

create or replace function public.join_slot_waitlist(
  p_slot_id uuid,
  p_name text,
  p_phone text default null,
  p_email text default null
)
returns table(id uuid, access_token uuid, "position" integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.slots%rowtype;
  v_item public.waitlist%rowtype;
begin
  select * into v_slot from public.slots where slots.id = p_slot_id for update;
  if not found then raise exception using message = 'SLOT_NOT_FOUND'; end if;
  if v_slot.is_day_locked then raise exception using message = 'DAY_LOCKED'; end if;
  if v_slot.is_slot_locked then raise exception using message = 'SLOT_LOCKED'; end if;
  if v_slot.booking_count < v_slot.capacity then
    raise exception using message = 'SPOT_AVAILABLE';
  end if;

  insert into public.waitlist (slot_id, name, phone, email)
  values (
    p_slot_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_email, '')), '')
  ) returning * into v_item;

  return query select
    v_item.id,
    v_item.access_token,
    (select count(*)::integer from public.waitlist w
     where w.slot_id = p_slot_id and w.created_at <= v_item.created_at);
exception when unique_violation then
  raise exception using errcode = '23505', message = 'ALREADY_WAITING';
end;
$$;

revoke all on function public.join_slot_waitlist(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.join_slot_waitlist(uuid, text, text, text) to anon, authenticated;

create or replace function public.promote_slot_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next public.waitlist%rowtype;
  v_slot public.slots%rowtype;
begin
  select * into v_slot from public.slots where id = old.slot_id for update;
  if v_slot.is_day_locked or v_slot.is_slot_locked then
    return old;
  end if;
  if (select count(*) from public.bookings where slot_id = old.slot_id) >= v_slot.capacity then
    return old;
  end if;

  select * into v_next from public.waitlist
  where slot_id = old.slot_id order by created_at for update skip locked limit 1;

  if found then
    insert into public.bookings (slot_id, name, phone, email, access_token)
    values (v_next.slot_id, v_next.name, v_next.phone, v_next.email, v_next.access_token);
    delete from public.waitlist where id = v_next.id;
  end if;
  return old;
end;
$$;

revoke all on function public.promote_slot_waitlist() from public, anon, authenticated;

create or replace function public.manage_my_schedule_item(
  p_item_type text,
  p_item_id uuid,
  p_access_token uuid,
  p_action text,
  p_target_slot_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.slots%rowtype;
  v_local_now timestamp := timezone('Europe/Sofia', now());
begin
  if p_item_type = 'waitlist' and p_action = 'cancel' then
    delete from public.waitlist
    where id = p_item_id and access_token = p_access_token;
    if not found then raise exception using message = 'ACCESS_DENIED'; end if;
    return;
  end if;

  if p_item_type <> 'booking' then raise exception using message = 'INVALID_ITEM'; end if;

  if p_action = 'cancel' then
    delete from public.bookings
    where id = p_item_id and access_token = p_access_token
      and exists (
        select 1 from public.slots s where s.id = bookings.slot_id
        and (s.day_key::timestamp + s.time::time) > v_local_now + interval '2 hours'
      );
    if not found then raise exception using message = 'CUTOFF_OR_ACCESS_DENIED'; end if;
    return;
  end if;

  if p_action = 'move' then
    select * into v_target from public.slots where id = p_target_slot_id for update;
    if not found or v_target.is_day_locked or v_target.is_slot_locked
       or v_target.booking_count >= v_target.capacity
       or (v_target.day_key::timestamp + v_target.time::time) <= v_local_now + interval '2 hours' then
      raise exception using message = 'TARGET_UNAVAILABLE';
    end if;
    update public.bookings set slot_id = v_target.id
    where id = p_item_id and access_token = p_access_token
      and exists (
        select 1 from public.slots source where source.id = bookings.slot_id
        and (source.day_key::timestamp + source.time::time) > v_local_now + interval '2 hours'
      );
    if not found then raise exception using message = 'ACCESS_DENIED'; end if;
    return;
  end if;

  raise exception using message = 'INVALID_ACTION';
end;
$$;

revoke all on function public.manage_my_schedule_item(text, uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.manage_my_schedule_item(text, uuid, uuid, text, uuid) to anon, authenticated;

create or replace function public.set_slot_lock(p_slot_id uuid, p_locked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  update public.slots
  set is_slot_locked = p_locked
  where id = p_slot_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'SLOT_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.set_slot_lock(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_slot_lock(uuid, boolean) to authenticated;

-- Add the expanded timetable to the current and future booking window.
do $$
declare
  v_week_start date;
  v_current_monday date := current_date - (extract(isodow from current_date)::integer - 1);
begin
  for v_week_start in
    select generate_series(
      v_current_monday::timestamp,
      (v_current_monday + 182)::timestamp,
      interval '7 days'
    )::date
  loop
    perform public.ensure_week_slots(v_week_start);
  end loop;
end;
$$;

commit;
