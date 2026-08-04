begin;

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  day_key date not null,
  day_name text not null,
  time text not null,
  capacity integer not null default 14,
  booking_count integer not null default 0,
  is_day_locked boolean not null default false
);

create unique index if not exists slots_day_time_unique
on public.slots (day_key, time);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create unique index if not exists bookings_slot_name_unique
on public.bookings (slot_id, lower(name));

-- Admin authorization belongs in the database, not only in browser code.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public, anon, authenticated;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "Admins read own membership" on public.app_admins;
create policy "Admins read own membership"
on public.app_admins for select
to authenticated
using (user_id = auth.uid());

alter table public.slots
  add column if not exists booking_count integer not null default 0;

alter table public.slots
  add column if not exists is_day_locked boolean not null default false;

alter table public.slots
  alter column capacity set default 14;

update public.slots
set capacity = 14
where capacity <> 14;

update public.slots s
set booking_count = (
  select count(*)::integer
  from public.bookings b
  where b.slot_id = s.id
);

-- Replace permissive policies with explicit public-read/admin-write rules.
alter table public.slots enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Anyone reads slots" on public.slots;
drop policy if exists "Authenticated manages slots" on public.slots;
drop policy if exists "Anyone creates generated slots" on public.slots;
drop policy if exists "Public reads slots" on public.slots;
drop policy if exists "Admins insert slots" on public.slots;
drop policy if exists "Admins update slots" on public.slots;
drop policy if exists "Admins delete slots" on public.slots;

create policy "Public reads slots"
on public.slots for select
to anon, authenticated
using (true);

create policy "Admins insert slots"
on public.slots for insert
to authenticated
with check (public.is_app_admin());

create policy "Admins update slots"
on public.slots for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Admins delete slots"
on public.slots for delete
to authenticated
using (public.is_app_admin());

drop policy if exists "Anyone can book" on public.bookings;
drop policy if exists "Anyone reads bookings" on public.bookings;
drop policy if exists "Admins read bookings" on public.bookings;
drop policy if exists "Admins update bookings" on public.bookings;
drop policy if exists "Admins delete bookings" on public.bookings;

create policy "Admins read bookings"
on public.bookings for select
to authenticated
using (public.is_app_admin());

create policy "Admins update bookings"
on public.bookings for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "Admins delete bookings"
on public.bookings for delete
to authenticated
using (public.is_app_admin());

-- Keep booking_count exact after inserts, deletes, or a slot move.
create or replace function public.sync_slot_booking_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('DELETE', 'UPDATE') then
    update public.slots
    set booking_count = (
      select count(*)::integer from public.bookings where slot_id = old.slot_id
    )
    where id = old.slot_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.slots
    set booking_count = (
      select count(*)::integer from public.bookings where slot_id = new.slot_id
    )
    where id = new.slot_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_slot_booking_count() from public, anon, authenticated;

drop trigger if exists booking_count_trigger on public.bookings;
drop trigger if exists sync_slot_booking_count_trigger on public.bookings;
create trigger sync_slot_booking_count_trigger
after insert or delete or update of slot_id on public.bookings
for each row execute function public.sync_slot_booking_count();

-- Generate only the fixed weekly timetable, within a bounded booking window.
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

  insert into public.slots (day_key, day_name, time, capacity, booking_count, is_day_locked)
  values
    (p_week_start,     'Monday',    '17:00', 14, 0, false),
    (p_week_start,     'Monday',    '18:00', 14, 0, false),
    (p_week_start + 1, 'Tuesday',   '18:00', 14, 0, false),
    (p_week_start + 2, 'Wednesday', '17:00', 14, 0, false),
    (p_week_start + 2, 'Wednesday', '18:00', 14, 0, false),
    (p_week_start + 3, 'Thursday',  '18:00', 14, 0, false),
    (p_week_start + 4, 'Friday',    '17:00', 14, 0, false),
    (p_week_start + 4, 'Friday',    '18:00', 14, 0, false),
    (p_week_start + 5, 'Saturday',  '10:00', 14, 0, false),
    (p_week_start + 5, 'Saturday',  '11:00', 14, 0, false)
  on conflict (day_key, time) do nothing;
end;
$$;

revoke all on function public.ensure_week_slots(date) from public, anon, authenticated;
grant execute on function public.ensure_week_slots(date) to anon, authenticated;

-- Public users receive names only; the registered admin also receives phones.
create or replace function public.get_slot_bookings(p_slot_id uuid)
returns table(id uuid, name text, phone text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.name,
    case when public.is_app_admin() then b.phone else null end,
    b.created_at
  from public.bookings b
  where b.slot_id = p_slot_id
  order by b.created_at;
$$;

revoke all on function public.get_slot_bookings(uuid) from public, anon, authenticated;
grant execute on function public.get_slot_bookings(uuid) to anon, authenticated;

-- Capacity, lock, date, and insert happen inside one transaction.
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

-- Admin lock updates are atomic and cannot be called by normal authenticated users.
create or replace function public.set_day_lock(p_day_key date, p_locked boolean)
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
  set is_day_locked = p_locked
  where day_key = p_day_key;
end;
$$;

revoke all on function public.set_day_lock(date, boolean) from public, anon, authenticated;
grant execute on function public.set_day_lock(date, boolean) to authenticated;

-- Old function is replaced so callers cannot treat every authenticated user as admin.
drop function if exists public.get_bookings_with_phone(uuid);

commit;

-- Run once after this migration, replacing the email with your real admin email:
-- insert into public.app_admins (user_id)
-- select id from auth.users where email = 'YOUR_OWNER_EMAIL'
-- on conflict (user_id) do nothing;
