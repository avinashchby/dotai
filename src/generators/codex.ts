import type { Generator, PackageManager, ProjectContext } from '../types.js';

/** Map package manager to setup commands. */
function getSetupCommands(pm: PackageManager | null): Record<string, string> {
  const cmds: Record<string, Record<string, string>> = {
    npm:     { install: 'npm install',    test: 'npm test',           build: 'npm run build' },
    yarn:    { install: 'yarn',           test: 'yarn test',          build: 'yarn build' },
    pnpm:    { install: 'pnpm install',   test: 'pnpm test',         build: 'pnpm build' },
    bun:     { install: 'bun install',    test: 'bun test',          build: 'bun run build' },
    cargo:   { install: 'cargo build',    test: 'cargo test',        build: 'cargo build' },
    go:      { install: 'go build',       test: 'go test ./...',     build: 'go build' },
    pip:     { install: 'pip install -r requirements.txt', test: 'pytest', build: '' },
    uv:      { install: 'uv sync',       test: 'pytest',            build: '' },
    poetry:  { install: 'poetry install', test: 'poetry run pytest', build: '' },
    bundler: { install: 'bundle install', test: 'bundle exec rspec', build: '' },
    composer:  { install: 'composer install', test: 'composer test', build: '' },
    maven:   { install: 'mvn install',    test: 'mvn test',          build: 'mvn package' },
    gradle:  { install: 'gradle build',   test: 'gradle test',       build: 'gradle build' },
    dotnet:  { install: 'dotnet restore', test: 'dotnet test',       build: 'dotnet build' },
  };

  if (!pm) return { install: '', test: '', build: '' };
  return cmds[pm] ?? { install: '', test: '', build: '' };
}

/** Build project description line. */
function buildProjectLine(ctx: ProjectContext): string {
  const parts: string[] = [];
  if (ctx.framework) parts.push(ctx.framework.name);
  const primary = ctx.languages[0];
  if (primary) parts.push(primary.name);
  parts.push('project');
  if (ctx.packageManager) parts.push(`managed with ${ctx.packageManager}`);
  return parts.join(' ') + '.';
}

/** Build setup commands section. */
function buildSetupSection(ctx: ProjectContext): string {
  const cmds = getSetupCommands(ctx.packageManager);
  const lines: string[] = [];
  if (cmds.install) lines.push(`- Install: \`${cmds.install}\``);
  if (cmds.build) lines.push(`- Build: \`${cmds.build}\``);
  if (cmds.test) lines.push(`- Test: \`${cmds.test}\``);
  return lines.length > 0 ? lines.join('\n') : 'No setup commands detected.';
}

/** Build stack bullets from context. */
function buildStackBullets(ctx: ProjectContext): string {
  const lines: string[] = [];
  const langNames = ctx.languages.map((l) => l.name).join(', ');
  if (langNames) lines.push(`- Languages: ${langNames}`);
  if (ctx.framework) lines.push(`- Framework: ${ctx.framework.name}`);
  if (ctx.testFramework) lines.push(`- Testing: ${ctx.testFramework.name}`);
  if (ctx.linters.length > 0) lines.push(`- Linting: ${ctx.linters.map((l) => l.name).join(', ')}`);
  if (ctx.formatters.length > 0) lines.push(`- Formatting: ${ctx.formatters.map((f) => f.name).join(', ')}`);
  if (ctx.databases.length > 0) lines.push(`- Database: ${ctx.databases.join(', ')}`);
  if (ctx.orm) lines.push(`- ORM: ${ctx.orm}`);
  if (ctx.buildTool) lines.push(`- Build tool: ${ctx.buildTool}`);
  return lines.length > 0 ? lines.join('\n') : 'No stack details detected.';
}

/** Build patterns section from conventions and tooling. */
function buildPatternsSection(ctx: ProjectContext): string {
  const lines: string[] = [];
  for (const conv of ctx.conventions) {
    lines.push(`- ${conv}`);
  }
  if (ctx.linters.length > 0) lines.push(`- Linter: ${ctx.linters.map((l) => l.name).join(', ')}`);
  if (ctx.formatters.length > 0) lines.push(`- Formatter: ${ctx.formatters.map((f) => f.name).join(', ')}`);
  return lines.length > 0 ? lines.join('\n') : 'No specific patterns detected.';
}

/** Build architecture section. */
function buildArchSection(ctx: ProjectContext): string {
  const parts: string[] = [];
  if (ctx.monorepo) {
    parts.push(`- Monorepo: ${ctx.monorepo.tool}`);
    if (ctx.monorepo.packages.length > 0) {
      parts.push(`  - Packages: ${ctx.monorepo.packages.join(', ')}`);
    }
  }
  if (ctx.apiStyles.length > 0) parts.push(`- API: ${ctx.apiStyles.join(', ')}`);
  if (ctx.deployment.length > 0) parts.push(`- Deployment: ${ctx.deployment.join(', ')}`);
  if (ctx.cicd.length > 0) parts.push(`- CI/CD: ${ctx.cicd.map((c) => c.platform).join(', ')}`);
  if (ctx.hasDocker) parts.push('- Docker containerized');
  return parts.length > 0 ? parts.join('\n') : 'No specific architecture details detected.';
}

/** OpenAI Codex CLI instructions generator. */
export const codexGenerator: Generator = {
  name: 'codex',
  fileName: 'codex-instructions.md',

  generate(ctx: ProjectContext): string {
    const sections = [
      '# Codex Instructions',
      '',
      '## Project',
      buildProjectLine(ctx),
      '',
      '## Setup',
      buildSetupSection(ctx),
      '',
      '## Stack',
      buildStackBullets(ctx),
      '',
      '## Patterns',
      buildPatternsSection(ctx),
      '',
      '## Architecture',
      buildArchSection(ctx),
      '',
    ];

    return sections.join('\n');
  },
};
