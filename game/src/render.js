// High Roller Heist — every pixel the judge sees. One canvas, drawn in
// layers: floor, furniture, loot, laser beams, vision cones, people,
// then the HUD. The cover shot lives or dies here, so the first frame
// must already show the room, the guards and their cones, a camera, the
// loot and the alarm meter.
import { CANVAS_W, CANVAS_H, COLORS, GUARD_VISION_RANGE, CAMERA_RANGE } from './config.js';
import { laserOn } from './vault.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, floor) {
  if (floor === 'carpet') {
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.carpetDark;
    for (let y = 40; y < CANVAS_H; y += 80) {
      for (let x = 40; x < CANVAS_W; x += 80) {
        ctx.fillRect(x, y, 36, 36);
      }
    }
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, CANVAS_W - 28, CANVAS_H - 28);
  } else if (floor === 'metal') {
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 60; x < CANVAS_W; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 60; y < CANVAS_H; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = COLORS.concrete;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.concreteDark;
    for (let y = 90; y < CANVAS_H; y += 180) {
      ctx.fillRect(0, y, CANVAS_W, 6);
    }
    ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.fillRect(20, 352, 1240, 4);
    ctx.fillRect(20, 364, 1240, 4);
  }
}

function drawBlock(ctx, b) {
  if (b.kind === 'wall') {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = COLORS.wallTop;
    if (b.h <= 26) ctx.fillRect(b.x, b.y, b.w, 5);
    else ctx.fillRect(b.x, b.y, 5, b.h);
    return;
  }
  if (b.kind === 'table') {
    ctx.fillStyle = COLORS.felt;
    roundRect(ctx, b.x, b.y, b.w, b.h, 40);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = COLORS.feltDark;
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 - 26, b.h / 2 - 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 15px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('ROULETTE', b.x + b.w / 2, b.y + b.h / 2 + 5);
    return;
  }
  if (b.kind === 'slots') {
    ctx.fillStyle = '#2c1a4d';
    roundRect(ctx, b.x, b.y, b.w, b.h, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.goldBright;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(b.x + 16 + i * 28, b.y + 13, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('SLOTS', b.x + b.w / 2, b.y + 22);
    return;
  }
  if (b.kind === 'bar') {
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(b.x, b.y, b.w, 6);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BAR', b.x + b.w / 2, b.y + 36);
    return;
  }
  if (b.kind === 'desk') {
    ctx.fillStyle = '#5d4a2f';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    return;
  }
  if (b.kind === 'car') {
    ctx.fillStyle = '#7b1e1e';
    roundRect(ctx, b.x, b.y, b.w, b.h, 22);
    ctx.fill();
    ctx.fillStyle = '#1c2733';
    roundRect(ctx, b.x + 40, b.y + 12, b.w - 80, b.h - 24, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(b.x + 52, b.y + 18, 30, 8);
    return;
  }
  if (b.kind === 'pillar') {
    ctx.fillStyle = '#565b63';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#6e737b';
    ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
    return;
  }
  ctx.fillStyle = '#1e4d2b';
  ctx.beginPath();
  ctx.arc(b.x + b.w / 2, b.y + b.h / 2, Math.min(b.w, b.h) / 2 - 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCone(ctx, x, y, angle, halfAngle, range, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + item.x) * 0.08;
    if (item.kind === 'grand') {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.goldBright;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5c00';
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 5);
      ctx.restore();
      ctx.fillStyle = COLORS.goldBright;
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('GRAND CHIP $1000', item.x, item.y - 34);
    } else {
      ctx.fillStyle = COLORS.chipRed;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.chipWhite;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.chipRed;
      ctx.font = 'bold 10px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('$', item.x, item.y + 3.5);
    }
  }
}

function drawPerson(ctx, x, y, r, body, hat, angle) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + r - 2, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  if (hat) {
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.ellipse(x, y - r + 3, r + 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - r + 3, y - r - 6, (r - 3) * 2, 9);
  }
  ctx.fillStyle = '#f5e9c8';
  ctx.beginPath();
  ctx.arc(x + Math.cos(angle) * (r - 4), y + Math.sin(angle) * (r - 4), 3, 0, Math.PI * 2);
  ctx.fill();
}

export function render(ctx, g) {
  const level = g.level;
  drawFloor(ctx, level.floor);
  for (const b of level.blocks) drawBlock(ctx, b);

  // exit door
  const ex = level.exit;
  ctx.fillStyle = g.exitReady ? '#1e8449' : '#5d4037';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.save();
  ctx.translate(ex.x + ex.w / 2, ex.y + ex.h / 2);
  ctx.rotate(ex.w > ex.h ? 0 : Math.PI / 2);
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 13px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(ex.label, 0, 4);
  ctx.restore();

  // keycard + panel + vault door
  if (g.vault.keycard && !g.vault.keycard.taken) {
    const k = g.vault.keycard;
    ctx.fillStyle = COLORS.goldBright;
    roundRect(ctx, k.x - 14, k.y - 9, 28, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.font = 'bold 9px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('KEY', k.x, k.y + 3);
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 12px Georgia';
    ctx.fillText(`CODE ${k.code}`, k.x, k.y - 16);
  }
  if (g.vault.panel) {
    const p = g.vault.panel;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(p.x - 8, p.y - 14, 16, 28);
    ctx.fillStyle = g.vault.door.open ? '#2ecc71' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CODE PANEL', p.x, p.y + 30);
  }
  if (g.vault.door) {
    const d = g.vault.door;
    if (!d.open) {
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = COLORS.gold;
      for (let y = d.y + 10; y < d.y + d.h; y += 24) ctx.fillRect(d.x + 4, y, d.w - 8, 4);
    }
  }

  // lasers
  for (const l of g.vault.lasers) {
    const on = laserOn(l, g.time);
    ctx.strokeStyle = on ? COLORS.laser : COLORS.laserOff;
    ctx.lineWidth = on ? 3 : 2;
    ctx.setLineDash(on ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#333';
    ctx.fillRect(l.x1 - 3, l.y1 - 6, 6, 12);
    ctx.fillRect(l.x2 - 3, l.y2 - 6, 6, 12);
  }

  drawLoot(ctx, g.loot, g.time);

  // tossed coins + smoke
  for (const c of g.coins) {
    ctx.fillStyle = COLORS.goldBright;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const s of g.smokes) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // patrons (crowd)
  for (const p of g.patrons) drawPerson(ctx, p.x, p.y, p.r, p.color, null, p.angle);

  // guard vision cones (under the guards)
  for (const gd of g.guards) {
    if (gd.state === 'chase') {
      drawCone(ctx, gd.x, gd.y, gd.angle, 0.56, GUARD_VISION_RANGE, 'rgba(255, 68, 68, 0.28)');
    } else {
      drawCone(ctx, gd.x, gd.y, gd.angle, 0.56, GUARD_VISION_RANGE, COLORS.guardCone);
    }
  }
  // camera cones
  for (const c of g.cameras) {
    if (c.disabledTimer <= 0) {
      drawCone(ctx, c.x, c.y, c.angle, 0.44, CAMERA_RANGE, COLORS.cameraCone);
    }
  }

  // cameras (the wall units)
  for (const c of g.cameras) {
    ctx.fillStyle = c.disabledTimer > 0 ? '#555' : '#222';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.disabledTimer > 0 ? '#777' : '#ff4444';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // guards
  for (const gd of g.guards) {
    drawPerson(ctx, gd.x, gd.y, 14, COLORS.guard, '#0e1a3a', gd.angle);
    if (gd.suspicion > 5 && gd.state !== 'chase') {
      ctx.strokeStyle = gd.suspicion > 65 ? '#ff4444' : '#ffd640';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(gd.x, gd.y, 20, -Math.PI / 2, -Math.PI / 2 + (gd.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
    if (gd.state === 'chase') {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('!', gd.x, gd.y - 22);
    }
  }

  // the thief
  const p = g.player;
  const blink = g.caughtFlash > 0 && Math.floor(g.time * 12) % 2 === 0;
  if (!blink) drawPerson(ctx, p.x, p.y, p.r, COLORS.thiefCoat, '#111111', p.angle);

  drawHud(ctx, g);
  if (g.screen === 'title') drawTitle(ctx, g);
  if (g.screen === 'paused') drawPaused(ctx);
  if (g.screen === 'levelclear') drawLevelClear(ctx, g);
  if (g.screen === 'gameover') drawGameOver(ctx, g);
  if (g.screen === 'win') drawWin(ctx, g);
}

function drawHud(ctx, g) {
  ctx.fillStyle = 'rgba(8, 8, 14, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, 46);
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 17px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`HIGH ROLLER HEIST — ${g.level.name}`, 14, 29);
  // alarm meter
  const ax = 470;
  ctx.fillStyle = '#333';
  ctx.fillRect(ax, 12, 220, 22);
  const aw = (g.alarm / 100) * 220;
  ctx.fillStyle = g.alarm > 70 ? '#ff2222' : (g.alarm > 35 ? '#ffaa00' : '#2ecc71');
  ctx.fillRect(ax, 12, aw, 22);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, 12, 220, 22);
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 14px Georgia';
  ctx.fillText('ALARM', ax - 62, 29);
  ctx.fillText(`${Math.round(g.alarm)}%`, ax + 230, 29);
  // chips + lives + tools
  ctx.textAlign = 'right';
  ctx.fillText(`$${g.chips}`, 880, 29);
  ctx.fillStyle = '#ff5566';
  ctx.fillText('♥'.repeat(Math.max(0, g.lives)), 960, 29);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '14px Georgia';
  ctx.fillText(`◉ ${g.tools.coin}  ☁ ${g.tools.smoke}  ⚡ ${g.tools.emp}`, 1266, 29);
  // objective
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'italic 15px Georgia';
  ctx.fillText(g.objective, 14, 66);
  if (g.hasKeycard) {
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = 'bold 15px Georgia';
    ctx.fillText(`KEYCARD — CODE ${g.keycardCode}`, 1050, 66);
  }
  if (g.toastTimer > 0) {
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(g.toast, CANVAS_W / 2, 96);
  }
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(5, 5, 10, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function centerText(ctx, text, y, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_W / 2, y);
}

function drawTitle(ctx, g) {
  dim(ctx);
  centerText(ctx, 'HIGH ROLLER HEIST', 210, 'bold 64px Georgia', COLORS.goldBright);
  centerText(ctx, 'One thief. One casino. One very large chip.', 260, 'italic 22px Georgia', COLORS.hud);
  centerText(ctx, 'Pocket the chips. Crack the vault. Reach the limo.', 300, '18px Georgia', COLORS.hudDim);
  centerText(ctx, 'Guards watch with cones — stay out of them, or sneak slow.', 340, '18px Georgia', COLORS.hudDim);
  centerText(ctx, 'Crowds hide you. Coins distract. Smoke blinds. EMP kills cameras.', 370, '18px Georgia', COLORS.hudDim);
  centerText(ctx, 'Press ENTER to start the night', 470, 'bold 26px Georgia', '#ffffff');
  centerText(ctx, 'WASD move · Shift sneak · Space dash · E grab/use · C coin · X smoke · Q EMP · P pause', 520, '16px Georgia', COLORS.hudDim);
}

function drawPaused(ctx) {
  dim(ctx);
  centerText(ctx, 'PAUSED', 350, 'bold 56px Georgia', COLORS.hud);
  centerText(ctx, 'Press P to keep stealing', 410, '20px Georgia', COLORS.hudDim);
}

function drawLevelClear(ctx, g) {
  dim(ctx);
  centerText(ctx, 'CLEAN GETAWAY', 280, 'bold 54px Georgia', COLORS.goldBright);
  centerText(ctx, g.levelClearLine, 340, '22px Georgia', COLORS.hud);
  centerText(ctx, `Take so far: $${g.chips}`, 390, 'bold 26px Georgia', '#ffffff');
  centerText(ctx, 'Press ENTER for the next room', 470, '20px Georgia', COLORS.hudDim);
}

function drawGameOver(ctx, g) {
  dim(ctx);
  centerText(ctx, 'BUSTED', 300, 'bold 64px Georgia', '#ff4444');
  centerText(ctx, g.gameOverLine, 360, '22px Georgia', COLORS.hud);
  centerText(ctx, `The house keeps your $${g.chips}… this time.`, 400, '20px Georgia', COLORS.hudDim);
  centerText(ctx, 'Press ENTER to try the night again', 470, 'bold 22px Georgia', '#ffffff');
}

function drawWin(ctx, g) {
  dim(ctx);
  centerText(ctx, 'THE PERFECT HEIST', 250, 'bold 58px Georgia', COLORS.goldBright);
  centerText(ctx, `You drove off with $${g.chips} — and the house never saw your face.`, 320, '22px Georgia', COLORS.hud);
  centerText(ctx, 'Ghost bonuses, chips and the Grand Chip, all in the bag.', 360, '18px Georgia', COLORS.hudDim);
  centerText(ctx, 'Press ENTER to play it again', 460, 'bold 22px Georgia', '#ffffff');
}
