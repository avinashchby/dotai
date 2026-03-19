# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-19

### Added

- Initial release
- Codebase scanning engine with 10 detection modules
- Language detection: TypeScript, JavaScript, Python, Rust, Go, Ruby, Java, PHP, C#
- Package manager detection: npm, yarn, pnpm, bun, pip, uv, poetry, cargo, go, bundler, composer, maven, gradle, dotnet
- Framework detection: Next.js, Nuxt, Angular, React, Vue, Svelte, Express, Fastify, NestJS, Hono, Django, Flask, FastAPI, Actix, Axum, Gin, Rails, Laravel, and more
- Testing framework detection: Vitest, Jest, Mocha, Playwright, Cypress, pytest, Go test, RSpec, PHPUnit
- Linter/formatter detection: ESLint, Prettier, Biome, Ruff, Black, Clippy, golangci-lint, RuboCop
- Database detection: PostgreSQL, MySQL, SQLite, MongoDB, Redis
- ORM detection: Prisma, Drizzle, TypeORM, Sequelize, SQLAlchemy, Diesel, GORM, ActiveRecord
- Deployment target detection: Docker, Vercel, Netlify, Fly.io, Railway, AWS CDK, Kubernetes, Cloudflare Workers
- CI/CD detection: GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis CI, Bitbucket Pipelines
- Monorepo detection: Turborepo, Nx, Lerna, pnpm/npm/yarn workspaces, Cargo workspaces
- API style detection: REST, GraphQL, gRPC, tRPC, WebSocket
- 5 output generators: CLAUDE.md, .cursorrules, .windsurfrules, .github/copilot-instructions.md, codex-instructions.md
- CLI flags: `--format`, `--interactive`, `--dry-run`, `--force`, `--output`
- Zero external API calls — fully offline, pure static analysis
