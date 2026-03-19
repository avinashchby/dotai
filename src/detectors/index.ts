import type { ProjectContext } from '../types.js';
import { detectLanguages } from './language.js';
import { detectPackageManager } from './package-manager.js';
import { detectFramework } from './framework.js';
import { detectTesting } from './testing.js';
import { detectLinters } from './linter.js';
import { detectDatabases } from './database.js';
import { detectDeployment } from './deployment.js';
import { detectCicd } from './cicd.js';
import { detectMonorepo } from './monorepo.js';
import { detectApiStyles } from './api-style.js';

/** Detector function signature: receives file list and root path, returns partial context. */
export type DetectorFn = (files: string[], rootPath: string) => Promise<Partial<ProjectContext>>;

/** All registered detectors. */
const detectors: DetectorFn[] = [
  detectLanguages,
  detectPackageManager,
  detectFramework,
  detectTesting,
  detectLinters,
  detectDatabases,
  detectDeployment,
  detectCicd,
  detectMonorepo,
  detectApiStyles,
];

export default detectors;
