import * as THREE from 'three';
import { distanceXZ } from './state.js';
import { scarePeds } from './peds.js';

const direction = new THREE.Vector3();
const toTarget = new THREE.Vector3();

export function updateCombat(state, input, dt, camera, audio) {
  const player = state.player;
  if (player.reload > 0) {
    player.reload -= dt;
    if (player.reload <= 0) player.ammo = 12;
  }
  player.fireCooldown = Math.max(0, (player.fireCooldown ?? 0) - dt);
  if (input.melee && player.onFoot && player.fireCooldown <= 0) {
    let target = null, nearest = 2.4;
    for (let i = 0; i < state.peds.length; i += 1) {
      const ped = state.peds[i];
      if (!ped.alive) continue;
      const distance = distanceXZ(player.position, ped.position);
      if (distance < nearest) { target = ped; nearest = distance; }
    }
    if (target) {
      target.health -= 1; target.fear = 6;
      if (target.health <= 0) { target.alive = false; target.mesh.visible = false; }
      player.wanted = Math.min(5, player.wanted + 1);
      state.stats.crimes += 1;
      player.fireCooldown = 0.6;
      if (audio) audio.pickup();
      scarePeds(state, player.position, 26);
    }
  }
  if (!player.weapon || !player.onFoot || !input.firePressed || player.fireCooldown > 0) return;
  if (player.ammo <= 0) {
    if (input.reload) player.reload = 1.15;
    return;
  }
  player.ammo -= 1;
  player.fireCooldown = 0.28;
  state.stats.crimes += 1;
  player.wanted = Math.min(5, player.wanted + 1);
  if (audio) audio.gunshot();
  camera.getWorldDirection(direction);
  let best = null, bestDot = 0.93, bestDistance = 48, bestHostile = false;
  for (let i = 0; i < state.peds.length; i += 1) {
    const ped = state.peds[i];
    if (!ped.alive) continue;
    toTarget.set(ped.position.x - player.position.x, 1.15, ped.position.z - player.position.z);
    const dist = toTarget.length();
    if (dist >= bestDistance) continue;
    toTarget.normalize();
    const dot = direction.dot(toTarget);
    if ((ped.hostile && !bestHostile && dot > 0.82) || (ped.hostile === bestHostile && dot > bestDot)) {
      best = ped; bestDot = dot; bestDistance = dist; bestHostile = Boolean(ped.hostile);
    }
  }
  if (best) {
    best.health -= 1;
    best.fear = 12;
    if (best.health <= 0) { best.alive = false; best.mesh.visible = false; }
    scarePeds(state, player.position, 35);
  }
}

export function requestReload(state) {
  if (state.player.weapon && state.player.ammo < 12 && state.player.reload <= 0) state.player.reload = 1.15;
}

export function fireCrime(state) {
  state.player.wanted = Math.min(5, state.player.wanted + 1);
  state.stats.crimes += 1;
}
