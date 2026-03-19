import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext, TestFrameworkInfo } from '../types.js';

/** Safely read and parse a JSON file, returning null on failure. */
async function readJsonFile(
  filePath: string,
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Merge dependencies and devDependencies from package.json. */
function extractNodeDeps(
  pkg: Record<string, unknown>,
): Record<string, string> {
  const deps = (pkg['dependencies'] ?? {}) as Record<string, string>;
  const devDeps = (pkg['devDependencies'] ?? {}) as Record<string, string>;
  return { ...deps, ...devDeps };
}

/** Check if any file in the list matches a glob-like prefix + suffix. */
function findFile(
  files: string[],
  prefix: string,
  suffixes?: string[],
): string | undefined {
  return files.find((f) => {
    const name = f.split('/').pop() ?? '';
    if (suffixes) {
      return name.startsWith(prefix) && suffixes.some((s) => name.endsWith(s));
    }
    return name === prefix;
  });
}

/** Check if any file matches a predicate on its basename. */
function hasFileMatching(
  files: string[],
  predicate: (name: string) => boolean,
): boolean {
  return files.some((f) => predicate(f.split('/').pop() ?? ''));
}

/** Detect JS/TS test framework from package.json deps and config files. */
function detectNodeTestFramework(
  deps: Record<string, string>,
  files: string[],
): TestFrameworkInfo | null {
  return (
    detectVitest(deps, files) ??
    detectJest(deps, files) ??
    detectMocha(deps) ??
    detectPlaywright(deps) ??
    detectCypress(deps, files)
  );
}

/** Detect Vitest. */
function detectVitest(
  deps: Record<string, string>,
  files: string[],
): TestFrameworkInfo | null {
  if ('vitest' in deps) return { name: 'Vitest' };
  const cfg = findFile(files, 'vitest.config', ['.ts', '.js', '.mts', '.mjs']);
  if (cfg) return { name: 'Vitest', configFile: cfg };
  return null;
}

/** Detect Jest. */
function detectJest(
  deps: Record<string, string>,
  files: string[],
): TestFrameworkInfo | null {
  if ('jest' in deps) return { name: 'Jest' };
  const cfg = findFile(files, 'jest.config', ['.ts', '.js', '.mjs', '.cjs', '.json']);
  if (cfg) return { name: 'Jest', configFile: cfg };
  return null;
}

/** Detect Mocha. */
function detectMocha(
  deps: Record<string, string>,
): TestFrameworkInfo | null {
  return 'mocha' in deps ? { name: 'Mocha' } : null;
}

/** Detect Playwright. */
function detectPlaywright(
  deps: Record<string, string>,
): TestFrameworkInfo | null {
  return '@playwright/test' in deps ? { name: 'Playwright' } : null;
}

/** Detect Cypress. */
function detectCypress(
  deps: Record<string, string>,
  files: string[],
): TestFrameworkInfo | null {
  if ('cypress' in deps) return { name: 'Cypress' };
  const cfg = findFile(files, 'cypress.config', ['.ts', '.js', '.mjs', '.cjs']);
  if (cfg) return { name: 'Cypress', configFile: cfg };
  return null;
}

/** Detect pytest from Python dependency files or marker files. */
function detectPytest(files: string[]): TestFrameworkInfo | null {
  const markers = ['conftest.py', 'pytest.ini'];
  for (const m of markers) {
    const found = findFile(files, m);
    if (found) return { name: 'pytest', configFile: found };
  }

  const hasPytestDep = files.some((f) => {
    const name = f.split('/').pop() ?? '';
    return name === 'requirements.txt' || name === 'pyproject.toml';
  });
  // If Python project files exist, we'd need content check (handled below)
  return hasPytestDep ? null : null;
}

/** Detect pytest by reading Python dependency file contents. */
async function detectPytestFromDeps(
  rootPath: string,
): Promise<TestFrameworkInfo | null> {
  try {
    const paths = ['requirements.txt', 'pyproject.toml'];
    for (const p of paths) {
      const content = await readFile(join(rootPath, p), 'utf-8');
      if (content.toLowerCase().includes('pytest')) return { name: 'pytest' };
    }
  } catch {
    // Files don't exist, skip
  }
  return null;
}

/** Detect Go testing (convention-based: _test.go files). */
function detectGoTesting(files: string[]): TestFrameworkInfo | null {
  const found = hasFileMatching(files, (n) => n.endsWith('_test.go'));
  return found ? { name: 'Go testing' } : null;
}

/** Detect Rust tests (#[cfg(test)] in .rs files — heuristic via file list). */
function detectRustTesting(files: string[]): TestFrameworkInfo | null {
  const hasRs = hasFileMatching(files, (n) => n.endsWith('.rs'));
  // Rust projects with .rs files conventionally use built-in test framework
  return hasRs ? { name: 'Rust tests' } : null;
}

/** Detect RSpec from Gemfile or spec/ directory. */
function detectRspec(files: string[]): TestFrameworkInfo | null {
  const hasSpec = files.some((f) => f.includes('/spec/') || f.startsWith('spec/'));
  const hasGemfile = findFile(files, 'Gemfile');
  if (hasSpec || hasGemfile) return null; // Need content check
  return null;
}

/** Detect RSpec by reading Gemfile contents. */
async function detectRspecFromGemfile(
  rootPath: string,
  files: string[],
): Promise<TestFrameworkInfo | null> {
  try {
    const content = await readFile(join(rootPath, 'Gemfile'), 'utf-8');
    if (content.includes('rspec')) return { name: 'RSpec' };
  } catch {
    // no Gemfile
  }
  const hasSpecDir = files.some(
    (f) => f.includes('/spec/') || f.startsWith('spec/'),
  );
  return hasSpecDir ? { name: 'RSpec' } : null;
}

/** Detect PHPUnit from composer.json. */
async function detectPhpunit(
  rootPath: string,
): Promise<TestFrameworkInfo | null> {
  const pkg = await readJsonFile(join(rootPath, 'composer.json'));
  if (!pkg) return null;

  const reqDev = pkg['require-dev'] ?? {};
  const keys = Object.keys(reqDev as Record<string, unknown>).join(' ');
  return keys.includes('phpunit') ? { name: 'PHPUnit' } : null;
}

/** Main testing detector. */
export async function detectTesting(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  // Node.js detection
  const pkg = await readJsonFile(join(rootPath, 'package.json'));
  if (pkg) {
    const deps = extractNodeDeps(pkg);
    const result = detectNodeTestFramework(deps, files);
    if (result) return { testFramework: result };
  }

  // Python detection
  const pytest =
    detectPytest(files) ?? (await detectPytestFromDeps(rootPath));
  if (pytest) return { testFramework: pytest };

  // Go detection
  const goTest = detectGoTesting(files);
  if (goTest) return { testFramework: goTest };

  // Rust detection
  const rustTest = detectRustTesting(files);
  if (rustTest) return { testFramework: rustTest };

  // Ruby detection
  const rspec = await detectRspecFromGemfile(rootPath, files);
  if (rspec) return { testFramework: rspec };

  // PHP detection
  const phpunit = await detectPhpunit(rootPath);
  if (phpunit) return { testFramework: phpunit };

  return {};
}
