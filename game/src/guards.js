// Guards — patrol, watch, suspect, chase. A guard walks its route until
// the thief enters its vision cone with a clear line of sight; then
// suspicion climbs (faster if the thief runs, slower if sneaking or
// blended in a crowd). At full suspicion the guard chases, the alarm
// climbs, and the level's ghost bonus is lost. Lose the guard for a few
// seconds and it gives up and goes back to patrol.
import {
  GUARD_R, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_VISION_RANGE,
  GUARD_VISION_HALF_ANGLE, GUARD_SUSPICION_RISE, GUARD_SUSPICION_FALL,
  GUARD_LOSE_SIGHT_TIME, CROWD_BLEND_RADIUS, CROWD_BLEND_FACTOR,
} from './config.js';
import { crowdNear } from './crowd.js';

export function makeGuards(defs) {
  return defs.map((d) => ({
    x: d.x,
    y: d.y,
    path: d.path,
    wp: 1,
    speed: d.speed || GUARD_PATROL_SPEED,
    angle: 0,
    suspicion: 0,
    state: 'patrol', // patrol | chase
    unseenTimer: 0,
    lured: null, // {x, y} when a coin pulled the guard away
    lureTimer: 0,
  }));
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Segment (x1,y1)-(x2,y2) against one rect: true when it crosses the rect.
function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  // sample along the segment — cheap and plenty for a sight check
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return true;
  }
  return false;
}

export function hasLineOfSight(x1, y1, x2, y2, blocks) {
  for (const b of blocks) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

export function canSee(guard, tx, ty, blocks, inSmoke) {
  if (inSmoke) return false;
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VISION_RANGE) return false;
  if (dist < 26) return true; // bumping into a guard is always noticed
  const want = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(want, guard.angle)) > GUARD_VISION_HALF_ANGLE) return false;
  return hasLineOfSight(guard.x, guard.y, tx, ty, blocks);
}

function moveToward(e, tx, ty, speed, dt, blocks) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = e.x + (dx / dist) * step;
  const ny = e.y + (dy / dist) * step;
  e.angle = Math.atan2(dy, dx);
  if (!hitsCircle(nx, e.y, GUARD_R, blocks)) e.x = nx;
  if (!hitsCircle(e.x, ny, GUARD_R, blocks)) e.y = ny;
  return dist <= speed * dt + 1;
}

function hitsCircle(x, y, r, blocks) {
  for (const b of blocks) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

export function updateGuards(guards, player, blocks, patrons, smokes, dt, onChaseStart) {
  for (const g of guards) {
    const inSmoke = smokes.some((s) => Math.hypot(s.x - g.x, s.y - g.y) < s.r);
    const sees = canSee(g, player.x, player.y, blocks, inSmoke);

    if (g.lureTimer > 0) {
      g.lureTimer -= dt;
      if (g.lured) {
        const arrived = moveToward(g, g.lured.x, g.lured.y, g.speed, dt, blocks);
        if (arrived || g.lureTimer <= 0) {
          g.lured = null;
          g.lureTimer = 0;
        }
      }
      continue;
    }

    if (sees) {
      let rate = GUARD_SUSPICION_RISE;
      if (player.sneaking) rate *= 0.5;
      if (player.dashing) rate *= 1.6;
      const near = crowdNear(patrons, player.x, player.y, CROWD_BLEND_RADIUS);
      if (near >= 2) rate *= CROWD_BLEND_FACTOR;
      g.suspicion = Math.min(100, g.suspicion + rate * dt);
      g.unseenTimer = 0;
      if (g.suspicion >= 100 && g.state !== 'chase') {
        g.state = 'chase';
        if (onChaseStart) onChaseStart(g);
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - GUARD_SUSPICION_FALL * dt);
      if (g.state === 'chase') {
        g.unseenTimer += dt;
        if (g.unseenTimer > GUARD_LOSE_SIGHT_TIME) {
          g.state = 'patrol';
          g.suspicion = 55;
          g.unseenTimer = 0;
        }
      }
    }

    if (g.state === 'chase') {
      moveToward(g, player.x, player.y, GUARD_CHASE_SPEED, dt, blocks);
    } else {
      const target = g.path[g.wp];
      const arrived = moveToward(g, target[0], target[1], g.speed, dt, blocks);
      if (arrived) g.wp = (g.wp + 1) % g.path.length;
    }
  }
}
