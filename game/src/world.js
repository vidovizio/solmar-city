import * as THREE from 'three';
import { CITY } from './state.js';
import { COLORS, DISTRICTS } from './palette.js';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
function material(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

export function createWorld(scene, random) {
  const groundMat = material(0x89917d);
  const roadMat = material(COLORS.asphalt);
  const sidewalkMat = material(COLORS.sidewalk);
  const seaMat = new THREE.MeshStandardMaterial({ color: COLORS.sea, roughness: 0.32, metalness: 0.05 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.15; scene.add(ground);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(370, 76), seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.08, 165); scene.add(sea);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(300, 30), material(COLORS.sand));
  beach.rotation.x = -Math.PI / 2; beach.position.set(0, -0.02, 122); scene.add(beach);

  const roadGeoX = new THREE.BoxGeometry(270, 0.12, CITY.road);
  const roadGeoZ = new THREE.BoxGeometry(CITY.road, 0.12, 270);
  const sidewalkXGeo = new THREE.BoxGeometry(270, 0.08, 2.4);
  const sidewalkZGeo = new THREE.BoxGeometry(2.4, 0.08, 270);
  const laneMat = material(COLORS.lane, 0.7);
  const dashGeo = new THREE.BoxGeometry(3.2, 0.035, 0.13);
  const dashGeoZ = new THREE.BoxGeometry(0.13, 0.035, 3.2);
  const dashesX = new THREE.InstancedMesh(dashGeo, laneMat, 121);
  const dashesZ = new THREE.InstancedMesh(dashGeoZ, laneMat, 121);
  const transform = new THREE.Object3D();
  let dashCount = 0;
  for (let n = -5; n <= 5; n += 1) {
    const position = n * CITY.spacing;
    const xRoad = new THREE.Mesh(roadGeoX, roadMat); xRoad.position.set(0, 0, position); scene.add(xRoad);
    const zRoad = new THREE.Mesh(roadGeoZ, roadMat); zRoad.position.set(position, 0, 0); scene.add(zRoad);
    const sx = new THREE.Mesh(sidewalkXGeo, sidewalkMat);
    sx.position.set(0, 0.025, position + CITY.road / 2 + 1.15); scene.add(sx);
    const sz = new THREE.Mesh(sidewalkZGeo, sidewalkMat);
    sz.position.set(position + CITY.road / 2 + 1.15, 0.025, 0); scene.add(sz);
    for (let p = -42; p <= 42; p += 8) {
      transform.position.set(p, 0.075, position); transform.updateMatrix();
      dashesX.setMatrixAt(dashCount, transform.matrix);
      transform.position.set(position, 0.075, p); transform.updateMatrix();
      dashesZ.setMatrixAt(dashCount, transform.matrix);
      dashCount += 1;
    }
  }
  dashesX.instanceMatrix.needsUpdate = true; dashesZ.instanceMatrix.needsUpdate = true;
  scene.add(dashesX, dashesZ);

  const colliders = [];
  const buildings = new THREE.InstancedMesh(boxGeometry, material(0xffffff), 100);
  const roofMat = material(0xe4d5ba);
  const roofs = new THREE.InstancedMesh(boxGeometry, roofMat, 100);
  const awnings = new THREE.InstancedMesh(boxGeometry, material(0xffffff), 100);
  let buildingCount = 0, awningCount = 0;
  for (let ix = -5; ix < 5; ix += 1) {
    for (let iz = -5; iz < 5; iz += 1) {
      const cx = (ix + 0.5) * CITY.spacing;
      const cz = (iz + 0.5) * CITY.spacing;
      if (cz > 91) continue;
      const districtIndex = cx < -48 ? 0 : cz < -48 ? 2 : cx > 48 ? 4 : cz > 40 ? 3 : 1;
      const hBase = districtIndex === 4 ? 17 : districtIndex === 2 ? 10 : 7;
      const width = 11 + random() * 3, depth = 11 + random() * 3;
      const height = hBase + random() * (districtIndex === 4 ? 29 : 12);
      const x = cx + (random() - 0.5) * 2, z = cz + (random() - 0.5) * 2;
      transform.position.set(x, height / 2, z); transform.scale.set(width, height, depth); transform.updateMatrix();
      buildings.setMatrixAt(buildingCount, transform.matrix);
      const shade = DISTRICTS[districtIndex].colors[Math.floor(random() * 3)];
      buildings.setColorAt(buildingCount, new THREE.Color(shade));
      transform.position.set(x, height + 0.15, z); transform.scale.set(width + 0.25, 0.3, depth + 0.25); transform.updateMatrix();
      roofs.setMatrixAt(buildingCount, transform.matrix);
      buildingCount += 1;
      colliders.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
      if (random() > 0.45) {
        transform.position.set(x, 2.6, z - depth / 2 - 0.48);
        transform.scale.set(width * 0.72, 0.35, 1.1); transform.updateMatrix();
        awnings.setMatrixAt(awningCount, transform.matrix);
        awnings.setColorAt(awningCount, new THREE.Color(random() > 0.5 ? COLORS.coral : COLORS.teal));
        awningCount += 1;
      }
    }
  }
  buildings.count = buildingCount; roofs.count = buildingCount; awnings.count = awningCount;
  buildings.instanceMatrix.needsUpdate = true; roofs.instanceMatrix.needsUpdate = true; awnings.instanceMatrix.needsUpdate = true;
  if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  if (awnings.instanceColor) awnings.instanceColor.needsUpdate = true;
  scene.add(buildings, roofs, awnings);

  const trunkMat = material(0x8b6747), frondMat = material(0x376f52);
  const trunkGeo = new THREE.CylinderGeometry(0.23, 0.42, 5.2, 6);
  const frondGeo = new THREE.ConeGeometry(0.48, 5.5, 5);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 38);
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, 190);
  let frondCount = 0;
  for (let i = 0; i < 38; i += 1) {
    const x = -115 + (i % 19) * 12.5, z = 103 + Math.floor(i / 19) * 12;
    transform.position.set(x, 2.6, z); transform.rotation.set(0, 0, 0); transform.scale.set(1, 1, 1); transform.updateMatrix();
    trunks.setMatrixAt(i, transform.matrix);
    for (let j = 0; j < 5; j += 1) {
      transform.position.set(x + Math.cos(j * 1.256) * 1.35, 5.2, z + Math.sin(j * 1.256) * 1.35);
      transform.rotation.set(Math.sin(j * 1.256) * 0.9, 0, Math.cos(j * 1.256) * 0.9);
      transform.scale.set(1, 1, 1); transform.updateMatrix();
      fronds.setMatrixAt(frondCount, transform.matrix); frondCount += 1;
    }
  }
  trunks.instanceMatrix.needsUpdate = true; fronds.instanceMatrix.needsUpdate = true;
  scene.add(trunks, fronds);

  const pierMat = material(0x927c62);
  for (let i = 0; i < 4; i += 1) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 24), pierMat);
    pier.position.set(-37 + i * 18, 0.28, 132); scene.add(pier);
    const boat = new THREE.Mesh(new THREE.ConeGeometry(2.4, 8, 5), material(i % 2 ? 0xe7e1d0 : 0x7d463c));
    boat.rotation.x = Math.PI / 2; boat.position.set(-37 + i * 18, 0.35, 145); scene.add(boat);
  }
  const parcel = new THREE.Mesh(boxGeometry, material(0x876646));
  parcel.scale.set(0.9, 0.8, 0.9); parcel.position.set(-39, 0.68, 128); scene.add(parcel);

  const poleMat = material(0x4c5550);
  const lightMat = material(0xf6d49a, 0.3, { emissive: 0x704526, emissiveIntensity: 0.35 });
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.13, 5.5, 6), poleMat, 25);
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 6), lightMat, 25);
  poles.name = 'streetlight-poles';
  lamps.name = 'streetlight-lamps';
  let lightCount = 0;
  for (let n = -4; n <= 4; n += 2) {
    for (let p = -4; p <= 4; p += 2) {
      const x = n * CITY.spacing + 6.1, z = p * CITY.spacing + 6.1;
      transform.position.set(x, 2.75, z); transform.updateMatrix(); poles.setMatrixAt(lightCount, transform.matrix);
      transform.position.set(x, 5.55, z); transform.updateMatrix(); lamps.setMatrixAt(lightCount, transform.matrix);
      lightCount += 1;
    }
  }
  poles.instanceMatrix.needsUpdate = true; lamps.instanceMatrix.needsUpdate = true;
  scene.add(poles, lamps);

  const billboardMat = material(0x243b3a, 0.4, { emissive: 0x17615b, emissiveIntensity: 0.7 });
  for (const [x, z, text] of [[-25, -25, 'SOLMAR'], [25, 25, 'MARINA'], [78, -50, 'HOTEL']]) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 0.22), billboardMat);
    sign.position.set(x, 7, z); scene.add(sign);
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 72;
    const ctx = labelCanvas.getContext('2d'); ctx.fillStyle = '#d9c9a8'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, 128, 49);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true }));
    label.position.set(x, 7, z + 0.13); scene.add(label);
  }

  const landmarks = [
    new THREE.Vector3(-39, 0, 128), new THREE.Vector3(24, 0, 75),
    new THREE.Vector3(-78, 0, 27), new THREE.Vector3(77, 0, -52),
    new THREE.Vector3(25, 0, 0), new THREE.Vector3(90, 0, 90),
  ];
  return { colliders, landmarks, beachZ: 108, random };
}
