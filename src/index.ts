#!/usr/bin/env node

import { resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import type { ProjectContext, OutputFormat, Generator } from './types.js';
import { scan } from './scanner.js';
import { getGenerators } from './generators/index.js';

// ── ANSI helpers ──────────────────────────────────────────────────────

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

// ── CLI options type ──────────────────────────────────────────────────

interface CliOptions {
  format: string;
  interactive: boolean;
  output: string;
  dryRun: boolean;
  force: boolean;
}

// ── Version loader ────────────────────────────────────────────────────

async function loadVersion(): Promise<string> {
  const thisFile = fileURLToPath(import.meta.url);
  const pkgPath = join(dirname(thisFile), '..', 'package.json');
  const raw = await readFile(pkgPath, 'utf-8');
  return (JSON.parse(raw) as { version: string }).version;
}

// ── Detection summary printer ─────────────────────────────────────────

function formatRow(label: string, value: string): string {
  return `  ${DIM}${label.padEnd(18)}${RESET}${value}`;
}

/** Print a nicely-formatted detection summary to stderr. */
function printSummary(ctx: ProjectContext): void {
  const name = ctx.rootPath.split('/').pop() ?? 'project';
  const lines: string[] = [
    '',
    `${BOLD}📦 ${name} — Codebase Analysis${RESET}`,
    '',
  ];

  if (ctx.languages.length > 0) {
    const langs = ctx.languages
      .map((l) => `${l.name} (${l.percentage}%)`)
      .join(', ');
    lines.push(formatRow('Language:', langs));
  }

  addOptionalRow(lines, 'Framework:', formatFramework(ctx));
  addOptionalRow(lines, 'Package Manager:', ctx.packageManager);
  addOptionalRow(lines, 'Testing:', ctx.testFramework?.name);
  addToolListRow(lines, 'Linter:', ctx.linters);
  addToolListRow(lines, 'Formatter:', ctx.formatters);
  addListRow(lines, 'Database:', ctx.databases);
  addOptionalRow(lines, 'ORM:', ctx.orm);
  addDeploymentRow(lines, ctx);
  addCicdRow(lines, ctx);
  addMonorepoRow(lines, ctx);
  addListRow(lines, 'API Style:', ctx.apiStyles);

  lines.push('');
  console.error(lines.join('\n'));
}

function formatFramework(ctx: ProjectContext): string | null {
  if (!ctx.framework) return null;
  const ver = ctx.framework.version ? ` ${ctx.framework.version}` : '';
  return `${ctx.framework.name}${ver}`;
}

function addOptionalRow(lines: string[], label: string, value: string | null | undefined): void {
  if (value) lines.push(formatRow(label, value));
}

function addToolListRow(lines: string[], label: string, tools: { name: string }[]): void {
  if (tools.length > 0) {
    lines.push(formatRow(label, tools.map((t) => t.name).join(', ')));
  }
}

function addListRow(lines: string[], label: string, items: string[]): void {
  if (items.length > 0) {
    lines.push(formatRow(label, items.join(', ')));
  }
}

function addDeploymentRow(lines: string[], ctx: ProjectContext): void {
  const parts = [...ctx.deployment];
  if (ctx.hasDocker && !parts.includes('Docker')) parts.unshift('Docker');
  if (parts.length > 0) lines.push(formatRow('Deployment:', parts.join(', ')));
}

function addCicdRow(lines: string[], ctx: ProjectContext): void {
  if (ctx.cicd.length > 0) {
    lines.push(formatRow('CI/CD:', ctx.cicd.map((c) => c.platform).join(', ')));
  }
}

function addMonorepoRow(lines: string[], ctx: ProjectContext): void {
  if (ctx.monorepo) {
    const count = ctx.monorepo.packages.length;
    lines.push(formatRow('Monorepo:', `${ctx.monorepo.tool} (${count} packages)`));
  }
}

// ── Interactive mode ──────────────────────────────────────────────────

async function runInteractive(
  ctx: ProjectContext,
  generators: Generator[],
): Promise<{ selectedGenerators: Generator[]; extraConventions: string }> {
  const { confirm, checkbox, input } = await import('@inquirer/prompts');

  const proceed = await confirm({
    message: 'Detected stack looks correct?',
    default: true,
  });

  if (!proceed) {
    console.error(`${YELLOW}Aborted by user.${RESET}`);
    process.exit(0);
  }

  const choices = generators.map((g) => ({
    name: `${g.name} (${g.fileName})`,
    value: g.name,
    checked: true,
  }));

  const selected = await checkbox({
    message: 'Which files to generate?',
    choices,
  });

  const selectedGenerators = generators.filter((g) => selected.includes(g.name));

  const extraConventions = await input({
    message: 'Additional conventions (free text, or leave blank):',
    default: '',
  });

  return { selectedGenerators, extraConventions };
}

// ── File output ───────────────────────────────────────────────────────

interface WriteResult {
  written: string[];
  skipped: string[];
}

function printDryRun(generators: Generator[], ctx: ProjectContext): void {
  for (const gen of generators) {
    const content = gen.generate(ctx);
    console.log(`\n${CYAN}── ${gen.fileName} ${'─'.repeat(60 - gen.fileName.length)}${RESET}`);
    console.log(content);
  }
}

async function writeOutputs(
  generators: Generator[],
  ctx: ProjectContext,
  targetDir: string,
  force: boolean,
  interactive: boolean,
): Promise<WriteResult> {
  const written: string[] = [];
  const skipped: string[] = [];

  for (const gen of generators) {
    const filePath = resolve(targetDir, gen.fileName);
    const shouldWrite = await resolveOverwrite(filePath, force, interactive);

    if (!shouldWrite) {
      skipped.push(gen.fileName);
      continue;
    }

    ensureParentDir(filePath);
    const content = gen.generate(ctx);
    writeFileSync(filePath, content, 'utf-8');
    written.push(gen.fileName);
  }

  return { written, skipped };
}

async function resolveOverwrite(
  filePath: string,
  force: boolean,
  interactive: boolean,
): Promise<boolean> {
  if (!existsSync(filePath)) return true;
  if (force) return true;

  if (interactive) {
    const { confirm } = await import('@inquirer/prompts');
    return confirm({
      message: `${filePath} already exists. Overwrite?`,
      default: false,
    });
  }

  console.error(`${YELLOW}⚠ Skipping ${filePath} (already exists, use --force to overwrite)${RESET}`);
  return false;
}

function ensureParentDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ── Final summary ─────────────────────────────────────────────────────

function printFinalSummary(result: WriteResult): void {
  const total = result.written.length;
  if (total === 0) {
    console.error(`${YELLOW}No files were generated.${RESET}`);
    return;
  }

  console.error(`\n✨ Generated ${total} file${total === 1 ? '' : 's'}:`);
  for (const f of result.written) {
    console.error(`  ${GREEN}✓${RESET} ${f}`);
  }
  for (const f of result.skipped) {
    console.error(`  ${DIM}⊘ ${f} (skipped)${RESET}`);
  }
  console.error('');
}

// ── Format parser ─────────────────────────────────────────────────────

const VALID_FORMATS: OutputFormat[] = ['claude', 'cursor', 'windsurf', 'copilot', 'codex'];

function parseFormats(raw: string): OutputFormat[] {
  const parts = raw.split(',').map((s) => s.trim().toLowerCase());
  const invalid = parts.filter((p) => !VALID_FORMATS.includes(p as OutputFormat));

  if (invalid.length > 0) {
    console.error(`${RED}Unknown format(s): ${invalid.join(', ')}${RESET}`);
    console.error(`Valid formats: ${VALID_FORMATS.join(', ')}`);
    process.exit(1);
  }

  return parts as OutputFormat[];
}

// ── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const version = await loadVersion();

  const program = new Command()
    .name('dotai')
    .description('Auto-generate AI coding assistant config files for any codebase')
    .version(version, '-v, --version')
    .option('-f, --format <formats>', 'comma-separated formats (claude,cursor,windsurf,copilot,codex)', 'all')
    .option('-i, --interactive', 'guided setup with prompts', false)
    .option('-o, --output <dir>', 'output directory', process.cwd())
    .option('-d, --dry-run', 'print to stdout instead of writing files', false)
    .option('--force', 'overwrite existing files without prompting', false)
    .parse();

  const opts = program.opts<CliOptions>();
  const targetDir = resolve(opts.output);

  let ctx: ProjectContext;
  try {
    ctx = await scan(targetDir);
  } catch (err) {
    console.error(`${RED}Error scanning ${targetDir}: ${(err as Error).message}${RESET}`);
    process.exit(1);
  }

  if (ctx.languages.length === 0) {
    console.error(`${RED}No languages detected in ${targetDir}.${RESET}`);
    console.error('Is this a valid project directory?');
    process.exit(1);
  }

  printSummary(ctx);

  const formats = opts.format === 'all' ? undefined : parseFormats(opts.format);
  let generators = getGenerators(formats);

  if (generators.length === 0) {
    console.error(`${YELLOW}No generators matched the requested formats.${RESET}`);
    process.exit(1);
  }

  if (opts.interactive) {
    const result = await runInteractive(ctx, generators);
    generators = result.selectedGenerators;
    if (result.extraConventions) {
      ctx.conventions = [...ctx.conventions, result.extraConventions];
    }
  }

  if (opts.dryRun) {
    printDryRun(generators, ctx);
    return;
  }

  const result = await writeOutputs(generators, ctx, targetDir, opts.force, opts.interactive);
  printFinalSummary(result);
}

main().catch((err: unknown) => {
  console.error(`${RED}Fatal: ${(err as Error).message}${RESET}`);
  process.exit(1);
});
