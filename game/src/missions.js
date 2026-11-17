import * as THREE from 'three';
import { distanceXZ } from './state.js';

export const STORY = [
  { title: 'The Pickup', payout: 650, line: 'Mara: The package is still on the pier. Then we are square.' },
  { title: 'Hot Wheels', payout: 1100, line: 'Inez: Syndicate sports coupe. Take it intact to Old Town.' },
  { title: 'Harbor Heat', payout: 1450, line: 'Mara: Three stars. Shake them, then reach the safehouse.' },
  { title: 'The Exchange', payout: 1900, line: 'Inez: Hold the marina. The Harbor Syndicate brought friends.' },
  { title: 'Debt Paid', payout: 3200, line: 'Mara: One last run. Get through the coast road and end this.' },
];

const markerGeo = new THREE.TorusGeometry(2.4, 0.18, 8, 24);
const beamGeo = new THREE.CylinderGeometry(0.55, 1.8, 5, 10, 1, true);
const markerMat = new THREE.MeshStandardMaterial({ color: 0xf3c66a, emissive: 0x9a5c1a, emissiveIntensity: 1.1, roughness: 0.45 });
const markerBeamMat = new THREE.MeshBasicMaterial({ color: 0xf0b95d, transparent: true, opacity: 0.13, depthWrite: false });
const START_MARKERS = [0, 1, 3, 0, 5];
const RETURN_TO_CAR = new THREE.Vector3(4, 0, 4);
const GARAGE = new THREE.Vector3(-25, 0, -25);

function setMarker(state, point) {
  const marker = state.mission.marker;
  if (!point) { marker.visible = false; return; }
  marker.visible = true;
  marker.position.set(point.x, 0.14, point.z);
  state.mission.target = point;
}

function finishCurrent(state, audio, line) {
  const current = STORY[state.mission.index];
  state.player.cash += current.payout;
  if (state.mission.index === 1) { state.player.weapon = true; state.player.ammo = 12; }
  state.mission.banner = 5;
  state.mission.message = `${current.title}  •  +$${current.payout.toLocaleString()}`;
  state.mission.dialogue = line || 'Mara: One less thing following me.';
  if (audio) audio.mission();
  state.mission.index += 1;
  state.mission.phase = 0;
  if (state.mission.index >= STORY.length) {
    state.mission.complete = true;
    state.screen = 'complete';
    setMarker(state, null);
    state.mission.dialogue = 'Mara: Debt paid. Solmar can keep the rest.';
    return;
  }
  const next = state.mission.index;
  state.mission.dialogue = STORY[next].line;
  setMarker(state, state.world.landmarks[START_MARKERS[next]]);
}

function spawnEnemies(state) {
  if (state.mission.enemies) return;
  state.mission.enemies = [];
  const center = state.world.landmarks[0];
  for (let i = 0; i < 4; i += 1) {
    const mesh = new THREE.Group();
    const shirt = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.65, 3, 6), new THREE.MeshStandardMaterial({ color: 0x513f48 }));
    shirt.position.y = 0.82; mesh.add(shirt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), new THREE.MeshStandardMaterial({ color: 0xb77b5c }));
    head.position.y = 1.47; mesh.add(head);
    mesh.position.set(center.x + (i - 1.5) * 4.2, 0, center.z - 5 - (i % 2) * 3);
    state.scene.add(mesh);
    const enemy = { mesh, position: mesh.position, heading: Math.PI, speed: 0, fear: 0, alive: true, health: 1, hostile: true };
    state.peds.push(enemy);
    state.mission.enemies.push(enemy);
  }
}

export function createMissions(state) {
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(markerGeo, markerMat);
  ring.rotation.x = -Math.PI / 2; marker.add(ring);
  const beam = new THREE.Mesh(beamGeo, markerBeamMat);
  beam.position.y = 2.5; marker.add(beam);
  marker.position.set(0, 0.1, 0); state.scene.add(marker);
  state.mission.marker = marker;
  syncMissionMarker(state);
  state.mission.dialogue = STORY[state.mission.index]?.line ?? '';
  return STORY;
}

export function syncMissionMarker(state) {
  const mission = state.mission;
  if (!mission.marker || mission.index >= STORY.length) {
    if (mission.marker) mission.marker.visible = false;
    return;
  }
  if (mission.index === 0 && mission.phase === 1) setMarker(state, RETURN_TO_CAR);
  else if (mission.index === 1 && mission.phase === 1) setMarker(state, GARAGE);
  else if (mission.index === 3 && mission.phase === 1) {
    spawnEnemies(state);
    setMarker(state, state.world.landmarks[START_MARKERS[mission.index]]);
  }
  else setMarker(state, state.world.landmarks[START_MARKERS[mission.index]]);
}

export function updateMissions(state, dt, audio) {
  const mission = state.mission;
  if (mission.banner > 0) mission.banner = Math.max(0, mission.banner - dt);
  if (mission.marker?.visible) {
    mission.marker.rotation.y += dt * 0.55;
    mission.marker.position.y = 0.14 + Math.sin(state.time * 2.2) * 0.12;
  }
  if (mission.complete) return;
  const player = state.player;
  const target = mission.target;
  if (!target) return;
  const d = distanceXZ(player.position, target);
  switch (mission.index) {
    case 0:
      if (mission.phase === 0 && d < 5) {
        mission.phase = 1;
        mission.dialogue = 'Mara: Got it. Back to the car before the tide turns.';
        setMarker(state, RETURN_TO_CAR);
      } else if (mission.phase === 1 && d < 6) finishCurrent(state, audio, 'Mara: Package delivered. The debt is smaller.');
      break;
    case 1:
      if (mission.phase === 0 && player.car === state.missionCar) {
        mission.phase = 1; mission.dialogue = 'Inez: That is the one. Bring it to the garage.';
        setMarker(state, GARAGE);
      } else if (mission.phase === 1 && player.car === state.missionCar && d < 7) finishCurrent(state, audio, 'Inez: Clean enough. You earned this.');
      break;
    case 2:
      if (mission.phase === 0) {
        player.wanted = Math.max(player.wanted, 3);
        mission.phase = 1;
        mission.dialogue = 'Mara: Lose the uniforms. No heroics.';
      }
      if (mission.phase === 1 && player.wanted === 0 && d < 7) finishCurrent(state, audio, 'Mara: Safe. That was the hard part.');
      break;
    case 3:
      if (mission.phase === 0 && d < 7 && player.onFoot) {
        mission.phase = 1; spawnEnemies(state);
        player.weapon = true; player.ammo = Math.max(player.ammo, 12);
        mission.dialogue = 'Mara: Keep them away from Inez. Click to aim and fire.';
      }
      if (mission.phase === 1 && mission.enemies?.every((enemy) => !enemy.alive)) finishCurrent(state, audio, 'Inez: Harbor is quiet. We can finish this.');
      break;
    case 4:
      if (mission.phase === 0 && player.car && d < 8) finishCurrent(state, audio, 'Mara: Debt paid. Solmar is yours again.');
      break;
    default: break;
  }
}

export function missionObjective(state) {
  const mission = state.mission;
  if (mission.complete) return 'STORY COMPLETE — FREE ROAM';
  switch (mission.index) {
    case 0: return mission.phase === 0 ? 'Drive to the pier and collect the package' : 'Return the package to your car';
    case 1: return mission.phase === 0 ? 'Steal the marked syndicate sports car' : 'Deliver the sports car to the Old Town garage';
    case 2: return mission.phase === 0 ? 'Reach the safehouse and trigger the chase' : 'Lose the 3-star pursuit, then reach the safehouse';
    case 3: return mission.phase === 0 ? 'Reach the marina exchange' : `Defend the exchange — ${mission.enemies?.filter((e) => e.alive).length ?? 4} remain`;
    case 4: return 'Drive through the coast road to the final marker';
    default: return '';
  }
}
