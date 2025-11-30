import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* -------------------------------------------------------------------------- */
/*                                 SCENE SETUP                                */
/* -------------------------------------------------------------------------- */

const width = window.innerWidth, height = window.innerHeight;

// SELECT THE EXISTING CANVAS
const canvas = document.querySelector('#three-bg');

// PASS IT TO THE RENDERER
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
	alpha: true
});

renderer.setSize(width, height);
renderer.setAnimationLoop(animate);

/* --------------------------------- CAMERA --------------------------------- */

const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
camera.position.set(0, 1, 0);

const scene = new THREE.Scene();

/* -------------------------------------------------------------------------- */
/*                               MOUSE CONTROLS                               */
/* -------------------------------------------------------------------------- */

let mouseX = 0;
let mouseY = 0;

// remember that lower number = smaller camera movement
const sensitivity = 0.002;

window.addEventListener('mousemove', (event) => {
	// This works by getting the mouse position in pixels, subtracting half the screen width/height to make the center (0,0) and then multiplying by sensitivity to scale it down
	mouseX = (event.clientX - window.innerWidth / 2) * sensitivity;
	mouseY = (event.clientY - window.innerHeight / 2) * sensitivity;
});

// Handle window resize
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -------------------------------------------------------------------------- */
/*                              BACKGROUND SCENE                              */
/* -------------------------------------------------------------------------- */

// Add some light so we can see the model
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

/* -------------------------------------------------------------------------- */
/*                                ANIMATED CUBE                               */
/* -------------------------------------------------------------------------- */

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.5;
scene.add(mesh);

/* -------------------------------------------------------------------------- */
/*                                 CITY MODEL                                 */
/* -------------------------------------------------------------------------- */

// Initialize Loader
const loader = new GLTFLoader();

// Load the model
loader.load('models/Bangkok_Clean.glb', function (gltf) {

	const model = gltf.scene;

	// Scale down/up if it's too big/small
	model.scale.set(0.8, 0.8, 0.8);

	// Center it
	model.position.set(1, -5, 0);

	model.rotation.z = -113 / 180 * Math.PI;

	scene.add(model);

}, undefined, function (error) {
	console.error('An error happened:', error);
});

/* -------------------------------------------------------------------------- */
/*                               ANIMATION LOOP                               */
/* -------------------------------------------------------------------------- */

function animate(time) {
	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;
	camera.lookAt(mouseX * 20, -mouseY * 20, 0);
	renderer.render(scene, camera);
}

