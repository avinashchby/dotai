import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext, ToolInfo } from '../types.js';

/** Try to read and parse a JSON file, returning null on failure. */
async function readJson(rootPath: string, name: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(rootPath, name), 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Try to read a text file, returning null on failure. */
async function readText(rootPath: string, name: string): Promise<string | null> {
  try {
    return await readFile(join(rootPath, name), 'utf8');
  } catch {
    return null;
  }
}

/** Extract all dependency names from a package.json object. */
function npmDeps(pkg: Record<string, unknown>): Set<string> {
  const deps = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const section = pkg[key];
    if (section && typeof section === 'object') {
      for (const name of Object.keys(section as Record<string, unknown>)) {
        deps.add(name);
      }
    }
  }
  return deps;
}

/** Extract Python dependency names from pyproject.toml text (simple line scan). */
function pythonDeps(text: string): Set<string> {
  const deps = new Set<string>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim().replace(/^["']|["'],?$/g, '');
    const name = trimmed.split(/[>=<!\[;@ ]/)[0].toLowerCase();
    if (name) deps.add(name);
  }
  return deps;
}

/** Check whether any file in the list matches a predicate. */
function hasFile(files: string[], test: (f: string) => boolean): string | undefined {
  return files.find(test);
}

/** Detect JS/TS linters and formatters from config files and package.json. */
async function detectJsTools(
  files: string[],
  rootPath: string,
  linters: ToolInfo[],
  formatters: ToolInfo[],
): Promise<void> {
  const pkg = await readJson(rootPath, 'package.json');
  const deps = pkg ? npmDeps(pkg) : new Set<string>();

  // ESLint
  const eslintCfg = hasFile(files, (f) =>
    /^\.?eslintrc/.test(f) || /^eslint\.config\./.test(f),
  );
  if (eslintCfg || deps.has('eslint')) {
    linters.push({ name: 'ESLint', configFile: eslintCfg });
  }

  // Biome (linter + formatter)
  const biomeCfg = hasFile(files, (f) => f === 'biome.json' || f === 'biome.jsonc');
  if (biomeCfg || deps.has('@biomejs/biome')) {
    linters.push({ name: 'Biome', configFile: biomeCfg });
    formatters.push({ name: 'Biome', configFile: biomeCfg });
  }

  // Prettier
  const prettierCfg = hasFile(files, (f) => /^\.prettierrc/.test(f));
  if (prettierCfg || deps.has('prettier')) {
    formatters.push({ name: 'Prettier', configFile: prettierCfg });
  }
}

/** Detect Python linters and formatters from pyproject.toml and config files. */
async function detectPythonTools(
  files: string[],
  rootPath: string,
  linters: ToolInfo[],
  formatters: ToolInfo[],
): Promise<void> {
  const pyproject = await readText(rootPath, 'pyproject.toml');
  const deps = pyproject ? pythonDeps(pyproject) : new Set<string>();

  // Ruff (linter + formatter)
  const ruffCfg = hasFile(files, (f) => f === 'ruff.toml' || f === '.ruff.toml');
  if (ruffCfg || deps.has('ruff')) {
    linters.push({ name: 'Ruff', configFile: ruffCfg });
    formatters.push({ name: 'Ruff', configFile: ruffCfg });
  }

  // Pylint
  if (deps.has('pylint')) {
    linters.push({ name: 'Pylint' });
  }

  // Flake8
  if (deps.has('flake8')) {
    linters.push({ name: 'Flake8' });
  }

  // Black
  if (deps.has('black')) {
    formatters.push({ name: 'Black' });
  }
}

/** Detect Go linters. */
function detectGoTools(files: string[], linters: ToolInfo[]): void {
  const cfg = hasFile(files, (f) => f === '.golangci.yml' || f === '.golangci.yaml');
  if (cfg) {
    linters.push({ name: 'golangci-lint', configFile: cfg });
  }
}

/** Detect Ruby linters/formatters from Gemfile. */
async function detectRubyTools(
  rootPath: string,
  linters: ToolInfo[],
  formatters: ToolInfo[],
): Promise<void> {
  const gemfile = await readText(rootPath, 'Gemfile');
  if (!gemfile) return;

  if (gemfile.includes('rubocop')) {
    linters.push({ name: 'RuboCop' });
    formatters.push({ name: 'RuboCop' });
  }
}

/** Detect Rust linters/formatters from Cargo.toml and config files. */
async function detectRustTools(
  files: string[],
  rootPath: string,
  linters: ToolInfo[],
  formatters: ToolInfo[],
): Promise<void> {
  const cargo = await readText(rootPath, 'Cargo.toml');
  if (cargo && cargo.includes('clippy')) {
    linters.push({ name: 'Clippy' });
  }

  const rustfmtCfg = hasFile(files, (f) => f === 'rustfmt.toml' || f === '.rustfmt.toml');
  if (rustfmtCfg) {
    formatters.push({ name: 'rustfmt', configFile: rustfmtCfg });
  }
}

/** Detect linters and formatters across all supported ecosystems. */
export async function detectLinters(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const linters: ToolInfo[] = [];
  const formatters: ToolInfo[] = [];

  await Promise.all([
    detectJsTools(files, rootPath, linters, formatters),
    detectPythonTools(files, rootPath, linters, formatters),
    detectRubyTools(rootPath, linters, formatters),
    detectRustTools(files, rootPath, linters, formatters),
  ]);

  detectGoTools(files, linters);

  return { linters, formatters };
}
