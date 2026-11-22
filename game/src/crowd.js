// Casino patrons — the crowd you hide in. They wander between the
// tables on a fixed seed, so their paths are the same every run. A thief
// standing close to two or more patrons is "blended": guards build
// suspicion half as fast. Patrons never raise the alarm themselves.
import { makeRng, range } from './random.js';
import { COLORS } from './config.js';

export function makeCrowd(spots, seed) {
  const rng = makeRng(seed);
  return spots.map((spot, i) => ({
    x: spot.x,
    y: spot.y,
    homeX: spot.x,
    homeY: spot.y,
    r: 12,
    color: COLORS.patron[i % COLORS.patron.length],
    angle: rng() * Math.PI * 2,
    speed: range(rng, 12, 26),
    turnTimer: range(rng, 1.5, 4),
    pauseTimer: 0,
  }));
}

export function updateCrowd(patrons, dt, blocks) {
  for (const p of patrons) {
    if (p.pauseTimer > 0) {
      p.pauseTimer -= dt;
      continue;
    }
    p.turnTimer -= dt;
    if (p.turnTimer <= 0) {
      p.turnTimer = 1.5 + Math.random() * 3;
      // drift back toward home, then wander a little
      const homeAngle = Math.atan2(p.homeY - p.y, p.homeX - p.x);
      const homeDist = Math.hypot(p.homeX - p.x, p.homeY - p.y);
      p.angle = homeDist > 90 ? homeAngle : homeAngle + (Math.random() - 0.5) * 2.4;
      if (Math.random() < 0.25) p.pauseTimer = 0.8 + Math.random() * 1.6;
    }
    const nx = p.x + Math.cos(p.angle) * p.speed * dt;
    const ny = p.y + Math.sin(p.angle) * p.speed * dt;
    if (!hitsBlock(nx, ny, p.r, blocks)) {
      p.x = nx;
      p.y = ny;
    } else {
      p.angle += Math.PI / 2;
    }
    p.x = Math.max(34, Math.min(1246, p.x));
    p.y = Math.max(34, Math.min(686, p.y));
  }
}

export function crowdNear(patrons, x, y, radius) {
  let count = 0;
  for (const p of patrons) {
    if (Math.hypot(p.x - x, p.y - y) < radius) count += 1;
  }
  return count;
}

export function hitsBlock(x, y, r, blocks) {
  for (const b of blocks) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}
