import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

/* -------------------------------------------------------------------------- */
/*                                 SCENE SETUP                                */
/* -------------------------------------------------------------------------- */

const width = window.innerWidth, height = window.innerHeight;


/* -------------------- RAYCASTING SETUP (The Laser Beam) ------------------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // This holds X/Y coordinates from -1 to 1

// The projection plane
// Vector3(0, 0, 1) means the wall faces the camera.
// -2.0 places the plane at Z = 2.0 (the camera is at Z=3.0)
const collapsePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.0);

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

// Global Uniforms
let gu = {
    time: { value: 0 },
    collapse: { value: 0 },
    // this vector stores the 3D position of the mouse
    cursorPos: { value: new THREE.Vector3(0, 0, 0) } 
};
/* -------------------------------------------------------------------------- */
/*                               MOUSE CONTROLS                               */
/* -------------------------------------------------------------------------- */

let mouseX = 0;
let mouseY = 0;

// mouse sensitivity: remember that lower number = smaller camera movement
const sensitivity = 0.002;

window.addEventListener('mousemove', (event) => {
    // Camera Rotation logic
    mouseX = (event.clientX - window.innerWidth / 2) * sensitivity;
    mouseY = (event.clientY - window.innerHeight / 2) * sensitivity;

    // Logic for Raycaster: a straight line from camera through mouse pointer
    // Convert mouse pixels to a range of -1 (Left/Bottom) to +1 (Right/Top)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// this handles window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -------------------------------------------------------------------------- */
/*                            DREAMLIKE POINT CLOUD                           */
/* -------------------------------------------------------------------------- */

const dreamMaterial = new THREE.PointsMaterial({
    color: 0xffffff, 
    size: 0.04,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.NormalBlending, 
    
    onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        shader.uniforms.collapse = gu.collapse;
        shader.uniforms.cursorPos = gu.cursorPos;

        shader.vertexShader = `
      uniform float time;
      uniform float collapse;
      uniform vec3 cursorPos;
      varying float vRandom;
      varying float vDist; 
      ${shader.vertexShader}
    `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
        
        vec3 wPos = vec3(modelMatrix * vec4(position, 1.));
        
        // SUBTLE FLOATING
        float t = time * 0.5;
        wPos.y += sin(t * 0.5 + wPos.x) * 0.05;
        
        // COLLAPSE LOGIC
        vec3 targetPos = vec3(0.0, 0.0, 2.5); 
        wPos = mix(wPos, targetPos, collapse);

        transformed = (viewMatrix * vec4(wPos, 1.0)).xyz;
        
        vRandom = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);

        // LIDAR DISTANCE FALLOFF
        float distToScanner = distance(wPos, targetPos);
        vDist = distToScanner; 
        float lidarFalloff = 1.0 / (1.0 + distToScanner * distToScanner * 0.01);
      `
        ).replace(
            `gl_PointSize = size;`,
            `
      // VANISH LOGIC
      float threshold = 1.0 - (collapse * 1.2);
      float vanish = step(0.0, threshold - vRandom); 

      // KILL SWITCH
      // If collapse is nearly finished (> 0.95), force everything to zero size.
      // This stops the GPU from calculating the dense center cluster.
      if (collapse > 0.95) {
          vanish = 0.0;
      }

      gl_PointSize = size * vanish * lidarFalloff;
      `
        ).replace(
            `#include <project_vertex>`,
            `
            vec4 mvPosition = vec4( transformed, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize *= ( scale / - mvPosition.z );
            `
        );
        // A new fragment shader to make the points blueish with gold highlights
        shader.fragmentShader = `
      varying float vRandom;
      varying float vDist;
      ${shader.fragmentShader}
    `.replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
            `
        ).replace(
            `#include <alphatest_fragment>`,
            `#include <alphatest_fragment>
        
        vec3 blueDark = vec3(0.1, 0.2, 0.3); 
        vec3 blueMist = vec3(0.3, 0.45, 0.6); 
        vec3 goldColor = vec3(1.0, 0.8, 0.4); 

        vec3 finalColor;

        if (vRandom < 0.95) {
            finalColor = mix(blueDark, blueMist, vRandom * 1.1);
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
/*                                 CITY MODEL                                 */
/* -------------------------------------------------------------------------- */

// Initialize Loader
const loader = new GLTFLoader();

loader.load('models/Bangkok_Clean_V4.glb', function (gltf) {

    const model = gltf.scene;
    const cityGroup = new THREE.Group();

/* ------------------------------ CONFIGURATION ----------------------------- */

    // LAYER 1: Area-Based POINT DENSITY (for large uniform surfaces)
    const density = 30;
    const maxPointsPerMesh = 4000; // Cap for big meshes
    
    // LAYER 2: Fixed Count POINT DENSITY (for small details)
    const detailPointsPerMesh = 44; // Each small mesh gets this many points
    const detailThreshold = 5; // If bounding box volume < this, use detail layer

/* --------------------- LAYER 1: AREA-BASED POINT CLOUD -------------------- */

    model.traverse((child) => {
        if (child.isMesh) {
            
            // Calculate bounding box
            child.geometry.computeBoundingBox();
            const bbox = child.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            // Calculate volume to determine which layer this belongs to
            const volume = size.x * size.y * size.z;
            
            // Skip small objects
            if (volume < detailThreshold) return;
            
            // Calculate surface area
            const surfaceArea = 2 * (size.x * size.y + size.x * size.z + size.y * size.z);
            
            // Calculate count based on area
            let count = Math.ceil(surfaceArea * density);
            count = Math.max(50, Math.min(count, maxPointsPerMesh));

            // Generate points
            const sampler = new MeshSurfaceSampler(child).build();
            const vertices = [];
            const tempPosition = new THREE.Vector3();

            for (let i = 0; i < count; i++) {
                sampler.sample(tempPosition);
                tempPosition.applyMatrix4(child.matrixWorld);
                vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
            }

            const pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const points = new THREE.Points(pointsGeometry, dreamMaterial);
            
            cityGroup.add(points);
        }
    });

    /* ----------------------- LAYER 2: DETAIL POINT CLOUD ---------------------- */

    model.traverse((child) => {
        if (child.isMesh) {
            
            // Calculate bounding box
            child.geometry.computeBoundingBox();
            const bbox = child.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            // Calculate volume
            const volume = size.x * size.y * size.z;
            
            // Only process small/detailed objects
            if (volume >= detailThreshold) return;
            
            // Fixed point count for details
            const count = detailPointsPerMesh;

            // Generate points
            const sampler = new MeshSurfaceSampler(child).build();
            const vertices = [];
            const tempPosition = new THREE.Vector3();

            for (let i = 0; i < count; i++) {
                sampler.sample(tempPosition);
                tempPosition.applyMatrix4(child.matrixWorld);
                vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
            }

            const pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const points = new THREE.Points(pointsGeometry, dreamMaterial);
            
            cityGroup.add(points);
        }
    });

    // Apply group transformations
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

// Control variables for the smooth transition
let targetCollapse = 0; // We start at "Normal" (0)
const collapseSpeed = 0.002; // LOWER = SLOWER

// This function allows app.js to trigger the effect
window.triggerCollapse = function () {
    targetCollapse = 1; // Tell the system: "Go to Collapsed State"
    console.log("Collapse triggered!");
};

function animate(time) {
    let t = clock.getElapsedTime();
    gu.time.value = t;

    // Only calculate the Lerp if the collapse hasn't finished
    if (gu.collapse.value < 0.99) {
        gu.collapse.value += (targetCollapse - gu.collapse.value) * collapseSpeed;
    } else {
        // If it's almost done, set it to 1 and stop calculating
        gu.collapse.value = 1.0;
    }

    // Camera Look Logic
    camera.lookAt(mouseX * 10, -mouseY * 10, 0);

    // Raycasting Logic
    raycaster.setFromCamera(mouse, camera);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(collapsePlane, intersectionPoint);

    if (intersectionPoint) {
        intersectionPoint.x = Math.max(-12, Math.min(12, intersectionPoint.x));
        intersectionPoint.y = Math.max(-8, Math.min(8, intersectionPoint.y));
        gu.cursorPos.value.copy(intersectionPoint);
    }

    renderer.render(scene, camera);
}