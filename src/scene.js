import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function ellipsoid(material, x, y, z, sx, sy, sz) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

export function createAnatomyScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080d19');
  scene.fog = new THREE.FogExp2('#080d19', 0.035);

  const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 100);
  camera.position.set(0, 1.0, 10.2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 3.5;
  controls.maxDistance = 17;
  controls.target.set(0, 0.15, 0);
  controls.update();

  scene.add(new THREE.HemisphereLight('#9cceff', '#261025', 2.5));
  const key = new THREE.DirectionalLight('#ffe4df', 3.3);
  key.position.set(-3, 7, 7);
  scene.add(key);
  const rim = new THREE.PointLight('#57beff', 100);
  rim.position.set(5, 2, -3);
  scene.add(rim);

  const body = new THREE.Group();
  scene.add(body);
  const tissue = new THREE.MeshPhysicalMaterial({ color: '#d98d91', roughness: 0.55, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });
  const shell = ellipsoid(tissue, 0, -0.10, -0.38, 2.14, 3.0, 1.10);
  body.add(shell);

  const lungMat = new THREE.MeshPhysicalMaterial({ color: '#bb657c', roughness: 0.47, metalness: 0.04, clearcoat: 0.2, transparent: true, opacity: 0.89 });
  const leftLung = new THREE.Group();
  const rightLung = new THREE.Group();
  const lungL = ellipsoid(lungMat, -0.98, 0.35, 0.30, 0.82, 1.56, 0.68);
  const lungR = ellipsoid(lungMat, 0.98, 0.35, 0.30, 0.82, 1.56, 0.68);
  lungL.rotation.z = -0.12;
  lungR.rotation.z = 0.12;
  leftLung.add(lungL);
  rightLung.add(lungR);
  body.add(leftLung, rightLung);

  // Stylized branching airways, not full anatomical bronchi.
  const airwayMaterial = new THREE.MeshStandardMaterial({ color: '#e5b4c3', roughness: 0.5 });
  function tube(points, radius) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 28, radius, 9, false), airwayMaterial);
  }
  body.add(tube([[0, 2.55, 0.64], [0, 1.7, 0.64], [0, 1.13, 0.64]], 0.14));
  body.add(tube([[0, 1.13, 0.64], [-0.42, 0.8, 0.64], [-0.86, 0.38, 0.61]], 0.105));
  body.add(tube([[0, 1.13, 0.64], [0.42, 0.8, 0.64], [0.86, 0.38, 0.61]], 0.105));

  const heartPivot = new THREE.Group();
  heartPivot.position.set(-0.05, 0.08, 1.03);
  const heartMaterial = new THREE.MeshPhysicalMaterial({ color: '#b82343', roughness: 0.32, clearcoat: 0.34 });
  const heartCore = ellipsoid(heartMaterial, 0, 0, 0, 0.54, 0.75, 0.48);
  heartCore.rotation.z = -0.32;
  const lower = ellipsoid(heartMaterial, -0.06, -0.42, 0.04, 0.36, 0.48, 0.38);
  lower.rotation.z = 0.25;
  heartPivot.add(heartCore, lower);
  const vessel = new THREE.MeshStandardMaterial({ color: '#cb5367', roughness: 0.43 });
  heartPivot.add(new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.10, 10, 28, Math.PI * 1.4), vessel));
  body.add(heartPivot);

  const floor = new THREE.GridHelper(15, 16, '#284458', '#172b3b');
  floor.position.y = -3.35;
  scene.add(floor);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const selectable = [heartCore, lower, lungL, lungR];
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return {
    render(physiology) {
      const { contraction, inhalation } = physiology;
      const heartScale = 1 - contraction * 2.6;
      heartPivot.scale.set(heartScale, 1 + contraction * 1.9, heartScale);
      const lungScale = 0.95 + 0.085 * inhalation;
      leftLung.scale.set(lungScale, lungScale, lungScale);
      rightLung.scale.set(lungScale, lungScale, lungScale);
      controls.update();
      renderer.render(scene, camera);
    },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(selectable, false);
      if (!intersections.length) return null;
      return intersections[0].object === heartCore || intersections[0].object === lower ? 'Heart' : 'Lungs';
    },
    resetCamera() {
      camera.position.set(0, 1, 10.2);
      controls.target.set(0, 0.15, 0);
      controls.update();
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        materials.forEach(material => material.dispose());
      });
      renderer.dispose();
    },
  };
}
