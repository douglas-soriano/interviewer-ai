# Interviewer AI

## 1. Overview

Interviewer AI is a voice-based interview app built to help candidates practice technical interviews.

The interviewer listens to each answer, reviews its content, and creates the next question based on what the candidate said. At the end of the session, the app shows the full transcript, the interviewer's reasoning, and a final score.

The app includes:

* A public home page with available jobs and recent interview sessions
* A live interview room with voice input
* Follow-up questions based on previous answers
* A results page with the transcript, evaluation, and final score
* An admin area to manage jobs, skills, and questions

### Main stack

* Next.js
* TypeScript
* React
* Drizzle ORM
* PostgreSQL
* Gemini or OpenRouter
* Browser Speech Recognition API
* Server-Sent Events for streaming

The main goal was not only to generate interview questions with an LLM. The goal was to create an interview flow with a clear purpose, fixed rules, job-specific evaluation, and results that could be reviewed later.

---

## 2. Decisions Before Development

Before writing the application code, I defined the main product and architecture decisions.

### Modular LLM provider

I did not want the application to depend on a single LLM provider.

I created a common provider interface so the interview system can work with different providers without changing the main interview logic.

The current adapters support:

* Gemini
* OpenRouter

Gemini was used as the main provider during development.

This structure makes it easier to change models, compare providers, or add another provider later.

### Voice input

I decided to use the browser Speech Recognition API for speech-to-text.

The browser records the candidate's answer and converts it into text. The transcript is then sent to the backend and evaluated by the LLM.

This decision has clear tradeoffs:

* Browser support is limited
* Results may change between browsers
* Transcription quality depends on the device and environment
* Some browsers may not support the feature

For this demo, it was a simple way to provide voice input without adding an external speech-to-text service.

The interface handles missing browser support and microphone permission errors.

### Interview layout

I planned the main interview screen before development.

The layout follows a chat-style interface:

* The interviewer appears on the left
* The candidate appears on the right
* Previous questions and answers remain visible
* The voice input stays simple and easy to find
* Loading and recording states are clearly shown

The goal was to make the interview feel natural and easy to understand without adding too many controls.

### Job-based evaluation

A general technical interview has little value when there is no clear role or evaluation goal.

For this reason, every interview starts from a registered job.

The job contains the role description and the skills that should be evaluated. These details are used to define what the interviewer should ask and what signals it should look for in the candidate's answers.

A simple admin CRUD was created to manage:

* Jobs
* Job descriptions
* Skills
* Evaluation points
* Question banks

This allows the same interview system to support different roles without changing the application code.

### LLM guardrails

The LLM does not have full control over the interview.

Before development, I defined rules to reduce common LLM problems, such as:

* Following instructions included inside a candidate's answer
* Changing its role during the interview
* Ignoring the job evaluation goals
* Asking questions outside the interview scope
* Returning an invalid response format
* Ending the interview too early
* Repeating the same question
* Producing a final score that does not match the recorded decisions

Candidate answers are treated as interview content, not as system instructions.

The backend also checks the LLM response before using it. Important interview decisions are stored in the database, and the final score is calculated from those saved decisions instead of asking the LLM to invent a score at the end.

### Project start

After defining the provider interface, voice flow, layout, job model, evaluation rules, and guardrails, I started the project implementation.

---

## 3. Project Setup

### Requirements

* Node.js 20 or newer
* Docker
* A Gemini or OpenRouter API key

### Quick start

Create the local environment file:

```bash
cp .env.example .env
```

Add your LLM provider and API key to `.env`.

Then run:

```bash
make bootstrap
npm run dev
```

The bootstrap command:

* Installs the project dependencies
* Starts PostgreSQL
* Applies the database schema
* Creates the sample jobs

Open the application at:

```text
http://localhost:3000
```

When port `3000` is already being used:

```bash
npm run dev -- --port 3001
```

Then open:

```text
http://localhost:3001
```

### Environment variables

Required:

```env
DATABASE_URL=
LLM_PROVIDER=
```

Add the key for the selected provider:

```env
GEMINI_API_KEY=
```

or:

```env
OPENROUTER_API_KEY=
```

Optional Gemini settings:

```env
GEMINI_MODEL=
```

Optional OpenRouter settings:

```env
OPENROUTER_MODEL=
OPENROUTER_APP_URL=
OPENROUTER_APP_NAME=
```

Sample values are available in `.env.example`.

### Common commands

```bash
make bootstrap
```

Installs dependencies, starts PostgreSQL, applies the schema, and creates sample data.

```bash
make db-up
```

Starts the local PostgreSQL container.

```bash
make db-down
```

Stops the local PostgreSQL container.

```bash
make db-logs
```

Shows the PostgreSQL container logs.

```bash
make typecheck
```

Runs the TypeScript checks.

```bash
make build
```

Creates a production build.

---

## 4. Architecture

### Main folders

```text
src/
├── app/
├── components/
├── hooks/
├── services/
├── providers/
│   └── llm/
├── repositories/
└── db/
```

### `src/app`

Contains the Next.js routes, pages, and API endpoints.

Main areas include:

* Public home
* Interview room
* Interview results
* Admin settings
* Session API endpoints

### `src/components`

Contains the user interface components.

The components are grouped around the main product areas:

* Home
* Interview
* Results
* Settings

### `src/hooks`

Contains browser-side state and behavior.

This includes:

* Interview session state
* Microphone control
* Speech recognition
* Answer submission
* Server-Sent Events handling

### `src/services`

Contains the main application rules.

This layer handles:

* Interview flow
* Answer evaluation
* Next-question decisions
* Guardrails
* Session completion
* Final evaluation
* Job and session loading

The interview rules are kept outside the API routes and UI components.

### `src/providers/llm`

Contains the LLM provider interface and provider adapters.

Current adapters:

* Gemini
* OpenRouter

The interview services depend on the common interface instead of depending directly on Gemini or OpenRouter.

### `src/repositories`

Contains the database access layer.

Repositories are responsible for reading and saving:

* Jobs
* Skills
* Interview sessions
* Questions
* Answers
* Evaluation decisions

### `src/db`

Contains:

* Drizzle schema
* Database connection
* Database bootstrap
* Sample seed data

### Interview runtime flow

1. The candidate selects a job.
2. The backend creates an interview session.
3. The browser asks for microphone permission.
4. The candidate records one answer.
5. The browser converts the audio into text.
6. The transcript is sent to:

```text
/api/sessions/[id]/answer
```

7. The backend loads the job, session, previous turns, and evaluation rules.
8. The answer is checked and sent to the configured LLM provider.
9. The backend reviews the returned signals and applies its guardrails.
10. The decision is saved in PostgreSQL.
11. The next question is streamed to the browser with Server-Sent Events.
12. The process continues until the interview is complete.
13. The final evaluation is calculated from the saved interview decisions.
14. The results page shows the transcript, reasoning, and final score.

### Evaluation model

The LLM helps identify signals inside each answer, but the final result does not depend on a single final LLM request.

Each interview turn stores its evaluation decision.

The final score is calculated from the saved decisions, which makes the result:

* Easier to review
* More stable
* Less affected by the wording of a final prompt
* Safer against candidate prompt injection
* Easier to test

### Streaming

The next question is returned through Server-Sent Events.

This allows the interface to show the question while it is being generated instead of waiting for the full response.

### Deployment

The recommended hosted setup is:

* Next.js application on Vercel
* Managed PostgreSQL database
* Gemini or OpenRouter as the LLM provider

Required hosted environment variables:

```env
DATABASE_URL=
LLM_PROVIDER=
GEMINI_API_KEY=
```

or:

```env
DATABASE_URL=
LLM_PROVIDER=
OPENROUTER_API_KEY=
```

When using OpenRouter, set the hosted application URL:

```env
OPENROUTER_APP_URL=
```

### Smoke test

After starting the application, check that:

* The home page lists public jobs
* A job can be created and edited in settings
* An interview session can be started
* Microphone permission errors are clearly shown
* Unsupported browsers are clearly handled
* An answer can be recorded and submitted
* The next question is streamed to the interview room
* A completed interview appears in the session history
* The results page shows the transcript
* A completed session shows the final evaluation
* An active session shows the transcript without a final evaluation
