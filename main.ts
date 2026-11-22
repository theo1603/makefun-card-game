// Ember Court — the entrypoint (Node 22, standard library only). The game is
// plain static files under game/ (game/index.html plus its ES modules, no
// library and no network request). This program hands the entry in: it copies
// game/ and screenshots/ from beside this file into the output directory and
// writes dossier.json there, the summary the judge reads, using the vendored
// make.fun library's buildDossier.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, name), { recursive: true });
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  copyTree('game');
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  copyTree('screenshots');
  // The scorer's own caps: only text_max_bytes shapes the bytes; the rest
  // refuse an entry the scorer would refuse (more than 4 screenshots or one
  // over 256 KiB; more than 993 files in game/ or 48 MiB of game files, or a
  // path under game/ over 1000 bytes — game/ counts beside /output's own
  // 1000-entry cap, its screenshots/ and dossier.json).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
