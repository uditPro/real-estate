import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./villa-experience.css";

type SceneMode = "day" | "night";
type ExperienceState = "loading" | "ready" | "error";

type SceneVisuals = {
  background: THREE.Color;
  fog: THREE.FogExp2;
  hemisphere: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  poolLight: THREE.PointLight;
  windowLights: THREE.PointLight[];
  glassMaterials: THREE.MeshStandardMaterial[];
  glowMaterials: THREE.MeshStandardMaterial[];
  waterMaterial: THREE.MeshStandardMaterial;
  foliageMaterial: THREE.MeshStandardMaterial;
  groundMaterial: THREE.MeshStandardMaterial;
};

type SceneApi = {
  setMode: (mode: SceneMode) => void;
  setPaused: (paused: boolean) => void;
  rotate: (direction: -1 | 1) => void;
  reset: () => void;
};

type ResourceCollection = {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
};

const palette = {
  ivory: 0xf5f3ed,
  ivoryDeep: 0xe5e0d5,
  stone: 0xc8c1b4,
  stoneLight: 0xd9d4c9,
  evergreen: 0x243a30,
  evergreenDeep: 0x172a22,
  olive: 0x66735a,
  oliveLight: 0x87916e,
  timber: 0x8d6c4d,
  timberLight: 0xa77d57,
  glass: 0x16332f,
  water: 0x79aaa4,
  waterDeep: 0x376d6d,
  gravel: 0xb6ab99,
  sand: 0xd7cbb9,
  nightSky: 0x101d1c,
  warmLight: 0xffd59a,
};

function registerGeometry(resources: ResourceCollection, geometry: THREE.BufferGeometry): void {
  resources.geometries.add(geometry);
}

function registerMaterial(resources: ResourceCollection, material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((item) => resources.materials.add(item));
  } else {
    resources.materials.add(material);
  }
}

function makeMaterial(
  resources: ResourceCollection,
  color: number,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.74, ...options });
  registerMaterial(resources, material);
  return material;
}

function addBox(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  rotationY = 0,
): THREE.Mesh<THREE.BoxGeometry, THREE.Material> {
  const geometry = new THREE.BoxGeometry(...size);
  registerGeometry(resources, geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  radius: number,
  height: number,
  material: THREE.Material,
  position: [number, number, number],
  radialSegments = 18,
): THREE.Mesh<THREE.CylinderGeometry, THREE.Material> {
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.08, height, radialSegments);
  registerGeometry(resources, geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  radius: number,
  material: THREE.Material,
  position: [number, number, number],
  scale: [number, number, number] = [1, 1, 1],
): THREE.Mesh<THREE.SphereGeometry, THREE.Material> {
  const geometry = new THREE.SphereGeometry(radius, 16, 10);
  registerGeometry(resources, geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPlane(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  size: [number, number],
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [-Math.PI / 2, 0, 0],
): THREE.Mesh<THREE.PlaneGeometry, THREE.Material> {
  const geometry = new THREE.PlaneGeometry(...size);
  registerGeometry(resources, geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSlats(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  count: number,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  startX: number,
  baseY: number,
  z: number,
  gap: number,
): void {
  const total = count * width + (count - 1) * gap;
  const first = startX - total / 2 + width / 2;
  for (let index = 0; index < count; index += 1) {
    addBox(parent, resources, [width, height, depth], material, [first + index * (width + gap), baseY + height / 2, z]);
  }
}

function addTree(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  position: [number, number, number],
  scale = 1,
  trunkMaterial: THREE.Material,
  foliageMaterial: THREE.Material,
): void {
  const tree = new THREE.Group();
  tree.position.set(...position);
  tree.scale.setScalar(scale);
  parent.add(tree);

  addCylinder(tree, resources, 0.14, 1.8, trunkMaterial, [0, 0.9, 0], 10);
  addCylinder(tree, resources, 0.085, 0.85, trunkMaterial, [-0.22, 1.68, 0], 9).rotation.z = -0.38;
  addCylinder(tree, resources, 0.07, 0.72, trunkMaterial, [0.22, 1.65, 0.02], 9).rotation.z = 0.44;
  addSphere(tree, resources, 0.64, foliageMaterial, [-0.38, 2.07, 0], [1.08, 0.72, 0.86]);
  addSphere(tree, resources, 0.56, foliageMaterial, [0.36, 2.16, 0.04], [1.03, 0.7, 0.84]);
  addSphere(tree, resources, 0.48, foliageMaterial, [0, 2.42, -0.02], [1.1, 0.72, 0.9]);
}

function addLounger(
  parent: THREE.Object3D,
  resources: ResourceCollection,
  position: [number, number, number],
  rotationY: number,
  woodMaterial: THREE.Material,
  cushionMaterial: THREE.Material,
): void {
  const lounger = new THREE.Group();
  lounger.position.set(...position);
  lounger.rotation.y = rotationY;
  parent.add(lounger);
  addBox(lounger, resources, [0.82, 0.1, 2.05], woodMaterial, [0, 0.1, 0]);
  const back = addBox(lounger, resources, [0.76, 0.1, 0.92], cushionMaterial, [0, 0.42, -0.43]);
  back.rotation.x = -0.24;
  addBox(lounger, resources, [0.76, 0.11, 1.02], cushionMaterial, [0, 0.26, 0.46]);
  addBox(lounger, resources, [0.08, 0.5, 0.08], woodMaterial, [-0.31, 0.1, -0.65]);
  addBox(lounger, resources, [0.08, 0.5, 0.08], woodMaterial, [0.31, 0.1, -0.65]);
}

function buildVillaScene(scene: THREE.Scene, resources: ResourceCollection): SceneVisuals {
  const ivory = makeMaterial(resources, palette.ivory, { roughness: 0.68 });
  const ivoryDeep = makeMaterial(resources, palette.ivoryDeep, { roughness: 0.82 });
  const stone = makeMaterial(resources, palette.stone, { roughness: 0.92 });
  const stoneLight = makeMaterial(resources, palette.stoneLight, { roughness: 0.86 });
  const evergreen = makeMaterial(resources, palette.evergreen, { roughness: 0.64 });
  const evergreenDeep = makeMaterial(resources, palette.evergreenDeep, { roughness: 0.7 });
  const metal = makeMaterial(resources, 0x33483f, { metalness: 0.72, roughness: 0.3 });
  const timber = makeMaterial(resources, palette.timber, { roughness: 0.74 });
  const timberLight = makeMaterial(resources, palette.timberLight, { roughness: 0.7 });
  const gravel = makeMaterial(resources, palette.gravel, { roughness: 0.95 });
  const sand = makeMaterial(resources, palette.sand, { roughness: 0.94 });
  const trunk = makeMaterial(resources, 0x5c4938, { roughness: 0.94 });
  const foliage = makeMaterial(resources, palette.olive, { roughness: 0.88 });
  const foliageLight = makeMaterial(resources, palette.oliveLight, { roughness: 0.86 });
  const water = makeMaterial(resources, palette.water, { roughness: 0.2, metalness: 0.18 });
  const glass = makeMaterial(resources, palette.glass, {
    roughness: 0.18,
    metalness: 0.38,
    transparent: true,
    opacity: 0.78,
  });
  const glassBlue = makeMaterial(resources, 0x2a4b4c, {
    roughness: 0.14,
    metalness: 0.35,
    transparent: true,
    opacity: 0.68,
  });
  const glow = makeMaterial(resources, palette.warmLight, {
    roughness: 0.42,
    emissive: palette.warmLight,
    emissiveIntensity: 0,
  });
  const glowSoft = makeMaterial(resources, 0xffe1b2, {
    roughness: 0.44,
    emissive: 0xffcc83,
    emissiveIntensity: 0,
  });
  const darkWater = makeMaterial(resources, palette.waterDeep, { roughness: 0.24, metalness: 0.18 });

  const background = new THREE.Color(0xdedfd8);
  const fog = new THREE.FogExp2(background, 0.022);
  scene.background = background;
  scene.fog = fog;

  const site = new THREE.Group();
  site.position.y = -0.12;
  scene.add(site);

  addBox(site, resources, [18, 0.56, 13.5], evergreenDeep, [0, -0.28, 0]);
  addBox(site, resources, [17.4, 0.34, 12.9], sand, [0, 0.14, 0]);
  addBox(site, resources, [13.8, 0.22, 9.8], gravel, [-0.2, 0.4, -0.15]);
  addBox(site, resources, [11.4, 0.12, 7.5], stoneLight, [0.45, 0.55, -0.26]);

  // A restrained landscape grid keeps the diorama grounded and gives the villa a clear approach.
  addBox(site, resources, [4.1, 0.09, 6.3], sand, [-5.05, 0.62, -0.22]);
  addBox(site, resources, [0.36, 0.1, 5.8], stone, [-3.25, 0.68, -0.22]);
  addBox(site, resources, [0.36, 0.1, 5.8], stone, [-6.88, 0.68, -0.22]);
  addBox(site, resources, [2.4, 0.11, 8.3], gravel, [5.7, 0.64, -0.1]);
  addBox(site, resources, [1.4, 0.08, 0.32], stoneLight, [5.1, 0.73, -3.72]);
  addBox(site, resources, [1.4, 0.08, 0.32], stoneLight, [6.4, 0.73, -3.72]);
  addBox(site, resources, [1.4, 0.08, 0.32], stoneLight, [5.1, 0.73, 3.46]);
  addBox(site, resources, [1.4, 0.08, 0.32], stoneLight, [6.4, 0.73, 3.46]);

  // Pool, coping, and a low dark-water shadow line.
  addBox(site, resources, [6.75, 0.18, 3.72], ivoryDeep, [-1.68, 0.72, 3.24]);
  addBox(site, resources, [6.24, 0.14, 3.2], darkWater, [-1.68, 0.84, 3.24]);
  addPlane(site, resources, [5.88, 2.84], water, [-1.68, 0.925, 3.24]);
  addBox(site, resources, [5.9, 0.05, 0.09], glowSoft, [-1.68, 0.98, 1.83]);

  const villa = new THREE.Group();
  villa.position.set(1.2, 0.7, -1.1);
  site.add(villa);

  // Interlocking volumes, deep overhangs, and a recessed service wing.
  addBox(villa, resources, [7.15, 2.85, 4.95], ivory, [0.45, 2.15, 0.1]);
  addBox(villa, resources, [3.45, 2.22, 4.5], ivoryDeep, [-4.55, 1.82, -0.28]);
  addBox(villa, resources, [3.8, 3.8, 3.3], ivory, [2.55, 2.62, -0.92]);
  addBox(villa, resources, [4.25, 0.32, 5.52], evergreen, [0.55, 3.65, 0.08]);
  addBox(villa, resources, [4.38, 0.28, 3.72], ivoryDeep, [2.48, 4.57, -0.95]);
  addBox(villa, resources, [3.74, 0.26, 4.86], timber, [-4.56, 3.02, -0.28]);
  addBox(villa, resources, [7.78, 0.24, 0.54], stoneLight, [0.42, 0.75, 2.63]);

  // A shaded front terrace and a raised side terrace.
  addBox(villa, resources, [8.35, 0.24, 2.42], stoneLight, [0.35, 0.82, 2.92]);
  addBox(villa, resources, [5.12, 0.22, 1.88], timberLight, [-3.25, 2.86, 2.15]);
  addBox(villa, resources, [4.05, 0.18, 1.7], ivoryDeep, [2.75, 4.0, 1.04]);

  // Recessed glazing: the dark openings are intentionally framed like a physical architectural model.
  addPlane(villa, resources, [6.15, 2.1], glass, [0.36, 2.12, 2.59], [0, 0, 0]);
  addPlane(villa, resources, [2.75, 2.82], glassBlue, [2.55, 2.64, 0.74], [0, 0, 0]);
  addPlane(villa, resources, [2.75, 2.82], glassBlue, [4.46, 2.64, -0.94], [0, Math.PI / 2, 0]);
  addPlane(villa, resources, [3.0, 1.64], glass, [-4.55, 2.04, 2.0], [0, 0, 0]);

  // Front mullions and the signature vertical timber screen.
  addBox(villa, resources, [0.08, 2.18, 0.09], metal, [-2.18, 2.16, 2.68]);
  addBox(villa, resources, [0.08, 2.18, 0.09], metal, [-0.62, 2.16, 2.68]);
  addBox(villa, resources, [0.08, 2.18, 0.09], metal, [0.93, 2.16, 2.68]);
  addBox(villa, resources, [0.08, 2.18, 0.09], metal, [2.48, 2.16, 2.68]);
  addBox(villa, resources, [6.18, 0.08, 0.1], metal, [0.36, 3.1, 2.68]);
  addBox(villa, resources, [6.18, 0.08, 0.1], metal, [0.36, 1.22, 2.68]);
  addSlats(villa, resources, 8, 0.12, 2.75, 0.11, timberLight, 3.15, 1.28, 0.7, 0.23);
  addBox(villa, resources, [0.14, 3.0, 0.12], timberLight, [4.2, 2.62, 0.68]);
  addBox(villa, resources, [0.14, 3.0, 0.12], timberLight, [4.77, 2.62, 0.68]);

  // Service wing rhythm: smaller punched openings and a heavy entry canopy.
  addBox(villa, resources, [3.18, 0.18, 0.26], timber, [-4.55, 2.99, 2.0]);
  addBox(villa, resources, [0.08, 1.48, 0.1], metal, [-5.7, 2.08, 2.07]);
  addBox(villa, resources, [0.08, 1.48, 0.1], metal, [-4.55, 2.08, 2.07]);
  addBox(villa, resources, [0.08, 1.48, 0.1], metal, [-3.4, 2.08, 2.07]);
  addBox(villa, resources, [1.28, 0.22, 1.5], timber, [-4.55, 2.78, 2.78]);
  addBox(villa, resources, [1.44, 0.12, 0.12], glow, [-4.55, 2.64, 2.02]);

  // Entry steps and the deliberate path down to the water.
  addBox(villa, resources, [2.22, 0.16, 0.48], stone, [0.54, 0.68, 3.65]);
  addBox(villa, resources, [2.05, 0.16, 0.48], stone, [0.54, 0.53, 4.12]);
  addBox(villa, resources, [1.88, 0.16, 0.48], stone, [0.54, 0.38, 4.59]);
  addBox(villa, resources, [1.72, 0.16, 0.48], stone, [0.54, 0.23, 5.06]);
  addBox(villa, resources, [0.94, 0.1, 2.25], stoneLight, [3.05, 0.98, 2.55]);

  // Furniture establishes scale without becoming decorative clutter.
  const furniture = new THREE.Group();
  villa.add(furniture);
  addBox(furniture, resources, [1.85, 0.18, 0.74], evergreen, [-0.3, 1.05, 3.18]);
  addBox(furniture, resources, [0.18, 0.56, 0.58], evergreen, [-1.12, 1.22, 3.18]);
  addBox(furniture, resources, [0.18, 0.56, 0.58], evergreen, [0.52, 1.22, 3.18]);
  addBox(furniture, resources, [1.56, 0.16, 0.16], timberLight, [-0.3, 1.35, 3.18]);
  addCylinder(furniture, resources, 0.38, 0.08, timberLight, [2.52, 1.03, 2.95], 24);
  addCylinder(furniture, resources, 0.055, 0.55, metal, [2.52, 0.76, 2.95], 12);
  addLounger(furniture, resources, [-2.7, 1.0, 3.25], 0.08, timber, ivoryDeep);
  addLounger(furniture, resources, [-3.7, 1.0, 3.25], 0.08, timber, ivoryDeep);
  addCylinder(furniture, resources, 0.42, 0.12, evergreenDeep, [4.18, 1.07, 2.64], 24);
  addCylinder(furniture, resources, 0.22, 0.16, stoneLight, [4.18, 1.18, 2.64], 24);

  // Site planting: asymmetric olive-style trees and low planting islands.
  addTree(site, resources, [-6.45, 0.68, -3.8], 1.12, trunk, foliage);
  addTree(site, resources, [6.4, 0.7, -3.9], 0.88, trunk, foliageLight);
  addTree(site, resources, [6.72, 0.69, 3.25], 0.76, trunk, foliage);
  addTree(site, resources, [-5.85, 0.69, 3.45], 0.62, trunk, foliageLight);

  const planting = new THREE.Group();
  site.add(planting);
  addBox(planting, resources, [2.25, 0.16, 0.9], evergreenDeep, [3.95, 0.78, -3.62]);
  addBox(planting, resources, [1.54, 0.13, 0.62], stoneLight, [-5.85, 0.78, 3.42]);
  for (let index = 0; index < 7; index += 1) {
    const x = 3.18 + (index % 4) * 0.48;
    const z = -3.72 + Math.floor(index / 4) * 0.34;
    addSphere(planting, resources, 0.16, foliageLight, [x, 0.96, z], [1.15, 0.58, 0.75]);
  }
  for (let index = 0; index < 5; index += 1) {
    addSphere(planting, resources, 0.18, evergreen, [-5.9 + index * 0.28, 0.98, 3.43], [0.84, 0.62, 0.76]);
  }

  // A few small architectural markers add depth to the foreground.
  addBox(site, resources, [0.55, 0.16, 0.55], stone, [4.9, 0.82, -1.72]);
  addBox(site, resources, [0.35, 0.46, 0.35], evergreenDeep, [4.9, 1.12, -1.72]);
  addBox(site, resources, [0.7, 0.09, 1.1], stoneLight, [-6.55, 0.78, 0.58]);
  addBox(site, resources, [0.7, 0.09, 1.1], stoneLight, [-6.55, 0.78, 1.84]);

  const hemisphere = new THREE.HemisphereLight(0xf8f3e7, 0x44574b, 2.05);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff0d0, 4.4);
  sun.position.set(-7, 11, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 35;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb6d3cf, 1.2);
  fill.position.set(8, 5, -8);
  scene.add(fill);
  const poolLight = new THREE.PointLight(0x85d7d1, 0.65, 7, 2);
  poolLight.position.set(-1.68, 1.6, 3.24);
  scene.add(poolLight);
  const windowLights = [
    new THREE.PointLight(palette.warmLight, 0, 4.8, 2),
    new THREE.PointLight(0xffc578, 0, 3.5, 2),
  ];
  windowLights[0].position.set(0.1, 2.25, 1.3);
  windowLights[1].position.set(2.9, 2.6, -0.1);
  windowLights.forEach((light) => scene.add(light));

  return {
    background,
    fog,
    hemisphere,
    sun,
    fill,
    poolLight,
    windowLights,
    glassMaterials: [glass, glassBlue],
    glowMaterials: [glow, glowSoft],
    waterMaterial: water,
    foliageMaterial: foliage,
    groundMaterial: gravel,
  };
}

function applySceneMode(visuals: SceneVisuals, mode: SceneMode): void {
  const night = mode === "night";
  const backgroundColor = night ? palette.nightSky : 0xdedfd8;
  visuals.background.setHex(backgroundColor);
  visuals.fog.color.setHex(backgroundColor);
  visuals.fog.density = night ? 0.028 : 0.022;
  visuals.hemisphere.color.setHex(night ? 0x6f8b93 : 0xf8f3e7);
  visuals.hemisphere.groundColor.setHex(night ? 0x162923 : 0x44574b);
  visuals.hemisphere.intensity = night ? 0.72 : 2.05;
  visuals.sun.color.setHex(night ? 0x7e9aa4 : 0xfff0d0);
  visuals.sun.intensity = night ? 0.48 : 4.4;
  visuals.fill.color.setHex(night ? 0x668184 : 0xb6d3cf);
  visuals.fill.intensity = night ? 0.38 : 1.2;
  visuals.poolLight.intensity = night ? 1.55 : 0.65;
  visuals.windowLights[0].intensity = night ? 2.8 : 0;
  visuals.windowLights[1].intensity = night ? 1.8 : 0;
  visuals.waterMaterial.color.setHex(night ? 0x2e7778 : palette.water);
  visuals.groundMaterial.color.setHex(night ? 0x536254 : palette.gravel);
  visuals.foliageMaterial.color.setHex(night ? 0x3f5142 : palette.olive);
  visuals.glassMaterials[0].color.setHex(night ? 0x0c1d25 : palette.glass);
  visuals.glassMaterials[1].color.setHex(night ? 0x172e38 : 0x2a4b4c);
  visuals.glassMaterials[0].opacity = night ? 0.84 : 0.78;
  visuals.glassMaterials[1].opacity = night ? 0.76 : 0.68;
  visuals.glowMaterials.forEach((material) => {
    material.emissiveIntensity = night ? 1.8 : 0;
  });
}

function disposeScene(scene: THREE.Scene, resources: ResourceCollection): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
    }
  });
  resources.geometries.forEach((geometry) => geometry.dispose());
  resources.materials.forEach((material) => material.dispose());
}

function getReducedMotionPreference(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Icon({ name }: { name: "sun" | "moon" | "pause" | "play" | "left" | "right" | "reset" }): ReactElement {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "sun") {
    return <svg {...common}><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  }
  if (name === "moon") {
    return <svg {...common}><path d="M19.2 14.6A7.7 7.7 0 0 1 9.4 4.8 7.3 7.3 0 1 0 19.2 14.6Z" /></svg>;
  }
  if (name === "pause") {
    return <svg {...common}><path d="M9 5v14M15 5v14" /></svg>;
  }
  if (name === "play") {
    return <svg {...common}><path d="m9 5 9 7-9 7V5Z" /></svg>;
  }
  if (name === "left") {
    return <svg {...common}><path d="m14.5 5-7 7 7 7" /></svg>;
  }
  if (name === "right") {
    return <svg {...common}><path d="m9.5 5 7 7-7 7" /></svg>;
  }
  return <svg {...common}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>;
}

export default function VillaExperience(): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const helpId = useId();
  const [mode, setMode] = useState<SceneMode>("day");
  const [paused, setPaused] = useState<boolean>(() => getReducedMotionPreference());
  const [state, setState] = useState<ExperienceState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let animationFrame: number | null = null;
    let mounted = true;
    let isVisible = false;
    let contextLost = false;
    let lastFrameTime = 0;
    const reducedMotion = getReducedMotionPreference();
    const scene = new THREE.Scene();
    const resources: ResourceCollection = { geometries: new Set(), materials: new Set() };

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const initialPosition = new THREE.Vector3(12.4, 9.1, 14.2);
    const initialTarget = new THREE.Vector3(0.4, 1.55, 0.1);
    camera.position.copy(initialPosition);
    camera.lookAt(initialTarget);

    const requestFrame = (): void => {
      if (!mounted || contextLost || !isVisible || animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const renderFrame = (time: number): void => {
      animationFrame = null;
      if (!mounted || contextLost || !isVisible || document.hidden || !renderer || !controls) return;
      const delta = lastFrameTime === 0 ? 0 : Math.min((time - lastFrameTime) / 1000, 0.1);
      lastFrameTime = time;
      const changed = controls.update(delta);
      renderer.render(scene, camera);
      const shouldContinue = controls.autoRotate || changed;
      if (shouldContinue && isVisible && !document.hidden) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const resize = (): void => {
      if (!renderer) return;
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestFrame();
    };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(Math.max(host.clientWidth, 1), Math.max(host.clientHeight, 1), false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional architectural model of a warm ivory villa and landscaped courtyard");
      renderer.domElement.setAttribute("aria-describedby", helpId);
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.tabIndex = 0;
      renderer.domElement.className = "villa-experience__canvas";
      host.appendChild(renderer.domElement);

      const visuals = buildVillaScene(scene, resources);
      applySceneMode(visuals, mode);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(initialTarget);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.72;
      controls.maxPolarAngle = 1.38;
      controls.minDistance = 13;
      controls.maxDistance = 24;
      controls.rotateSpeed = 0.55;
      controls.autoRotateSpeed = 0.65;
      controls.autoRotate = !paused && !reducedMotion;
      controls.saveState();

      const setMode = (nextMode: SceneMode): void => {
        applySceneMode(visuals, nextMode);
        requestFrame();
      };
      const setPaused = (nextPaused: boolean): void => {
        if (controls) controls.autoRotate = !nextPaused;
        requestFrame();
      };
      const rotate = (direction: -1 | 1): void => {
        controls!.rotateLeft(direction * 0.38);
        controls!.update();
        requestFrame();
      };
      const reset = (): void => {
        controls!.reset();
        requestFrame();
      };
      sceneApiRef.current = { setMode, setPaused, rotate, reset };

      const handleCanvasKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          rotate(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          rotate(1);
        } else if (event.key === "Home" || event.key === "0") {
          event.preventDefault();
          reset();
        }
      };
      const handleControlsChange = (): void => requestFrame();
      const handleContextLost = (event: Event): void => {
        event.preventDefault();
        if (!mounted) return;
        contextLost = true;
        setState("error");
        setErrorMessage("The graphics context was lost. Refresh the page to reopen the architectural study.");
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      };

      renderer.domElement.addEventListener("keydown", handleCanvasKeyDown);
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost, false);
      controls.addEventListener("change", handleControlsChange);
      setState("ready");

      const intersectionObserver = typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            isVisible = entries.some((entry) => entry.isIntersecting);
            if (isVisible) {
              lastFrameTime = 0;
              requestFrame();
            } else if (animationFrame !== null) {
              window.cancelAnimationFrame(animationFrame);
              animationFrame = null;
            }
          }, { threshold: 0.01 })
        : null;
      intersectionObserver?.observe(host);
      if (!intersectionObserver) isVisible = true;

      const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(host);
      resize();

      const handleVisibilityChange = (): void => {
        if (document.hidden) {
          if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        } else {
          lastFrameTime = 0;
          requestFrame();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        mounted = false;
        sceneApiRef.current = null;
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        renderer?.domElement.removeEventListener("keydown", handleCanvasKeyDown);
        renderer?.domElement.removeEventListener("webglcontextlost", handleContextLost);
        controls?.removeEventListener("change", handleControlsChange);
        intersectionObserver?.disconnect();
        resizeObserver?.disconnect();
        controls?.dispose();
        disposeScene(scene, resources);
        renderer?.dispose();
        renderer?.forceContextLoss();
        if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "WebGL is unavailable in this browser.";
      setState("error");
      setErrorMessage(`The interactive study could not start here. ${reason}`);
      disposeScene(scene, resources);
      renderer?.dispose();
      renderer?.forceContextLoss();
      if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      return () => {
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      };
    }
  }, [helpId]);

  useEffect(() => {
    sceneApiRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    sceneApiRef.current?.setPaused(paused);
  }, [paused]);

  const handleRotate = (direction: -1 | 1): void => {
    sceneApiRef.current?.rotate(direction);
  };

  const handleReset = (): void => {
    sceneApiRef.current?.reset();
  };

  const handlePauseToggle = (): void => {
    setPaused((current) => !current);
  };

  const isNight = mode === "night";
  return (
    <section className={`villa-experience${isNight ? " villa-experience--night" : ""}${state === "error" ? " villa-experience--error" : ""}`} data-mode={mode}>
      <div className="villa-experience__heading">
        <div>
          <p className="villa-experience__eyebrow"><span className="villa-experience__eyebrow-dot" /> AUREL / ARCHITECTURAL STUDY</p>
          <h2 className="villa-experience__title">A quiet villa, <em>in motion.</em></h2>
        </div>
        <p className="villa-experience__heading-note">Rotate the study to explore how light, landscape, and proportion meet.</p>
      </div>

      <div className="villa-experience__layout">
        <div className="villa-experience__stage">
          <div className="villa-experience__viewport">
            <div className="villa-experience__canvas-host" ref={hostRef} />

            {state === "loading" && (
              <div className="villa-experience__loading" role="status" aria-live="polite">
                <span className="villa-experience__loading-mark" />
                <span>Preparing the architectural study</span>
              </div>
            )}

            {state === "error" && (
              <div className="villa-experience__fallback" role="alert">
                <svg className="villa-experience__fallback-drawing" viewBox="0 0 240 150" aria-hidden="true">
                  <path d="M25 112 92 58l79 21 44 33-77 19-113-19Z" />
                  <path d="m92 58 16 57M171 79l-1 34M118 69l1 53M50 93l1 31M196 98l-1 26" />
                  <path d="m77 73 31-25 50 15-31 24-50-14ZM112 63v46M136 70v38" />
                  <path d="M25 112v16l113 19 77-19v-16M39 115l-1 14M74 121l-1 14M181 115v13" />
                </svg>
                <p className="villa-experience__fallback-kicker">AUREL / STUDY VIEW</p>
                <h3>The model needs a WebGL canvas.</h3>
                <p>{errorMessage ?? "This browser could not create the interactive scene."}</p>
                <span className="villa-experience__fallback-hint">The rest of the residence story is still available below.</span>
              </div>
            )}

            {state === "ready" && (
              <>
                <div className="villa-experience__hud villa-experience__hud--top">
                  <span className="villa-experience__hud-index">01</span>
                  <span>{isNight ? "Moonlit courtyard" : "Late afternoon study"}</span>
                </div>
                <div className="villa-experience__hud villa-experience__hud--bottom">
                  <span className="villa-experience__hud-line" />
                  <span>{paused ? "Rotation paused" : "Slow study rotation"}</span>
                </div>
              </>
            )}

            {state === "ready" && (
              <>
                <div className="villa-experience__toolbar" role="group" aria-label="Villa experience controls">
                  <div className="villa-experience__segmented" role="group" aria-label="Scene lighting">
                    <button type="button" className={`villa-experience__mode-button${!isNight ? " is-active" : ""}`} aria-pressed={!isNight} onClick={() => setMode("day")}>
                      <Icon name="sun" /> <span>Day</span>
                    </button>
                    <button type="button" className={`villa-experience__mode-button${isNight ? " is-active" : ""}`} aria-pressed={isNight} onClick={() => setMode("night")}>
                      <Icon name="moon" /> <span>Night</span>
                    </button>
                  </div>
                  <div className="villa-experience__transport" role="group" aria-label="Camera controls">
                    <button type="button" className="villa-experience__icon-button" aria-label="Rotate villa left" title="Rotate left" onClick={() => handleRotate(-1)}><Icon name="left" /></button>
                    <button type="button" className="villa-experience__icon-button" aria-label="Reset villa view" title="Reset view" onClick={handleReset}><Icon name="reset" /></button>
                    <button type="button" className="villa-experience__icon-button" aria-label="Rotate villa right" title="Rotate right" onClick={() => handleRotate(1)}><Icon name="right" /></button>
                    <button type="button" className="villa-experience__icon-button villa-experience__icon-button--play" aria-label={paused ? "Resume slow rotation" : "Pause slow rotation"} title={paused ? "Resume rotation" : "Pause rotation"} aria-pressed={paused} onClick={handlePauseToggle}><Icon name={paused ? "play" : "pause"} /></button>
                  </div>
                </div>
                <p className="villa-experience__help" id={helpId}>Drag to orbit · Arrow keys rotate · Home resets · Zoom is intentionally off</p>
              </>
            )}
          </div>
        </div>

        <aside className="villa-experience__details" aria-label="Villa study notes">
          <p className="villa-experience__details-label">THE COURTYARD HOUSE / 01</p>
          <h3>Architecture that lets the garden lead.</h3>
          <p className="villa-experience__details-copy">A warm ivory volume is cut through with shaded terraces, deep glazing, and a long reflecting pool. The model is deliberately spare: every plane has a job, every tree gives the horizon a measure.</p>
          <div className="villa-experience__specs">
            <div><strong>04</strong><span>light wells</span></div>
            <div><strong>02</strong><span>garden courts</span></div>
            <div><strong>18m</strong><span>pool edge</span></div>
          </div>
          <div className="villa-experience__material-note">
            <span className="villa-experience__material-swatch villa-experience__material-swatch--ivory" />
            <div><strong>Material palette</strong><span>Warm plaster · olive timber · green glass</span></div>
          </div>
          <div className="villa-experience__details-rule" />
          <p className="villa-experience__details-footer"><span>DRAG / ROTATE</span><span>01 — 03</span></p>
        </aside>
      </div>
    </section>
  );
}
