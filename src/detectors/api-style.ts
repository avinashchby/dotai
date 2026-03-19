import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectContext, ApiStyle } from '../types.js';

/** Read dependency names from package.json (both deps and devDeps). */
async function readDependencyNames(rootPath: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(rootPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const deps = Object.keys((pkg['dependencies'] as Record<string, string>) ?? {});
    const devDeps = Object.keys((pkg['devDependencies'] as Record<string, string>) ?? {});
    return new Set([...deps, ...devDeps]);
  } catch {
    return new Set();
  }
}

/** Check if any file matches a given extension. */
function hasFileWithExt(files: string[], ext: string): boolean {
  return files.some((f) => f.endsWith(ext));
}

/** Detect REST framework dependencies. */
function detectRest(deps: Set<string>): boolean {
  const restPackages = ['express', 'fastify', 'hono', '@nestjs/common'];
  return restPackages.some((pkg) => deps.has(pkg));
}

/** Detect GraphQL from deps or .graphql files. */
function detectGraphQL(deps: Set<string>, files: string[]): boolean {
  const gqlPackages = ['graphql', '@apollo/server', 'type-graphql'];
  return gqlPackages.some((pkg) => deps.has(pkg)) || hasFileWithExt(files, '.graphql');
}

/** Detect gRPC from deps or .proto files. */
function detectGrpc(deps: Set<string>, files: string[]): boolean {
  const grpcPackages = ['@grpc/grpc-js', 'tonic'];
  return grpcPackages.some((pkg) => deps.has(pkg)) || hasFileWithExt(files, '.proto');
}

/** Detect API styles from project dependencies and file patterns. */
export async function detectApiStyles(
  files: string[],
  rootPath: string,
): Promise<Partial<ProjectContext>> {
  const deps = await readDependencyNames(rootPath);
  const apiStyles: ApiStyle[] = [];

  if (detectRest(deps)) apiStyles.push('REST');
  if (detectGraphQL(deps, files)) apiStyles.push('GraphQL');
  if (detectGrpc(deps, files)) apiStyles.push('gRPC');
  if (deps.has('@trpc/server')) apiStyles.push('tRPC');
  if (deps.has('ws') || deps.has('socket.io')) apiStyles.push('WebSocket');

  if (apiStyles.length === 0) return {};
  return { apiStyles };
}
