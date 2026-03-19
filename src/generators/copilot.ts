import type { Generator, PackageManager, ProjectContext } from '../types.js';

/** Map package manager to its common commands. */
function getCommands(pm: PackageManager | null): Record<string, string> {
  const cmds: Record<string, Record<string, string>> = {
    npm:     { install: 'npm install',   test: 'npm test',          lint: 'npm run lint',   build: 'npm run build' },
    yarn:    { install: 'yarn',          test: 'yarn test',         lint: 'yarn lint',      build: 'yarn build' },
    pnpm:    { install: 'pnpm install',  test: 'pnpm test',        lint: 'pnpm lint',      build: 'pnpm build' },
    bun:     { install: 'bun install',   test: 'bun test',         lint: 'bun lint',       build: 'bun run build' },
    cargo:   { install: 'cargo build',   test: 'cargo test',       lint: 'cargo clippy',   build: 'cargo build' },
    go:      { install: 'go build',      test: 'go test ./...',    lint: 'golangci-lint run', build: 'go build' },
    pip:     { install: 'pip install',   test: 'pytest',           lint: 'ruff check',     build: '' },
    uv:      { install: 'uv sync',      test: 'pytest',           lint: 'ruff check',     build: '' },
    poetry:  { install: 'poetry install', test: 'poetry run pytest', lint: 'poetry run ruff check', build: '' },
    bundler: { install: 'bundle install', test: 'bundle exec rspec', lint: 'bundle exec rubocop', build: '' },
    composer:  { install: 'composer install', test: 'composer test', lint: 'composer lint', build: '' },
    maven:   { install: 'mvn install',   test: 'mvn test',         lint: '',               build: 'mvn package' },
    gradle:  { install: 'gradle build',  test: 'gradle test',      lint: '',               build: 'gradle build' },
    dotnet:  { install: 'dotnet restore', test: 'dotnet test',     lint: '',               build: 'dotnet build' },
  };

  if (!pm) return { install: '', test: '', lint: '', build: '' };
  return cmds[pm] ?? { install: '', test: '', lint: '', build: '' };
}

/** Build the tech stack markdown table rows. */
function buildStackTable(ctx: ProjectContext): string {
  const rows: string[] = [
    '| Component | Technology |',
    '|-----------|-----------|',
  ];
  const langNames = ctx.languages.map((l) => l.name).join(', ');
  if (langNames) rows.push(`| Language | ${langNames} |`);
  if (ctx.framework) rows.push(`| Framework | ${ctx.framework.name} |`);
  if (ctx.testFramework) rows.push(`| Testing | ${ctx.testFramework.name} |`);
  if (ctx.linters.length > 0) rows.push(`| Linting | ${ctx.linters.map((l) => l.name).join(', ')} |`);
  if (ctx.formatters.length > 0) rows.push(`| Formatting | ${ctx.formatters.map((f) => f.name).join(', ')} |`);
  if (ctx.databases.length > 0) rows.push(`| Database | ${ctx.databases.join(', ')} |`);
  if (ctx.orm) rows.push(`| ORM | ${ctx.orm} |`);
  if (ctx.buildTool) rows.push(`| Build Tool | ${ctx.buildTool} |`);
  return rows.join('\n');
}

/** Build the development commands section. */
function buildDevSection(ctx: ProjectContext): string {
  const cmds = getCommands(ctx.packageManager);
  const lines: string[] = [];
  if (cmds.install) lines.push(`- Use \`${cmds.install}\` to install dependencies`);
  if (cmds.test) lines.push(`- Use \`${cmds.test}\` to run tests`);
  if (cmds.lint) lines.push(`- Use \`${cmds.lint}\` to lint code`);
  if (cmds.build) lines.push(`- Use \`${cmds.build}\` to build`);
  return lines.join('\n');
}

/** Build the architecture section from context. */
function buildArchSection(ctx: ProjectContext): string {
  const parts: string[] = [];
  if (ctx.monorepo) {
    parts.push(`- Monorepo managed with ${ctx.monorepo.tool}`);
    if (ctx.monorepo.packages.length > 0) {
      parts.push(`  - Packages: ${ctx.monorepo.packages.join(', ')}`);
    }
  }
  if (ctx.apiStyles.length > 0) parts.push(`- API style: ${ctx.apiStyles.join(', ')}`);
  if (ctx.deployment.length > 0) parts.push(`- Deployment: ${ctx.deployment.join(', ')}`);
  if (ctx.cicd.length > 0) parts.push(`- CI/CD: ${ctx.cicd.map((c) => c.platform).join(', ')}`);
  if (ctx.hasDocker) parts.push('- Docker containerized');
  return parts.length > 0 ? parts.join('\n') : 'No specific architecture details detected.';
}

/** Format the project overview line. */
function buildOverview(ctx: ProjectContext): string {
  const parts: string[] = ['This is a'];
  if (ctx.framework) parts.push(ctx.framework.name);
  parts.push('project');
  const primary = ctx.languages[0];
  if (primary) parts.push(`using ${primary.name}`);
  if (ctx.packageManager) parts.push(`with ${ctx.packageManager}`);
  return parts.join(' ') + '.';
}

/** GitHub Copilot instructions generator. */
export const copilotGenerator: Generator = {
  name: 'copilot',
  fileName: '.github/copilot-instructions.md',

  generate(ctx: ProjectContext): string {
    const sections = [
      '# Copilot Instructions',
      '',
      '## Project Overview',
      buildOverview(ctx),
      '',
      '## Tech Stack',
      buildStackTable(ctx),
      '',
      '## Development',
      buildDevSection(ctx),
    ];

    if (ctx.conventions.length > 0) {
      sections.push('', '## Code Conventions');
      for (const conv of ctx.conventions) {
        sections.push(`- ${conv}`);
      }
    }

    const arch = buildArchSection(ctx);
    sections.push('', '## Architecture', arch, '');

    return sections.join('\n');
  },
};
