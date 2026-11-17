import * as THREE from 'three';
import { CITY, distanceXZ } from './state.js';
import { spawnFleeingPed } from './peds.js';

const bodyGeo = new THREE.BoxGeometry(1.9, 0.72, 4.1);
const cabinGeo = new THREE.BoxGeometry(1.48, 0.68, 2.15);
const windowMat = new THREE.MeshStandardMaterial({ color: 0x42626a, roughness: 0.28, metalness: 0.18 });
const policeWindowMat = new THREE.MeshStandardMaterial({ color: 0x25384a, roughness: 0.3 });
const tempForward = new THREE.Vector3();

export function createCar(scene, x, z, color, options = {}) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.18 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.72; group.add(body);
  const cabin = new THREE.Mesh(cabinGeo, options.police ? policeWindowMat : windowMat);
  cabin.position.set(0, 1.34, 0.05); group.add(cabin);
  if (options.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x4ca3ff, emissive: 0x174caa, emissiveIntensity: 1.5 }));
    bar.position.set(0, 1.76, 0.05); group.add(bar);
  }
  group.position.set(x, 0, z);
  scene.add(group);
  return {
    mesh: group, position: group.position, heading: options.heading ?? 0, speed: 0,
    maxSpeed: options.maxSpeed ?? 26, driver: options.driver ?? null,
    parked: Boolean(options.parked), police: Boolean(options.police),
    color, type: options.type ?? 'sedan', radius: 1.55,
  };
}

export function seedParkedCars(state, random) {
  const colors = [0xc95f50, 0xd7d0bc, 0x347e83, 0x303d48, 0xd2a44c, 0x779078, 0x58728a];
  for (let i = 0; i < 22; i += 1) {
    const lane = -4 + (i % 9);
    const block = -4 + Math.floor(i / 9) * 3;
    const alongX = i % 2 === 0;
    const x = alongX ? (block + 0.5) * CITY.spacing : lane * CITY.spacing + 3.1;
    const z = alongX ? lane * CITY.spacing - 3.1 : (block + 0.5) * CITY.spacing;
    const car = createCar(state.scene, x, z, colors[Math.floor(random() * colors.length)], {
      heading: alongX ? -Math.PI / 2 : 0, parked: true, driver: random() > 0.48 ? 'resident' : null,
      maxSpeed: 24 + random() * 9,
    });
    state.vehicles.push(car);
  }
  state.vehicles.push(createCar(state.scene, 7, 4, 0x788d8b, { heading: 0, parked: true }));
  const sports = createCar(state.scene, 29, 78, 0xd55c42, { heading: 0.2, parked: true, driver: 'syndicate', type: 'sports', maxSpeed: 39 });
  state.vehicles.push(sports);
  state.missionCar = sports;
}

export function enterExitVehicle(state) {
  const player = state.player;
  if (!player.onFoot) {
    const car = player.car;
    player.position.x = car.position.x + Math.cos(car.heading) * 2.4;
    player.position.z = car.position.z + Math.sin(car.heading) * 2.4;
    player.onFoot = true; player.car = null;
    return 'exit';
  }
  let nearest = null, nearestDistance = 4.2;
  for (let i = 0; i < state.vehicles.length; i += 1) {
    const car = state.vehicles[i];
    if (car.police) continue;
    const d = distanceXZ(player.position, car.position);
    if (d < nearestDistance) { nearest = car; nearestDistance = d; }
  }
  if (!nearest) return '';
  if (nearest.traffic) {
    const index = state.traffic.indexOf(nearest);
    if (index >= 0) state.traffic.splice(index, 1);
    nearest.traffic = false;
  }
  if (nearest.driver) {
    nearest.driver = null;
    state.player.wanted = Math.min(5, state.player.wanted + 1);
    state.stats.crimes += 1;
    spawnFleeingPed(state, nearest.position);
  }
  player.onFoot = false; player.car = nearest; player.position.copy(nearest.position);
  player.heading = nearest.heading;
  return 'enter';
}

export function updatePlayerVehicle(state, input, dt) {
  const car = state.player.car;
  if (!car) return;
  const keys = input.keys;
  const throttle = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const steer = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const grip = Math.min(1, Math.abs(car.speed) / 8 + 0.12);
  car.speed += throttle * 24 * dt;
  if (!throttle) car.speed *= Math.max(0, 1 - dt * 1.5);
  if (keys.Space) car.speed *= Math.max(0, 1 - dt * 5.5);
  car.speed = THREE.MathUtils.clamp(car.speed, -car.maxSpeed * 0.35, car.maxSpeed);
  car.heading -= steer * grip * (car.speed >= 0 ? 1 : -1) * dt * 1.75;
  tempForward.set(-Math.sin(car.heading), 0, -Math.cos(car.heading));
  const nextX = car.position.x + tempForward.x * car.speed * dt;
  const nextZ = car.position.z + tempForward.z * car.speed * dt;
  let blocked = Math.abs(nextX) > 130 || nextZ < -130 || nextZ > 154;
  for (let i = 0; i < state.colliders.length; i += 1) {
    const c = state.colliders[i];
    if (nextX + car.radius > c.minX && nextX - car.radius < c.maxX && nextZ + car.radius > c.minZ && nextZ - car.radius < c.maxZ) { blocked = true; break; }
  }
  if (blocked) car.speed *= -0.18;
  else { car.position.x = nextX; car.position.z = nextZ; }
  car.mesh.rotation.y = car.heading;
  state.player.position.copy(car.position);
  state.player.heading = car.heading;
}
