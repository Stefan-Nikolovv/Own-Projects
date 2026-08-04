begin;

alter table public.bookings
  add column if not exists email text,
  add column if not exists access_token uuid not null default gen_random_uuid(),
  add column if not exists attendance text not null default 'pending';

alter table public.bookings drop constraint if exists bookings_attendance_check;
alter table public.bookings add constraint bookings_attendance_check
check (attendance in ('pending', 'present', 'absent', 'cancelled'));

create unique index if not exists bookings_access_token_unique
on public.bookings (access_token);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (slot_id, access_token)
);

create unique index if not exists waitlist_slot_name_unique
on public.waitlist (slot_id, lower(name));

alter table public.waitlist enable row level security;

drop policy if exists "Admins read waitlist" on public.waitlist;
create policy "Admins read waitlist"
on public.waitlist for select to authenticated
using (public.is_app_admin());

drop policy if exists "Admins manage waitlist" on public.waitlist;
create policy "Admins manage waitlist"
on public.waitlist for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop function if exists public.get_slot_bookings(uuid);
create function public.get_slot_bookings(p_slot_id uuid)
returns table(
  id uuid,
  name text,
  phone text,
  email text,
  attendance text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.name,
    case when public.is_app_admin() then b.phone else null end,
    case when public.is_app_admin() then b.email else null end,
    case when public.is_app_admin() then b.attendance else null end,
    b.created_at
  from public.bookings b
  where b.slot_id = p_slot_id
  order by b.created_at;
$$;

revoke all on function public.get_slot_bookings(uuid) from public, anon, authenticated;
grant execute on function public.get_slot_bookings(uuid) to anon, authenticated;

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

drop trigger if exists promote_waitlist_after_booking_delete on public.bookings;
create trigger promote_waitlist_after_booking_delete
after delete on public.bookings
for each row execute function public.promote_slot_waitlist();

create or replace function public.get_my_schedule(p_access jsonb)
returns table(
  item_type text,
  item_id uuid,
  access_token uuid,
  name text,
  phone text,
  email text,
  day_key date,
  "time" text,
  attendance text,
  queue_position integer
)
language sql
stable
security definer
set search_path = public
as $$
  with access as (
    select
      nullif(item->>'id', '')::uuid as id,
      nullif(item->>'token', '')::uuid as token
    from jsonb_array_elements(coalesce(p_access, '[]'::jsonb)) item
  )
  select 'booking', b.id, b.access_token, b.name, b.phone, b.email,
         s.day_key, s.time, b.attendance, null::integer
  from access a
  join public.bookings b on b.access_token = a.token
  join public.slots s on s.id = b.slot_id
  union all
  select 'waitlist', w.id, w.access_token, w.name, w.phone, w.email,
         s.day_key, s.time, 'waiting',
         (select count(*)::integer from public.waitlist q
          where q.slot_id = w.slot_id and q.created_at <= w.created_at)
  from access a
  join public.waitlist w on w.access_token = a.token
  join public.slots s on s.id = w.slot_id
  order by day_key, time;
$$;

revoke all on function public.get_my_schedule(jsonb) from public, anon, authenticated;
grant execute on function public.get_my_schedule(jsonb) to anon, authenticated;

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
begin
  if char_length(v_contact) < 5 or char_length(v_contact) > 160 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  if position('@' in v_contact) = 0 and char_length(v_digits) < 7 then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  return query
  select result.item_type, result.name, result.day_key, result.slot_time,
         result.attendance, result.queue_position
  from (
    select 'booking'::text as item_type, b.name, s.day_key, s.time as slot_time,
           b.attendance, null::integer as queue_position
    from public.bookings b
    join public.slots s on s.id = b.slot_id
    where (position('@' in v_contact) > 0 and lower(coalesce(b.email, '')) = v_contact)
       or (position('@' in v_contact) = 0
           and right(regexp_replace(coalesce(b.phone, ''), '[^0-9]', '', 'g'), 9)
               = right(v_digits, 9))

    union all

    select 'waitlist'::text, w.name, s.day_key, s.time, 'waiting'::text,
           (select count(*)::integer from public.waitlist q
            where q.slot_id = w.slot_id and q.created_at <= w.created_at)
    from public.waitlist w
    join public.slots s on s.id = w.slot_id
    where (position('@' in v_contact) > 0 and lower(coalesce(w.email, '')) = v_contact)
       or (position('@' in v_contact) = 0
           and right(regexp_replace(coalesce(w.phone, ''), '[^0-9]', '', 'g'), 9)
               = right(v_digits, 9))
  ) result
  order by result.day_key, result.slot_time
  limit 50;
end;
$$;

revoke all on function public.search_my_schedule(text) from public, anon, authenticated;
grant execute on function public.search_my_schedule(text) to anon, authenticated;

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
    if not found or v_target.is_day_locked or v_target.booking_count >= v_target.capacity
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

create or replace function public.set_booking_attendance(
  p_booking_id uuid,
  p_attendance text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then raise exception using message = 'ADMIN_REQUIRED'; end if;
  if p_attendance not in ('pending', 'present', 'absent', 'cancelled') then
    raise exception using message = 'INVALID_ATTENDANCE';
  end if;
  update public.bookings set attendance = p_attendance where id = p_booking_id;
end;
$$;

revoke all on function public.set_booking_attendance(uuid, text) from public, anon, authenticated;
grant execute on function public.set_booking_attendance(uuid, text) to authenticated;

create or replace function public.get_admin_week_dashboard(p_week_start date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_app_admin() then jsonb_build_object(
    'bookings', count(b.id),
    'present', count(b.id) filter (where b.attendance = 'present'),
    'absent', count(b.id) filter (where b.attendance = 'absent'),
    'waitlist', (select count(*) from public.waitlist w join public.slots ws on ws.id = w.slot_id
                 where ws.day_key between p_week_start and p_week_start + 6),
    'sessions', count(distinct s.id),
    'capacity', (select coalesce(sum(capacity), 0) from public.slots cs
                 where cs.day_key between p_week_start and p_week_start + 6)
  ) else null end
  from public.slots s
  left join public.bookings b on b.slot_id = s.id
  where s.day_key between p_week_start and p_week_start + 6;
$$;

revoke all on function public.get_admin_week_dashboard(date) from public, anon, authenticated;
grant execute on function public.get_admin_week_dashboard(date) to authenticated;

create or replace function public.get_admin_week_export(p_week_start date)
returns table(
  day_key date,
  day_name text,
  "time" text,
  name text,
  phone text,
  email text,
  attendance text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  return query
  select s.day_key, s.day_name, s.time, b.name, b.phone, b.email, b.attendance
  from public.slots s
  join public.bookings b on b.slot_id = s.id
  where s.day_key between p_week_start and p_week_start + 6
  order by s.day_key, s.time, b.created_at;
end;
$$;

revoke all on function public.get_admin_week_export(date) from public, anon, authenticated;
grant execute on function public.get_admin_week_export(date) to authenticated;

commit;
