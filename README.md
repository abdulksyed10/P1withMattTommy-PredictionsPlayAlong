# P1 Predictions — Play Along Website

A full-stack web app for playing along with Formula 1 race-weekend predictions, tracking per-race points, and viewing season-long leaderboards.

Built with **Next.js + TypeScript** and **Supabase (Postgres + Auth)**.

---

## Features

- **Authentication** (Supabase Auth)
  - Sign up / sign in / sign out
  - Profile record auto-created/managed via DB triggers (recommended)
- **Predictions**
  - Users submit predictions for a race/weekend (configurable per race/session)
  - Validation for required fields and lockout after deadline (recommended)
- **Scoring**
  - Admin endpoint to score a race and update:
    - per-race scores
    - season totals / leaderboard
- **Leaderboards**
  - Race leaderboard
  - Season leaderboard
  - User profile summary (optional)
- **Admin tools**
  - Protected endpoints (admin secret) to score races, backfill, etc.

---

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js Route Handlers (API routes)
- **Database/Auth:** Supabase (Postgres, Row Level Security, Auth)

---

## Repo Structure (typical)

> Your exact structure may differ—adjust paths in this README to match your repo.

