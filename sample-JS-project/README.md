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

### 3. Create or Upgrade the Supabase Database

Open the Supabase SQL Editor and run the complete migration from:

`supabase/migrations/20260804_harden_booking.sql`

Then run the booking experience migration:

`supabase/migrations/20260804_booking_experience.sql`

The migration is safe for both a new project and the existing tables. It adds
owner-only administration, private phone data, atomic capacity checks, protected
week generation, and exact booking counts.

The second migration adds secure self-service booking management, recurring
reservations, automatic waitlist promotion, a two-hour change cutoff, attendance
tracking, and admin dashboard reporting. Run the files in the order shown.

### 4. Create Owner Account

In Supabase Dashboard → Authentication → Users:
1. Click "Add user" → "Create new user"
2. Enter your owner email and password
3. Check "Auto Confirm User"

Then register that user as the database admin in the SQL Editor:

```sql
insert into public.app_admins (user_id)
select id from auth.users where email = 'YOUR_OWNER_EMAIL'
on conflict (user_id) do nothing;
```

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
- ✅ **Phone privacy** - phone numbers only visible to the registered database admin
- ✅ **Persistent data** - bookings stored in Supabase
- ✅ **Atomic capacity** - the database prevents booking beyond 14 places
- ✅ **Protected schedule** - past sessions and locked days cannot be booked
- ✅ **Admin export** - weekly attendance can be exported to CSV
- ✅ **My bookings** - clients can cancel, move, and add reservations to their calendar
- ✅ **Waiting list** - full sessions accept a queue and promote the next client automatically
- ✅ **Recurring bookings** - reserve the same training time for up to six weeks
- ✅ **Attendance dashboard** - admin check-in controls and weekly totals
- ✅ **Reminders and PWA** - installable mobile experience with local notifications
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
| `EMAILJS_PUBLIC_KEY` | EmailJS public key (optional) |
| `EMAILJS_SERVICE_ID` | EmailJS service ID (optional) |
| `EMAILJS_TEMPLATE_ID` | EmailJS template ID (optional) |

### 4. Deploy
Vercel will automatically run `npm run build` which generates `config.js` from your environment variables.

**Note**: The build script (`build-config.js`) generates `js/config.js` from
environment variables during deployment. The Supabase anon key and EmailJS public
key are intentionally browser-visible; database security is enforced with RLS.

### Local Development
For local development, create `js/config.js` from the example:
```bash
cp js/config.example.js js/config.js
# Edit js/config.js with your local values
```
