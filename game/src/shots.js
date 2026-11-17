import { createCar } from './vehicles.js';
import { updatePolice } from './police.js';

function frameShot(camera, position, target, fov = 46) {
  camera.fov = fov;
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateProjectionMatrix();
}

function hideStreetlights(scene) {
  const poles = scene.getObjectByName('streetlight-poles');
  const lamps = scene.getObjectByName('streetlight-lamps');
  if (poles) poles.visible = false;
  if (lamps) lamps.visible = false;
}

function stageTraffic(state, cars) {
  const placements = [
    [-13, 0, 1], [-5, -0.5, -1], [5, 0.5, 1], [13, 0, -1],
    [-10, -26, 1], [10, -26, -1],
  ];
  for (let i = 0; i < Math.min(cars, state.traffic.length, placements.length); i += 1) {
    const car = state.traffic[i];
    const [x, z, direction] = placements[i];
    car.axis = 'x';
    car.dir = direction;
    car.position.set(x, 0, z);
    car.heading = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
    car.speed = 8 + (i % 3);
    car.mesh.rotation.y = car.heading;
  }
}

function stagePeds(state) {
  const points = [
    [-6.1, -12], [-6.1, -5], [-6.1, 3], [-6.1, 11],
    [6.1, -10], [6.1, -2], [6.1, 6], [6.1, 14],
  ];
  for (let i = 0; i < Math.min(points.length, state.peds.length); i += 1) {
    const ped = state.peds[i];
    const [x, z] = points[i];
    ped.position.set(x, 0, z);
    ped.alive = true;
    ped.fear = 0;
    ped.mesh.visible = true;
    ped.heading = i % 2 ? Math.PI : 0;
    ped.mesh.rotation.y = ped.heading;
  }
}

export function stageShot(name, state, camera, cameraState, hud) {
  const player = state.player;
  state.shot = true;
  window.__shotMode = true;
  player.position.set(0, 0, 0);
  player.heading = 0;
  cameraState.yaw = 0;
  cameraState.pitch = 0.18;
  hideStreetlights(state.scene);

  if (name === 'start') {
    player.position.set(0, 0, 50);
    camera.position.set(88, 52, 126);
    camera.lookAt(0, 7, 24);
    state.screen = 'title';
    hud.showScreen('title', true);
    return;
  }

  if (name === 'play') {
    player.onFoot = true;
    player.car = null;
    player.position.set(0, 0, 4);
    player.heading = Math.PI;
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = player.heading;
    player.mesh.visible = true;
    stageTraffic(state, 6);
    stagePeds(state);

    state.mission.target.set(0, 0, -11);
    state.mission.marker.visible = true;
    state.mission.marker.position.set(0, 0.14, -11);
    frameShot(camera, { x: 0, y: 7.2, z: 22 }, { x: 0, y: 1, z: -7 }, 44);
    state.screen = 'play';
    hud.showScreen('play');
    return;
  }

  if (name === 'chase') {
    player.onFoot = false;
    const car = createCar(state.scene, 0, 0, 0xd55c42, { heading: 0, type: 'sports', maxSpeed: 39 });
    car.speed = 24;
    player.car = car;
    player.position.copy(car.position);
    state.vehicles.push(car);
    player.wanted = 3;
    updatePolice(state, 0);

    let placed = 0;
    for (let i = 0; i < state.police.length; i += 1) {
      const unit = state.police[i];
      if (unit.kind !== 'car') continue;
      const side = placed % 2 === 0 ? -1 : 1;
      unit.position.set(side * 3.2, 0, 6 + Math.floor(placed / 2) * 2.2);
      unit.car.heading = 0;
      unit.car.mesh.rotation.y = 0;
      unit.car.speed = 17;
      placed += 1;
    }
    stageTraffic(state, 2);
    for (let i = 0; i < Math.min(2, state.traffic.length); i += 1) {
      state.traffic[i].position.set(i === 0 ? -4 : 4, 0, -26);
    }
    frameShot(camera, { x: 0, y: 7, z: 18 }, { x: 0, y: 1, z: -3 }, 46);
    state.screen = 'play';
    hud.showScreen('play');
    return;
  }

  if (name === 'end') {
    const car = createCar(state.scene, 0, 0, 0xd55c42, { heading: -0.5, type: 'sports', maxSpeed: 39 });
    state.vehicles.push(car);
    player.onFoot = true;
    player.car = null;
    player.position.set(2.8, 0, 1.4);
    player.heading = Math.atan2(-3.7, -13.6);
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = player.heading;
    player.mesh.visible = true;
    state.mission.complete = true;
    state.mission.index = 5;
    state.mission.target = null;
    state.mission.marker.visible = false;
    state.screen = 'play';
    state.mission.banner = 10;
    state.mission.message = 'MISSION COMPLETE  •  DEBT PAID';
    frameShot(camera, { x: 6.5, y: 6.3, z: 15 }, { x: 0.8, y: 1.1, z: 0 }, 47);
    hud.showScreen('play');
    return;
  }

  state.screen = 'title';
  hud.showScreen('title', true);
}
