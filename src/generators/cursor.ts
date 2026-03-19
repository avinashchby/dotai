import type { Generator, ProjectContext } from '../types.js';
import { getCommands } from './commands.js';

/** Project intro line. */
function projectLine(ctx: ProjectContext): string {
  const lang = ctx.languages[0]?.name ?? 'Unknown';
  if (ctx.framework) {
    return `You are working on a ${ctx.framework.name} project using ${lang}.`;
  }
  return `You are working on a ${lang} project.`;
}

/** Package manager line. */
function pmLine(ctx: ProjectContext): string | null {
  if (!ctx.packageManager) return null;
  const cmds = getCommands(ctx.packageManager);
  return `Package manager: ${ctx.packageManager}. Use \`${cmds.install}\` for installing dependencies.`;
}

/** Test framework line. */
function testLine(ctx: ProjectContext): string | null {
  if (!ctx.testFramework) return null;
  const cmds = getCommands(ctx.packageManager);
  return `Test framework: ${ctx.testFramework.name}. Run tests with \`${cmds.test}\`.`;
}

/** Linter and formatter lines. */
function toolLines(ctx: ProjectContext): string[] {
  const lines: string[] = [];
  const cmds = getCommands(ctx.packageManager);
  if (ctx.linters.length > 0) {
    const names = ctx.linters.map((l) => l.name).join(', ');
    lines.push(`Linting: ${names}. Run with \`${cmds.lint}\`.`);
  }
  if (ctx.formatters.length > 0) {
    const names = ctx.formatters.map((f) => f.name).join(', ');
    lines.push(`Formatting: ${names}. Run with \`${cmds.format}\`.`);
  }
  return lines;
}

/** Database and ORM lines. */
function dataLines(ctx: ProjectContext): string[] {
  const lines: string[] = [];
  if (ctx.databases.length > 0) {
    lines.push(`Database: ${ctx.databases.join(', ')}.`);
  }
  if (ctx.orm) {
    lines.push(`ORM: ${ctx.orm}.`);
  }
  return lines;
}

/** Convention lines. */
function conventionLines(ctx: ProjectContext): string[] {
  return ctx.conventions.map((c) => c);
}

/** Best practices closing line. */
function closingLine(ctx: ProjectContext): string {
  const lang = ctx.languages[0]?.name ?? 'the project';
  return `Follow ${lang} best practices and idiomatic patterns.`;
}

/** Cursor .cursorrules generator. */
export const cursorGenerator: Generator = {
  name: 'cursor',
  fileName: '.cursorrules',
  generate(ctx: ProjectContext): string {
    const lines: string[] = [
      projectLine(ctx),
      pmLine(ctx),
      testLine(ctx),
      ...toolLines(ctx),
      ...dataLines(ctx),
      ...conventionLines(ctx),
      closingLine(ctx),
    ].filter((l): l is string => l !== null);
    return lines.join('\n') + '\n';
  },
};
