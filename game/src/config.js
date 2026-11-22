// High Roller Heist — shared tuning numbers. One place for every magic
// number the other modules use, so a balance tweak never means hunting
// through the game code.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const PLAYER_R = 13;
export const PLAYER_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 88;
export const PLAYER_DASH_SPEED = 430;
export const PLAYER_DASH_TIME = 0.18;
export const PLAYER_DASH_COOLDOWN = 2.0;

export const GUARD_R = 14;
export const GUARD_PATROL_SPEED = 72;
export const GUARD_CHASE_SPEED = 152;
export const GUARD_VISION_RANGE = 225;
export const GUARD_VISION_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_SUSPICION_RISE = 58; // per second, fully exposed
export const GUARD_SUSPICION_FALL = 26; // per second, out of sight
export const GUARD_LOSE_SIGHT_TIME = 3.0; // seconds unseen before giving up

export const CAMERA_RANGE = 265;
export const CAMERA_HALF_ANGLE = 0.44; // ~25 degrees each side
export const CAMERA_ALARM_RATE = 22; // alarm points per second while spotted

export const ALARM_CHASE_RATE = 6; // alarm points per second while chased
export const ALARM_DECAY_RATE = 1.6; // alarm points per second while hidden
export const ALARM_LASER_TRIP = 25; // alarm points for crossing a live beam
export const ALARM_MAX = 100;

export const CROWD_BLEND_RADIUS = 70; // being near patrons halves suspicion
export const CROWD_BLEND_FACTOR = 0.5;

export const TOOLS_START = { coin: 5, smoke: 3, emp: 2 };
export const SMOKE_RADIUS = 95;
export const SMOKE_TIME = 5.0;
export const EMP_TIME = 6.0;
export const COIN_LURE_RADIUS = 170;

export const GHOST_BONUS = 500; // dollars for a level with no chase at all
export const LIVES_START = 3;

export const COLORS = {
  felt: '#0d5c33',
  feltDark: '#0a4a29',
  carpet: '#5a1f2b',
  carpetDark: '#481824',
  metal: '#232830',
  metalDark: '#1a1e25',
  concrete: '#3a3f46',
  concreteDark: '#2e3238',
  wall: '#241a12',
  wallTop: '#3a2c1c',
  gold: '#d4af37',
  goldBright: '#ffd700',
  chipRed: '#c0392b',
  chipBlue: '#2471a3',
  chipWhite: '#ecf0f1',
  guard: '#1f3a93',
  guardCone: 'rgba(255, 214, 64, 0.20)',
  cameraCone: 'rgba(255, 64, 64, 0.16)',
  thief: '#111111',
  thiefCoat: '#1a1a2e',
  patron: ['#e67e22', '#8e44ad', '#16a085', '#d35400', '#2e86c1', '#c0392b'],
  laser: '#ff2d55',
  laserOff: 'rgba(255, 45, 85, 0.18)',
  smoke: 'rgba(200, 200, 210, 0.55)',
  hud: '#f5e9c8',
  hudDim: '#c9b37e',
  danger: '#ff4444',
};
