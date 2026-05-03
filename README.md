# Convo — Real-Time Chat App

A clean, production-grade real-time chat application built with React, Supabase, and Capacitor.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Realtime-3ECF8E?logo=supabase) ![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor)

---

## Features

- **Auth** — Email/password login with Supabase Auth; friendly error messages
- **Chat List** — All conversations with last message preview and relative timestamps
- **Real-Time Messaging** — Instant message delivery via Supabase Realtime (Postgres CDC)
- **Optimistic UI** — Messages appear instantly; confirmed or marked failed after server response
- **Typing Indicator** — Live broadcast when the other user is typing
- **Message Status** — Sending / Sent / Failed per message
- **User Avatars** — Deterministic color avatars from initials (no image uploads needed)
- **Empty & Loading States** — Skeleton loaders, zero-data screens, error recovery
- **Android APK** — Capacitor wraps the web app into a native Android build
- **Mobile Safe Areas** — Respects Android/iOS notch and home bar via CSS env()

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + Vite |
| Routing | React Router v6 |
| Backend / Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Mobile | Capacitor 6 (Android) |
| Styling | Plain CSS with design tokens (CSS variables) |

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js       # Supabase client singleton
│   ├── AuthContext.jsx   # Global auth state (React Context)
│   └── utils.js          # Date formatting helpers
├── pages/
│   ├── LoginPage.jsx     # Email/password auth form
│   ├── ChatListPage.jsx  # List of all conversations
│   └── ChatPage.jsx      # Individual chat with Realtime
├── components/
│   ├── Avatar.jsx        # Initials-based user avatar
│   ├── MessageBubble.jsx # Single chat message (memoized)
│   └── TypingIndicator.jsx
├── styles/
│   └── global.css        # All styles (CSS variables, components)
├── App.jsx               # Routing + protected routes
└── main.jsx              # App entry point
```

---

## Setup

### 1. Prerequisites

- Node.js 18+ — https://nodejs.org
- Android Studio (for APK only) — https://developer.android.com/studio
- A Supabase account — https://supabase.com

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd convo-chat-app
npm install
```

### 3. Supabase Setup

**Create a project** at https://supabase.com/dashboard

**Run this SQL** in the Supabase SQL Editor:

```sql
-- Profiles table (synced from auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Conversations
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now()
);

-- Who is in each conversation
create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Policies (users can only see their own data)
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can read participants in their convos" on public.conversation_participants
  for select using (
    auth.uid() in (
      select user_id from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
    )
  );

create policy "Users can read messages in their convos" on public.messages
  for select using (
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = messages.conversation_id
    )
  );

create policy "Users can insert messages in their convos" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = messages.conversation_id
    )
  );
```

**Enable Realtime** for the `messages` table:
- Go to Database → Replication → Tables
- Toggle on `messages`

**Insert test data** (run after signing up two test users):

```sql
-- Replace with real user IDs from auth.users
do $$
declare
  user_a uuid := 'USER_A_UUID_HERE';
  user_b uuid := 'USER_B_UUID_HERE';
  conv_id uuid := gen_random_uuid();
begin
  insert into public.conversations (id) values (conv_id);
  insert into public.conversation_participants values (conv_id, user_a), (conv_id, user_b);
  insert into public.messages (conversation_id, sender_id, content) values
    (conv_id, user_a, 'Hey! How are you?'),
    (conv_id, user_b, 'Doing great, thanks!'),
    (conv_id, user_a, 'Awesome 🎉');
end $$;
```

### 4. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Build for Android

### Prerequisites

- Java JDK 17+ (`java -version`)
- Android Studio with SDK 33+
- `ANDROID_HOME` environment variable set

### Steps

```bash
# 1. Build the web app
npm run build

# 2. Add Android platform (first time only)
npm run cap:add-android

# 3. Sync web build to Android
npm run cap:sync

# 4. Open in Android Studio
npm run cap:open
```

In Android Studio:
- Wait for Gradle sync to finish
- Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Checklist Before Submission

- [ ] Login works with valid credentials
- [ ] Invalid credentials show a user-friendly error message
- [ ] Chat list loads and shows correct last message + timestamp
- [ ] Clicking a conversation opens the correct chat
- [ ] Messages sent appear immediately (optimistic UI)
- [ ] Messages received appear in real time (without refresh)
- [ ] Typing indicator appears when the other user types
- [ ] Logout redirects to login screen
- [ ] Empty state shown when no conversations exist
- [ ] App builds to APK without errors
- [ ] `.env` is in `.gitignore` (no secrets in repo)

---

## Author

Built as a frontend internship assessment project.
