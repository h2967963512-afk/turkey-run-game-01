// Gobble Dash — Turkey Escape, a turkey-run-game-01 entry (Node 22,
// standard library only): the game is this directory's game/ folder, plain static
// files a desktop browser loads offline (game/index.html and its ES modules, no
// library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer refuses an entry whose game/ is over 48 MiB or whose screenshots
// are over 256 KiB each: check the sizes up front, while the error can still
// name the file that broke the cap, instead of failing inside buildDossier.
function totalBytes(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    total += stats.isDirectory() ? totalBytes(path) : stats.size;
  }
  return total;
}

function checkSizes() {
  const gameBytes = totalBytes(join(here, 'game'));
  if (gameBytes > 50331648) {
    throw new Error(`main.ts: game/ is ${gameBytes} bytes, over the 48 MiB cap`);
  }
  for (const name of readdirSync(join(here, 'screenshots'))) {
    const size = statSync(join(here, 'screenshots', name)).size;
    if (size > 262144) {
      throw new Error(`main.ts: screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
    }
  }
}

checkSizes();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Fail fast on an incomplete entry instead of handing in a broken dossier: the
// game must have its page shell, and the screenshots must already exist (the
// dossier refuses an entry with no cover image, but this names the missing piece).
if (!existsSync(join(out, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing; the entry is incomplete');
}
if (!existsSync(join(out, 'screenshots')) || !existsSync(join(here, 'screenshots'))) {
  throw new Error('main.ts: screenshots/ is missing; take the 4 staged shots first');
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
