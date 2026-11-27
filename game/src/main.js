// Gobble Dash — Turkey Escape: boot and the frame loop. A fixed 1/60 s simulation
// step with an accumulator, so the run plays the same on any display; the title
// screen runs an autopilot turkey behind the title card.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawTitleScreen, render, renderScene } from './render.js';
import { stageShot } from './shots.js';
import { autopilotInput, createWorld, scoreOf, startRun, stepWorld } from './world.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = FIELD.width * dpr;
  canvas.height = FIELD.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const input = createInput(canvas);
const audio = createAudio();
let world = createWorld(seed);
// The title screen runs this second world on autopilot behind the title card.
let attract = createWorld(seed);
startRun(attract);

let lastHearts = world.hearts;
let lastCollected = 0;
let lastState = world.state;
let lastAnnounce = 0;
let wallTime = 0;
let last = performance.now();
let acc = 0;

function saveBest() {
  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  const s = scoreOf(world);
  if (s > best) localStorage.setItem(BEST_KEY, String(s));
}

function announce() {
  statusEl.textContent =
    world.state === 'playing'
      ? `Running: score ${scoreOf(world)}, ${Math.floor(world.distance)} metres, ${world.hearts} hearts, farmer ${Math.round(world.farmerGap)} metres behind, ${Math.max(0, Math.ceil(1200 - world.distance))} metres to the forest.`
      : world.state === 'caught'
        ? `Caught: ${world.cause} Score ${scoreOf(world)}. Press Space to run again.`
        : world.state === 'escaped'
          ? `Escaped! Score ${scoreOf(world)}. Press Space to run again.`
          : world.state === 'paused'
            ? 'Paused. Press P to keep running.'
            : 'Gobble Dash, Turkey Escape. Press Space to run.';
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  wallTime += dt;
  const keys = input.poll();

  // Edge-triggered keys.
  if (input.wasPressed(' ', 'Enter')) {
    audio.ensure();
    if (world.state === 'title' || world.state === 'caught' || world.state === 'escaped') {
      startRun(world);
      keys.jump = false; // don't spend the starting keypress as a jump
      lastHearts = world.hearts;
      lastCollected = 0;
      audio.gobble();
      audio.startMusic();
    } else if (world.state === 'paused') {
      world.state = 'playing';
      audio.click();
    }
    input.clearPressed();
  }
  if (input.wasPressed('p', 'P', 'Escape')) {
    if (world.state === 'playing') {
      world.state = 'paused';
      audio.click();
    } else if (world.state === 'paused') {
      world.state = 'playing';
      audio.click();
    }
    input.clearPressed();
  }
  if (input.wasPressed('r', 'R')) {
    if (world.state !== 'title') {
      startRun(world);
      lastHearts = world.hearts;
      lastCollected = 0;
      audio.gobble();
    }
    input.clearPressed();
  }
  if (input.wasPressed('m', 'M')) {
    const muted = audio.toggleMute();
    if (!muted && world.state === 'playing') audio.startMusic();
    input.clearPressed();
  }

  // Fixed-step simulation.
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    if (world.state === 'playing') {
      stepWorld(world, keys, STEP);
      keys.jump = false; // the jump edge fires on one step only
      if (world.hearts < lastHearts) {
        audio.stumble();
        if (world.state === 'playing') audio.farmerYell();
        lastHearts = world.hearts;
      }
      if (world.collected > lastCollected) {
        if (world.shieldT > 0 || world.chiliT > 0) audio.powerup();
        else audio.pickup(world.combo);
        lastCollected = world.collected;
      }
      if (world.state !== 'playing') {
        saveBest();
        if (world.state === 'escaped') audio.win();
        else audio.lose();
        audio.stopMusic();
      }
    }
    if (world.state === 'title') {
      stepWorld(attract, autopilotInput(attract), STEP);
      if (attract.state !== 'playing') {
        attract = createWorld(seed);
        startRun(attract);
      }
    }
  }

  if (world.state === 'title') {
    renderScene(ctx, attract);
    drawTitleScreen(ctx, world);
  } else {
    render(ctx, world);
  }

  if (world.state !== lastState || wallTime - lastAnnounce > 1) {
    announce();
    lastState = world.state;
    lastAnnounce = wallTime;
  }
  requestAnimationFrame(frame);
}

if (shot) {
  stageShot(world, shot, seed);
  if (world.state === 'playing') {
    // A staged shot is a frozen frame of a real run: render it once, no loop.
    render(ctx, world);
    announce();
    if (world.state === 'caught' || world.state === 'escaped') saveBest();
  } else {
    render(ctx, world);
    announce();
  }
} else {
  announce();
  requestAnimationFrame(frame);
}
