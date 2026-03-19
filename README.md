<p align="center">
  <h1 align="center">dotai</h1>
  <p align="center"><strong>One command. Every AI coding assistant configured.</strong></p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dotai"><img src="https://img.shields.io/npm/v/dotai.svg" alt="npm version"></a>
  <a href="https://github.com/avinashchaubey/dotai/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/dotai.svg" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/dotai.svg" alt="node version"></a>
</p>

---

`dotai` scans your codebase and auto-generates configuration files for **every major AI coding assistant** — Claude Code, Cursor, Windsurf, GitHub Copilot, and OpenAI Codex. No API keys. No accounts. Works completely offline.

```bash
npx dotai
```

That's it. Five config files. One command.

---

## The Problem

Every AI coding tool has its own config format. Setting up a new project means:

```
# Without dotai — manual, repetitive, error-prone

1. Read Claude Code docs → write CLAUDE.md by hand
2. Read Cursor docs → write .cursorrules by hand
3. Read Windsurf docs → write .windsurfrules by hand
4. Read Copilot docs → write .github/copilot-instructions.md by hand
5. Read Codex docs → write codex-instructions.md by hand
6. Repeat for every new project
7. Keep all 5 files in sync when your stack changes
```

```
# With dotai — automatic, consistent, always accurate

npx dotai    # done
```

Your AI tools go from "generic JavaScript suggestions" to "knows you use Next.js 14 with Prisma, pnpm, Vitest, and deploy to Vercel."

---

## Quick Start

```bash
# Run in any project directory
npx dotai

# Preview without writing files
npx dotai --dry-run

# Generate only Claude and Cursor configs
npx dotai --format claude,cursor

# Guided interactive setup
npx dotai --interactive
```

### Example Output

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

---

## Before / After

### Before — no AI config

```
my-app/
├── src/
├── tests/
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

Every AI tool gives generic, context-free suggestions. Copilot doesn't know you use Prisma. Claude doesn't know you prefer Vitest. Cursor doesn't know your monorepo layout.

### After — `npx dotai`

```
my-app/
├── src/
├── tests/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── CLAUDE.md                        ← generated
├── .cursorrules                     ← generated
├── .windsurfrules                   ← generated
├── .github/copilot-instructions.md  ← generated
└── codex-instructions.md            ← generated
```

Every AI tool now knows your exact stack, conventions, commands, and architecture.

---

## Output Formats

| File | AI Tool | Description |
|------|---------|-------------|
| `CLAUDE.md` | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Project instructions for Anthropic's CLI agent |
| `.cursorrules` | [Cursor](https://www.cursor.com/) | Rules file for Cursor IDE's AI assistant |
| `.windsurfrules` | [Windsurf](https://codeium.com/windsurf) | Rules file for Windsurf (Codeium) IDE |
| `.github/copilot-instructions.md` | [GitHub Copilot](https://github.com/features/copilot) | Custom instructions for Copilot |
| `codex-instructions.md` | [OpenAI Codex](https://openai.com/index/openai-codex/) | Instructions for the Codex CLI tool |

---

## Detected Technologies

### Languages

TypeScript, JavaScript, Python, Rust, Go, Ruby, Java, PHP, C#

### Package Managers

| Manager | Detected via |
|---------|-------------|
| npm | `package-lock.json` |
| yarn | `yarn.lock` |
| pnpm | `pnpm-lock.yaml` |
| bun | `bun.lockb` / `bun.lock` |
| cargo | `Cargo.toml` |
| go | `go.mod` |
| pip | `requirements.txt` / `pyproject.toml` |
| uv | `uv.lock` |
| poetry | `poetry.lock` |
| bundler | `Gemfile.lock` |
| composer | `composer.lock` |
| maven | `pom.xml` |
| gradle | `build.gradle` / `build.gradle.kts` |
| dotnet | `*.csproj` / `*.sln` |

### Frameworks

| Category | Frameworks |
|----------|------------|
| React ecosystem | Next.js, React, Remix |
| Vue ecosystem | Vue, Nuxt |
| Other frontend | Svelte, SvelteKit, Angular |
| Node.js backend | Express, Fastify, NestJS, Hono |
| Python | Django, Flask, FastAPI |
| Ruby | Rails, Sinatra |
| Rust | Actix Web, Axum, Rocket |
| Go | Gin, Echo, Fiber, Gorilla |
| PHP | Laravel, Symfony |

### Testing

| Tool | Ecosystem |
|------|-----------|
| Vitest | Node.js |
| Jest | Node.js |
| Mocha | Node.js |
| Playwright | Browser |
| Cypress | Browser |
| pytest | Python |
| Go test | Go |
| Rust built-in | Rust |
| RSpec | Ruby |
| PHPUnit | PHP |

### Linters & Formatters

| Tool | Type | Ecosystem |
|------|------|-----------|
| ESLint | Linter | JS/TS |
| Prettier | Formatter | JS/TS |
| Biome | Both | JS/TS |
| Ruff | Both | Python |
| Black | Formatter | Python |
| Pylint / Flake8 | Linter | Python |
| Clippy | Linter | Rust |
| rustfmt | Formatter | Rust |
| golangci-lint | Linter | Go |
| RuboCop | Both | Ruby |

### Databases & ORMs

| Database | ORM |
|----------|-----|
| PostgreSQL | Prisma, Drizzle, TypeORM, Sequelize |
| MySQL | TypeORM, Sequelize |
| SQLite | Prisma, Drizzle |
| MongoDB | Mongoose |
| Redis | — |
| — | SQLAlchemy (Python), Diesel (Rust), GORM (Go), ActiveRecord (Ruby) |

### Infrastructure

| Category | Detected |
|----------|----------|
| Deployment | Docker, Vercel, Netlify, Fly.io, Railway, Render, AWS CDK, Kubernetes, Cloudflare Workers, Heroku, Google Cloud |
| CI/CD | GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis CI, Bitbucket Pipelines |
| Monorepo | Turborepo, Nx, Lerna, pnpm workspaces, npm/yarn workspaces, Cargo workspaces |
| API Style | REST, GraphQL, gRPC, tRPC, WebSocket |

---

## CLI Reference

```
Usage: dotai [options]

Options:
  -f, --format <formats>  Comma-separated: claude,cursor,windsurf,copilot,codex (default: all)
  -i, --interactive        Guided setup with prompts
  -o, --output <dir>       Target directory (default: current directory)
  -d, --dry-run            Preview output without writing files
  --force                  Overwrite existing config files
  -V, --version            Show version number
  -h, --help               Show help
```

### Examples

```bash
# Generate all configs in current directory
npx dotai

# Only Claude and Cursor
npx dotai -f claude,cursor

# Preview what would be generated
npx dotai --dry-run

# Point at another project
npx dotai -o ~/projects/my-api

# Overwrite existing configs
npx dotai --force

# Interactive mode — confirm detections, select outputs
npx dotai -i
```

---

## Why dotai?

**The AI coding assistant landscape is fragmented.** Claude Code reads `CLAUDE.md`. Cursor reads `.cursorrules`. Copilot reads `.github/copilot-instructions.md`. Each tool has its own format, its own conventions, its own location.

Most developers either:
1. Don't configure any of them (leaving AI suggestions generic and unhelpful)
2. Configure one and ignore the rest
3. Manually maintain 5 different files that say roughly the same thing

`dotai` solves this by **analyzing your actual codebase** — not asking you to fill out a form — and generating all five files with accurate, up-to-date information about your stack.

It's:
- **Zero config** — no setup, no config file for the config file generator
- **Zero cost** — no API calls, no tokens, no subscriptions
- **Zero network** — works completely offline, on an airplane, in a submarine
- **Fast** — pure static analysis, typically under 2 seconds
- **Accurate** — reads your actual lock files, config files, and dependency declarations

---

## How It Works

1. **Scan** — Collects the file tree using fast-glob (respects `.gitignore`, skips `node_modules`/`vendor`/`dist`)
2. **Detect** — Runs 10 independent detectors in parallel: language, package manager, framework, testing, linter/formatter, database/ORM, deployment, CI/CD, monorepo, API style
3. **Generate** — Passes the detection results through format-specific generators that produce properly structured output for each tool

Everything is **static analysis**. It reads filenames, config files, and dependency manifests. Nothing is executed, uploaded, or sent anywhere.

---

## Contributing

Contributions welcome! Especially:
- New framework/tool detections
- Improved output templates
- Support for additional AI coding tools

```bash
git clone https://github.com/avinashchaubey/dotai.git
cd dotai
npm install
npm run build
npm test

# Test against any project
npm run dev -- --dry-run -o ~/some-project
```

Use [conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

---

## License

[MIT](LICENSE) — Avinash Chaubey
