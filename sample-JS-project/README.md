# Emotion in Motion - Personal Training Scheduler

A vanilla JavaScript app for managing personal training schedules with Supabase backend.

## Setup

### 1. Clone and Install
```bash
npm install
```

### 2. Configure Supabase

Create `js/config.js` from the example:
```bash
cp js/config.example.js js/config.js
```

Edit `js/config.js` with your Supabase credentials:
```javascript
export const config = {
  supabaseUrl: "YOUR_SUPABASE_URL",           // From Supabase Project Settings → API
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",  // From Supabase Project Settings → API  
  ownerEmail: "YOUR_OWNER_EMAIL",             // Admin email for viewing phone numbers
};
```

### 3. Create Supabase Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Create slots table
create table slots (
  id            uuid primary key default gen_random_uuid(),
  day_key       date    not null,
  day_name      text    not null,
  time          text    not null,
  capacity      integer not null default 16,
  booking_count integer not null default 0,
  constraint slots_day_time_unique unique (day_key, time)
);

-- Create bookings table
create table bookings (
  id         uuid        primary key default gen_random_uuid(),
  slot_id    uuid        not null references slots (id) on delete cascade,
  name       text        not null,
  phone      text,
  created_at timestamptz not null default now()
);

create unique index bookings_slot_name_unique on bookings (slot_id, lower(name));

-- Trigger to auto-update booking_count
create or replace function update_slot_booking_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update slots set booking_count = booking_count + 1 where id = NEW.slot_id;
  elsif TG_OP = 'DELETE' then
    update slots set booking_count = booking_count - 1 where id = OLD.slot_id;
  end if;
  return null;
end;
$$;

create trigger booking_count_trigger
after insert or delete on bookings
for each row execute function update_slot_booking_count();

-- RLS policies
alter table slots enable row level security;
alter table bookings enable row level security;

create policy "Anyone reads slots" on slots for select using (true);
create policy "Authenticated manages slots" on slots for all to authenticated using (true) with check (true);
create policy "Anyone can book" on bookings for insert with check (true);
create policy "Anyone reads bookings" on bookings for select using (true);

-- RPC function for phone privacy
create or replace function get_bookings_with_phone(p_slot_id uuid)
returns table(id uuid, name text, phone text, created_at timestamptz)
language plpgsql security definer as $$
begin
  if auth.role() = 'authenticated' then
    return query select b.id, b.name, b.phone, b.created_at
                 from bookings b where b.slot_id = p_slot_id order by b.created_at;
  else
    return query select b.id, b.name, null::text, b.created_at
                 from bookings b where b.slot_id = p_slot_id order by b.created_at;
  end if;
end;
$$;
```

### 4. Create Owner Account

In Supabase Dashboard → Authentication → Users:
1. Click "Add user" → "Create new user"
2. Enter your owner email and password
3. Check "Auto Confirm User"

### 5. Run the App

With Live Server or any static server:
```bash
# Open index.html with Live Server in VS Code
# Or use python:
python -m http.server 5500
```

## Features

- ✅ **Dynamic weekly schedule** - automatically displays current week (Mon-Sun)
- ✅ **Anonymous booking** - anyone can book slots with name (and optional phone)
- ✅ **Phone privacy** - phone numbers only visible to authenticated owner
- ✅ **Persistent data** - bookings stored in Supabase
- ✅ **Real-time counts** - accurate slot availability
- ✅ **Responsive design** - mobile-friendly interface

## Deployment

For deployment (Netlify, Vercel, etc.):
1. Create `js/config.js` with production values
2. Deploy the app
3. Config is gitignored and stays secure

**Note**: `js/config.js` is gitignored. Never commit your Supabase credentials!
