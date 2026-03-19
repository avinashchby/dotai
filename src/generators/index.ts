import type { Generator, OutputFormat } from '../types.js';
import { claudeGenerator } from './claude.js';
import { cursorGenerator } from './cursor.js';
import { windsurfGenerator } from './windsurf.js';
import { copilotGenerator } from './copilot.js';
import { codexGenerator } from './codex.js';

/** All available generators. */
export const allGenerators: Generator[] = [
  claudeGenerator,
  cursorGenerator,
  windsurfGenerator,
  copilotGenerator,
  codexGenerator,
];

/**
 * Return generators matching the requested formats.
 * If no formats specified, returns all generators.
 */
export function getGenerators(formats?: OutputFormat[]): Generator[] {
  if (!formats || formats.length === 0) {
    return allGenerators;
  }
  const nameSet = new Set<string>(formats);
  return allGenerators.filter((g) => nameSet.has(g.name));
}
