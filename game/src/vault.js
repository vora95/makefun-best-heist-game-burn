// The vault room (level 2): a keycard, a code panel, a vault door and
// a laser grid. The keycard carries the code; the panel opens the door
// only while the thief holds it. Lasers toggle on a fixed rhythm — cross
// while a beam is lit and the alarm jumps. An EMP freezes every beam.
import { ALARM_LASER_TRIP } from './config.js';
import { sfx } from './audio.js';

export function makeVault(def) {
  return {
    keycard: def.keycard ? { ...def.keycard } : null,
    panel: def.panel ? { ...def.panel } : null,
    door: def.vaultDoor ? { ...def.vaultDoor } : null,
    lasers: (def.lasers || []).map((l) => ({ ...l, disabledTimer: 0 })),
    tripped: new Set(), // laser indexes already charged this pass
  };
}

export function laserOn(laser, time) {
  if (laser.disabledTimer > 0) return false;
  const cycle = (time + laser.phase) % laser.period;
  return cycle < laser.period * 0.55; // lit a bit over half the cycle
}

// Segment-circle test: does the thief's circle touch the beam?
function beamHitsPlayer(laser, p) {
  const dx = laser.x2 - laser.x1;
  const dy = laser.y2 - laser.y1;
  const len2 = dx * dx + dy * dy;
  let t = ((p.x - laser.x1) * dx + (p.y - laser.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = laser.x1 + dx * t;
  const cy = laser.y1 + dy * t;
  return Math.hypot(p.x - cx, p.y - cy) < p.r + 2;
}

export function updateVault(vault, player, time, dt, game) {
  for (const l of vault.lasers) {
    if (l.disabledTimer > 0) l.disabledTimer -= dt;
  }
  vault.lasers.forEach((laser, i) => {
    if (!laserOn(laser, time)) {
      vault.tripped.delete(i);
      return;
    }
    if (vault.tripped.has(i)) return;
    if (beamHitsPlayer(laser, player)) {
      vault.tripped.add(i);
      game.alarm = Math.min(100, game.alarm + ALARM_LASER_TRIP);
      game.toast = 'LASER TRIPPED! +25 ALARM';
      game.toastTimer = 2;
      sfx.alarm();
    }
  });
}

// E near the panel with the keycard: open the vault door.
export function tryPanel(vault, player, game) {
  if (!vault.panel || !vault.door) return null;
  const d = Math.hypot(player.x - vault.panel.x, player.y - vault.panel.y);
  if (d > 70) return null;
  if (vault.door.open) return 'VAULT ALREADY OPEN';
  if (!vault.keycard || !vault.keycard.taken) return 'PANEL LOCKED — NEED THE KEYCARD';
  vault.door.open = true;
  sfx.vault();
  return `CODE ${vault.keycard.code} ACCEPTED — VAULT OPEN`;
}
