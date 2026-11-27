// Gobble Dash — Turkey Escape: staged screenshot scenes. Each scene plays the real
// rules forward with the autopilot (the same stepWorld the player runs), then leaves
// the world frozen in a genuine state for the capture. `?shot=<name>&seed=N`.
//
//   start    — title screen over the farm, turkey running behind it
//   play     — mid-run: jumping a fence, corn ahead, farmer far behind
//   hazards  — deep in the run: knife, fox and oven in one stretch
//   end      — escaped: the forest, results on screen (or caught, honestly)

import { STEP } from './config.js';
import { autopilotInput, createWorld, scoreOf, startRun, stepWorld } from './world.js';

/** Step the autopilot forward `seconds` of game time. */
function runFor(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    if (world.state !== 'playing') break;
    stepWorld(world, autopilotInput(world), STEP);
  }
}

export function stageShot(world, name, seed) {
  if (name === 'start') {
    // Title screen: keep the world on title; main renders the autopilot behind it.
    const fresh = createWorld(seed);
    Object.assign(world, fresh, { state: 'title' });
    world.time = 0;
    return;
  }
  if (name === 'play') {
    startRun(world);
    runFor(world, 9);
    // Leave the state 'playing': the shot is a live run frame with the HUD.
    // (Pausing would paint the PAUSED overlay over the scene.)
    world.message = null;
    return;
  }
  if (name === 'hazards') {
    startRun(world);
    runFor(world, 26);
    world.message = null;
    return;
  }
  if (name === 'end') {
    startRun(world);
    // Play until the run ends (escape at 1200 m) or 150 s, whichever first.
    runFor(world, 150);
    if (world.state === 'playing') {
      // The autopilot survived but did not reach the forest in time: keep
      // playing honestly rather than inventing an ending.
      world.message = null;
    }
    return;
  }
  // Unknown scene: fall back to the title.
  const fresh = createWorld(seed);
  Object.assign(world, fresh, { state: 'title' });
}
