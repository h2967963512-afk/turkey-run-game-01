// Gobble Dash — Turkey Escape: every pixel is drawn in code on one canvas — the
// autumn farm, the turkey, the farmer, the hazards, the HUD and the screens.
// No images, no fonts from the network, no external anything.

import { FIELD, TURKEY, RUN, LIVES, SCORE } from './config.js';
import { clamp, hash2 } from './random.js';

const SKY_TOP = '#f7b733';
const SKY_MID = '#fbd98a';
const SKY_BOT = '#fdeec8';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSky(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(0.55, SKY_MID);
  g.addColorStop(1, SKY_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.groundY + 2);
  // Low autumn sun.
  ctx.fillStyle = '#fff3b0';
  ellipse(ctx, 1080, 120, 52, 52);
  ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
  ellipse(ctx, 1080, 120, 84, 84);
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 317 + 180 - world.travel * 0.12) % 1500 + 1500) % 1500 - 110;
    const cy = 60 + i * 34;
    ellipse(ctx, cx, cy, 62, 20);
    ellipse(ctx, cx + 42, cy + 6, 44, 16);
    ellipse(ctx, cx - 44, cy + 8, 38, 14);
  }
}

function drawHills(ctx, world) {
  // Two parallax hill bands.
  for (const [col, amp, base, speed] of [
    ['#d9a05b', 46, 560, 0.18],
    ['#b97f3e', 60, 592, 0.34],
  ]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 16) {
      const wx = x + world.travel * speed;
      const y = base - Math.abs(Math.sin(wx * 0.004) * amp) - Math.sin(wx * 0.0013) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
  }
  // Barn and trees, far parallax.
  const barnX = 980 - ((world.travel * 0.34) % 1800);
  ctx.fillStyle = '#a63a2e';
  ctx.fillRect(barnX, 470, 150, 110);
  ctx.fillStyle = '#7c2a20';
  ctx.beginPath();
  ctx.moveTo(barnX - 12, 472);
  ctx.lineTo(barnX + 75, 420);
  ctx.lineTo(barnX + 162, 472);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(barnX + 58, 520, 34, 60);
  ctx.strokeStyle = '#7c2a20';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(barnX + 58, 520);
  ctx.lineTo(barnX + 92, 580);
  ctx.moveTo(barnX + 92, 520);
  ctx.lineTo(barnX + 58, 580);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const tx = ((i * 197 + 60 - world.travel * 0.55) % 1500 + 1500) % 1500 - 60;
    const th = 70 + hash2(i, world.seed) * 50;
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(tx - 5, FIELD.groundY - th * 0.55, 10, th * 0.55);
    ctx.fillStyle = i % 2 ? '#c96a1e' : '#d98a2b';
    ellipse(ctx, tx, FIELD.groundY - th * 0.55 - 26, 34, 40);
    ellipse(ctx, tx - 22, FIELD.groundY - th * 0.55 - 8, 22, 26);
    ellipse(ctx, tx + 22, FIELD.groundY - th * 0.55 - 8, 22, 26);
  }
}

function drawGround(ctx, world) {
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = '#a06a33';
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 8);
  // Grass tufts and fallen leaves scrolling with the world.
  for (let i = 0; i < 40; i++) {
    const wx = i * 173 + 40;
    const sx = ((wx - world.travel) % 1400 + 1400) % 1400 - 60;
    const sy = FIELD.groundY + 22 + hash2(i, world.seed + 3) * 66;
    ctx.strokeStyle = i % 3 ? '#6d8f3a' : '#7fa344';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 3, sy - 9);
    ctx.moveTo(sx + 4, sy);
    ctx.lineTo(sx + 7, sy - 8);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? '#d98a2b' : '#c96a1e';
    ellipse(ctx, sx + 30, sy + 6, 5, 3);
  }
}

function drawTurkey(ctx, world) {
  const t = world.turkey;
  const x = TURKEY.x + TURKEY.w / 2;
  const feet = t.y;
  const sliding = t.sliding;
  const invuln = t.invulnT > 0 && Math.floor(world.time * 12) % 2 === 0;
  if (invuln) ctx.globalAlpha = 0.35;
  const bob = t.y >= FIELD.groundY ? Math.sin(t.runPhase) * 3 : 0;
  const bodyY = feet - (sliding ? 26 : 46) + bob;
  const squash = sliding ? 1.35 : 1;
  // Fanned tail feathers.
  ctx.save();
  ctx.translate(x - 30, bodyY - 6);
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.34);
    ctx.fillStyle = i % 2 ? '#8a5a2b' : '#6d4520';
    ctx.beginPath();
    ctx.ellipse(-6, -34, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98a3a';
    ctx.beginPath();
    ctx.ellipse(-6, -52, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // Body.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(x, bodyY, 34 * squash, sliding ? 20 : 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#96602c';
  ctx.beginPath();
  ctx.ellipse(x + 4, bodyY + 4, 26 * squash, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#5d3a17';
  ctx.beginPath();
  ctx.ellipse(x - 4, bodyY - 2, 18, 12, sliding ? -0.3 : -0.5 + Math.sin(t.runPhase) * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  const hx = x + 28;
  const hy = bodyY - (sliding ? 18 : 34);
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x + 18, bodyY - 12);
  ctx.lineTo(hx, hy + 6);
  ctx.stroke();
  ctx.fillStyle = '#c96a5a';
  ellipse(ctx, hx, hy, 13, 12);
  // Beak.
  ctx.fillStyle = '#f2a93b';
  ctx.beginPath();
  ctx.moveTo(hx + 10, hy - 2);
  ctx.lineTo(hx + 24, hy + 3);
  ctx.lineTo(hx + 10, hy + 7);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#d43d2a';
  ellipse(ctx, hx + 8, hy + 10, 4, 7);
  // Eye.
  ctx.fillStyle = '#fff';
  ellipse(ctx, hx + 4, hy - 4, 4.5, 4.5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, hx + 5, hy - 4, 2.2, 2.2);
  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 4;
  const step = Math.sin(t.runPhase) * 10;
  if (t.y >= FIELD.groundY && !sliding) {
    ctx.beginPath();
    ctx.moveTo(x - 8, bodyY + 24);
    ctx.lineTo(x - 8 + step, feet);
    ctx.moveTo(x + 8, bodyY + 24);
    ctx.lineTo(x + 8 - step, feet);
    ctx.stroke();
  } else if (sliding) {
    ctx.beginPath();
    ctx.moveTo(x - 6, bodyY + 14);
    ctx.lineTo(x - 18, feet);
    ctx.moveTo(x + 6, bodyY + 14);
    ctx.lineTo(x + 18, feet);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawFarmer(ctx, world) {
  const gapPx = world.farmerGap * 10;
  const x = TURKEY.x - gapPx;
  if (x < -160) return;
  const feet = FIELD.groundY;
  const bob = Math.abs(Math.sin(world.time * 9)) * 4;
  const y = feet - bob;
  // Legs.
  ctx.strokeStyle = '#3a4a6b';
  ctx.lineWidth = 9;
  const step = Math.sin(world.time * 9) * 14;
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x - 10 + step, feet);
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x + 10 - step, feet);
  ctx.stroke();
  // Body: overalls.
  ctx.fillStyle = '#3a4a6b';
  rr(ctx, x - 18, y - 96, 36, 54, 8);
  ctx.fill();
  // Shirt.
  ctx.fillStyle = '#c94f3d';
  rr(ctx, x - 20, y - 96, 40, 26, 8);
  ctx.fill();
  // Head + straw hat.
  ctx.fillStyle = '#e8b98a';
  ellipse(ctx, x, y - 108, 13, 13);
  ctx.fillStyle = '#e8c95a';
  ellipse(ctx, x, y - 118, 24, 6);
  ctx.fillRect(x - 11, y - 132, 22, 12);
  // Pitchfork, raised and ready.
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 90);
  ctx.lineTo(x + 34, y - 150);
  ctx.stroke();
  ctx.strokeStyle = '#b9b9b9';
  ctx.lineWidth = 3;
  for (const off of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(x + 34 + off, y - 150);
    ctx.lineTo(x + 38 + off, y - 168);
    ctx.stroke();
  }
  // Shout.
  if (world.farmerGap < 30) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Come back here!', x + 30, y - 150);
  }
}

function drawObstacle(ctx, o) {
  const gy = FIELD.groundY;
  const x = o.x;
  if (o.kind === 'fence') {
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(x, gy - 64, 6, 64);
    ctx.fillRect(x + 40, gy - 64, 6, 64);
    ctx.fillStyle = '#a8844a';
    ctx.fillRect(x - 4, gy - 58, 54, 9);
    ctx.fillRect(x - 4, gy - 34, 54, 9);
  } else if (o.kind === 'bale') {
    ctx.fillStyle = '#d9a83a';
    ellipse(ctx, x + 37, gy - 29, 38, 29);
    ctx.strokeStyle = '#b8892a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + 37, gy - 29, 26, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 37, gy - 29, 12, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (o.kind === 'trap') {
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + 32, gy - 26);
    ctx.lineTo(x + 64, gy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0c0c0';
    for (const tx of [x + 6, x + 18, x + 30, x + 42, x + 54]) {
      ctx.beginPath();
      ctx.moveTo(tx, gy - 12);
      ctx.lineTo(tx + 4, gy - 24);
      ctx.lineTo(tx + 8, gy - 12);
      ctx.closePath();
      ctx.fill();
    }
  } else if (o.kind === 'oven') {
    ctx.fillStyle = '#4a4a4a';
    rr(ctx, x, gy - 72, 84, 72, 8);
    ctx.fill();
    ctx.fillStyle = '#2a2a2a';
    rr(ctx, x + 12, gy - 56, 60, 40, 6);
    ctx.fill();
    // Flames licking out of the oven door.
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(x + 22, gy - 52);
    ctx.quadraticCurveTo(x + 30, gy - 84, x + 38, gy - 52);
    ctx.quadraticCurveTo(x + 48, gy - 78, x + 56, gy - 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.moveTo(x + 30, gy - 52);
    ctx.quadraticCurveTo(x + 36, gy - 70, x + 44, gy - 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x + 30, gy - 92, 24, 22);
  } else if (o.kind === 'fox') {
    const bob = Math.sin(o.x * 0.05) * 3;
    ctx.fillStyle = '#d96a1e';
    ctx.beginPath();
    ctx.ellipse(x + 46, gy - 30 + bob, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head.
    ctx.beginPath();
    ctx.moveTo(x + 78, gy - 52 + bob);
    ctx.lineTo(x + 96, gy - 44 + bob);
    ctx.lineTo(x + 80, gy - 30 + bob);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, x + 82, gy - 46 + bob, 12, 11);
    ctx.fillStyle = '#fff';
    ellipse(ctx, x + 88, gy - 40 + bob, 7, 6);
    // Ears.
    ctx.fillStyle = '#d96a1e';
    ctx.beginPath();
    ctx.moveTo(x + 72, gy - 54 + bob);
    ctx.lineTo(x + 76, gy - 70 + bob);
    ctx.lineTo(x + 82, gy - 54 + bob);
    ctx.closePath();
    ctx.fill();
    // Tail.
    ctx.strokeStyle = '#d96a1e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x + 8, gy - 34 + bob);
    ctx.quadraticCurveTo(x - 18, gy - 52 + bob, x - 6, gy - 66 + bob);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ellipse(ctx, x - 6, gy - 66 + bob, 7, 6);
    // Legs.
    ctx.strokeStyle = '#a84e12';
    ctx.lineWidth = 5;
    const step = Math.sin(o.x * 0.08) * 8;
    ctx.beginPath();
    ctx.moveTo(x + 22, gy - 14 + bob);
    ctx.lineTo(x + 22 + step, gy);
    ctx.moveTo(x + 66, gy - 14 + bob);
    ctx.lineTo(x + 66 - step, gy);
    ctx.stroke();
  } else if (o.kind === 'knife') {
    // Low branch with the carving knife dangling from it.
    ctx.strokeStyle = '#6d4520';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x - 30, FIELD.groundY - 190);
    ctx.lineTo(x + 70, FIELD.groundY - 190);
    ctx.stroke();
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 20, FIELD.groundY - 190);
    ctx.lineTo(x + 20, FIELD.groundY - 140);
    ctx.stroke();
    // Blade.
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.moveTo(x + 4, FIELD.groundY - 140);
    ctx.lineTo(x + 36, FIELD.groundY - 140);
    ctx.lineTo(x + 30, FIELD.groundY - 62);
    ctx.lineTo(x + 20, FIELD.groundY - 52);
    ctx.lineTo(x + 10, FIELD.groundY - 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    rr(ctx, x + 12, FIELD.groundY - 152, 16, 14, 3);
    ctx.fill();
    // Warning glint.
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x + 12, FIELD.groundY - 132, 3, 60);
  }
}

function drawPickup(ctx, p, world) {
  const bob = Math.sin(world.time * 4 + p.x * 0.02) * 3;
  const y = p.y + bob;
  if (p.kind === 'corn') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.ellipse(p.x, y, 12, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fa344';
    ctx.beginPath();
    ctx.moveTo(p.x - 8, y + 8);
    ctx.lineTo(p.x - 16, y + 22);
    ctx.lineTo(p.x - 2, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9a83a';
    ctx.lineWidth = 1.5;
    for (const dy of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(p.x - 8, y + dy);
      ctx.lineTo(p.x + 8, y + dy);
      ctx.stroke();
    }
  } else if (p.kind === 'feather') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(0.5);
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -12, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (p.kind === 'pumpkin') {
    ctx.fillStyle = '#e8701a';
    ellipse(ctx, p.x, y, 22, 18);
    ctx.strokeStyle = '#c95a10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(p.x, y, 12, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#5a8f3a';
    ctx.fillRect(p.x - 3, y - 24, 6, 8);
  } else if (p.kind === 'chili') {
    ctx.fillStyle = '#d42a1a';
    ctx.beginPath();
    ctx.moveTo(p.x, y - 16);
    ctx.quadraticCurveTo(p.x + 14, y + 4, p.x + 2, y + 18);
    ctx.quadraticCurveTo(p.x - 10, y + 8, p.x, y - 16);
    ctx.fill();
    ctx.strokeStyle = '#5a8f3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, y - 16);
    ctx.quadraticCurveTo(p.x + 2, y - 26, p.x + 10, y - 26);
    ctx.stroke();
  }
}

function drawHud(ctx, world) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Score panel.
  ctx.fillStyle = 'rgba(20, 12, 4, 0.55)';
  rr(ctx, 16, 14, 330, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`SCORE ${world.score}`, 30, 52);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  const remaining = Math.max(0, Math.ceil(RUN.escapeDistance - world.distance));
  ctx.fillText(`${Math.floor(world.distance)} m  ·  ${remaining} m to the forest`, 30, 82);
  if (world.combo > 1) {
    ctx.fillStyle = '#ff9a1a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`COMBO x${world.combo}`, 30, 132);
  }
  // Hearts.
  for (let i = 0; i < LIVES; i++) {
    const hx = FIELD.width - 40 - i * 44;
    ctx.fillStyle = i < world.hearts ? '#e83a2a' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(hx, 58);
    ctx.arc(hx - 9, 36, 10, Math.PI, 0);
    ctx.arc(hx + 9, 36, 10, Math.PI, 0);
    ctx.lineTo(hx, 58);
    ctx.closePath();
    ctx.fill();
  }
  // Escape progress bar.
  const bw = 420;
  const bx = (FIELD.width - bw) / 2;
  ctx.fillStyle = 'rgba(20, 12, 4, 0.55)';
  rr(ctx, bx, 18, bw, 26, 13);
  ctx.fill();
  const frac = clamp(world.distance / RUN.escapeDistance, 0, 1);
  ctx.fillStyle = '#7fa344';
  rr(ctx, bx + 3, 21, (bw - 6) * frac, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPE TO THE FOREST', bx + bw / 2, 36);
  ctx.textAlign = 'left';
  // Farmer gap meter.
  ctx.fillStyle = 'rgba(20, 12, 4, 0.55)';
  rr(ctx, 16, FIELD.height - 52, 260, 36, 10);
  ctx.fill();
  ctx.fillStyle = world.farmerGap < 30 ? '#e83a2a' : '#ffd23d';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(`FARMER ${Math.round(world.farmerGap)} m BEHIND`, 28, FIELD.height - 28);
  // Power-up timers.
  let py = 152;
  if (world.shieldT > 0) {
    ctx.fillStyle = '#e8701a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`PUMPKIN SHIELD ${Math.ceil(world.shieldT)}s`, 30, py);
    py += 28;
  }
  if (world.chiliT > 0) {
    ctx.fillStyle = '#d42a1a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`CHILI BURST ${Math.ceil(world.chiliT)}s`, 30, py);
  }
  // Message banner.
  if (world.message && world.messageT > 0) {
    ctx.font = 'bold 26px sans-serif';
    const w = ctx.measureText(world.message).width + 36;
    ctx.fillStyle = 'rgba(20, 12, 4, 0.65)';
    rr(ctx, (FIELD.width - w) / 2, 150, w, 44, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, FIELD.width / 2, 180);
    ctx.textAlign = 'left';
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20, 12, 4, 0.62)';
  rr(ctx, 290, 130, 700, 460, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  rr(ctx, 290, 130, 700, 460, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(title, FIELD.width / 2, 210);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 268 + i * 40));
  ctx.textAlign = 'left';
}

/** Draw the farm scene only: sky, farm, hazards, pickups, farmer, turkey. */
export function renderScene(ctx, world) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawSky(ctx, world);
  drawHills(ctx, world);
  drawGround(ctx, world);
  for (const p of world.pickups) drawPickup(ctx, p, world);
  for (const o of world.obstacles) drawObstacle(ctx, o);
  drawFarmer(ctx, world);
  drawTurkey(ctx, world);
}

export function drawTitleScreen(ctx, world) {
  drawTitle(ctx, world);
}

/** The title screen: dimmed farm, big title, how to play. */
function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20, 12, 4, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('GOBBLE DASH', FIELD.width / 2, 190);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('— Turkey Escape —', FIELD.width / 2, 240);
  ctx.font = '24px sans-serif';
  ctx.fillText('Thanksgiving is coming. The farmer wants dinner. You want the forest.', FIELD.width / 2, 300);
  ctx.fillText('Jump the fences, bales, traps, ovens and foxes. Slide under the carving knife.', FIELD.width / 2, 336);
  ctx.fillText('Grab corn and feathers. Reach the forest 1200 m away — before the farmer catches you.', FIELD.width / 2, 372);
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('SPACE / ↑ / W — jump (twice for a double jump)      ↓ / S — slide', FIELD.width / 2, 440);
  ctx.fillText('P — pause      R — restart      M — mute      Click — jump', FIELD.width / 2, 476);
  const best = Number(localStorage.getItem('gobble-dash-best-score') || 0);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(best > 0 ? `Best score: ${best}` : 'No best score yet — be the first turkey to make it!', FIELD.width / 2, 530);
  if (Math.floor(world.time * 1.4) % 2 === 0) {
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Press SPACE to run!', FIELD.width / 2, 590);
  }
  ctx.textAlign = 'left';
}

/** Draw the whole scene for the world's current state. */
export function render(ctx, world) {
  renderScene(ctx, world);
  if (world.state === 'playing' || world.state === 'paused') drawHud(ctx, world);
  if (world.state === 'title') drawTitle(ctx, world);
  if (world.state === 'paused') {
    panel(ctx, 'PAUSED', ['Take a breath. The farmer waits for no turkey.', 'Press P or SPACE to keep running.', 'R restarts the run.'], '#ffd23d');
  }
  if (world.state === 'caught') {
    panel(ctx, 'CAUGHT!', [
      world.cause,
      `Score ${world.score}  ·  ${Math.floor(world.distance)} m run  ·  ${world.dodged} hazards dodged`,
      `Best combo x${world.maxCombo}  ·  ${world.collected} pickups grabbed`,
      'The farmer is already sharpening the knife.',
      'Press SPACE to run again.',
    ], '#e83a2a');
  }
  if (world.state === 'escaped') {
    panel(ctx, 'ESCAPED!', [
      world.cause,
      `Score ${world.score}  ·  ${Math.floor(world.distance)} m run  ·  ${world.dodged} hazards dodged`,
      `Best combo x${world.maxCombo}  ·  ${world.collected} pickups grabbed`,
      'You made it to the forest. Happy Thanksgiving!',
      'Press SPACE to run again.',
    ], '#7fa344');
  }
}
