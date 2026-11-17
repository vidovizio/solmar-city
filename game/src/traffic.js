import { CITY, distanceXZ } from './state.js';
import { createCar } from './vehicles.js';

const COLORS = [0x788d8b, 0xd6c9ac, 0x9c5e4d, 0x444c4c, 0xd4a851, 0x527b7a];

export function seedTraffic(state, random) {
  for (let i = 0; i < 13; i += 1) {
    const vertical = i % 3 === 0;
    const lane = -4 + Math.floor(random() * 9);
    const pos = -116 + random() * 232;
    const heading = vertical ? (i % 2 ? Math.PI : 0) : (i % 2 ? Math.PI / 2 : -Math.PI / 2);
    const x = vertical ? lane * CITY.spacing + (heading === Math.PI ? 2 : -2) : pos;
    const z = vertical ? pos : lane * CITY.spacing + (heading === Math.PI / 2 ? -2 : 2);
    const car = createCar(state.scene, x, z, COLORS[i % COLORS.length], { heading, maxSpeed: 10 + random() * 4, driver: 'traffic' });
    car.traffic = true;
    car.speed = car.maxSpeed * (0.55 + random() * 0.3);
    car.axis = vertical ? 'z' : 'x';
    car.dir = Math.sign(car.axis === 'z' ? -Math.cos(heading) : -Math.sin(heading));
    state.vehicles.push(car);
    state.traffic.push(car);
  }
}

export function updateTraffic(state, dt) {
  const traffic = state.traffic ?? [];
  for (let i = 0; i < traffic.length; i += 1) {
    const car = traffic[i];
    if (car.flee) {
      car.speed = Math.min(car.maxSpeed, car.speed + dt * 13);
    } else {
      let blocked = false;
      for (let j = 0; j < traffic.length; j += 1) {
        if (j === i) continue;
        const other = traffic[j];
        const delta = car.axis === 'x' ? (other.position.x - car.position.x) * car.dir : (other.position.z - car.position.z) * car.dir;
        if (delta > 0 && delta < 7 && distanceXZ(car.position, other.position) < 8) { blocked = true; break; }
      }
      if (state.player.car && distanceXZ(car.position, state.player.position) < 8) blocked = true;
      const desired = blocked ? 0 : car.maxSpeed * 0.66;
      car.speed += Math.sign(desired - car.speed) * Math.min(Math.abs(desired - car.speed), dt * 12);
    }
    if (car.axis === 'x') car.position.x += car.dir * car.speed * dt;
    else car.position.z += car.dir * car.speed * dt;
    const value = car.axis === 'x' ? car.position.x : car.position.z;
    if (value > 130) { car.position[car.axis] = -130; }
    if (value < -130) { car.position[car.axis] = 130; }
    car.mesh.rotation.y = car.axis === 'x' ? (car.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (car.dir > 0 ? 0 : Math.PI);
  }
}
