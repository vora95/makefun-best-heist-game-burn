// High Roller Heist — the hand-in program (Node 22, standard library
// only). It takes this repository's game/ and screenshots/ and lays them
// out under the output directory the grader gives it, then writes the
// dossier the judge reads with the kit's vendored library. It runs
// twice in grading and both runs must write identical bytes, so it does
// nothing but copy files and build the dossier — no timestamps, no
// randomness, no network.
//
// Local check: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The caps mirror the sealed gate's own limits, so a local run refuses
// exactly what the grader would refuse: at most 4 screenshots, each at
// most 256 KiB, game/ within its file and byte caps, and the dossier
// text capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
