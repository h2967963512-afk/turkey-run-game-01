// Gobble Dash — Turkey Escape: every sound is synthesized with the Web Audio API.
// No audio files, no network: gobbles, jumps, pickups, stumbles and fanfares are
// all oscillators and noise shaped in code.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A lazy plucked melody (C major pentatonic) that keeps the farm cheerful.
  const MELODY = [523, 587, 659, 784, 659, 587, 523, 440, 523, 587, 659, 587, 523, 0, 392, 0];
  const BASS = [131, 131, 175, 196, 175, 131, 98, 131, 131, 175, 196, 175, 131, 0, 98, 0];

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, lowpass = 1200) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  function pluck(freq, vol) {
    if (!freq) return;
    tone(freq, 0.34, 'triangle', vol);
    tone(freq * 2, 0.18, 'sine', vol * 0.4);
  }

  function startMusic() {
    if (musicTimer || !ensure()) return;
    musicTimer = setInterval(() => {
      if (muted || !ctx) return;
      pluck(MELODY[musicStep % MELODY.length], 0.05);
      if (musicStep % 2 === 0) pluck(BASS[musicStep % BASS.length] / 2, 0.045);
      musicStep++;
    }, 240);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    ensure,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) stopMusic();
      return muted;
    },
    startMusic,
    stopMusic,
    click() {
      tone(660, 0.07, 'square', 0.08);
    },
    jump() {
      tone(280, 0.16, 'sine', 0.12, 0, 620);
    },
    doubleJump() {
      tone(420, 0.14, 'sine', 0.1, 0, 840);
    },
    gobble() {
      // Two quick descending clucks: the turkey's war cry.
      tone(340, 0.09, 'square', 0.1, 0, 240);
      tone(300, 0.11, 'square', 0.1, 0.1, 190);
    },
    pickup(combo) {
      const base = 660 + Math.min(combo, 5) * 60;
      tone(base, 0.1, 'sine', 0.12);
      tone(base * 1.5, 0.12, 'sine', 0.09, 0.06);
    },
    powerup() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.11, i * 0.07));
    },
    stumble() {
      noiseBurst(0.18, 0.22, 700);
      tone(160, 0.3, 'sawtooth', 0.14, 0, 70);
    },
    farmerYell() {
      tone(220, 0.12, 'sawtooth', 0.12, 0, 330);
      tone(260, 0.14, 'sawtooth', 0.12, 0.12, 380);
    },
    win() {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
    },
    lose() {
      [392, 370, 349, 311].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.09, i * 0.16));
    },
  };
}
