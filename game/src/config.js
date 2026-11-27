// Gobble Dash — Turkey Escape: every tuning number in one place. The playfield
// is a fixed 1280x720 logical area; the renderer scales it to the window, so no
// rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const BEST_KEY = 'gobble-dash-best-score';

export const TURKEY = {
  x: 260,
  w: 78,
  h: 84,
  slideH: 46,
  jumpV: 1000,
  doubleJumpV: 900,
  gravity: 2400,
};

export const RUN = {
  startSpeed: 300,
  maxSpeed: 560,
  speedGainPerMetre: 0.16,
  escapeDistance: 1200,
  pxPerMetre: 10,
};

export const LIVES = 3;
export const FARMER_START_GAP = 90; // metres behind the turkey
export const FARMER_HIT_GAIN = 22; // metres the farmer gains on a stumble
export const FARMER_RECOVER_PER_METRE = 0.012; // metres regained per clean metre

export const SPAWN = {
  firstAt: 420, // px of travel before the first hazard
  minGap: 220,
  maxGap: 520,
  gapShrinkPerMetre: 0.15,
  minGapFloor: 320,
};

export const SCORE = {
  metre: 1,
  corn: 25,
  feather: 100,
  chili: 50,
  escape: 500,
  heartBonus: 100,
  comboWindow: 2.0,
  maxCombo: 5,
};

export const POWERUP = {
  pumpkinSeconds: 6, // shield: absorbs one hit, doubles pickup points
  chiliSeconds: 4, // speed burst: +35% speed, +1 score per metre
};
