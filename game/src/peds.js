import * as THREE from 'three';
import { CITY, distanceXZ } from './state.js';
import { COLORS } from './palette.js';

const bodyGeo = new THREE.CapsuleGeometry(0.28, 0.62, 3, 5);
const headGeo = new THREE.SphereGeometry(0.23, 7, 5);
const clothing = [0x476d71, 0xc36f56, 0xddd0b6, 0x756b85, 0x59744f, 0x344c5a, 0xe4b858];
const temp = new THREE.Vector3();

export function seedPeds(state, random) {
  for (let i = 0; i < 34; i += 1) {
    const alongX = i % 2 === 0;
    const lane = -4 + Math.floor(random() * 9);
    const walk = -112 + random() * 224;
    const x = alongX ? walk : lane * CITY.spacing + 6.1;
    const z = alongX ? lane * CITY.spacing + 6.1 : walk;
    const mesh = new THREE.Group();
    const coat = new THREE.MeshStandardMaterial({ color: clothing[i % clothing.length], roughness: 0.88 });
    const torso = new THREE.Mesh(bodyGeo, coat); torso.position.y = 0.82; mesh.add(torso);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: COLORS.skin, roughness: 0.8 }));
    head.position.y = 1.48; mesh.add(head);
    mesh.position.set(x, 0, z); state.scene.add(mesh);
    state.peds.push({
      mesh, position: mesh.position, heading: random() * Math.PI * 2,
      speed: 0.7 + random() * 0.7, fear: 0, alive: true, health: 1,
      walkAxis: alongX ? 'x' : 'z', direction: random() > 0.5 ? 1 : -1,
    });
  }
}

export function spawnFleeingPed(state, position) {
  const mesh = new THREE.Group();
  const torso = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: clothing[2], roughness: 0.88 }));
  torso.position.y = 0.82; mesh.add(torso);
  const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: COLORS.skin, roughness: 0.8 }));
  head.position.y = 1.48; mesh.add(head);
  mesh.position.set(position.x + 1.6, 0, position.z + 1.4);
  state.scene.add(mesh);
  state.peds.push({ mesh, position: mesh.position, heading: Math.PI, speed: 0, fear: 8, alive: true, health: 1, hostile: false });
}

export function scarePeds(state, origin, radius = 30) {
  for (let i = 0; i < state.peds.length; i += 1) {
    const ped = state.peds[i];
    if (!ped.alive || distanceXZ(ped.position, origin) > radius) continue;
    temp.subVectors(ped.position, origin);
    ped.heading = Math.atan2(-temp.x, -temp.z);
    ped.fear = 6;
  }
}

export function updatePeds(state, dt) {
  const player = state.player;
  for (let i = 0; i < state.peds.length; i += 1) {
    const ped = state.peds[i];
    if (!ped.alive) continue;
    if (ped.fear > 0) ped.fear -= dt;
    else {
      ped.position[ped.walkAxis] += ped.direction * ped.speed * dt;
      if (Math.abs(ped.position[ped.walkAxis]) > 120) ped.direction *= -1;
      ped.heading = ped.walkAxis === 'x' ? (ped.direction > 0 ? -Math.PI / 2 : Math.PI / 2) : (ped.direction > 0 ? 0 : Math.PI);
    }
    if (ped.fear > 0) {
      ped.position.x += -Math.sin(ped.heading) * 5.2 * dt;
      ped.position.z += -Math.cos(ped.heading) * 5.2 * dt;
    }
    ped.mesh.rotation.y = ped.heading;
    if (player.car && Math.abs(player.car.speed) > 8 && distanceXZ(ped.position, player.position) < 1.8) {
      ped.alive = false; ped.mesh.visible = false;
      player.health = Math.max(0, player.health - 14);
      player.wanted = Math.min(5, player.wanted + 1);
      state.stats.crimes += 1;
      scarePeds(state, player.position, 36);
    }
  }
}
