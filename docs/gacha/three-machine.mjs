import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const mount = document.getElementById('gachaThreeMount');
const machineEl = document.getElementById('gachaMachine');
const handleWrap = machineEl?.querySelector('.gacha-handle-wrap') ?? null;
const capsuleProxy = document.getElementById('gachaCapsuleDrop');

if (!mount || !machineEl) {
  throw new Error('3D machine mount not found.');
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pointer = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

const visualState = {
  spinning: false,
  hasCapsule: false,
  revealed: false,
  jackpot: false,
  touching: false,
  rarity: 'N',
  reducedMotion: prefersReducedMotion.matches,
  capsuleTop: new THREE.Color('#ffd34a'),
  capsuleBottom: new THREE.Color('#76c7ff'),
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
camera.position.set(0, 1.2, 15.5);

const sceneRoot = new THREE.Group();
sceneRoot.position.set(0, -1.6, 0);
scene.add(sceneRoot);

const ambientLight = new THREE.HemisphereLight(0xfbf7ff, 0xde9b56, 1.55);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(6, 10, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffaf73, 28, 30, 2.2);
fillLight.position.set(-5, -2, 8);
scene.add(fillLight);

const rarityLight = new THREE.PointLight(0x8fd3ff, 0, 24, 2);
rarityLight.position.set(0, 4.2, 4.4);
scene.add(rarityLight);

const pedestalShadow = new THREE.Mesh(
  new THREE.CircleGeometry(4.9, 48),
  new THREE.MeshBasicMaterial({ color: 0x7f451e, transparent: true, opacity: 0.14 }),
);
pedestalShadow.rotation.x = -Math.PI / 2;
pedestalShadow.position.set(0, -5.65, 0);
sceneRoot.add(pedestalShadow);

const machineGroup = new THREE.Group();
sceneRoot.add(machineGroup);

const pedestal = createMesh(
  new THREE.CylinderGeometry(4.65, 4.15, 1.15, 64),
  new THREE.MeshStandardMaterial({ color: 0xff815c, metalness: 0.2, roughness: 0.45 }),
  { position: [0, -5, 0], castShadow: true, receiveShadow: true },
);
machineGroup.add(pedestal);

const pedestalRing = createMesh(
  new THREE.TorusGeometry(3.85, 0.28, 20, 56),
  new THREE.MeshStandardMaterial({ color: 0xffd6a3, metalness: 0.32, roughness: 0.28 }),
  { position: [0, -4.7, 0], rotation: [Math.PI / 2, 0, 0], castShadow: true },
);
machineGroup.add(pedestalRing);

const bodyGroup = new THREE.Group();
bodyGroup.position.set(0, -1.65, 0);
machineGroup.add(bodyGroup);

const bodyShell = createMesh(
  new THREE.BoxGeometry(6.3, 5.8, 4.4),
  new THREE.MeshStandardMaterial({ color: 0xe94c3b, metalness: 0.18, roughness: 0.42 }),
  { castShadow: true, receiveShadow: true },
);
bodyGroup.add(bodyShell);

const bodyTrim = createMesh(
  new THREE.BoxGeometry(5.55, 4.9, 4.65),
  new THREE.MeshStandardMaterial({ color: 0xff8a5f, metalness: 0.14, roughness: 0.36 }),
  { position: [0, 0.1, 0], castShadow: true },
);
bodyGroup.add(bodyTrim);

const panelFace = createMesh(
  new THREE.BoxGeometry(4.9, 3.8, 0.55),
  new THREE.MeshStandardMaterial({ color: 0xfff0d2, metalness: 0.08, roughness: 0.28 }),
  { position: [0, -0.05, 2.2], castShadow: true },
);
bodyGroup.add(panelFace);

const controlPlate = createMesh(
  new THREE.BoxGeometry(4.3, 2.9, 0.3),
  new THREE.MeshStandardMaterial({ color: 0xf6d9a9, metalness: 0.1, roughness: 0.22 }),
  { position: [0.15, -0.3, 2.46], castShadow: true },
);
bodyGroup.add(controlPlate);

const marqueePlate = createMesh(
  new THREE.BoxGeometry(3.25, 0.72, 0.26),
  new THREE.MeshStandardMaterial({ color: 0xffd66e, emissive: 0xf98b2b, emissiveIntensity: 0.12, metalness: 0.22, roughness: 0.2 }),
  { position: [0, 2.02, 2.42], castShadow: true },
);
bodyGroup.add(marqueePlate);

const chuteHousing = createMesh(
  new THREE.BoxGeometry(1.68, 2.28, 1.18),
  new THREE.MeshStandardMaterial({ color: 0x31130d, metalness: 0.15, roughness: 0.62 }),
  { position: [-1.48, -1.18, 2.36], castShadow: true },
);
bodyGroup.add(chuteHousing);

const chuteInset = createMesh(
  new THREE.BoxGeometry(1.08, 1.62, 0.32),
  new THREE.MeshStandardMaterial({ color: 0x100707, metalness: 0.08, roughness: 0.82 }),
  { position: [-1.48, -1.08, 2.82] },
);
bodyGroup.add(chuteInset);

const chuteLip = createMesh(
  new THREE.CylinderGeometry(1.25, 1.48, 0.2, 42),
  new THREE.MeshStandardMaterial({ color: 0x8a3729, metalness: 0.16, roughness: 0.44 }),
  { position: [-1.48, -2.55, 2.42], rotation: [0.04, 0, Math.PI / 2], castShadow: true },
);
bodyGroup.add(chuteLip);

const chromeDots = [];
for (const x of [-2.55, 2.55]) {
  for (const y of [1.8, -2.05]) {
    const dot = createMesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.18, 24),
      new THREE.MeshStandardMaterial({ color: 0xffe6b4, metalness: 0.72, roughness: 0.18 }),
      { position: [x, y, 2.28], rotation: [Math.PI / 2, 0, 0], castShadow: true },
    );
    bodyGroup.add(dot);
    chromeDots.push(dot);
  }
}

const domeGroup = new THREE.Group();
domeGroup.position.set(0, 3.28, 0);
machineGroup.add(domeGroup);

const domeBase = createMesh(
  new THREE.CylinderGeometry(2.9, 3.15, 0.6, 64),
  new THREE.MeshStandardMaterial({ color: 0xf3f0ff, metalness: 0.42, roughness: 0.14 }),
  { position: [0, -1.05, 0], castShadow: true, receiveShadow: true },
);
domeGroup.add(domeBase);

const domeRing = createMesh(
  new THREE.TorusGeometry(2.78, 0.15, 18, 72),
  new THREE.MeshStandardMaterial({ color: 0xd3e4ff, metalness: 0.55, roughness: 0.12 }),
  { position: [0, -0.86, 0], rotation: [Math.PI / 2, 0, 0], castShadow: true },
);
domeGroup.add(domeRing);

const domeGlass = createMesh(
  new THREE.SphereGeometry(3.05, 64, 40),
  new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    transparent: true,
    opacity: 0.22,
    transmission: 0.88,
    thickness: 0.35,
    roughness: 0.02,
    metalness: 0,
    ior: 1.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  }),
  { position: [0, 0.36, 0], castShadow: true },
);
domeGroup.add(domeGlass);

const domeReflection = createMesh(
  new THREE.SphereGeometry(2.9, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.46),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }),
  { position: [-0.28, 0.94, 1.16], rotation: [0.12, -0.22, 0] },
);
domeGroup.add(domeReflection);

const capsuleOrbitalGroup = new THREE.Group();
domeGroup.add(capsuleOrbitalGroup);

const innerCapsules = Array.from({ length: 10 }, (_, index) => {
  const capsule = createCapsule(0.46);
  const theta = (index / 10) * Math.PI * 2;
  const radius = 1.15 + (index % 3) * 0.35;
  capsule.group.position.set(Math.cos(theta) * radius, -0.4 + (index % 4) * 0.52, Math.sin(theta) * radius * 0.88);
  capsule.group.rotation.z = theta * 0.7;
  capsuleOrbitalGroup.add(capsule.group);
  return {
    ...capsule,
    seed: Math.random() * Math.PI * 2,
    radius,
    speed: 0.4 + Math.random() * 0.55,
    float: 0.14 + Math.random() * 0.12,
  };
});

const handlePivot = new THREE.Group();
handlePivot.position.set(1.9, -1.15, 2.32);
machineGroup.add(handlePivot);

const handleHub = createMesh(
  new THREE.CylinderGeometry(0.84, 0.84, 0.58, 40),
  new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: 0.6, roughness: 0.18 }),
  { rotation: [0, Math.PI / 2, 0], castShadow: true },
);
handlePivot.add(handleHub);

const handleCore = createMesh(
  new THREE.CylinderGeometry(0.34, 0.34, 0.68, 36),
  new THREE.MeshStandardMaterial({ color: 0xfff1bf, metalness: 0.5, roughness: 0.16 }),
  { rotation: [0, Math.PI / 2, 0], castShadow: true },
);
handlePivot.add(handleCore);

const handleArm = createMesh(
  new THREE.CylinderGeometry(0.14, 0.14, 1.82, 20),
  new THREE.MeshStandardMaterial({ color: 0xff7b65, metalness: 0.16, roughness: 0.28 }),
  { position: [0, 1.2, 0], castShadow: true },
);
handleArm.position.y = 1.02;
handleArm.rotation.z = -0.06;
handlePivot.add(handleArm);

const handleKnob = createMesh(
  new THREE.SphereGeometry(0.42, 28, 20),
  new THREE.MeshStandardMaterial({ color: 0xff6d5e, metalness: 0.1, roughness: 0.2 }),
  { position: [0.04, 1.95, 0.06], castShadow: true },
);
handlePivot.add(handleKnob);

const jackpotRing = createMesh(
  new THREE.TorusGeometry(3.62, 0.09, 12, 120),
  new THREE.MeshBasicMaterial({ color: 0xffd55f, transparent: true, opacity: 0 }),
  { position: [0, 0.5, 0], rotation: [Math.PI / 2, 0, 0] },
);
machineGroup.add(jackpotRing);

const glowRing = createMesh(
  new THREE.TorusGeometry(2.88, 0.12, 14, 72),
  new THREE.MeshBasicMaterial({ color: 0x88d6ff, transparent: true, opacity: 0.16 }),
  { position: [0, 2.2, 0], rotation: [Math.PI / 2, 0, 0] },
);
machineGroup.add(glowRing);

const sparkles = Array.from({ length: 18 }, () => {
  const sparkle = createMesh(
    new THREE.OctahedronGeometry(0.08 + Math.random() * 0.05, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24 + Math.random() * 0.3 }),
  );
  sceneRoot.add(sparkle);
  return {
    mesh: sparkle,
    orbit: 3.2 + Math.random() * 1.6,
    height: -0.4 + Math.random() * 6.8,
    speed: 0.22 + Math.random() * 0.55,
    seed: Math.random() * Math.PI * 2,
  };
});

const dispensedCapsule = createCapsule(0.9);
dispensedCapsule.group.position.set(-1.48, -2.52, 2.94);
machineGroup.add(dispensedCapsule.group);

let capsuleProgress = 0;
let revealProgress = 0;
let mounted = true;

const machineObserver = new MutationObserver(syncMachineState);
machineObserver.observe(machineEl, { attributes: true, attributeFilter: ['class', 'data-rarity'] });

if (handleWrap) {
  machineObserver.observe(handleWrap, { attributes: true, attributeFilter: ['class'] });
}

if (capsuleProxy) {
  machineObserver.observe(capsuleProxy, { attributes: true, attributeFilter: ['style'] });
}

if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', (event) => {
    visualState.reducedMotion = event.matches;
  });
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener((event) => {
    visualState.reducedMotion = event.matches;
  });
}

machineEl.addEventListener('pointermove', (event) => {
  const rect = mount.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
});

machineEl.addEventListener('pointerleave', () => {
  pointer.set(0, 0);
});

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(mount);

window.addEventListener('pagehide', teardown, { once: true });

syncMachineState();
resizeRenderer();
animate();

function animate() {
  if (!mounted) return;

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  const pointerX = visualState.reducedMotion ? 0 : pointer.x * 0.12;
  const pointerY = visualState.reducedMotion ? 0 : pointer.y * 0.06;
  machineGroup.rotation.x = THREE.MathUtils.lerp(machineGroup.rotation.x, -0.08 - pointerY, 0.08);
  machineGroup.rotation.y = THREE.MathUtils.lerp(machineGroup.rotation.y, -0.38 + pointerX, 0.08);

  domeGroup.rotation.y += visualState.reducedMotion ? 0.0015 : 0.0035 + (visualState.spinning ? 0.008 : 0);

  if (visualState.spinning) {
    handlePivot.rotation.z = normalizeAngle(handlePivot.rotation.z - 0.22);
  } else {
    const handleTarget = visualState.touching ? -0.68 : 0;
    handlePivot.rotation.z = THREE.MathUtils.lerp(normalizeAngle(handlePivot.rotation.z), handleTarget, 0.18);
  }

  capsuleProgress = THREE.MathUtils.lerp(capsuleProgress, visualState.hasCapsule ? 1 : 0, visualState.reducedMotion ? 0.28 : 0.12);
  revealProgress = THREE.MathUtils.lerp(revealProgress, visualState.revealed ? 1 : 0, visualState.reducedMotion ? 0.24 : 0.1);

  const lift = -0.92 + capsuleProgress * 1.64;
  dispensedCapsule.group.position.y = -2.7 + lift;
  dispensedCapsule.group.position.z = 2.9 + capsuleProgress * 0.08;
  dispensedCapsule.group.rotation.z = capsuleProgress * 0.35;
  dispensedCapsule.top.position.y = revealProgress * 0.52;
  dispensedCapsule.top.rotation.z = -revealProgress * 0.92;
  dispensedCapsule.bottom.position.y = -revealProgress * 0.52;
  dispensedCapsule.bottom.rotation.z = revealProgress * 0.92;
  dispensedCapsule.group.scale.setScalar(0.86 + capsuleProgress * 0.14);
  dispensedCapsule.seam.material.opacity = 0.55 - revealProgress * 0.28;

  const rarityColor = getRarityColor(visualState.rarity);
  rarityLight.color.copy(rarityColor);
  rarityLight.intensity = THREE.MathUtils.lerp(
    rarityLight.intensity,
    visualState.spinning ? 18 : visualState.rarity === 'SSR' ? 10 : visualState.rarity === 'R' ? 6 : 2.5,
    0.08,
  );
  glowRing.material.color.copy(rarityColor);
  glowRing.material.opacity = THREE.MathUtils.lerp(
    glowRing.material.opacity,
    visualState.spinning ? 0.32 : visualState.rarity === 'SSR' ? 0.2 : visualState.rarity === 'R' ? 0.12 : 0.08,
    0.1,
  );
  glowRing.rotation.z = elapsed * 0.2;

  jackpotRing.material.opacity = THREE.MathUtils.lerp(jackpotRing.material.opacity, visualState.jackpot ? 0.82 : 0, 0.08);
  jackpotRing.rotation.z += visualState.jackpot ? 0.03 : 0.008;
  jackpotRing.scale.setScalar(1 + (visualState.jackpot ? Math.sin(elapsed * 4.5) * 0.03 : 0));

  marqueePlate.material.emissiveIntensity = visualState.spinning ? 0.5 : visualState.rarity === 'SSR' ? 0.24 : 0.12;
  bodyTrim.material.emissive.copy(rarityColor).multiplyScalar(0.12);
  bodyTrim.material.emissiveIntensity = visualState.rarity === 'SSR' ? 0.32 : visualState.rarity === 'R' ? 0.18 : 0.08;

  innerCapsules.forEach((capsule, index) => {
    const orbitSpeed = visualState.spinning ? capsule.speed * 2.8 : capsule.speed;
    const phase = elapsed * orbitSpeed + capsule.seed;
    capsule.group.position.x = Math.cos(phase) * capsule.radius;
    capsule.group.position.z = Math.sin(phase) * capsule.radius * 0.84;
    capsule.group.position.y = -0.45 + Math.sin(phase * 1.6) * capsule.float + (index % 4) * 0.42;
    capsule.group.rotation.x = phase * 0.7;
    capsule.group.rotation.y = phase * 0.9;
  });

  sparkles.forEach((sparkle, index) => {
    const phase = elapsed * sparkle.speed + sparkle.seed;
    sparkle.mesh.position.set(
      Math.cos(phase + index) * sparkle.orbit,
      sparkle.height + Math.sin(phase * 1.7) * 0.45,
      Math.sin(phase + index) * (sparkle.orbit * 0.58) + 1.2,
    );
    sparkle.mesh.rotation.x += 0.02;
    sparkle.mesh.rotation.y += 0.03;
    sparkle.mesh.material.opacity = visualState.spinning || visualState.rarity === 'SSR'
      ? 0.38 + Math.sin(phase * 2.2) * 0.18
      : 0.1 + Math.sin(phase * 2) * 0.06;
  });

  domeGlass.material.emissive.copy(rarityColor).multiplyScalar(visualState.spinning ? 0.12 : 0.05);
  domeGlass.material.emissiveIntensity = visualState.rarity === 'SSR' ? 0.9 : visualState.rarity === 'R' ? 0.45 : 0.18;
  domeGlass.rotation.y += delta * 0.16;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function syncMachineState() {
  visualState.spinning = machineEl.classList.contains('is-spinning');
  visualState.hasCapsule = machineEl.classList.contains('has-capsule');
  visualState.revealed = machineEl.classList.contains('is-revealed');
  visualState.jackpot = machineEl.classList.contains('is-ticket-jackpot');
  visualState.touching = handleWrap?.classList.contains('is-touching') ?? false;
  visualState.rarity = machineEl.dataset.rarity || 'N';

  const palette = readCapsulePalette();
  visualState.capsuleTop.copy(palette.top);
  visualState.capsuleBottom.copy(palette.bottom);
  applyCapsuleColors(dispensedCapsule, palette);

  innerCapsules.forEach((capsule, index) => {
    const tint = getPaletteVariant(index, palette);
    applyCapsuleColors(capsule, tint);
  });
}

function resizeRenderer() {
  const width = Math.max(mount.clientWidth, 1);
  const height = Math.max(mount.clientHeight, 1);
  renderer.setSize(width, height, false);
  applyResponsiveLayout(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function applyResponsiveLayout(width, height) {
  const widthRatio = width / 560;
  const heightRatio = height / 620;
  const narrowScreen = width <= 480;
  const tabletScreen = width <= 768;
  const compactScale = narrowScreen ? 1.04 : tabletScreen ? 0.98 : 1;
  const scale = THREE.MathUtils.clamp(Math.min(widthRatio, heightRatio) * compactScale, narrowScreen ? 0.74 : 0.78, 1);

  machineGroup.scale.setScalar(scale);
  pedestalShadow.scale.setScalar(narrowScreen ? 0.74 : tabletScreen ? 0.84 : 1);
  pedestalShadow.position.y = narrowScreen ? -5.2 : tabletScreen ? -5.38 : -5.65;
  sceneRoot.position.y = narrowScreen
    ? -1.55 - (1 - scale) * 0.68
    : tabletScreen
      ? -1.34 - (1 - scale) * 0.8
      : -0.82 - (1 - scale) * 1.18;

  camera.fov = narrowScreen ? 33 : tabletScreen ? 31 : 28;
  camera.position.set(0, narrowScreen ? 1.18 : tabletScreen ? 1.24 : 1.2, narrowScreen ? 16.9 : tabletScreen ? 16.2 : 15.5);
  camera.lookAt(0, narrowScreen ? -2.05 : tabletScreen ? -1.8 : -0.9, 0);
}

function readCapsulePalette() {
  const styles = capsuleProxy ? getComputedStyle(capsuleProxy) : null;
  return {
    top: safeColor(styles?.getPropertyValue('--capsule-top'), '#ffd34a'),
    bottom: safeColor(styles?.getPropertyValue('--capsule-bottom'), '#76c7ff'),
  };
}

function safeColor(value, fallback) {
  const source = (value || fallback).trim() || fallback;
  try {
    return new THREE.Color(source);
  } catch {
    return new THREE.Color(fallback);
  }
}

function getPaletteVariant(index, palette) {
  const top = palette.top.clone().lerp(new THREE.Color('#fff3cf'), 0.18 + (index % 3) * 0.08);
  const bottom = palette.bottom.clone().lerp(new THREE.Color('#ffffff'), 0.1 + (index % 4) * 0.06);
  return { top, bottom };
}

function getRarityColor(rarity) {
  if (rarity === 'SSR') return new THREE.Color('#ff83c7');
  if (rarity === 'R') return new THREE.Color('#ffb05a');
  return new THREE.Color('#8fd3ff');
}

function createCapsule(radius) {
  const group = new THREE.Group();
  const materialTop = new THREE.MeshPhysicalMaterial({
    color: 0xffd34a,
    metalness: 0.02,
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const materialBottom = new THREE.MeshPhysicalMaterial({
    color: 0x76c7ff,
    metalness: 0.02,
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const top = createMesh(
    new THREE.SphereGeometry(radius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    materialTop,
    { position: [0, 0.02, 0], castShadow: true },
  );
  const bottom = createMesh(
    new THREE.SphereGeometry(radius, 32, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    materialBottom,
    { position: [0, -0.02, 0], castShadow: true },
  );
  const seam = createMesh(
    new THREE.TorusGeometry(radius * 0.98, radius * 0.07, 14, 40),
    new THREE.MeshStandardMaterial({ color: 0xf7f7ff, metalness: 0.48, roughness: 0.18, transparent: true, opacity: 0.55 }),
    { rotation: [Math.PI / 2, 0, 0], castShadow: true },
  );
  group.add(top, bottom, seam);
  return { group, top, bottom, seam };
}

function applyCapsuleColors(capsule, palette) {
  capsule.top.material.color.copy(palette.top);
  capsule.bottom.material.color.copy(palette.bottom);
  capsule.seam.material.color.copy(palette.top.clone().lerp(palette.bottom, 0.5).lerp(new THREE.Color('#ffffff'), 0.4));
}

function createMesh(geometry, material, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  if (options.position) mesh.position.set(...options.position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.scale) mesh.scale.set(...options.scale);
  mesh.castShadow = Boolean(options.castShadow);
  mesh.receiveShadow = Boolean(options.receiveShadow);
  return mesh;
}

function normalizeAngle(value) {
  const fullTurn = Math.PI * 2;
  return THREE.MathUtils.euclideanModulo(value + Math.PI, fullTurn) - Math.PI;
}

function teardown() {
  mounted = false;
  machineObserver.disconnect();
  resizeObserver.disconnect();
  renderer.dispose();
  disposeObject(scene);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
      return;
    }
    if (child.material) child.material.dispose();
  });
}
