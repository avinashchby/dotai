import type { ProjectContext, LanguageInfo } from '../types.js';

const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.java': 'Java',
  '.php': 'PHP',
  '.cs': 'C#',
};

/** Count files per language based on file extensions. */
function countByLanguage(files: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const file of files) {
    const dot = file.lastIndexOf('.');
    if (dot === -1) continue;

    const ext = file.slice(dot);
    const lang = EXT_TO_LANG[ext];
    if (lang) {
      counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
  }

  return counts;
}

/** Promote JS files to TS if tsconfig.json exists. */
function applyTsconfigPromotion(
  counts: Map<string, number>,
  files: string[],
): void {
  const hasTsconfig = files.some((f) => f === 'tsconfig.json' || f.endsWith('/tsconfig.json'));
  if (!hasTsconfig) return;

  const jsCount = counts.get('JavaScript') ?? 0;
  if (jsCount === 0) return;
  if (counts.has('TypeScript')) return;

  counts.set('TypeScript', jsCount);
  counts.delete('JavaScript');
}

/** Detect programming languages by file extension frequency. */
export async function detectLanguages(
  files: string[],
  _rootPath: string,
): Promise<Partial<ProjectContext>> {
  const counts = countByLanguage(files);
  applyTsconfigPromotion(counts, files);

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return {};

  const languages: LanguageInfo[] = Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return { languages };
}
