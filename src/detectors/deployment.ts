import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext } from '../types.js';

/** Check if a file contains a specific string pattern. */
async function fileContains(
  rootPath: string,
  filePath: string,
  pattern: string,
): Promise<boolean> {
  try {
    const content = await readFile(join(rootPath, filePath), 'utf-8');
    return content.includes(pattern);
  } catch {
    return false;
  }
}

/** Simple file-presence deployment rules. */
function detectSimpleDeployments(files: Set<string>): string[] {
  const results: string[] = [];

  if (files.has('vercel.json')) results.push('Vercel');
  if (files.has('netlify.toml')) results.push('Netlify');
  if (files.has('fly.toml')) results.push('Fly.io');
  if (files.has('railway.json') || files.has('railway.toml')) results.push('Railway');
  if (files.has('render.yaml')) results.push('Render');
  if (files.has('Procfile')) results.push('Heroku');
  if (files.has('cdk.json')) results.push('AWS CDK');
  if (files.has('wrangler.toml')) results.push('Cloudflare Workers');

  if (files.has('serverless.yml') || files.has('serverless.yaml')) {
    results.push('Serverless');
  }

  return results;
}

/** Detect deployments requiring file-list scanning (globs, directories). */
function detectPatternDeployments(allFiles: string[]): string[] {
  const results: string[] = [];

  if (allFiles.some((f) => f.endsWith('.tf'))) results.push('Terraform');

  const hasK8sDir = allFiles.some(
    (f) => f.startsWith('k8s/') || f.startsWith('kubernetes/'),
  );
  if (hasK8sDir) results.push('Kubernetes');

  if (allFiles.some((f) => f.startsWith('pulumi.') || f === 'Pulumi.yaml')) {
    results.push('Pulumi');
  }

  return results;
}

/** Detect deployment targets from project files. */
export async function detectDeployment(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const rootFiles = new Set(files.filter((f) => !f.includes('/')));
  const deployment: string[] = [];
  let hasDocker = false;

  if (files.some((f) => f === 'Dockerfile' || f.endsWith('/Dockerfile'))) {
    deployment.push('Docker');
    hasDocker = true;
  }

  deployment.push(...detectSimpleDeployments(rootFiles));
  deployment.push(...detectPatternDeployments(files));

  if (rootFiles.has('app.yaml')) {
    const isGcloud = await fileContains(rootPath, 'app.yaml', 'runtime:');
    if (isGcloud) deployment.push('Google Cloud');
  }

  if (deployment.length === 0 && !hasDocker) return {};
  return { deployment, hasDocker };
}
