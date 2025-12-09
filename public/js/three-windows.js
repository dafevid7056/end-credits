import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

/* -------------------------------------------------------------------------- */
/* SETUP                                                                      */
/* -------------------------------------------------------------------------- */

const width = window.innerWidth;
const height = window.innerHeight;
const canvas = document.querySelector('#three-windows');

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false 
});

renderer.setSize(width, height);
renderer.setClearColor(0xffffff, 1); // White Background
renderer.setAnimationLoop(animate);

/* -------------------------------------------------------------------------- */
/* CAMERA & MOUSE                                                             */
/* -------------------------------------------------------------------------- */

const camera = new THREE.PerspectiveCamera(77, width / height, 0.01, 1000);
camera.position.set(-14, 5, 0); 

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth inertia
controls.dampingFactor = 0.05;
controls.minDistance = 5; // Minimum zoom
controls.maxDistance = 50; // Maximum zoom
controls.maxPolarAngle = Math.PI / 1.5; // Prevent going under the floor
controls.target.set(0, 0, 0); // Look at center
controls.update();

// Enable mouse controls explicitly
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
};
const scene = new THREE.Scene();

// // Mouse Tracking
// let mouseX = 0;
// let mouseY = 0;
// const sensitivity = 0.002;

// window.addEventListener('mousemove', (event) => {
//     mouseX = (event.clientX - window.innerWidth / 2) * sensitivity;
//     mouseY = (event.clientY - window.innerHeight / 2) * sensitivity;
// });

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -------------------------------------------------------------------------- */
/* KEYBOARD CONTROLS (ELEVATOR LOGIC)                                         */
/* -------------------------------------------------------------------------- */

const moveSpeed = 0.5;

window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'r': // Reset camera
            camera.position.set(-14, 5, 0);
            controls.target.set(0, 0, 0);
            break;
    }
});

// Global Uniforms
let gu = {
    time: { value: 0 }
};

/* -------------------------------------------------------------------------- */
/* MATERIAL (LIGHT MODE SHADER)                                               */
/* -------------------------------------------------------------------------- */

const lightModeMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.03,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.NormalBlending,
    
    onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;

        shader.vertexShader = `
      uniform float time;
      varying float vRandom;
      ${shader.vertexShader}
    `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
        
        vec3 wPos = vec3(modelMatrix * vec4(position, 1.));
        
        // Gentle Floating
        float t = time * 0.5;
        wPos.y += sin(t * 0.5 + wPos.x) * 0.05;

        transformed = (viewMatrix * vec4(wPos, 1.0)).xyz;
        
        // Randomness
        vRandom = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
      `
        ).replace(
            `#include <project_vertex>`,
            `
            vec4 mvPosition = vec4( transformed, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
            
            // Perspective Sizing
            gl_PointSize = size * ( scale / - mvPosition.z );
            `
        );

        shader.fragmentShader = `
      varying float vRandom;
      ${shader.fragmentShader}
    `.replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>`
            // No clipping = Square points
        ).replace(
            `#include <alphatest_fragment>`,
            `#include <alphatest_fragment>
        
        // PALETTE
        vec3 prussianDark = vec3(0.05, 0.1, 0.15); 
        vec3 prussianLight = vec3(0.15, 0.25, 0.35);
        vec3 lightBlue = vec3(0.7, 0.85, 0.95);
        vec3 goldColor = vec3(1.0, 0.8, 0.4);

        vec3 finalColor;

        if (vRandom < 0.90) {
            finalColor = mix(prussianDark, prussianLight, vRandom * 1.1);
        } else if (vRandom < 0.98) {
            finalColor = lightBlue;
        } else {
            finalColor = goldColor;
        }

        diffuseColor.rgb = finalColor;
        diffuseColor.a = 1.0;
      `
        );
    }
});

/* -------------------------------------------------------------------------- */
/* LOADER                                                                     */
/* -------------------------------------------------------------------------- */

const loader = new GLTFLoader();

loader.load('models/Windows.glb', function (gltf) {

    const model = gltf.scene;
    const windowGroup = new THREE.Group();

    // Force matrix update
    model.updateMatrixWorld(true);

    const density = 40; 
    const maxPointsPerMesh = 4000;

    model.traverse((child) => {
        if (child.isMesh) {
            
            // Bounding Box Calculation
            child.geometry.computeBoundingBox();
            const bbox = child.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            // Surface Area
            const surfaceArea = 2 * (size.x * size.y + size.x * size.z + size.y * size.z);
            
            // Count Logic
            let count = Math.ceil(surfaceArea * density);
            count = Math.max(50, Math.min(count, maxPointsPerMesh));

            // Sampling
            const sampler = new MeshSurfaceSampler(child).build();
            const vertices = [];
            const tempPosition = new THREE.Vector3();

            for (let i = 0; i < count; i++) {
                sampler.sample(tempPosition);
                tempPosition.applyMatrix4(child.matrixWorld);
                vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
            }

            // Geometry Creation
            const pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const points = new THREE.Points(pointsGeometry, lightModeMaterial);
            
            windowGroup.add(points);
        }
    });

    // Final Positioning
    windowGroup.position.set(0, -1, 0); 
    scene.add(windowGroup);

}, undefined, function (error) {
    console.error('Error loading GLB:', error);
});

/* -------------------------------------------------------------------------- */
/* ANIMATION                                                                  */
/* -------------------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate() {
    let t = clock.getElapsedTime();
    gu.time.value = t;

    controls.update(); // This must be called every frame when damping is enabled

    renderer.render(scene, camera);
}