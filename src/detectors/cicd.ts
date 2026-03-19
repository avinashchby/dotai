import type { ProjectContext, CicdInfo } from '../types.js';

/** Match GitHub Actions workflow files under .github/workflows/. */
function detectGitHubActions(files: string[]): CicdInfo[] {
  const prefix = '.github/workflows/';
  return files
    .filter((f) => f.startsWith(prefix) && (f.endsWith('.yml') || f.endsWith('.yaml')))
    .map((f) => ({ platform: 'GitHub Actions', configFile: f }));
}

/** Simple CI/CD config file rules (single-file detection). */
const CICD_RULES: Array<{ file: string; platform: string }> = [
  { file: '.gitlab-ci.yml', platform: 'GitLab CI' },
  { file: '.circleci/config.yml', platform: 'CircleCI' },
  { file: 'Jenkinsfile', platform: 'Jenkins' },
  { file: '.travis.yml', platform: 'Travis CI' },
  { file: 'bitbucket-pipelines.yml', platform: 'Bitbucket Pipelines' },
];

/** Detect CI/CD platforms from project files. */
export async function detectCicd(
  files: string[],
  _rootPath: string,
): Promise<Partial<ProjectContext>> {
  const cicd: CicdInfo[] = [];
  const fileSet = new Set(files);

  cicd.push(...detectGitHubActions(files));

  for (const rule of CICD_RULES) {
    if (fileSet.has(rule.file)) {
      cicd.push({ platform: rule.platform, configFile: rule.file });
    }
  }

  if (cicd.length === 0) return {};
  return { cicd };
}
