import * as THREE from 'three';
import { distanceXZ } from './state.js';
import { createCar } from './vehicles.js';

const direction = new THREE.Vector3();
const copColors = [0x29466e, 0x314d74, 0x243b62, 0x385779, 0x263e65];

function spawnCar(state, index) {
  const player = state.player.position;
  const angle = (index / Math.max(1, state.player.wanted)) * Math.PI * 2;
  const rawX = player.x + Math.cos(angle) * (37 + index * 6);
  const rawZ = player.z + Math.sin(angle) * (37 + index * 6);
  const x = THREE.MathUtils.clamp(Math.round(rawX / 26) * 26, -124, 124);
  const z = THREE.MathUtils.clamp(Math.round(rawZ / 26) * 26, -124, 100);
  const car = createCar(state.scene, x, z, copColors[index % copColors.length], { police: true, heading: Math.atan2(player.x - x, player.z - z), maxSpeed: 30 });
  car.speed = 8; car.police = true; car.radius = 1.8;
  state.police.push({ kind: 'car', car, mesh: car.mesh, position: car.position, alive: true });
}

function spawnOfficer(state, index) {
  const player = state.player.position;
  const angle = index * 2.4 + 0.8;
  const mesh = new THREE.Group();
  const uniform = new THREE.MeshStandardMaterial({ color: 0x263f62, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.65, 3, 6), uniform);
  body.position.y = 0.82; mesh.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), new THREE.MeshStandardMaterial({ color: 0xb77b5c }));
  head.position.y = 1.47; mesh.add(head);
  mesh.position.set(player.x + Math.cos(angle) * 28, 0, player.z + Math.sin(angle) * 28);
  state.scene.add(mesh);
  state.police.push({ kind: 'officer', mesh, position: mesh.position, alive: true });
}

function addRoadblock(state) {
  if (state.roadblock) return;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(7, 0.75, 0.7), new THREE.MeshStandardMaterial({ color: 0xe7a43c, emissive: 0x452400 }));
  mesh.position.set(Math.round(state.player.position.x / 26) * 26, 0.7, Math.round(state.player.position.z / 26) * 26 + 5);
  state.scene.add(mesh);
  state.roadblock = mesh;
  state.roadblockCollider = {
    minX: mesh.position.x - 3.5, maxX: mesh.position.x + 3.5,
    minZ: mesh.position.z - 0.35, maxZ: mesh.position.z + 0.35,
  };
  state.colliders.push(state.roadblockCollider);
}

function clearPolice(state) {
  for (let i = 0; i < state.police.length; i += 1) {
    const unit = state.police[i];
    if (unit.kind === 'car') {
      state.scene.remove(unit.mesh);
      const index = state.vehicles.indexOf(unit.car);
      if (index >= 0) state.vehicles.splice(index, 1);
    } else state.scene.remove(unit.mesh);
  }
  state.police.length = 0;
  if (state.roadblock) {
    state.scene.remove(state.roadblock);
    state.roadblock = null;
    const index = state.colliders.indexOf(state.roadblockCollider);
    if (index >= 0) state.colliders.splice(index, 1);
    state.roadblockCollider = null;
  }
}

export function updatePolice(state, dt) {
  const player = state.player;
  if (player.wanted > 0) {
    let cars = 0, officers = 0;
    for (let i = 0; i < state.police.length; i += 1) {
      if (state.police[i].kind === 'car') cars += 1;
      else officers += 1;
    }
    const desiredCars = Math.min(5, player.wanted + 1);
    while (cars < desiredCars) { spawnCar(state, cars); cars += 1; }
    const desiredOfficers = player.wanted >= 3 ? Math.min(3, player.wanted - 1) : 0;
    while (officers < desiredOfficers) { spawnOfficer(state, officers); officers += 1; }
    if (player.wanted >= 5) addRoadblock(state);
  }

  let nearest = 999, nearestX = player.position.x, nearestZ = player.position.z;
  for (let i = 0; i < state.police.length; i += 1) {
    const unit = state.police[i];
    if (!unit.alive) continue;
    const dx = player.position.x - unit.position.x, dz = player.position.z - unit.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < nearest) { nearest = distance; nearestX = unit.position.x; nearestZ = unit.position.z; }
    if (unit.kind === 'car') {
      const car = unit.car;
      const desiredHeading = Math.atan2(-dx, -dz);
      let turn = THREE.MathUtils.euclideanModulo(desiredHeading - car.heading + Math.PI, Math.PI * 2) - Math.PI;
      car.heading += THREE.MathUtils.clamp(turn, -dt * 1.5, dt * 1.5);
      car.speed = Math.min(car.maxSpeed, car.speed + dt * 10);
      const nextX = car.position.x - Math.sin(car.heading) * car.speed * dt;
      const nextZ = car.position.z - Math.cos(car.heading) * car.speed * dt;
      let blocked = Math.abs(nextX) > 130 || nextZ < -130 || nextZ > 154;
      for (let j = 0; j < state.colliders.length && !blocked; j += 1) {
        const c = state.colliders[j];
        blocked = nextX + car.radius > c.minX && nextX - car.radius < c.maxX
          && nextZ + car.radius > c.minZ && nextZ - car.radius < c.maxZ;
      }
      if (blocked) {
        car.heading += turn >= 0 ? Math.PI / 2 : -Math.PI / 2;
        car.speed *= 0.62;
      } else {
        car.position.x = nextX;
        car.position.z = nextZ;
      }
      car.mesh.rotation.y = car.heading;
      if (distance < 3.2 && !player.onFoot) player.car.speed *= 0.92;
    } else {
      direction.set(dx, 0, dz);
      if (distance > 0.01) {
        direction.normalize();
        unit.position.x += direction.x * 4.4 * dt;
        unit.position.z += direction.z * 4.4 * dt;
        unit.mesh.rotation.y = Math.atan2(-direction.x, -direction.z);
      }
      if (player.onFoot && distance < 1.65) return true;
    }
  }

  if (player.wanted > 0) {
    let obscured = false;
    if (nearest > 22) {
      for (let s = 1; s < 20 && !obscured; s += 1) {
        const x = player.position.x + (nearestX - player.position.x) * s / 20;
        const z = player.position.z + (nearestZ - player.position.z) * s / 20;
        for (let i = 0; i < state.colliders.length; i += 1) {
          const c = state.colliders[i];
          if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) { obscured = true; break; }
        }
      }
    }
    const hidden = obscured && nearest > (player.car ? 58 : 40);
    player.hideTimer = hidden ? (player.hideTimer ?? 0) + dt : 0;
    if (player.hideTimer > 8) {
      player.wantedDecay = (player.wantedDecay ?? 0) + dt;
      if (player.wantedDecay > 13) {
        player.wanted -= 1; player.wantedDecay = 0; player.hideTimer = 0;
        state.stats.escapes += 1;
        if (player.wanted === 0) clearPolice(state);
      }
    } else player.wantedDecay = 0;
  }
  if (player.health <= 0) return true;
  return false;
}

export function bustPlayer(state) {
  const player = state.player;
  player.cash = Math.max(0, player.cash - Math.min(250, Math.floor(player.cash * 0.22)));
  player.health = 100; player.wanted = 0; player.onFoot = true; player.car = null;
  player.position.set(-78, 0, 27); player.velocity.set(0, 0, 0);
  player.hideTimer = 0; player.wantedDecay = 0;
  clearPolice(state);
  state.screen = 'busted';
}
