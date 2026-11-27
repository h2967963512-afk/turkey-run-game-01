// Gobble Dash — Turkey Escape: the farm's state and rules. A fixed-step side
// scrolling runner: the turkey flees the farm, jumps fences, hay bales, bear
// traps, ovens and foxes, slides under the farmer's hanging carving knife, grabs
// corn and feathers, and must reach the forest 1200 m away before the farmer
// catches it. Every layout comes from the seed, so a `?seed=N` run is identical.

import { FIELD, STEP, TURKEY, RUN, LIVES, FARMER_START_GAP, FARMER_HIT_GAIN, FARMER_RECOVER_PER_METRE, SPAWN, SCORE, POWERUP } from './config.js';
import { clamp, makeRng } from './random.js';

const OBSTACLES = {
  fence: { w: 46, h: 64, jump: true },
  bale: { w: 74, h: 58, jump: true },
  trap: { w: 64, h: 26, jump: true },
  oven: { w: 84, h: 72, jump: true },
  fox: { w: 92, h: 62, jump: true, chases: true },
  knife: { w: 40, h: 85, hang: true }, // hangs at head height: slide under it
};

/** A fresh world for `seed`, on the title screen. */
export function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    state: 'title',
    time: 0,
    travel: 0, // px scrolled, the spawn clock
    distance: 0, // metres run
    speed: RUN.startSpeed,
    score: 0,
    scoreFrac: 0,
    hearts: LIVES,
    farmerGap: FARMER_START_GAP,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    shieldT: 0,
    chiliT: 0,
    turkey: { y: FIELD.groundY, vy: 0, jumps: 0, sliding: false, slideT: 0, invulnT: 0, runPhase: 0 },
    obstacles: [],
    pickups: [],
    nextSpawnAt: SPAWN.firstAt,
    dodged: 0,
    collected: 0,
    cause: '',
    message: null,
    messageT: 0,
    startedAt: 0,
  };
}

/** Begin (or restart) a run from the title / end screen. */
export function startRun(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh, { state: 'playing', startedAt: world.time });
  world.message = 'RUN! The farmer is coming — go, go, go!';
  world.messageT = 2.2;
}

function speedOf(world) {
  const base = RUN.startSpeed + world.distance * RUN.speedGainPerMetre;
  const boost = world.chiliT > 0 ? 1.35 : 1;
  return Math.min(RUN.maxSpeed, base) * boost;
}

function turkeyBox(world) {
  const t = world.turkey;
  const h = t.sliding ? TURKEY.slideH : TURKEY.h;
  // A forgiving hitbox, a little smaller than the drawn turkey.
  return { x: TURKEY.x + 8, y: t.y - h + 4, w: TURKEY.w - 16, h: h - 4 };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnPattern(world) {
  const rng = world.rng;
  const d = world.distance;
  const x = FIELD.width + 120;
  const roll = rng();
  const gapBase = Math.max(SPAWN.minGapFloor, SPAWN.maxGap - d * SPAWN.gapShrinkPerMetre - rng() * 180);
  world.nextSpawnAt = world.travel + gapBase + rng() * 180;

  const addObstacle = (kind, dx = 0) => {
    const def = OBSTACLES[kind];
    world.obstacles.push({ kind, x: x + dx, w: def.w, h: def.h, passed: false, hit: false });
  };
  const addPickup = (kind, dx, dy) => {
    world.pickups.push({ kind, x: x + dx, y: FIELD.groundY - dy, taken: false });
  };
  const cornArc = (dx) => {
    addPickup('corn', dx, 70);
    addPickup('corn', dx + 56, 120);
    addPickup('corn', dx + 112, 70);
  };

  if (roll < 0.16) {
    // Corn trail on open ground.
    for (let i = 0; i < 4; i++) addPickup('corn', i * 64, 46);
    if (rng() < 0.3) addPickup('feather', 300, 190);
  } else if (roll < 0.34) {
    // Single jumpable hazard, often with a corn arc over it.
    const kinds = ['fence', 'bale', 'trap', 'oven'];
    const kind = kinds[Math.floor(rng() * kinds.length)];
    addObstacle(kind);
    if (rng() < 0.6) cornArc(-40);
  } else if (roll < 0.46 && d > 150) {
    // The fox sprints in from the right.
    addObstacle('fox');
    if (rng() < 0.5) addPickup('corn', 190, 46);
  } else if (roll < 0.58 && d > 250) {
    // The carving knife dangles from a low branch: slide under it.
    addObstacle('knife');
    addPickup('corn', 150, 46);
    if (rng() < 0.4) addPickup('feather', 220, 190);
  } else if (roll < 0.72 && d > 350) {
    // Two hazards in a row: jump, land, jump again.
    const kinds = ['fence', 'bale', 'trap', 'oven'];
    addObstacle(kinds[Math.floor(rng() * kinds.length)]);
    addObstacle(kinds[Math.floor(rng() * kinds.length)], 360);
    cornArc(90);
  } else if (roll < 0.8) {
    // A power-up on the path.
    addPickup(rng() < 0.55 ? 'pumpkin' : 'chili', 0, 46);
    for (let i = 0; i < 3; i++) addPickup('corn', 90 + i * 64, 46);
  } else if (roll < 0.9 && d > 500) {
    // Knife plus a fox behind it: slide, then jump.
    addObstacle('knife');
    addObstacle('fox', 300);
  } else {
    // Feather high up: worth the jump.
    addPickup('feather', 0, 210);
    addPickup('corn', 70, 120);
    addPickup('corn', 130, 120);
  }
}

function addScore(world, base) {
  const mult = 1 + (world.combo > 0 ? world.combo - 1 : 0) * 0.5;
  const shield = world.shieldT > 0 ? 2 : 1;
  world.score += Math.round(base * mult * shield);
}

function collect(world, p) {
  p.taken = true;
  world.collected++;
  world.combo = Math.min(SCORE.maxCombo, world.combo + 1);
  world.comboT = SCORE.comboWindow;
  world.maxCombo = Math.max(world.maxCombo, world.combo);
  if (p.kind === 'corn') addScore(world, SCORE.corn);
  else if (p.kind === 'feather') addScore(world, SCORE.feather);
  else if (p.kind === 'chili') {
    addScore(world, SCORE.chili);
    world.chiliT = POWERUP.chiliSeconds;
    world.message = 'CHILI BURST! Faster — and every metre pays double!';
    world.messageT = 1.8;
  } else if (p.kind === 'pumpkin') {
    world.shieldT = POWERUP.pumpkinSeconds;
    world.message = 'PUMPKIN SHIELD! One hit bounces off — pickups pay double!';
    world.messageT = 1.8;
  }
}

function stumble(world, kind) {
  const t = world.turkey;
  if (t.invulnT > 0) return;
  if (world.shieldT > 0) {
    world.shieldT = 0;
    t.invulnT = 1.2;
    world.message = 'Shield saved you! The pumpkin took the hit.';
    world.messageT = 1.6;
    return;
  }
  world.hearts--;
  world.combo = 0;
  world.comboT = 0;
  t.invulnT = 1.6;
  world.farmerGap = Math.max(0, world.farmerGap - FARMER_HIT_GAIN);
  world.message = kind === 'fox' ? 'The fox nipped you! The farmer gains!' : 'Ouch! The farmer gains on you!';
  world.messageT = 1.6;
  if (world.hearts <= 0 || world.farmerGap <= 0) {
    world.state = 'caught';
    world.cause = world.farmerGap <= 0 ? 'The farmer caught you by the tail feathers.' : 'Three stumbles — the farmer caught up.';
  }
}

/** One fixed simulation step. `input` is { jump: bool (edge), slide: bool (held) }. */
export function stepWorld(world, input, dt) {
  if (world.state !== 'playing') return;
  world.time += dt;
  const t = world.turkey;

  world.speed = speedOf(world);
  const dx = world.speed * dt;
  world.travel += dx;
  const metres = dx / RUN.pxPerMetre;
  world.distance += metres;
  world.scoreFrac += metres * (world.chiliT > 0 ? 2 : 1);
  if (world.scoreFrac >= 1) {
    world.score += Math.floor(world.scoreFrac);
    world.scoreFrac -= Math.floor(world.scoreFrac);
  }
  if (world.comboT > 0) {
    world.comboT -= dt;
    if (world.comboT <= 0) world.combo = 0;
  }
  if (world.shieldT > 0) world.shieldT -= dt;
  if (world.chiliT > 0) world.chiliT -= dt;
  if (t.invulnT > 0) t.invulnT -= dt;
  if (world.messageT > 0) world.messageT -= dt;
  // Clean running slowly shakes the farmer off.
  world.farmerGap = Math.min(FARMER_START_GAP, world.farmerGap + metres * FARMER_RECOVER_PER_METRE);

  // Turkey vertical motion.
  const onGround = t.y >= FIELD.groundY;
  if (input.jump) {
    if (onGround) {
      t.vy = -TURKEY.jumpV;
      t.jumps = 1;
      t.sliding = false;
    } else if (t.jumps < 2) {
      t.vy = -TURKEY.doubleJumpV;
      t.jumps = 2;
    }
  }
  t.sliding = input.slide && onGround && t.vy >= 0;
  if (t.sliding) t.slideT += dt; else t.slideT = 0;
  t.vy += TURKEY.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= FIELD.groundY) {
    t.y = FIELD.groundY;
    t.vy = 0;
    t.jumps = 0;
  }
  t.runPhase += dt * (world.speed / 28);

  // Spawn ahead.
  if (world.travel >= world.nextSpawnAt) spawnPattern(world);

  // Move and resolve obstacles.
  const box = turkeyBox(world);
  for (const o of world.obstacles) {
    o.x -= dx * (o.kind === 'fox' ? 1.35 : 1);
    const def = OBSTACLES[o.kind];
    let ob;
    if (def.hang) {
      // The knife hangs from a branch: its blade is head-height, the turkey
      // must slide under it (a sliding turkey is shorter than the blade's tip).
      ob = { x: o.x + 4, y: FIELD.groundY - 140, w: o.w - 8, h: def.h };
    } else {
      ob = { x: o.x + 4, y: FIELD.groundY - o.h + 4, w: o.w - 8, h: o.h - 4 };
    }
    if (!o.passed && o.x + o.w < TURKEY.x) {
      o.passed = true;
      world.dodged++;
    }
    if (!o.hit && t.invulnT <= 0 && overlap(box, ob)) {
      o.hit = true;
      stumble(world, o.kind);
      if (world.state !== 'playing') return;
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.w > -80);

  // Pickups.
  for (const p of world.pickups) {
    p.x -= dx;
    if (!p.taken) {
      const pb = { x: p.x - 18, y: p.y - 18, w: 36, h: 36 };
      if (overlap(box, pb)) collect(world, p);
    }
  }
  world.pickups = world.pickups.filter((p) => p.x > -60 && !p.taken);

  // Escape!
  if (world.distance >= RUN.escapeDistance) {
    world.state = 'escaped';
    world.score += SCORE.escape + world.hearts * SCORE.heartBonus;
    world.cause = 'You reached the forest — free for another year!';
  }
}

export function scoreOf(world) {
  return world.score;
}

/** The autopilot: jumps jumpable hazards, slides under knives, grabs high pickups. */
export function autopilotInput(world) {
  const t = world.turkey;
  const onGround = t.y >= FIELD.groundY;
  let jump = false;
  let slide = false;
  let nearest = null;
  for (const o of world.obstacles) {
    if (o.x + o.w < TURKEY.x - 10) continue;
    if (!nearest || o.x < nearest.x) nearest = o;
  }
  if (nearest) {
    const gap = nearest.x - (TURKEY.x + TURKEY.w);
    const def = OBSTACLES[nearest.kind];
    // Hazards close at the scroll speed (foxes faster, they run at you).
    const approach = nearest.kind === 'fox' ? world.speed * 1.35 : world.speed;
    if (def.hang) {
      // Keep sliding until the knife's far edge is past the turkey's tail.
      slide = gap < 320 && gap > -130;
    } else if (onGround && gap < approach * 0.4 && gap > -20) {
      jump = true;
    } else if (!onGround && t.jumps < 2 && gap < 200 && t.vy > -300) {
      // Still airborne, past the jump's apex, and another hazard is close:
      // double-jump to stretch the flight over the cluster.
      jump = true;
    }
  }
  if (!jump && !slide && onGround) {
    // Hop for a high feather or corn arc overhead — never while a hazard is near.
    const hazardNear = nearest && nearest.x - (TURKEY.x + TURKEY.w) < 700;
    if (!hazardNear) {
      for (const p of world.pickups) {
        const px = p.x - TURKEY.x;
        if ((p.kind === 'feather' || p.y < FIELD.groundY - 100) && px > 40 && px < 220) {
          jump = true;
          break;
        }
      }
    }
  }
  return { jump, slide };
}
