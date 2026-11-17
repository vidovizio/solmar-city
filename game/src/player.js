import * as THREE from 'three';

const capsuleGeo = new THREE.CapsuleGeometry(0.42, 0.78, 4, 8);
const headGeo = new THREE.SphereGeometry(0.3, 10, 8);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraLook = new THREE.Vector3();
const move = new THREE.Vector3();

export function createPlayer(state) {
  const mesh = new THREE.Group();
  const jacket = new THREE.Mesh(capsuleGeo, new THREE.MeshStandardMaterial({ color: 0x324750, roughness: 0.8 }));
  jacket.position.y = 0.82; mesh.add(jacket);
  const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xc27b5e, roughness: 0.8 }));
  head.position.y = 1.52; mesh.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshStandardMaterial({ color: 0x272b2c }));
  hair.scale.set(1, 0.46, 1); hair.position.y = 1.72; mesh.add(hair);
  mesh.position.copy(state.player.position); state.scene.add(mesh);
  state.player.mesh = mesh;
  return { yaw: 0, pitch: 0.22, mesh };
}

export function updatePlayer(state, input, dt, camera, cameraState) {
  const player = state.player;
  cameraState.yaw -= input.dx * 0.0032;
  cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + input.dy * 0.002, -0.02, 0.75);
  const keys = input.keys;
  if (player.onFoot) {
    const forwardAxis = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const strafe = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    forward.set(-Math.sin(cameraState.yaw), 0, -Math.cos(cameraState.yaw));
    right.set(-forward.z, 0, forward.x);
    move.set(0, 0, 0).addScaledVector(forward, forwardAxis).addScaledVector(right, strafe);
    if (move.lengthSq() > 1) move.normalize();
    const speed = keys.ShiftLeft || keys.ShiftRight ? 8.5 : 5.2;
    const nextX = player.position.x + move.x * speed * dt;
    const nextZ = player.position.z + move.z * speed * dt;
    let blockedX = false, blockedZ = false;
    for (let i = 0; i < state.colliders.length; i += 1) {
      const c = state.colliders[i];
      if (nextX + 0.42 > c.minX && nextX - 0.42 < c.maxX && player.position.z + 0.42 > c.minZ && player.position.z - 0.42 < c.maxZ) blockedX = true;
      if (player.position.x + 0.42 > c.minX && player.position.x - 0.42 < c.maxX && nextZ + 0.42 > c.minZ && nextZ - 0.42 < c.maxZ) blockedZ = true;
    }
    if (!blockedX) player.position.x = nextX;
    if (!blockedZ) player.position.z = nextZ;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -130, 130);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -130, 158);
    if (move.lengthSq() > 0.01) player.heading = Math.atan2(-move.x, -move.z);
    if (keys.Space && player.jump <= 0) player.jump = 0.22;
    if (player.jump > 0) {
      player.jump = Math.max(0, player.jump - dt);
      player.mesh.position.y = Math.sin((player.jump / 0.22) * Math.PI) * 0.9;
    } else player.mesh.position.y = 0;
    player.mesh.position.x = player.position.x;
    player.mesh.position.z = player.position.z;
    player.mesh.rotation.y = player.heading;
    player.mesh.visible = true;
  } else {
    player.mesh.visible = false;
  }
  const anchor = player.onFoot ? player.position : player.car.position;
  const heading = player.onFoot ? cameraState.yaw : player.car.heading + cameraState.yaw;
  cameraTarget.set(anchor.x, anchor.y + (player.onFoot ? 1.3 : 1.1), anchor.z);
  const distance = player.onFoot ? 7.6 : 10.4;
  const horizontal = Math.cos(cameraState.pitch) * distance;
  cameraDesired.set(
    anchor.x + Math.sin(heading) * horizontal,
    anchor.y + Math.sin(cameraState.pitch) * distance + (player.onFoot ? 1.4 : 1.8),
    anchor.z + Math.cos(heading) * horizontal,
  );
  camera.position.lerp(cameraDesired, 1 - Math.exp(-dt * 7));
  cameraLook.copy(cameraTarget);
  camera.lookAt(cameraLook);
  input.dx = 0; input.dy = 0;
}
