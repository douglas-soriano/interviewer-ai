# Setup

Interviewer AI is a Next.js App Router application with TypeScript, Tailwind CSS,
and a local Postgres database for development.

## Prerequisites

- Node.js 20 or newer
- Docker, for the local Postgres database

## Local setup

```bash
cp .env.example .env
npm install
make db-up
npm run db:push
npm run db:seed
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

## Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run db:generate
npm run db:push
npm run db:seed
```

## Database

The Docker database uses the same connection string as `.env.example`:

```text
postgresql://interviewer:interviewer@localhost:5432/interviewer
```

Use `make db-up` to start Postgres and `make db-down` to stop it. The first
data backbone includes the job, session, and turn tables plus sample interview
jobs for local development.
