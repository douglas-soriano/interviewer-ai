# Interviewer AI

Voice-led interview demo built with Next.js, TypeScript, Drizzle, Postgres, and a pluggable LLM provider.

## What the app does

- public home with available roles and recent sessions
- live interview room with microphone capture, streaming follow-up questions, and deterministic evaluation
- read-only results page with transcript, interviewer rationale, and final score when the session is complete
- admin settings to manage jobs, skills, and question banks

## Local setup

Prerequisites:

- Node 20+
- Docker
- one LLM key for Gemini or OpenRouter

Quick start:

```bash
cp .env.example .env
make bootstrap
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

If that port is busy, run:

```bash
npm run dev -- --port 3001
```

## Environment

Required:

- `DATABASE_URL`
- `LLM_PROVIDER`
- one provider key:
  - `GEMINI_API_KEY`
  - or `OPENROUTER_API_KEY`

Optional:

- `GEMINI_MODEL`
- `OPENROUTER_MODEL`
- `OPENROUTER_APP_URL`
- `OPENROUTER_APP_NAME`

The sample values live in `.env.example`.

## Bootstrap and common commands

```bash
make bootstrap   # install deps, start Postgres, push schema, seed sample jobs
make db-up       # start local Postgres
make db-down     # stop local Postgres
make db-logs     # inspect Postgres logs
make typecheck
make build
```

## Architecture

- `src/app`: routes, pages, and API endpoints
- `src/components`: UI for home, interview, results, and settings
- `src/hooks`: browser session flow, voice capture, SSE consumption
- `src/services`: interview orchestration, scoring, final evaluation, job/session loading
- `src/providers/llm`: Gemini and OpenRouter adapters behind one provider interface
- `src/repositories` and `src/db`: persistence, schema, bootstrap, and seed flow

Runtime flow:

1. a session is created from the selected job
2. the browser records and transcribes one answer at a time
3. the answer is sent to `/api/sessions/[id]/answer`
4. the backend evaluates signals, guardrails, and next-question policy
5. the next question is streamed back over SSE
6. final evaluation is computed deterministically from persisted turn decisions

## Deployment notes

Recommended hosted shape:

- Next.js app on Vercel
- managed Postgres
- one configured LLM provider

Hosted env checklist:

- `DATABASE_URL`
- `LLM_PROVIDER`
- provider key and optional model
- `OPENROUTER_APP_URL` set to the hosted app URL when using OpenRouter

## Smoke checklist

- home lists public jobs
- settings can create and edit a job
- interview starts
- microphone permission and browser support are handled clearly
- answer submission returns the next streamed question
- a completed interview appears in history
- results page shows transcript and final evaluation
- an in-progress session shows transcript without final evaluation
