const KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyE', 'KeyR', 'KeyM', 'KeyP', 'KeyF', 'Escape']);

export function createInput(canvas) {
  const keys = Object.create(null);
  const input = {
    keys, dx: 0, dy: 0, fire: false, firePressed: false, interact: false,
    pause: false, save: false, missions: false, reload: false, melee: false, pointer: false,
  };
  window.addEventListener('keydown', (event) => {
    if (KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    keys[event.code] = true;
    if (event.code === 'KeyE') input.interact = true;
    if (event.code === 'Escape') input.pause = true;
    if (event.code === 'KeyP') input.save = true;
    if (event.code === 'KeyM') input.missions = true;
    if (event.code === 'KeyR') input.reload = true;
    if (event.code === 'KeyF') input.melee = true;
  });
  window.addEventListener('keyup', (event) => { keys[event.code] = false; });
  window.addEventListener('blur', () => {
    for (const key of Object.keys(keys)) keys[key] = false;
    input.fire = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    input.fire = true;
    input.firePressed = true;
    if (document.pointerLockElement !== canvas && !window.__shotMode) canvas.requestPointerLock?.();
  });
  window.addEventListener('pointerup', (event) => { if (event.button === 0) input.fire = false; });
  document.addEventListener('pointerlockchange', () => { input.pointer = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', (event) => {
    if (input.pointer) { input.dx += event.movementX; input.dy += event.movementY; }
  });
  return input;
}

export function clearInput(input) {
  input.dx = 0; input.dy = 0; input.firePressed = false;
  input.interact = false; input.pause = false; input.save = false; input.missions = false; input.reload = false; input.melee = false;
}
