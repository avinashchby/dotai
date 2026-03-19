import type { ProjectContext, PackageManager } from '../types.js';

interface LockFileRule {
  match: (file: string) => boolean;
  manager: PackageManager;
}

/** Ordered rules — first match wins. Lock files before config files. */
const RULES: LockFileRule[] = [
  { match: (f) => f === 'pnpm-lock.yaml', manager: 'pnpm' },
  { match: (f) => f === 'yarn.lock', manager: 'yarn' },
  { match: (f) => f === 'bun.lockb' || f === 'bun.lock', manager: 'bun' },
  { match: (f) => f === 'package-lock.json', manager: 'npm' },
  { match: (f) => f === 'Cargo.toml', manager: 'cargo' },
  { match: (f) => f === 'go.mod', manager: 'go' },
  { match: (f) => f === 'Gemfile.lock' || f === 'Gemfile', manager: 'bundler' },
  {
    match: (f) => f === 'composer.lock' || f === 'composer.json',
    manager: 'composer',
  },
  { match: (f) => f === 'pom.xml', manager: 'maven' },
  {
    match: (f) => f === 'build.gradle' || f === 'build.gradle.kts',
    manager: 'gradle',
  },
  { match: (f) => f.endsWith('.csproj') || f.endsWith('.sln'), manager: 'dotnet' },
  { match: (f) => f === 'uv.lock', manager: 'uv' },
  { match: (f) => f === 'poetry.lock', manager: 'poetry' },
  {
    match: (f) => f === 'requirements.txt' || f === 'pyproject.toml',
    manager: 'pip',
  },
];

/** Detect package manager by checking for lock/config files. */
export async function detectPackageManager(
  files: string[],
  _rootPath: string,
): Promise<Partial<ProjectContext>> {
  const rootFiles = new Set(files.filter((f) => !f.includes('/')));

  for (const rule of RULES) {
    for (const file of rootFiles) {
      if (rule.match(file)) {
        return { packageManager: rule.manager };
      }
    }
  }

  return {};
}
