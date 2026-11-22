// High Roller Heist — the game loop and the state machine. Title,
// playing, paused, level clear, game over, win. One level at a time:
// pocket the chips, crack the vault, reach the limo, and never let the
// alarm hit 100 while a guard is on you.
import { CANVAS_W, CANVAS_H, TOOLS_START, LIVES_START, GHOST_BONUS, ALARM_MAX, ALARM_CHASE_RATE, ALARM_DECAY_RATE, CAMERA_ALARM_RATE } from './config.js';
import { LEVELS } from './levels.js';
import { makeCrowd, updateCrowd } from './crowd.js';
import { makeGuards, updateGuards } from './guards.js';
import { makeCameras, updateCameras, cameraSees as camSees } from './cameras.js';
import { makePlayer, updatePlayer, useCoin, useSmoke, useEmp } from './player.js';
import { makeVault, updateVault, tryPanel } from './vault.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { bindInput, input } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
bindInput(canvas);

export const g = {
  screen: 'title',
  levelIndex: 0,
  level: LEVELS[0],
  player: null,
  guards: [],
  cameras: [],
  patrons: [],
  vault: null,
  loot: [],
  coins: [],
  smokes: [],
  alarm: 0,
  lives: LIVES_START,
  chips: 0,
  levelChips: 0,
  grandTaken: false,
  hasKeycard: false,
  keycardCode: '',
  tools: { ...TOOLS_START },
  ghost: true,
  time: 0,
  toast: '',
  toastTimer: 0,
  caughtFlash: 0,
  objective: '',
  exitReady: false,
  levelClearLine: '',
  gameOverLine: '',
  shotMode: null,
};

function solidBlocks() {
  const blocks = [...g.level.blocks];
  if (g.vault.door && !g.vault.door.open) {
    blocks.push({ x: g.vault.door.x, y: g.vault.door.y, w: g.vault.door.w, h: g.vault.door.h, kind: 'wall' });
  }
  return blocks;
}

function refreshObjective() {
  if (g.levelIndex === 0) {
    g.objective = `Pocket $${Math.max(0, g.level.chipsNeeded - g.levelChips)} more in chips, then slip into the VIP lounge.`;
  } else if (g.levelIndex === 1) {
    g.objective = g.grandTaken
      ? 'Grand Chip in the bag — get to the SERVICE EXIT.'
      : (g.hasKeycard ? 'Keycard ready — crack the code panel by the vault door.' : 'Lift the keycard from the desk, then crack the panel.');
  } else {
    g.objective = 'The alarm is screaming — reach the LIMO. Do not get caught.';
  }
}

export function loadLevel(index) {
  const def = LEVELS[index];
  g.levelIndex = index;
  g.level = def;
  g.player = makePlayer(def.spawn);
  g.guards = makeGuards(def.guards);
  g.cameras = makeCameras(def.cameras);
  g.patrons = makeCrowd(def.patrons, 1337 + index * 101);
  g.vault = makeVault(def);
  g.loot = def.loot.map((l) => ({ ...l, taken: false }));
  g.coins = [];
  g.smokes = [];
  g.alarm = def.alarmStart;
  g.levelChips = 0;
  g.grandTaken = false;
  g.hasKeycard = false;
  g.keycardCode = '';
  g.tools = { ...TOOLS_START };
  g.ghost = true;
  g.toast = '';
  g.toastTimer = 0;
  g.caughtFlash = 0;
  g.exitReady = def.chipsNeeded === 0 && !def.loot.some((l) => l.kind === 'grand');
  refreshObjective();
}

function computeExitReady() {
  if (g.levelIndex === 0) return g.levelChips >= g.level.chipsNeeded;
  if (g.levelIndex === 1) return g.grandTaken;
  return true;
}

function nearLoot() {
  return g.loot.find((l) => !l.taken && Math.hypot(l.x - g.player.x, l.y - g.player.y) < 34);
}

function caught(reason) {
  g.lives -= 1;
  g.caughtFlash = 0.6;
  sfx.caught();
  g.gameOverLine = reason;
  if (g.lives <= 0) {
    g.screen = 'gameover';
  } else {
    loadLevel(g.levelIndex);
    g.toast = `CAUGHT! ${g.lives} ${g.lives === 1 ? 'LIFE' : 'LIVES'} LEFT — THE ROOM RESETS`;
    g.toastTimer = 2.5;
    g.screen = 'playing';
  }
}

function update(dt) {
  g.time += dt;
  if (g.toastTimer > 0) g.toastTimer -= dt;
  if (g.caughtFlash > 0) g.caughtFlash -= dt;
  if (g.screen !== 'playing') return;

  const blocks = solidBlocks();
  const axis = input.axis();
  updatePlayer(g.player, axis, input.held, dt, blocks, g);
  updateGuards(g.guards, g.player, blocks, g.patrons, g.smokes, dt, () => {
    g.ghost = false;
    sfx.spotted();
    g.toast = 'SPOTTED! BREAK LINE OF SIGHT';
    g.toastTimer = 2;
  });
  updateCameras(g.cameras, g.time, dt);
  updateCrowd(g.patrons, dt, blocks);
  updateVault(g.vault, g.player, g.time, dt, g);

  // coins fade
  for (const c of g.coins) c.ttl -= dt;
  g.coins = g.coins.filter((c) => c.ttl > 0);
  for (const s of g.smokes) s.ttl -= dt;
  g.smokes = g.smokes.filter((s) => s.ttl > 0);

  // alarm: chases and cameras push it up, hiding lets it bleed off
  const anyChase = g.guards.some((gd) => gd.state === 'chase');
  let spottedByCamera = false;
  for (const c of g.cameras) {
    const inSmoke = g.smokes.some((s) => Math.hypot(s.x - g.player.x, s.y - g.player.y) < s.r);
    if (camSees(c, g.player.x, g.player.y, blocks, inSmoke)) spottedByCamera = true;
  }
  if (anyChase) g.alarm += ALARM_CHASE_RATE * dt;
  if (spottedByCamera) g.alarm += CAMERA_ALARM_RATE * dt;
  if (!anyChase && !spottedByCamera) g.alarm = Math.max(g.level.alarmStart, g.alarm - ALARM_DECAY_RATE * dt);
  g.alarm = Math.min(ALARM_MAX, g.alarm);

  // tools (edge-triggered)
  if (input.wasPressed('KeyC')) g.toast = useCoin(g), g.toastTimer = 2;
  if (input.wasPressed('KeyX')) g.toast = useSmoke(g), g.toastTimer = 2;
  if (input.wasPressed('KeyQ')) g.toast = useEmp(g), g.toastTimer = 2;

  // interact: loot, keycard, panel
  if (input.wasPressed('KeyE')) {
    const loot = nearLoot();
    if (loot) {
      loot.taken = true;
      g.chips += loot.value;
      g.levelChips += loot.value;
      if (loot.kind === 'grand') g.grandTaken = true;
      sfx.pickup();
      g.toast = loot.kind === 'grand' ? 'GRAND CHIP! $1000 — NOW RUN' : `+$${loot.value} IN CHIPS`;
      g.toastTimer = 1.6;
    } else if (g.vault.keycard && !g.vault.keycard.taken
      && Math.hypot(g.vault.keycard.x - g.player.x, g.vault.keycard.y - g.player.y) < 36) {
      g.vault.keycard.taken = true;
      g.hasKeycard = true;
      g.keycardCode = g.vault.keycard.code;
      sfx.pickup();
      g.toast = `KEYCARD — CODE ${g.keycardCode}`;
      g.toastTimer = 2;
    } else {
      const panel = tryPanel(g.vault, g.player, g);
      if (panel) {
        g.toast = panel;
        g.toastTimer = 2;
      }
    }
    refreshObjective();
  }

  g.exitReady = computeExitReady();

  // exit reached?
  const ex = g.level.exit;
  if (g.exitReady
    && g.player.x + g.player.r > ex.x && g.player.x - g.player.r < ex.x + ex.w
    && g.player.y + g.player.r > ex.y && g.player.y - g.player.r < ex.y + ex.h) {
    if (g.ghost) {
      g.chips += GHOST_BONUS;
      g.levelClearLine = `Ghost run — never spotted. +$${GHOST_BONUS} ghost bonus.`;
    } else {
      g.levelClearLine = 'Out clean — but they saw you. No ghost bonus this room.';
    }
    sfx.win();
    if (g.levelIndex === 2) {
      g.screen = 'win';
    } else {
      g.screen = 'levelclear';
    }
    return;
  }

  // caught: a chasing guard touches the thief, or the alarm maxes out
  const touching = g.guards.some((gd) => gd.state === 'chase' && Math.hypot(gd.x - g.player.x, gd.y - g.player.y) < 26);
  if (touching) {
    caught('A guard laid hands on you in the middle of the floor.');
    return;
  }
  if (g.alarm >= ALARM_MAX) {
    caught('The alarm hit 100% — security swarmed the room.');
  }
}

function onKeyDown(event) {
  if (event.code === 'Enter') {
    if (g.screen === 'title') {
      loadLevel(0);
      g.screen = 'playing';
    } else if (g.screen === 'levelclear') {
      loadLevel(g.levelIndex + 1);
      g.screen = 'playing';
    } else if (g.screen === 'gameover' || g.screen === 'win') {
      g.chips = 0;
      g.lives = LIVES_START;
      loadLevel(0);
      g.screen = 'playing';
    }
  }
  if (event.code === 'KeyP' && (g.screen === 'playing' || g.screen === 'paused')) {
    g.screen = g.screen === 'playing' ? 'paused' : 'playing';
  }
}
window.addEventListener('keydown', onKeyDown);

loadLevel(0);
window.__game = g; // exposed for the local play-test driver only

// Screenshot mode: ?shot=play|vault|title|win renders one fixed frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  g.shotMode = shot;
  applyShot(g, shot, loadLevel);
  render(ctx, g);
  window.__shotReady = true;
  window.__gameState = g.screen;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render(ctx, g);
    input.clearPressed();
    window.__gameState = g.screen;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
