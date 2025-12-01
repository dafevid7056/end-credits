import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

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

const camera = new THREE.PerspectiveCamera(66, width / height, 0.01, 1000);
camera.position.set(2, 1, 5);

const scene = new THREE.Scene();

let gu = {
    time: { value: 0 }
};

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

// Add some light so we can see the model. I chose a HemisphereLight over a DirectionalLight for softer shadows.
const hemiLight = new THREE.HemisphereLight(0xf0fbff, 0x080820, 2);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

/* -------------------------------------------------------------------------- */
/*                            DREAMLIKE POINT CLOUD                           */
/* -------------------------------------------------------------------------- */

// This is a reusable snippet to create a point cloud material with animated, glowing dots
const dreamMaterial = new THREE.PointsMaterial({
    color: 0xffffff, // White dots
    size: 0.05,      // Base size of dots (Adjust this if they are too big!)
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // Makes overlapping dots glow
    onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        // This injects the GLSL code to animate the dots
        shader.vertexShader = `
      uniform float time;
      varying float vSinVal;
      ${shader.vertexShader}
    `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
        vec3 wPos = vec3(modelMatrix * vec4(position, 1.));
      `
        ).replace(
            `gl_PointSize = size;`,
            `
      float t = time * 1.0;
      // Animate Y position slightly
      wPos.y -= t * 0.2; 
      
      // Calculate a wave effect
      float sinVal = sin(mod(wPos.y * 5.0, 6.283)) * 0.5 + 0.5;
      vSinVal = sinVal;
      
      // Change size based on the wave
      float sizeChange = 0.5 + sinVal * 2.0; 
      gl_PointSize = size * sizeChange;`
        );

        shader.fragmentShader = `
      varying float vSinVal;
      ${shader.fragmentShader}
    `.replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
        // Make points round instead of square
        float dist = length(gl_PointCoord.xy - 0.5);
        if (dist > 0.5) discard;
      `
        ).replace(
            `#include <alphatest_fragment>`,
            `#include <alphatest_fragment>
        // Color shift (Aqua to White)
        diffuseColor.rgb = mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 1.0, 1.0), vSinVal);
        float f = smoothstep(0.5, 0.1, dist);
        diffuseColor.a = f * diffuseColor.a;
      `
        );
    }
});

/* -------------------------------------------------------------------------- */
/*                                 CITY MODEL                                 */
/* -------------------------------------------------------------------------- */

// Initialize Loader
const loader = new GLTFLoader();

// Load the model
loader.load('models/Bangkok_Clean.glb', function (gltf) {

	const model = gltf.scene;
	// This creates a container for the point cloud
	const cityGroup = new THREE.Group();

// Traverse every mesh in the city
    model.traverse((child) => {
        if (child.isMesh) {
            
            //SETUP SAMPLER
            const sampler = new MeshSurfaceSampler(child).build();
            
            //HOW MANY POINTS PER MESH
            const count = 1500; 
            
            const vertices = [];
            const tempPosition = new THREE.Vector3();

            //GENERATE POINTS
            for (let i = 0; i < count; i++) {
                sampler.sample(tempPosition);
                vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
            }

            //CREATE GEOMETRY
            const pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            //CREATE POINTS MESH
            const points = new THREE.Points(pointsGeometry, dreamMaterial);
            
            cityGroup.add(points);
        }
    });

    // I have to apply the transformations to the GROUP, not the individual meshes
    cityGroup.scale.set(0.8, 0.8, 0.8);
    cityGroup.position.set(0, -2, 0);
    cityGroup.rotation.y = THREE.MathUtils.degToRad(113);

    scene.add(cityGroup);

}, undefined, function (error) {
    console.error(error);
});

/* -------------------------------------------------------------------------- */
/*                               ANIMATION LOOP                               */
/* -------------------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate(time) {
	// Update the time for the shader animation
    let t = clock.getElapsedTime();
    gu.time.value = t;
	// Smooth camera movement towards mouse position
	camera.lookAt(mouseX * 10, -mouseY * 10, 0);
	renderer.render(scene, camera);

// 	// This is a debugger to add visual helpers to see where the lights are
// const dirHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(dirHelper);

// const hemiHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
// scene.add(hemiHelper);

}