import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FrameworkInfo, ProjectContext } from '../types.js';

/** Safely read and parse a JSON file, returning null on failure. */
async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Safely read a file as text, returning null on failure. */
async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/** Extract merged dependencies from package.json data. */
function extractNodeDeps(
  pkg: Record<string, unknown>,
): Record<string, string> {
  const deps = (pkg['dependencies'] ?? {}) as Record<string, string>;
  const devDeps = (pkg['devDependencies'] ?? {}) as Record<string, string>;
  return { ...deps, ...devDeps };
}

/** Look up a dep version, stripping leading ^ ~ = characters. */
function depVersion(
  deps: Record<string, string>,
  key: string,
): string | undefined {
  const v = deps[key];
  return v ? v.replace(/^[\^~=><]+/, '') : undefined;
}

/** Node.js framework rules ordered most-specific first. */
const NODE_RULES: Array<{ dep: string; name: string; exclude?: string[] }> = [
  { dep: 'next', name: 'Next.js' },
  { dep: 'nuxt', name: 'Nuxt' },
  { dep: '@angular/core', name: 'Angular' },
  { dep: '@sveltejs/kit', name: 'SvelteKit' },
  { dep: 'svelte', name: 'Svelte' },
  { dep: '@nestjs/core', name: 'NestJS' },
  { dep: 'react', name: 'React', exclude: ['next', 'nuxt', '@remix-run/react'] },
  { dep: 'vue', name: 'Vue', exclude: ['nuxt'] },
  { dep: 'express', name: 'Express' },
  { dep: 'fastify', name: 'Fastify' },
  { dep: 'hono', name: 'Hono' },
];

/** Detect framework from package.json dependencies. */
function detectNodeFramework(
  deps: Record<string, string>,
): FrameworkInfo | null {
  for (const rule of NODE_RULES) {
    if (!(rule.dep in deps)) continue;
    const excluded = rule.exclude?.some((ex) => ex in deps) ?? false;
    if (excluded) continue;
    return { name: rule.name, version: depVersion(deps, rule.dep) };
  }
  return null;
}

/** Detect Python framework from requirements.txt or pyproject.toml. */
async function detectPythonFramework(
  rootPath: string,
): Promise<FrameworkInfo | null> {
  const content = await gatherPythonDeps(rootPath);
  if (!content) return null;

  const lower = content.toLowerCase();
  if (lower.includes('django')) return { name: 'Django' };
  if (lower.includes('fastapi')) return { name: 'FastAPI' };
  if (lower.includes('flask')) return { name: 'Flask' };
  return null;
}

/** Read Python dependency sources and concatenate them. */
async function gatherPythonDeps(rootPath: string): Promise<string | null> {
  const reqTxt = await readFileContent(join(rootPath, 'requirements.txt'));
  const pyproject = await readFileContent(join(rootPath, 'pyproject.toml'));
  const combined = [reqTxt, pyproject].filter(Boolean).join('\n');
  return combined || null;
}

/** Detect Rust framework from Cargo.toml. */
async function detectRustFramework(
  rootPath: string,
): Promise<FrameworkInfo | null> {
  const content = await readFileContent(join(rootPath, 'Cargo.toml'));
  if (!content) return null;

  if (content.includes('actix-web')) return { name: 'Actix' };
  if (content.includes('axum')) return { name: 'Axum' };
  if (content.includes('rocket')) return { name: 'Rocket' };
  return null;
}

/** Detect Go framework from go.mod. */
async function detectGoFramework(
  rootPath: string,
): Promise<FrameworkInfo | null> {
  const content = await readFileContent(join(rootPath, 'go.mod'));
  if (!content) return null;

  if (content.includes('gin-gonic/gin')) return { name: 'Gin' };
  if (content.includes('gorilla/mux')) return { name: 'Gorilla' };
  if (content.includes('gofiber/fiber') || content.includes('/fiber'))
    return { name: 'Fiber' };
  if (content.includes('labstack/echo')) return { name: 'Echo' };
  return null;
}

/** Detect Ruby framework from Gemfile. */
async function detectRubyFramework(
  rootPath: string,
): Promise<FrameworkInfo | null> {
  const content = await readFileContent(join(rootPath, 'Gemfile'));
  if (!content) return null;

  if (content.includes('rails')) return { name: 'Rails' };
  if (content.includes('sinatra')) return { name: 'Sinatra' };
  return null;
}

/** Detect PHP framework from composer.json. */
async function detectPhpFramework(
  rootPath: string,
): Promise<FrameworkInfo | null> {
  const pkg = await readJsonFile(join(rootPath, 'composer.json'));
  if (!pkg) return null;

  const deps = extractComposerDeps(pkg);
  if (deps.includes('laravel')) return { name: 'Laravel' };
  if (deps.includes('symfony')) return { name: 'Symfony' };
  return null;
}

/** Extract composer dependency names as a single string. */
function extractComposerDeps(pkg: Record<string, unknown>): string {
  const req = pkg['require'] ?? {};
  const reqDev = pkg['require-dev'] ?? {};
  return Object.keys(req as Record<string, unknown>)
    .concat(Object.keys(reqDev as Record<string, unknown>))
    .join(' ')
    .toLowerCase();
}

/** Main framework detector. */
export async function detectFramework(
  _files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const pkg = await readJsonFile(join(rootPath, 'package.json'));
  if (pkg) {
    const deps = extractNodeDeps(pkg);
    const fw = detectNodeFramework(deps);
    if (fw) return { framework: fw };
  }

  const detectors = [
    detectPythonFramework(rootPath),
    detectRustFramework(rootPath),
    detectGoFramework(rootPath),
    detectRubyFramework(rootPath),
    detectPhpFramework(rootPath),
  ];

  for (const p of detectors) {
    const fw = await p;
    if (fw) return { framework: fw };
  }

  return {};
}
