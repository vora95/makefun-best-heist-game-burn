// Keyboard + mouse state, kept in one place. The game reads held keys
// every frame; edges (just pressed) are consumed once by the loop.
const held = new Set();
const pressed = new Set();
let mouseX = 0;
let mouseY = 0;
let mouseClicked = false;

export const input = {
  held,
  mouseX: () => mouseX,
  mouseY: () => mouseY,
  clicked() {
    const c = mouseClicked;
    mouseClicked = false;
    return c;
  },
  wasPressed(code) {
    return pressed.has(code);
  },
  clearPressed() {
    pressed.clear();
  },
  axis() {
    let x = 0;
    let y = 0;
    if (held.has('ArrowLeft') || held.has('KeyA')) x -= 1;
    if (held.has('ArrowRight') || held.has('KeyD')) x += 1;
    if (held.has('ArrowUp') || held.has('KeyW')) y -= 1;
    if (held.has('ArrowDown') || held.has('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  },
};

export function bindInput(canvas) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    mouseClicked = true;
  });
}
