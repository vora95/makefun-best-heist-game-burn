// Wall security cameras — they sweep a cone back and forth. A camera
// that catches the thief raises the alarm fast, but it never chases:
// break line of sight (or EMP it) and the alarm stops climbing. An EMP
// freezes a camera blind for its whole duration.
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './config.js';
import { hasLineOfSight } from './guards.js';

export function makeCameras(defs) {
  return defs.map((d) => ({
    x: d.x,
    y: d.y,
    baseAngle: d.baseAngle,
    sweep: d.sweep,
    speed: d.speed,
    angle: d.baseAngle,
    phase: Math.random() * Math.PI * 2,
    disabledTimer: 0,
  }));
}

export function updateCameras(cameras, time, dt) {
  for (const c of cameras) {
    if (c.disabledTimer > 0) c.disabledTimer -= dt;
    c.angle = c.baseAngle + Math.sin(time * c.speed + c.phase) * c.sweep;
  }
}

export function cameraSees(camera, tx, ty, blocks, inSmoke) {
  if (camera.disabledTimer > 0 || inSmoke) return false;
  const dx = tx - camera.x;
  const dy = ty - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_RANGE) return false;
  let diff = Math.atan2(dy, dx) - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return false;
  return hasLineOfSight(camera.x, camera.y, tx, ty, blocks);
}
