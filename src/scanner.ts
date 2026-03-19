import fg from 'fast-glob';
import type { ProjectContext } from './types.js';
import { createEmptyContext } from './types.js';
import detectors from './detectors/index.js';

const IGNORED_DIRS = [
  'node_modules', 'vendor', 'target', '.git', 'dist', 'build',
  '__pycache__', '.next', '.nuxt', 'coverage',
];

const MAX_DEPTH = 6;
const FILE_CAP = 10_000;

/** Collect file paths from the project root, respecting .gitignore and common ignores. */
async function collectFiles(rootPath: string): Promise<string[]> {
  const ignoreGlobs = IGNORED_DIRS.map((dir) => `**/${dir}/**`);

  const files = await fg('**/*', {
    cwd: rootPath,
    dot: true,
    ignore: ignoreGlobs,
    deep: MAX_DEPTH,
    onlyFiles: true,
    followSymbolicLinks: false,
  });

  return files.slice(0, FILE_CAP);
}

/** Merge a partial detector result into the accumulated context. */
function mergeResult(ctx: ProjectContext, partial: Partial<ProjectContext>): void {
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined || value === null) continue;

    const k = key as keyof ProjectContext;
    const current = ctx[k];

    if (Array.isArray(current) && Array.isArray(value)) {
      (ctx as unknown as Record<string, unknown>)[k] = [...current, ...value];
    } else if (current === null || current === undefined) {
      (ctx as unknown as Record<string, unknown>)[k] = value;
    }
    // Scalar first-write-wins: skip if already set
  }
}

/** Scan a project directory and build a full ProjectContext. */
export async function scan(rootPath: string): Promise<ProjectContext> {
  const files = await collectFiles(rootPath);
  const ctx = createEmptyContext(rootPath);

  const results = await Promise.all(
    detectors.map((detect) => detect(files, rootPath)),
  );

  for (const partial of results) {
    mergeResult(ctx, partial);
  }

  return ctx;
}
