import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js";

(() => {
  const canvas = document.getElementById("bullseye-3d");
  const host = document.querySelector(".v6-bull-stage");
  if (!canvas || !host) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  camera.position.set(0, 1.8, 9.5);

  const hemi = new THREE.HemisphereLight(0xfff1c2, 0x07100e, 2.1);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffd66b, 4.6);
  key.position.set(-4, 7, 7);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9dff68, 2.6);
  rim.position.set(5, 4, -4);
  scene.add(rim);

  const fill = new THREE.PointLight(0xff8a18, 8, 12, 2);
  fill.position.set(0, 2.2, 4);
  scene.add(fill);

  const bullRoot = new THREE.Group();
  scene.add(bullRoot);

  const loader = new GLTFLoader();
  const modelUrl = "https://cdn.3dassets.dev/assets/5010/v1/model.glb";

  let bull = null;
  let eyeGroup = null;
  let baseY = 0;

  function makeGoldMaterial(source) {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xb8892e,
      metalness: 0.94,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.14
    });
    if (source && source.map) m.map = source.map;
    if (source && source.normalMap) m.normalMap = source.normalMap;
    return m;
  }

  function addFireEyes() {
    eyeGroup = new THREE.Group();
    eyeGroup.position.set(0, 2.35, 0.78);
    bullRoot.add(eyeGroup);

    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xa8ff61,
      transparent: true,
      opacity: 0.96
    });

    [-0.34, 0.34].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), eyeMaterial);
      eye.scale.set(1.6, 0.62, 0.5);
      eye.position.set(x, 0, 0);
      eyeGroup.add(eye);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xff8b16,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      glow.position.set(x, 0, -0.02);
      eyeGroup.add(glow);
    });
  }

  loader.load(modelUrl, gltf => {
    bull = gltf.scene;
    const box = new THREE.Box3().setFromObject(bull);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    bull.position.sub(center);
    const targetHeight = 4.9;
    bull.scale.setScalar(targetHeight / Math.max(size.y, 0.001));
    bull.position.y = -1.65;

    bull.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material = makeGoldMaterial(obj.material);
    });

    bullRoot.add(bull);
    addFireEyes();

    baseY = bullRoot.position.y;
    document.documentElement.classList.add("bullseye-3d-ready");
  }, undefined, () => {
    host.classList.add("v6-3d-failed");
  });

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  window.addEventListener("pointermove", e => {
    if (isTouch) return;
    pointer.tx = (e.clientX / innerWidth - 0.5) * 0.32;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 0.18;
  }, { passive: true });

  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(host);
  resize();

  const clock = new THREE.Clock();

  function render() {
    const t = clock.getElapsedTime();

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    if (!prefersReduced) {
      bullRoot.rotation.y = pointer.x + Math.sin(t * 0.35) * 0.035;
      bullRoot.rotation.x = pointer.y;
      bullRoot.position.y = baseY + Math.sin(t * 1.2) * 0.035;
      if (eyeGroup) eyeGroup.children.forEach((m, i) => {
        if (i % 2 === 0) m.material.opacity = 0.78 + Math.sin(t * 5) * 0.16;
      });
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
})();
