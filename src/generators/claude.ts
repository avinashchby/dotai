import type { Generator, ProjectContext } from '../types.js';
import { getCommands } from './commands.js';

/** Build the "Project Overview" section. */
function overviewSection(ctx: ProjectContext): string {
  const parts: string[] = [];
  const lang = ctx.languages[0]?.name ?? 'Unknown';
  const pm = ctx.packageManager ?? 'unknown';
  parts.push(`# Project Overview`);
  if (ctx.framework) {
    parts.push(`${ctx.framework.name} project using ${lang} with ${pm}.`);
  } else {
    parts.push(`${lang} project managed with ${pm}.`);
  }
  return parts.join('\n');
}

/** Build the "Tech Stack" section. */
function techStackSection(ctx: ProjectContext): string | null {
  const lines: string[] = ['# Tech Stack'];
  if (ctx.languages.length > 0) {
    const langs = ctx.languages
      .map((l) => `${l.name} (${l.percentage}%)`)
      .join(', ');
    lines.push(`- **Language:** ${langs}`);
  }
  if (ctx.framework) {
    const ver = ctx.framework.version ? ` ${ctx.framework.version}` : '';
    lines.push(`- **Framework:** ${ctx.framework.name}${ver}`);
  }
  if (ctx.packageManager) {
    lines.push(`- **Package Manager:** ${ctx.packageManager}`);
  }
  if (ctx.databases.length > 0) {
    lines.push(`- **Database:** ${ctx.databases.join(', ')}`);
  }
  if (ctx.orm) {
    lines.push(`- **ORM:** ${ctx.orm}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "Development Commands" section. */
function commandsSection(ctx: ProjectContext): string | null {
  const cmds = getCommands(ctx.packageManager);
  const lines: string[] = ['# Development Commands'];
  if (cmds.install) lines.push(`- Install: \`${cmds.install}\``);
  if (cmds.build) lines.push(`- Build: \`${cmds.build}\``);
  if (cmds.test) {
    const tf = ctx.testFramework ? ` (${ctx.testFramework.name})` : '';
    lines.push(`- Test: \`${cmds.test}\`${tf}`);
  }
  if (cmds.lint && ctx.linters.length > 0) {
    const names = ctx.linters.map((l) => l.name).join(', ');
    lines.push(`- Lint: \`${cmds.lint}\` (${names})`);
  }
  if (cmds.format && ctx.formatters.length > 0) {
    const names = ctx.formatters.map((f) => f.name).join(', ');
    lines.push(`- Format: \`${cmds.format}\` (${names})`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "Code Style" section. */
function codeStyleSection(ctx: ProjectContext): string | null {
  const lines: string[] = ['# Code Style'];
  for (const l of ctx.linters) {
    const cfg = l.configFile ? ` (${l.configFile})` : '';
    lines.push(`- Linter: ${l.name}${cfg}`);
  }
  for (const f of ctx.formatters) {
    const cfg = f.configFile ? ` (${f.configFile})` : '';
    lines.push(`- Formatter: ${f.name}${cfg}`);
  }
  for (const c of ctx.conventions) {
    lines.push(`- ${c}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "Architecture" section. */
function architectureSection(ctx: ProjectContext): string | null {
  const lines: string[] = ['# Architecture'];
  if (ctx.monorepo) {
    lines.push(`- **Monorepo:** ${ctx.monorepo.tool}`);
    lines.push(`- **Packages:** ${ctx.monorepo.packages.join(', ')}`);
  }
  if (ctx.apiStyles.length > 0) {
    lines.push(`- **API Style:** ${ctx.apiStyles.join(', ')}`);
  }
  if (ctx.deployment.length > 0) {
    lines.push(`- **Deployment:** ${ctx.deployment.join(', ')}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "CI/CD" section. */
function cicdSection(ctx: ProjectContext): string | null {
  if (ctx.cicd.length === 0) return null;
  const lines: string[] = ['# CI/CD'];
  for (const ci of ctx.cicd) {
    lines.push(`- ${ci.platform} (${ci.configFile})`);
  }
  return lines.join('\n');
}

/** Claude Code CLAUDE.md generator. */
export const claudeGenerator: Generator = {
  name: 'claude',
  fileName: 'CLAUDE.md',
  generate(ctx: ProjectContext): string {
    const sections = [
      overviewSection(ctx),
      techStackSection(ctx),
      commandsSection(ctx),
      codeStyleSection(ctx),
      architectureSection(ctx),
      cicdSection(ctx),
    ].filter((s): s is string => s !== null);
    return sections.join('\n\n') + '\n';
  },
};
