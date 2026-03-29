# UIGen

AI-powered React component generator with live preview.

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Features](#features)
- [UX TODO](#ux-todo) — known UX issues identified via Playwright exploration
- [Tech Stack](#tech-stack)

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## UX TODO

Identified via manual Playwright exploration:

- [ ] **Uživatelská zpráva vypadá jako tlačítko** — modrý bubble s bílým textem působí jako klikatelný element, ne chatová zpráva
- [ ] **Nekonzistentní název aplikace** — levý panel říká "React Component Generator", pravý "Welcome to UI Generator"
- [ ] **Sign In / Sign Up špatně umístěné** — auth tlačítka jsou v headeru Preview panelu místo v globálním headeru
- [ ] **Chybí "Copy code" tlačítko** — po vygenerování kódu není viditelná možnost zkopírovat ho
- [ ] **Tmavé preview pozadí jako default** — iframe má tmavé pozadí natvrdo; bylo by lepší mít světlé jako default + přepínač
- [ ] **Code tab zbytečný před první generací** — prázdný file tree + editor state matou uživatele; tab by měl být skrytý nebo zobrazit jasnou instrukci
- [ ] **Žádné příklady / follow-up hinty** — po vygenerování chybí návrhy dalších promptů ("Try: make it red", "Add an icon"…)
- [ ] **Send button nemá label** — ikonka šipky bez textu, disable stav vizuálně téměř nerozeznatelný

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK
