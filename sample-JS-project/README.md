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

## Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository

### 3. Configure Environment Variables
In Vercel project settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `OWNER_EMAIL` | Admin email address |

### 4. Deploy
Vercel will automatically run `npm run build` which generates `config.js` from your environment variables.

**Note**: The build script (`build-config.js`) generates `js/config.js` from environment variables during deployment. Your secrets stay secure and never get committed to Git!

### Local Development
For local development, create `js/config.js` from the example:
```bash
cp js/config.example.js js/config.js
# Edit js/config.js with your local values
```
