import * as THREE from 'three';

export const STEP = 1 / 60;
export const CITY = { half: 132, spacing: 26, road: 9 };

export function createState(scene) {
  return {
    scene,
    player: {
      position: new THREE.Vector3(4, 0, 4), velocity: new THREE.Vector3(),
      heading: Math.PI, health: 100, cash: 450, wanted: 0, onFoot: true,
      car: null, weapon: false, ammo: 0, reload: 0, jump: 0, bust: 0,
    },
    vehicles: [],
    traffic: [],
    peds: [],
    police: [],
    colliders: [],
    mission: { index: 0, phase: 0, complete: false, marker: null, message: '', banner: 0 },
    stats: { crimes: 0, escapes: 0, pedsHelped: 0 },
    time: 0,
    rng: Math.random,
    world: null,
    audio: null,
    screen: 'title',
    shot: false,
  };
}

export function distanceXZ(a, b) {
  const x = a.x - b.x;
  const z = a.z - b.z;
  return Math.sqrt(x * x + z * z);
}
