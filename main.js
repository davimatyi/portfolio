import './style.css'

import * as THREE from 'three';
import { SelectiveBloomEffect, EffectComposer, EffectPass, RenderPass, Selection } from 'postprocessing';

import bkg1_left from "./img/skybox/bkg1_left.png";
import bkg1_right from "./img/skybox/bkg1_right.png";
import bkg1_top from "./img/skybox/bkg1_top.png";
import bkg1_bot from "./img/skybox/bkg1_bot.png";
import bkg1_back from "./img/skybox/bkg1_back.png";
import bkg1_front from "./img/skybox/bkg1_front.png";

let scene, camera, composer, icosahedron, renderer, loadingManager = null;
let icosahedron_baserotation = 0;

const orbiterCenter = new THREE.Vector3(-300, 20, 200);
const orbitRadius = 50;
const orbiterCount = 60;
const sunComponentCount = 10;
let orbiters = [];
let sunComponents = [];

const loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000),
  loadingBox: new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF, opacity: 0.8, transparent: true })
  ),
  boxTimer: 0,
  boxInterval: 1,
  boxAngle: 0
};

let RESOURCES_LOADED = false;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

  loadingScreen.loadingBox.position.set(0, 0, 10);
  loadingScreen.scene.add(loadingScreen.loadingBox);
  loadingScreen.camera.lookAt(loadingScreen.loadingBox.position);

  loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = () => {
    console.log("resources loaded");

    setTimeout(() => {
      RESOURCES_LOADED = true;
      document.querySelector("#content").style.opacity = 1;
    }, 1000);
  };
  loadingManager.onProgress = (url, loaded, total) => {
    console.log(url, loaded, total);
    // const w = (loaded / total) * 10;
    // loadingScreen.loadingBar.scale.set(w, 1, 1);
    // loadingScreen.loadingBar.position.x = w - 5;
  };


  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#background"),
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  composer = new EffectComposer(renderer);
  const bloomEffect = new SelectiveBloomEffect(scene, camera, { intensity: 4.5, luminanceThreshold: 0 });
  const renderPass = new RenderPass(scene, camera);
  const effectPass = new EffectPass(camera, bloomEffect);
  composer.addPass(renderPass);
  composer.addPass(effectPass);


  const skyboxLoader = new THREE.CubeTextureLoader(loadingManager);
  const skyboxTexture = skyboxLoader.load([
    bkg1_left,
    bkg1_right,
    bkg1_top,
    bkg1_bot,
    bkg1_back,
    bkg1_front
  ]);
  scene.background = skyboxTexture;



  const icosahedron_geometry = new THREE.IcosahedronGeometry(10);
  const icosahedron_material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true });
  icosahedron = new THREE.Mesh(icosahedron_geometry, icosahedron_material);
  icosahedron.position.set(5, 5, 0);

  scene.add(icosahedron);

  const bloomSet = new Selection();

  function addStar() {
    const star_geometry = new THREE.SphereGeometry(0.5);
    const star_material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const star = new THREE.Mesh(star_geometry, star_material);

    const x = THREE.MathUtils.randFloatSpread(500) - 100;
    const y = THREE.MathUtils.randFloatSpread(500) + 100;
    const z = THREE.MathUtils.randFloatSpread(2000) + 500;

    star.position.set(x, y, z);
    scene.add(star);
    bloomSet.add(star);
  }

  Array(1000).fill().forEach(addStar);


  function addOrbiter(phi) {
    const orbiter_geometry = new THREE.TetrahedronBufferGeometry(5);
    const orbiter_material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const orbiter = new THREE.Mesh(orbiter_geometry, orbiter_material);
    const edges = new THREE.EdgesGeometry(orbiter_geometry);
    const lineSegments = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));

    const loc = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(orbitRadius / 2),
      THREE.MathUtils.randFloatSpread(orbitRadius / 5),
      THREE.MathUtils.randFloatSpread(orbitRadius / 2)
    )

    const x = orbiterCenter.x + Math.cos(phi) * orbitRadius + loc.x;
    const y = orbiterCenter.y + Math.cos(phi) * orbitRadius / 2.5 + loc.y;
    const z = orbiterCenter.z + Math.sin(phi) * orbitRadius + loc.z;

    orbiter.rotation.y = THREE.MathUtils.randFloatSpread(4);
    orbiter.rotation.z = THREE.MathUtils.randFloatSpread(4);
    orbiter.rotation.x = THREE.MathUtils.randFloatSpread(4);
    lineSegments.rotation.y = orbiter.rotation.y;
    lineSegments.rotation.x = orbiter.rotation.x;
    lineSegments.rotation.z = orbiter.rotation.z;

    orbiter.position.set(x, y, z);
    lineSegments.position.set(x, y, z);
    scene.add(orbiter);
    scene.add(lineSegments);
    return { orbiter: orbiter, outline: lineSegments, phi: phi, loc: loc };
  }

  orbiters = new Array(orbiterCount);
  for (let i = 0; i < orbiterCount; i++) {
    orbiters[i] = addOrbiter((i / orbiterCount) * 8);
  }

  function addSunComponent() {
    const sun_geometry = new THREE.IcosahedronGeometry(10);
    const sun_material = new THREE.MeshBasicMaterial({ color: 0xFF7810, wireframe: true });
    const sun = new THREE.Mesh(sun_geometry, sun_material);

    sun.position.set(orbiterCenter.x, orbiterCenter.y, orbiterCenter.z);
    let rot = THREE.MathUtils.randFloatSpread(8);
    sun.rotation.y = rot * 0.2;
    sun.rotation.z = rot * 0.5;
    sun.rotation.x = rot * 0.7;

    scene.add(sun);
    bloomSet.add(sun);
    return { sun: sun, rotation: rot };
  }

  sunComponents = new Array(sunComponentCount);
  for (let i = 0; i < sunComponentCount; i++) {
    sunComponents[i] = addSunComponent();
  }


  bloomEffect.selection = bloomSet;
}


function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  camera.position.z = 30 + t * -0.03;
  camera.position.x = -10 + t * 0.04;
  camera.position.y = t * -0.01;


  if (t < -2000) {
    const rot = (t + 2000) * -0.001;
    if (t > -4000) {
      camera.rotation.y = rot;
    } else camera.rotation.y = 2;
  } else camera.rotation.y = 0;

}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  composer.setSize(window.innerWidth, window.innerHeight);
}

document.body.onscroll = moveCamera;
document.body.onresize = resize;


function draw() {
  requestAnimationFrame(draw);

  if (!RESOURCES_LOADED) {
    if (loadingScreen.boxTimer >= loadingScreen.boxInterval) {
      loadingScreen.boxTimer = 0;
      loadingScreen.boxAngle += 0.5 * Math.PI;
    }
    if (loadingScreen.loadingBox.rotation.z < loadingScreen.boxAngle) {
      const diff = loadingScreen.boxAngle - loadingScreen.loadingBox.rotation.z;
      loadingScreen.loadingBox.rotation.z += diff < 0.01 ? diff : (diff / 20);
    }
    loadingScreen.boxTimer += 0.01;
    renderer.render(loadingScreen.scene, loadingScreen.camera);
    return;
  }

  const t = document.body.getBoundingClientRect().top;
  icosahedron_baserotation += 0.003;
  icosahedron.rotation.x = -icosahedron_baserotation + t * 0.001;
  icosahedron.rotation.y = icosahedron_baserotation * 0.5 + -t * 0.0005;
  icosahedron.rotation.z = -icosahedron_baserotation * 0.5 + t * 0.002;


  orbiters.forEach(elem => {
    elem.orbiter.rotation.x += 0.002;
    elem.orbiter.rotation.y += 0.005;
    elem.orbiter.rotation.z += 0.001;
    elem.outline.rotation.x = elem.orbiter.rotation.x;
    elem.outline.rotation.y = elem.orbiter.rotation.y;
    elem.outline.rotation.z = elem.orbiter.rotation.z;
    elem.phi += 0.001
    elem.orbiter.position.x = orbiterCenter.x + Math.cos(elem.phi - t * 0.001) * orbitRadius + elem.loc.x;
    elem.orbiter.position.y = orbiterCenter.y + Math.sin(elem.phi - t * 0.001) * -orbitRadius * 0.2 + elem.loc.y;
    elem.orbiter.position.z = orbiterCenter.z + Math.sin(elem.phi - t * 0.001) * orbitRadius + elem.loc.z;
    elem.outline.position.x = elem.orbiter.position.x;
    elem.outline.position.y = elem.orbiter.position.y;
    elem.outline.position.z = elem.orbiter.position.z;
  });

  sunComponents.forEach(elem => {
    elem.sun.rotation.x = elem.rotation * 0.2 + t * 0.001;
    elem.sun.rotation.y = elem.rotation * 0.5 - t * 0.002;
    elem.sun.rotation.z = elem.rotation * 0.7 + t * 0.002;
    elem.rotation += 0.01;
  });

  composer.render();
}


init();
draw();
moveCamera();