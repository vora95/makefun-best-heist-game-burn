// Screenshot poses — fixed, hand-placed game states for the four
// screenshots. No randomness, no animation: the same URL always renders
// the same frame, so the cover is exactly what the judge sees. The
// main loop calls applyShot(name) once when ?shot= is present, renders
// one frame, and raises window.__shotReady.
export function applyShot(g, name, loadLevel) {
  if (name === 'title') {
    loadLevel(0);
    g.screen = 'title';
    return;
  }
  if (name === 'play') {
    loadLevel(0);
    g.screen = 'playing';
    g.player.x = 620;
    g.player.y = 400;
    g.player.angle = -0.4;
    g.guards[0].x = 780;
    g.guards[0].y = 330;
    g.guards[0].angle = 2.6;
    g.guards[0].suspicion = 55;
    g.guards[1].x = 420;
    g.guards[1].y = 560;
    g.guards[1].angle = -1.2;
    g.cameras[0].angle = 0.9;
    g.cameras[1].angle = 2.6;
    g.loot[0].taken = true;
    g.loot[1].taken = true;
    g.levelChips = 200;
    g.chips = 200;
    g.alarm = 35;
    g.toast = '';
    g.toastTimer = 0;
    return;
  }
  if (name === 'vault') {
    loadLevel(1);
    g.screen = 'playing';
    g.player.x = 545;
    g.player.y = 370;
    g.player.angle = 0.3;
    g.hasKeycard = true;
    g.keycardCode = '4815';
    if (g.vault.keycard) g.vault.keycard.taken = true;
    g.guards[0].x = 420;
    g.guards[0].y = 240;
    g.guards[0].angle = 0.5;
    g.guards[1].x = 980;
    g.guards[1].y = 480;
    g.guards[1].angle = 2.9;
    g.cameras[0].angle = 1.9;
    g.levelChips = 100;
    g.chips = 400;
    g.alarm = 22;
    g.toast = 'CODE 4815 ACCEPTED — VAULT OPEN';
    g.toastTimer = 99;
    if (g.vault.door) g.vault.door.open = true;
    return;
  }
  if (name === 'win') {
    loadLevel(2);
    g.screen = 'win';
    g.player.x = 1150;
    g.player.y = 90;
    g.player.angle = -0.8;
    g.chips = 2400;
    g.alarm = 58;
    return;
  }
}
