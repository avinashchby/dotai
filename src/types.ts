/** Information about a detected programming language and its prevalence. */
export interface ProjectContext {
  rootPath: string;
  languages: LanguageInfo[];
  packageManager: PackageManager | null;
  framework: FrameworkInfo | null;
  testFramework: TestFrameworkInfo | null;
  linters: ToolInfo[];
  formatters: ToolInfo[];
  databases: string[];
  orm: string | null;
  deployment: string[];
  monorepo: MonorepoInfo | null;
  cicd: CicdInfo[];
  apiStyles: ApiStyle[];
  buildTool: string | null;
  sourceDir: string | null;
  hasDocker: boolean;
  nodeVersion: string | null;
  conventions: string[];
}

export interface LanguageInfo {
  name: string;
  percentage: number;
}

export interface FrameworkInfo {
  name: string;
  version?: string;
}

export interface TestFrameworkInfo {
  name: string;
  configFile?: string;
}

export interface ToolInfo {
  name: string;
  configFile?: string;
}

export interface MonorepoInfo {
  tool: string;
  packages: string[];
}

export interface CicdInfo {
  platform: string;
  configFile: string;
}

export type PackageManager =
  | 'npm' | 'yarn' | 'pnpm' | 'bun'
  | 'uv' | 'pip' | 'poetry'
  | 'cargo' | 'go' | 'bundler' | 'composer'
  | 'maven' | 'gradle' | 'dotnet';

export type ApiStyle = 'REST' | 'GraphQL' | 'gRPC' | 'tRPC' | 'WebSocket';

export type OutputFormat = 'claude' | 'cursor' | 'windsurf' | 'copilot' | 'codex';

export interface Generator {
  name: string;
  fileName: string;
  generate(ctx: ProjectContext): string;
}

export interface DetectorResult {
  [key: string]: unknown;
}

/** Creates a blank ProjectContext with sensible defaults. */
export function createEmptyContext(rootPath: string): ProjectContext {
  return {
    rootPath,
    languages: [],
    packageManager: null,
    framework: null,
    testFramework: null,
    linters: [],
    formatters: [],
    databases: [],
    orm: null,
    deployment: [],
    monorepo: null,
    cicd: [],
    apiStyles: [],
    buildTool: null,
    sourceDir: null,
    hasDocker: false,
    nodeVersion: null,
    conventions: [],
  };
}
