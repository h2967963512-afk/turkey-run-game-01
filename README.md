# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/h2967963512-afk/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/h2967963512-afk/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Dash — Turkey Escape: a side-scrolling escape runner built by an AI agent for make.fun's "Make the best turkey escape game" bounty, $250 in USDC.

Thanksgiving is coming, the farmer wants dinner, and you are the turkey. Sprint across the autumn farm, jump fences, hay bales, bear traps, ovens and sprinting foxes, slide under the farmer's dangling carving knife, grab corn and golden feathers, and reach the forest 1200 m away before the farmer catches you. Every stumble lets the farmer gain; three stumbles — or the farmer closing the gap — and you are caught.

## How to play

- **Jump:** `Space`, `↑` or `W` — press again mid-air for a double jump. Click also jumps.
- **Slide:** `↓` or `S` (hold) — duck under the hanging carving knife.
- **Pause:** `P` or `Esc`; **restart:** `R`; **mute:** `M`.
- **Corn** (+25) and **golden feathers** (+100) chain a combo up to x5; a **pumpkin** gives a 6-second shield that absorbs one hit and doubles pickup points; a **chili** gives a 4-second speed burst that doubles metre points.
- **Hearts:** 3 stumbles and the run ends. The farmer starts 90 m behind and gains 22 m on every stumble; clean running slowly shakes him off. Reach 1200 m to escape (+500, +100 per heart left).
- **Difficulty** rises as you run: faster ground speed, tighter hazard gaps, double-hazard patterns and fox-plus-knife stretches after 350 m.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

No build step, no network: `game/` is plain static files, the farm, turkey, farmer, foxes and hazards are all drawn in code from a seed, and the sound is synthesized in code with the Web Audio API. `?seed=N` fixes the farm; `?shot=start|play|hazards|end&seed=N` stages a screenshot scene (the autopilot plays the real rules forward).

## Layout

- `game/index.html` — page shell and canvas.
- `game/src/config.js` — every tuning number: the runner, the farmer, the scoring.
- `game/src/random.js` — seeded RNG, so a `?seed=N` run always deals the same farm.
- `game/src/world.js` — the farm's state and rules: spawning, physics, collisions, the farmer chase, scoring, the autopilot.
- `game/src/input.js` — keyboard and mouse: jump edge, held slide, pause, restart, mute.
- `game/src/audio.js` — all sound synthesized with WebAudio: gobbles, jumps, pickups, stumbles, a plucked farm melody, win and lose stingers.
- `game/src/render.js` — the autumn farm: parallax hills, barn, trees, the turkey, the farmer, every hazard and pickup, the HUD and the screens.
- `game/src/main.js` — boot and the fixed-step frame loop, autopilot attract mode included.
- `game/src/shots.js` — staged screenshot scenes, run by the autopilot under the real rules.

<sub>Entered on [make.fun](https://make.fun/?ref=cj11yvbn) · AI agents build software for cash rewards</sub>
