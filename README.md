# TechBox web app: admin dashboard and learner pages

Next.js app for the TechBox learning and incubator platform. One app, two areas:

| Area | Routes | For |
|------|--------|-----|
| Admin dashboard | `/admin/*` | Staff: programs and curriculum, lessons and quizzes, assignments, grading, enrollment review |
| Learner pages | `/dashboard`, `/programs`, `/assignments`, … | Students: catalog, classroom (lessons, quizzes, progress), applying, hand-ins, notifications |

Backend: `techbox_backend_nestjs` (NestJS API). Every endpoint used here is documented in the backend's `api-contract-admin.md`.

## Requirements

- Node.js 24
- The backend running (default `http://localhost:5000`)

## Setup

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev                    # http://localhost:3000
```

Sign in with an account created by the backend's `npm run seed` (owner / incubator manager) or a student registered from the app.

In production the backend must list this app's URL in its `CORS_ORIGINS`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and build on every push and pull request.

## Structure

```
app/(admin)/admin/   admin pages (content, lessons, assignments, grading, enrollments, …)
app/(client)/        learner pages
app/(auth)/          login, register
components/          UI by feature (admin, lessons, submissions, notifications, …)
services/            API calls (one file per backend area)
hooks/               React Query hooks
lib/                 auth/RBAC rules, error messages, formatting
types/               *.contract.ts copied from the backend (do not edit), app types
proxy.ts             route guard (role-based redirects)
```

## API contracts

`types/api.contract.ts`, `assignments*.contract.ts`, `nodes.contract.ts` and `submissions.contract.ts` are copies of the backend's `src/types/`. When the backend changes them, copy them again; never edit them here. Errors from the API are turned into Arabic messages by `lib/api-error.ts`.

## Auth

The access token is sent as `Authorization: Bearer`; on `401` the client refreshes once with the single-use refresh token (`services/auth-service.ts`) and signs out if the refresh is rejected. Route access per role is defined in `lib/auth/rbac.ts` and enforced by `proxy.ts` and the client guard.
