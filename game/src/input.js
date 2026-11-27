// Gobble Dash — Turkey Escape: keyboard and mouse input. Space / Up / W jumps
// (edge-triggered, so holding the key does not bunny-hop), Down / S slides while
// held, P or Escape pauses, R restarts, M mutes. A mouse click jumps too.

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  let slideHeld = false;

  const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W']);
  const SLIDE_KEYS = new Set(['ArrowDown', 's', 'S']);

  function onKeyDown(e) {
    if (e.repeat) return;
    const k = e.key;
    if (JUMP_KEYS.has(k) || SLIDE_KEYS.has(k)) e.preventDefault();
    if (JUMP_KEYS.has(k)) pressed.add('jump');
    if (SLIDE_KEYS.has(k)) slideHeld = true;
    down.add(k);
    pressed.add(k);
  }

  function onKeyUp(e) {
    down.delete(e.key);
    if (SLIDE_KEYS.has(e.key)) slideHeld = false;
  }

  function onMouseDown(e) {
    e.preventDefault();
    pressed.add('jump');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    /** True once for a key pressed since the last call (edge-triggered actions). */
    wasPressed(...keys) {
      for (const k of keys) {
        if (pressed.has(k)) {
          pressed.delete(k);
          return true;
        }
      }
      return false;
    },
    /**
     * The jump edge plus the held slide state, then clears the jump edge only.
     * Other pressed keys stay for wasPressed() to consume. Call once per frame.
     */
    poll() {
      const out = { jump: pressed.has('jump'), slide: slideHeld };
      pressed.delete('jump');
      return out;
    },
    clearPressed() {
      pressed.clear();
    },
  };
}
