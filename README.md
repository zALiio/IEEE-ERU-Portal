# IEEE ERU — Member Portal

Private member portal for IEEE ERU Student Branch. Separate project from the main public site, deployed to its own subdomain.

## Stack
Vite + React + Tailwind v4 + Supabase (Auth + Postgres + RLS) + Framer Motion + react-router-dom

## Setup
```
npm install
cp .env.example .env   # then fill in real Supabase project URL + anon key
npm run dev
```

## Status
Scaffold only — theme system (matches main site) and routing are wired.
Auth, roles (Member / Leader / Excom / Admin), and dashboard views are next.
