# dotai

One command. Every AI coding assistant configured — no API keys, no accounts, no network.

## Quick Start

```bash
npx @avinashchby/dotai
```

## What It Does

AI coding assistants are only as helpful as the context you give them, but each tool has its own config format: Claude Code reads `CLAUDE.md`, Cursor reads `.cursorrules`, Copilot reads `.github/copilot-instructions.md`, and so on. `dotai` solves this by scanning your actual codebase — file extensions, lock files, dependency manifests, and config files — and generating all five assistant configs in one shot. It uses pure static analysis: nothing is executed, uploaded, or sent to any service. A typical run completes in under two seconds and leaves your project with accurate, stack-specific instructions for every major AI coding tool.

## Features

- Generates `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and `codex-instructions.md`
- Detects languages (TypeScript, JavaScript, Python, Rust, Go, Ruby, Java, PHP, C#) by file-extension frequency
- Detects frameworks across ecosystems: Next.js, Django, Axum, Gin, Rails, Laravel, and more
- Detects package managers, test frameworks, linters, formatters, databases, ORMs, and CI/CD platforms
- Detects monorepos (Turborepo, Nx, Lerna, pnpm/npm/yarn/Cargo workspaces) and API styles (REST, GraphQL, gRPC, tRPC, WebSocket)
- Interactive mode to confirm detections, choose which files to generate, and add custom conventions
- Dry-run mode to preview all generated content without writing any files
- Skips existing files by default; `--force` overwrites without prompting

## Usage

```bash
# Generate all five configs in the current directory
npx @avinashchby/dotai

# Preview output without writing any files
npx @avinashchby/dotai --dry-run

# Generate only Claude Code and Cursor configs
npx @avinashchby/dotai --format claude,cursor

# Guided setup: confirm detections, pick outputs, add custom conventions
npx @avinashchby/dotai --interactive

# Target a different project directory
npx @avinashchby/dotai --output ~/projects/my-api

# Overwrite existing config files
npx @avinashchby/dotai --force
```

## Example Output

```
📦 my-app — Codebase Analysis

  Language:         TypeScript (85%), JavaScript (15%)
  Framework:        Next.js 14.1.0
  Package Manager:  pnpm
  Testing:          Vitest
  Linter:           ESLint
  Formatter:        Prettier
  Database:         PostgreSQL, Redis
  ORM:              Prisma
  Deployment:       Docker, Vercel
  CI/CD:            GitHub Actions
  Monorepo:         Turborepo (3 packages)
  API Style:        REST, tRPC

✨ Generated 5 files:
  ✓ CLAUDE.md
  ✓ .cursorrules
  ✓ .windsurfrules
  ✓ .github/copilot-instructions.md
  ✓ codex-instructions.md
```

Each generated file is tailored to its tool's format. For example, `CLAUDE.md` is structured Markdown with sections for tech stack, development commands, code style, architecture, and CI/CD. `.cursorrules` is a concise plain-text rules file. `.github/copilot-instructions.md` includes a Markdown table of the detected stack.

## Installation

```bash
npm install -g @avinashchby/dotai
# or
npx @avinashchby/dotai
```

Requires Node.js 18 or later.

## License

MIT
