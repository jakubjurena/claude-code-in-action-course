# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run Vitest test suite
npm run db:reset     # Reset database to clean state
```

Environment: requires `.env` with `ANTHROPIC_API_KEY` and `JWT_SECRET`. Falls back to mock LLM provider if no API key is set.

## Architecture

**UIGen** is a Next.js 15 app (App Router) that lets users generate React components via Claude AI with live preview. All generated files exist only in an in-memory virtual file system — nothing is written to disk.

### Request flow

1. User types a prompt in the chat UI
2. `POST /api/chat` receives the messages + current virtual file system state
3. Vercel AI SDK streams a response from Claude with tool use (`str_replace_editor`, `file_manager`)
4. Tool calls mutate files in the `VirtualFileSystem` (in `src/lib/file-system.ts`)
5. `FileSystemContext` propagates changes to the UI
6. `PreviewFrame` compiles JSX via Babel Standalone and renders in an isolated iframe

### Key layers

- **`src/app/api/chat/route.ts`** — LLM integration; uses Vercel AI SDK `streamText` with Anthropic prompt caching and tool definitions
- **`src/lib/file-system.ts`** — Core `VirtualFileSystem` class; all file state lives here
- **`src/lib/contexts/`** — `FileSystemContext` and `ChatContext` wire VFS and messages into React
- **`src/lib/tools/`** — Tool definitions passed to Claude: `str-replace.ts` (text editor ops) and `file-manager.ts` (create/delete/move)
- **`src/lib/transform/jsx-transformer.ts`** — Babel-based JSX compilation for the preview iframe
- **`src/lib/provider.ts`** — Switches between real Claude and mock provider
- **`src/app/main-content.tsx`** — Top-level layout: resizable Chat (35%) | Preview+Editor (65%) panels
- **`src/actions/`** — Server actions for auth and project CRUD
- **`prisma/schema.prisma`** — SQLite schema: `User` →many `Project`; projects store serialized VFS state

### Auth

JWT sessions via `jose` (7-day expiry). `src/middleware.ts` verifies sessions. Anonymous users can work without signing up; authenticated users get project persistence via Prisma/SQLite.

### Testing

Vitest with jsdom. Tests live alongside source files. Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

### UI components

Shadcn UI (New York style) with Radix UI primitives, Tailwind CSS v4, and Lucide icons. Component configs in `components.json`.

## Playwright (browser automation)

When taking screenshots with the `browser_take_screenshot` tool, always prefix the filename with `screenshots/` so files land in the gitignored `/screenshots/` folder instead of the project root:

```
filename: "screenshots/my-screenshot.png"  ✓
filename: "my-screenshot.png"              ✗  (ends up in root, not gitignored)
```

The `.playwright-mcp/` folder (session logs) is also gitignored — do not commit it.
