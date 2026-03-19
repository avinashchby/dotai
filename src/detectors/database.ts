import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../types.js';

/** Try to read a text file, returning null on failure. */
async function readText(rootPath: string, name: string): Promise<string | null> {
  try {
    return await readFile(join(rootPath, name), 'utf8');
  } catch {
    return null;
  }
}

/** Try to read and parse a JSON file, returning null on failure. */
async function readJson(rootPath: string, name: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(rootPath, name), 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
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

interface DbRule {
  packages: string[];
  name: string;
}

/** Database detection rules: if any package matches, the database is detected. */
const DB_RULES: DbRule[] = [
  { packages: ['pg', 'postgres', 'postgresql', 'psycopg2', 'psycopg2-binary'], name: 'PostgreSQL' },
  { packages: ['mysql2', 'mysql', 'pymysql'], name: 'MySQL' },
  { packages: ['better-sqlite3', 'sqlite3', 'rusqlite'], name: 'SQLite' },
  { packages: ['mongodb', 'mongoose', 'pymongo', 'motor'], name: 'MongoDB' },
  { packages: ['redis', 'ioredis'], name: 'Redis' },
];

interface OrmRule {
  packages: string[];
  name: string;
}

/** ORM detection rules: first match wins. */
const ORM_RULES: OrmRule[] = [
  { packages: ['@prisma/client', 'prisma'], name: 'Prisma' },
  { packages: ['drizzle-orm'], name: 'Drizzle' },
  { packages: ['typeorm'], name: 'TypeORM' },
  { packages: ['sequelize'], name: 'Sequelize' },
  { packages: ['sqlalchemy'], name: 'SQLAlchemy' },
  { packages: ['diesel'], name: 'Diesel' },
  { packages: ['gorm'], name: 'GORM' },
  { packages: ['activerecord'], name: 'ActiveRecord' },
];

/** Collect all dependency names from JS, Python, Rust, Go, and Ruby manifests. */
async function collectAllDeps(
  files: string[],
  rootPath: string,
): Promise<Set<string>> {
  const all = new Set<string>();

  const [pkg, pyproject, cargo, gomod, gemfile] = await Promise.all([
    readJson(rootPath, 'package.json'),
    readText(rootPath, 'pyproject.toml'),
    readText(rootPath, 'Cargo.toml'),
    readText(rootPath, 'go.mod'),
    readText(rootPath, 'Gemfile'),
  ]);

  if (pkg) {
    for (const dep of npmDeps(pkg)) all.add(dep);
  }

  if (pyproject) {
    addTextDeps(pyproject, all);
  }

  if (cargo) {
    addTextDeps(cargo, all);
  }

  if (gomod) {
    addTextDeps(gomod, all);
  }

  if (gemfile) {
    addTextDeps(gemfile, all);
    // Rails implies ActiveRecord
    if (gemfile.includes('rails')) all.add('activerecord');
  }

  // Prisma directory presence
  if (files.some((f) => f === 'prisma' || f.startsWith('prisma/'))) {
    all.add('prisma');
  }

  return all;
}

/** Add dependency-like tokens from a text file (line-by-line scan). */
function addTextDeps(text: string, deps: Set<string>): void {
  for (const line of text.split('\n')) {
    const trimmed = line.trim().replace(/^["']|["'],?$/g, '');
    const name = trimmed.split(/[>=<!\[;@ ]/)[0].toLowerCase();
    if (name) deps.add(name);
  }
}

/** Match collected deps against a set of rules, returning matched names. */
function matchRules(deps: Set<string>, rules: DbRule[]): string[] {
  const matched: string[] = [];
  for (const rule of rules) {
    if (rule.packages.some((p) => deps.has(p))) {
      matched.push(rule.name);
    }
  }
  return matched;
}

/** Find the first ORM that matches collected deps. */
function matchOrm(deps: Set<string>): string | null {
  for (const rule of ORM_RULES) {
    if (rule.packages.some((p) => deps.has(p))) {
      return rule.name;
    }
  }
  return null;
}

/** Detect databases and ORMs from project dependency files. */
export async function detectDatabases(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const deps = await collectAllDeps(files, rootPath);
  const databases = matchRules(deps, DB_RULES);
  const orm = matchOrm(deps);

  return { databases, orm };
}
