# ChatApp

A real-time chat application built with React, Vite, Supabase, and Capacitor.

## Description

ChatApp is a mobile-friendly messaging app with authentication, conversation list, real-time messages, typing indicators, and Android APK support.

## Features

- Email/password authentication with Supabase Auth
- Conversation list with latest message preview
- Real-time messaging with Supabase Realtime
- Typing indicator support
- Optimistic message sending state
- Android app packaging using Capacitor

## Tech Stack

- React 18
- Vite
- Supabase (`Auth`, `Postgres`, `Realtime`)
- Capacitor 6 (Android)

## Project Structure

```text
src/
  components/
  lib/
  pages/
  styles/
```

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Android Studio (for APK build)
- Java JDK 17+ (for Android build)

## 1) Supabase Setup

1. Create a new project in Supabase.
2. Go to `SQL Editor` and run your schema + RLS SQL (tables for `profiles`, `conversations`, `conversation_participants`, `messages`).
3. Enable Realtime for `messages` table:
   - `Database -> Replication -> Tables -> messages -> Enable`
4. Get project credentials:
   - `Settings -> API`
   - Copy `Project URL` and `anon public key`

### Environment Variables

Copy the example env file and fill values:

```bash
cp .env.example .env
```

Set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 2) Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## 3) Build the Web App

```bash
npm run build
```

## 4) Build Android APK (Capacitor)

First-time Android setup:

```bash
npm run cap:add-android
```

Sync latest web build into Android project:

```bash
npm run build
npm run cap:sync
```

Open Android Studio:

```bash
npm run cap:open
```

Inside Android Studio:

1. Wait for Gradle sync to finish.
2. Click `Build -> Build Bundle(s) / APK(s) -> Build APK(s)`.
3. Find APK at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run cap:add-android` - Add Android platform
- `npm run cap:sync` - Sync web assets to native project
- `npm run cap:open` - Open Android Studio project

## Security Notes

- Never commit `.env`.
- Only use Supabase `anon` key on frontend.
- Keep service role keys only on backend/private servers.

## License

This project is public for learning and portfolio purposes.
