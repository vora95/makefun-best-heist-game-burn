// The thief — movement, sneak, dash, and the three tools. The thief is
// a circle with a facing direction; tools are spent from the level's
// allowance and reported back to the loop through the returned events.
import {
  PLAYER_R, PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_DASH_SPEED,
  PLAYER_DASH_TIME, PLAYER_DASH_COOLDOWN, SMOKE_RADIUS, SMOKE_TIME,
  EMP_TIME, COIN_LURE_RADIUS,
} from './config.js';
import { hitsBlock } from './crowd.js';
import { sfx } from './audio.js';

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    r: PLAYER_R,
    angle: -Math.PI / 2,
    sneaking: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    moving: false,
  };
}

function tryMove(p, nx, ny, blocks) {
  if (!hitsBlock(nx, p.y, p.r, blocks)) p.x = nx;
  if (!hitsBlock(p.x, ny, p.r, blocks)) p.y = ny;
  p.x = Math.max(20 + p.r, Math.min(1260 - p.r, p.x));
  p.y = Math.max(20 + p.r, Math.min(700 - p.r, p.y));
}

export function updatePlayer(p, axis, keys, dt, blocks, game) {
  p.sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  if (p.dashTimer > 0) p.dashTimer -= dt;

  const wantDash = (keys.has('Space')) && p.dashCooldown <= 0 && (axis.x !== 0 || axis.y !== 0);
  if (wantDash) {
    p.dashing = true;
    p.dashTimer = PLAYER_DASH_TIME;
    p.dashCooldown = PLAYER_DASH_COOLDOWN;
  }
  if (p.dashTimer <= 0) p.dashing = false;

  const speed = p.dashing
    ? PLAYER_DASH_SPEED
    : (p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED);
  p.moving = axis.x !== 0 || axis.y !== 0;
  if (p.moving) {
    p.angle = Math.atan2(axis.y, axis.x);
    tryMove(p, p.x + axis.x * speed * dt, p.y + axis.y * speed * dt, blocks);
  }
}

// Tools. `game` carries the live lists (smokes, coins, guards, cameras,
// lasers) and the tool counts; this mutates them and returns a short
// event string for the loop's HUD toast.
export function useCoin(game) {
  if (game.tools.coin <= 0) return 'NO COINS LEFT';
  game.tools.coin -= 1;
  const tx = game.player.x + Math.cos(game.player.angle) * 120;
  const ty = game.player.y + Math.sin(game.player.angle) * 120;
  const coin = { x: tx, y: ty, ttl: 0.6 };
  game.coins.push(coin);
  sfx.coin();
  let lured = 0;
  for (const g of game.guards) {
    if (Math.hypot(g.x - tx, g.y - ty) < COIN_LURE_RADIUS) {
      g.lured = { x: tx, y: ty };
      g.lureTimer = 4;
      g.state = 'patrol';
      g.suspicion = Math.min(g.suspicion, 40);
      lured += 1;
    }
  }
  return lured > 0 ? 'COIN TOSSED — GUARD DISTRACTED' : 'COIN TOSSED — NOBODY BIT';
}

export function useSmoke(game) {
  if (game.tools.smoke <= 0) return 'NO SMOKE LEFT';
  game.tools.smoke -= 1;
  game.smokes.push({ x: game.player.x, y: game.player.y, r: SMOKE_RADIUS, ttl: SMOKE_TIME });
  sfx.smoke();
  return 'SMOKE OUT — YOU ARE HIDDEN';
}

export function useEmp(game) {
  if (game.tools.emp <= 0) return 'NO EMP LEFT';
  game.tools.emp -= 1;
  for (const c of game.cameras) c.disabledTimer = EMP_TIME;
  for (const l of game.lasers) l.disabledTimer = EMP_TIME;
  sfx.emp();
  return 'EMP — CAMERAS AND LASERS DOWN';
}
