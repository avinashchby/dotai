import type { Generator, ProjectContext } from '../types.js';
import { getCommands } from './commands.js';

/** Build the "Project Context" section. */
function projectSection(ctx: ProjectContext): string {
  const lang = ctx.languages[0]?.name ?? 'Unknown';
  const pm = ctx.packageManager ?? 'unknown';
  if (ctx.framework) {
    return `# Project Context\n${ctx.framework.name} project using ${lang} with ${pm}.`;
  }
  return `# Project Context\n${lang} project managed with ${pm}.`;
}

/** Build the "Commands" section. */
function commandsSection(ctx: ProjectContext): string | null {
  const cmds = getCommands(ctx.packageManager);
  const lines: string[] = ['# Commands'];
  if (cmds.install) lines.push(`- Install: \`${cmds.install}\``);
  if (cmds.test) lines.push(`- Test: \`${cmds.test}\``);
  if (cmds.lint) lines.push(`- Lint: \`${cmds.lint}\``);
  if (cmds.build) lines.push(`- Build: \`${cmds.build}\``);
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "Stack" section. */
function stackSection(ctx: ProjectContext): string | null {
  const lines: string[] = ['# Stack'];
  if (ctx.languages.length > 0) {
    const langs = ctx.languages
      .map((l) => `${l.name} (${l.percentage}%)`)
      .join(', ');
    lines.push(`- Languages: ${langs}`);
  }
  if (ctx.framework) {
    const ver = ctx.framework.version ? ` ${ctx.framework.version}` : '';
    lines.push(`- Framework: ${ctx.framework.name}${ver}`);
  }
  if (ctx.databases.length > 0) {
    lines.push(`- Database: ${ctx.databases.join(', ')}`);
  }
  if (ctx.orm) {
    lines.push(`- ORM: ${ctx.orm}`);
  }
  if (ctx.apiStyles.length > 0) {
    lines.push(`- API: ${ctx.apiStyles.join(', ')}`);
  }
  if (ctx.deployment.length > 0) {
    lines.push(`- Deployment: ${ctx.deployment.join(', ')}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Build the "Guidelines" section. */
function guidelinesSection(ctx: ProjectContext): string | null {
  const lines: string[] = ['# Guidelines'];
  for (const l of ctx.linters) {
    lines.push(`- Use ${l.name} for linting.`);
  }
  for (const f of ctx.formatters) {
    lines.push(`- Use ${f.name} for formatting.`);
  }
  for (const c of ctx.conventions) {
    lines.push(`- ${c}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
}

/** Windsurf .windsurfrules generator. */
export const windsurfGenerator: Generator = {
  name: 'windsurf',
  fileName: '.windsurfrules',
  generate(ctx: ProjectContext): string {
    const sections = [
      projectSection(ctx),
      commandsSection(ctx),
      stackSection(ctx),
      guidelinesSection(ctx),
    ].filter((s): s is string => s !== null);
    return sections.join('\n\n') + '\n';
  },
};
