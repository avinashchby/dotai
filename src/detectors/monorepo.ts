import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext, MonorepoInfo } from '../types.js';

/** Safely read and parse a JSON file, returning null on failure. */
async function readJson(rootPath: string, file: string): Promise<unknown> {
  try {
    const content = await readFile(join(rootPath, file), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Safely read a text file, returning null on failure. */
async function readText(rootPath: string, file: string): Promise<string | null> {
  try {
    return await readFile(join(rootPath, file), 'utf-8');
  } catch {
    return null;
  }
}

/** Extract package dir names from workspace glob patterns in the file list. */
function extractPackageDirs(files: string[], patterns: string[]): string[] {
  const dirs = new Set<string>();
  for (const pattern of patterns) {
    const prefix = pattern.replace(/\/?\*.*$/, '');
    if (!prefix) continue;
    for (const f of files) {
      if (f.startsWith(prefix + '/')) {
        const rest = f.slice(prefix.length + 1);
        const dirName = rest.split('/')[0];
        if (dirName) dirs.add(dirName);
      }
    }
  }
  return Array.from(dirs).sort();
}

/** Detect Cargo workspace packages from Cargo.toml. */
async function detectCargoWorkspace(
  rootPath: string,
  files: string[],
): Promise<MonorepoInfo | null> {
  const content = await readText(rootPath, 'Cargo.toml');
  if (!content || !content.includes('[workspace]')) return null;

  const membersMatch = content.match(/members\s*=\s*\[([^\]]*)\]/);
  if (!membersMatch) return { tool: 'Cargo workspace', packages: [] };

  const patterns = membersMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  return { tool: 'Cargo workspace', packages: extractPackageDirs(files, patterns) };
}

/** Detect pnpm workspace packages. */
async function detectPnpmWorkspace(
  rootPath: string,
  files: string[],
): Promise<MonorepoInfo | null> {
  const content = await readText(rootPath, 'pnpm-workspace.yaml');
  if (!content) return null;

  const patterns: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*-\s+['"]?([^'"#\s]+)/);
    if (match) patterns.push(match[1]);
  }

  return { tool: 'pnpm workspaces', packages: extractPackageDirs(files, patterns) };
}

/** Detect npm/yarn workspaces from package.json. */
async function detectNpmWorkspaces(
  rootPath: string,
  files: string[],
): Promise<MonorepoInfo | null> {
  const pkg = await readJson(rootPath, 'package.json') as Record<string, unknown> | null;
  if (!pkg || !pkg['workspaces']) return null;

  const raw = pkg['workspaces'];
  const patterns = Array.isArray(raw) ? raw as string[] : [];

  return { tool: 'npm/yarn workspaces', packages: extractPackageDirs(files, patterns) };
}

/** Detect monorepo tool and list package directories. */
export async function detectMonorepo(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const fileSet = new Set(files);

  if (fileSet.has('turbo.json')) {
    const info = await detectPnpmWorkspace(rootPath, files)
      ?? await detectNpmWorkspaces(rootPath, files);
    return { monorepo: { tool: 'Turborepo', packages: info?.packages ?? [] } };
  }

  if (fileSet.has('nx.json')) {
    const info = await detectNpmWorkspaces(rootPath, files);
    return { monorepo: { tool: 'Nx', packages: info?.packages ?? [] } };
  }

  if (fileSet.has('lerna.json')) {
    const info = await detectNpmWorkspaces(rootPath, files);
    return { monorepo: { tool: 'Lerna', packages: info?.packages ?? [] } };
  }

  if (fileSet.has('pnpm-workspace.yaml')) {
    const info = await detectPnpmWorkspace(rootPath, files);
    if (info) return { monorepo: info };
  }

  const npmWs = await detectNpmWorkspaces(rootPath, files);
  if (npmWs) return { monorepo: npmWs };

  if (fileSet.has('Cargo.toml')) {
    const cargo = await detectCargoWorkspace(rootPath, files);
    if (cargo) return { monorepo: cargo };
  }

  return {};
}
