import * as THREE from 'three';
import { createState, STEP } from './state.js';
import { createWorld } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { seedParkedCars, enterExitVehicle, updatePlayerVehicle } from './vehicles.js';
import { seedTraffic, updateTraffic } from './traffic.js';
import { seedPeds, updatePeds } from './peds.js';
import { updatePolice, bustPlayer } from './police.js';
import { updateCombat, requestReload } from './combat.js';
import { createMissions, updateMissions, syncMissionMarker } from './missions.js';
import { createInput, clearInput } from './input.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const parsedSeed = Number.parseInt(params.get('seed') ?? '', 10);
let seed = Number.isInteger(parsedSeed) ? parsedSeed : Date.now() >>> 0;
function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const canvas = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe4b17f);
scene.fog = new THREE.Fog(0xe4b17f, 105, 290);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 450);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

scene.add(new THREE.HemisphereLight(0xffe6c6, 0x55655c, 2.0));
const sun = new THREE.DirectionalLight(0xffd49a, 2.3);
sun.position.set(-75, 110, -60);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x87c9cc, 0.5);
fill.position.set(45, 28, 95);
scene.add(fill);
camera.position.set(88, 52, 126);
camera.lookAt(0, 7, 24);

const state = createState(scene);
state.rng = random;
state.world = createWorld(scene, random);
state.colliders = state.world.colliders;
seedParkedCars(state, random);
seedTraffic(state, random);
seedPeds(state, random);
const cameraState = { yaw: 0, pitch: 0.22 };
createPlayer(state);
const audio = createAudio();
state.audio = audio;
createMissions(state);
const input = createInput(canvas);
const hud = createHud(handleAction);
const shotMode = Boolean(shot);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', resize);

function handleAction(action) {
  if (action === 'new') {
    window.location.replace(window.location.pathname);
  } else if (action === 'continue') {
    if (loadGame(state)) {
      state.player.mesh.position.copy(state.player.position);
      syncMissionMarker(state);
      state.screen = state.mission.complete ? 'complete' : 'play';
      audio.resume();
      hud.showScreen(state.screen);
      hud.announce('Continue your Solmar City story.');
    } else hud.announce('No readable save was found.');
  } else if (action === 'resume') {
    state.screen = 'play';
    audio.resume();
    hud.showScreen('play');
  } else if (action === 'save') {
    hud.announce(saveGame(state) ? 'Game saved.' : 'Save failed; browser storage is unavailable.');
  } else if (action === 'title') {
    document.exitPointerLock?.();
    state.screen = 'title';
    hud.showScreen('title', hasSave());
  }
}

function step(dt) {
  state.time += dt;
  if (input.firePressed) audio.resume();
  if (input.interact) {
    const result = enterExitVehicle(state);
    if (result === 'enter') {
      audio.resume();
      hud.announce('Vehicle acquired. Keep moving.');
    } else if (result === 'exit') hud.announce('On foot.');
  }
  if (input.reload) requestReload(state);
  updatePlayer(state, input, dt, camera, cameraState);
  updatePlayerVehicle(state, input, dt);
  updateTraffic(state, dt);
  updatePeds(state, dt);
  updateCombat(state, input, dt, camera, audio);
  audio.update(dt, state.player.onFoot ? 0 : Math.abs(state.player.car.speed), state.player.wanted);
  if (updatePolice(state, dt)) {
    bustPlayer(state);
    document.exitPointerLock?.();
    hud.showScreen('busted');
    hud.announce('Busted. You were taken to Solmar General.');
    clearInput(input);
    return;
  }
  updateMissions(state, dt, audio);
  clearInput(input);
}

function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - previous) / 1000, MAX_FRAME);
  previous = now;
  if (input.save) {
    hud.announce(saveGame(state) ? 'Game saved.' : 'Save failed; browser storage is unavailable.');
    input.save = false;
  }
  if (input.missions) {
    hud.toggleMissions();
    input.missions = false;
  }
  if (input.pause) {
    if (state.screen === 'play') {
      state.screen = 'paused';
      document.exitPointerLock?.();
      hud.showScreen('paused');
    } else if (state.screen === 'paused') {
      state.screen = 'play';
      audio.resume();
      hud.showScreen('play');
    }
    input.pause = false;
  }
  if (state.screen === 'play') {
    accumulator += delta;
    while (accumulator >= STEP && state.screen === 'play') {
      step(STEP);
      accumulator -= STEP;
    }
  } else accumulator = 0;
  if (state.screen !== previousScreen) {
    if (state.screen === 'complete') hud.showScreen('complete');
    previousScreen = state.screen;
  }
  hud.refresh(state);
  renderer.render(scene, camera);
}

let accumulator = 0;
let previous = performance.now();
let previousScreen = state.screen;

if (shotMode) {
  stageShot(shot, state, camera, cameraState, hud);
  hud.refresh(state);
  let painted = 0;
  const paintShot = () => {
    renderer.render(scene, camera);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paintShot);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paintShot);
} else {
  hud.showScreen('title', hasSave());
  hud.refresh(state);
  requestAnimationFrame(frame);
}
