import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
camera.position.z = 1;

const scene = new THREE.Scene();



const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// // 1. Add some light so we can see the model
// const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white light
// scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
// directionalLight.position.set(1, 1, 1);
// scene.add(directionalLight);

// // 2. Initialize Loader
// const loader = new GLTFLoader();

// // 3. Load the model
// loader.load('models/Bogota_Clean.glb', function (gltf) {

//     const model = gltf.scene;

//     // Optional: Scale it down/up if it's too big/small
//     model.scale.set(0.8, 0.8, 0.8); 

//     // Optional: Center it
//     model.position.set(0, 0, 0);

//     scene.add(model);

// }, undefined, function (error) {
//     console.error('An error happened:', error);
// });

function animate(time) {
	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;
	renderer.render(scene, camera);


}