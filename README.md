# Sapienda

Sapienda is a Vite + React full-stack AI workspace with chat, model selection, conversation history, memory management, authentication, and a skills plaza.

## Project Structure

- `client/` contains the React application, public assets, and UI components.
- `api/` contains the Vercel serverless API routes for auth, chat, conversations, memories, and skills.
- `api/_lib/` contains shared serverless helpers for database access, auth/session cookies, JSON responses, streaming events, and text utilities.
- `shared/` contains database schema and shared API contracts used across client/server boundaries.
- `server/` contains the local Express development entrypoint and static/Vite integration.

## Common Commands

```bash
npm run dev
npm run check
npm run build
npm run start
npm run db:push
```

## Environment

Copy `.env.example` to `.env` for local development and configure:

- `DATABASE_URL`
- `JWT_SECRET`
- `DEEPSEEK_API_KEY` or model relay variables
- `MODEL_RELAY_BASE_URL`
- `MODEL_RELAY_API_KEY`

The production deployment target is Vercel. Local Express development reuses the same API handlers where possible so behavior stays aligned.
