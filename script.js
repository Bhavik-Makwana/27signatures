// Create a scene
const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth*0.8, window.innerHeight*0.8);
renderer.setClearColor(0xffffff); // Set background color to white
document.querySelector('.sphere-container').appendChild(renderer.domElement);

// Create a sphere geometry
const geometry = new THREE.SphereGeometry(2, 32, 32);

// Load texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('assets/baseball/baseball3.jpg');

// Adjust texture mapping to prevent warping
texture.mapping = THREE.EquirectangularReflectionMapping;

// Create a material with the texture
const material = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.5,
});

// Create a mesh with the geometry and material
const sphere = new THREE.Mesh(geometry, material);

// Add the sphere to the scene
scene.add(sphere);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 5, 5);  // Changed from 5 to -5 for x position
scene.add(directionalLight);

// Create x, y, z lines
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const xGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]);
const yGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 10, 0)]);
const zGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -10), new THREE.Vector3(0, 0, 10)]);

const xLine = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
const yLine = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
const zLine = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({ color: 0x0000ff }));

let debugLinesVisible = false;

// Add event listener to debug button
document.getElementById('debugButton').addEventListener('click', toggleDebugLines);

scene.add(xLine);
scene.add(yLine);
scene.add(zLine);

// Create cursor position indicator
const cursorGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const cursorMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const cursorSphere = new THREE.Mesh(cursorGeometry, cursorMaterial);
scene.add(cursorSphere);

// Create circle geometry for markers
const circleGeometry = new THREE.CircleGeometry(0.3, 32);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff69b4, side: THREE.DoubleSide });

// Create pink circle to mark the top of the sphere
const topCircle = new THREE.Mesh(circleGeometry, circleMaterial);
topCircle.position.set(0, 2, 0);
topCircle.rotation.x = -Math.PI / 2;
sphere.add(topCircle);

// Add circles across the surface of the sphere using Fibonacci distribution
const numCircles = 27; // Increased from 5 to 27 for better coverage
const goldenRatio = (1 + Math.sqrt(5)) / 2;
const circles = []; // Array to store all circle meshes

function equirectangularToCartesian(x, y, imageWidth, imageHeight) {
    // Calculate latitude and longitude
    const latitude = 90 - (y / imageHeight) * 180;
    const longitude = (x / imageWidth) * 360 - 180;
  
    // Convert to radians
    const latitudeRadians = latitude * Math.PI / 180;
    const longitudeRadians = longitude * Math.PI / 180;
  
    // Convert to spherical coordinates
    const radius = 2; // Assuming a unit sphere
    const theta = latitudeRadians;
    const phi = longitudeRadians;
  
    // Convert to Cartesian coordinates
    const xCartesian = radius * Math.sin(theta) * Math.cos(phi);
    const yCartesian = radius * Math.sin(theta) * Math.sin(phi);
    const zCartesian = radius * Math.cos(theta);
  
    return { x: xCartesian, y: yCartesian, z: zCartesian };
  }
  
// Define image dimensions
const imageWidth = 512;
const imageHeight = 512;

const signatureX = 0;
const signatureY = 0;
const coords = [ {x: 0, y: 0}, {x: 0, y: 512}, {x: 150, y: 160}, {x: 190, y: 250}, {x: 180, y: 320}, {x: 140, y: 350}, {x: 40, y:250}];

// Function to convert pixel coordinates to UV coordinates
function pixelToUV(x, y, imageWidth, imageHeight) {
    const u = x / imageWidth;
    const v = 1 - (y / imageHeight); // Flip V coordinate
    return { u, v };
}

// Convert pixel coordinates to UV coordinates for each coordinate
const uvCoords = coords.map(coord => pixelToUV(coord.x, coord.y, imageWidth, imageHeight));

console.log("UV coordinates:", uvCoords);

let i = 0;
let colors = [0xff0000, 0x00ff00, 0x0000ff, 0xfff000, 0xff1f00, 0xff00ff, 0xff00ff];

// Create markers on the sphere using UV mapping
uvCoords.forEach((coord, index) => {
    const { u, v } = coord;
    
    // Convert UV to spherical coordinates
    const theta = u * 2 * Math.PI;
    const phi = (1 - v) * Math.PI;
    
    // Convert spherical to Cartesian coordinates
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    
    const marker = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 32),
        new THREE.MeshBasicMaterial({ color: colors[index % colors.length], side: THREE.DoubleSide })
    );
    
    marker.position.set(x * 2, y * 2, z * 2); // Multiply by 2 to match the sphere radius
    marker.lookAt(0, 0, 0);
    sphere.add(marker);
    circles.push(marker);
});

function toggleDebugLines() {
    debugLinesVisible = !debugLinesVisible;
    if (debugLinesVisible) {
        scene.add(xLine);
        scene.add(yLine);
        scene.add(zLine);
        circles.forEach(circle => {
            circle.material.opacity = 1;
            circle.material.transparent = false;
        });
    } else {
        scene.remove(xLine);
        scene.remove(yLine);
        scene.remove(zLine);
        circles.forEach(circle => {
            circle.material.opacity = 0;
            circle.material.transparent = true;
        });
    }
}

// Variables for dragging
let isDragging = false;
let isBackgroundDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};

// Auto-rotation speed (reduced for slower rotation)
const autoRotationSpeed = 0.005;
const autoRotationSpeedX = 0.005;

// Variable to track if the sphere has been manually rotated
let hasBeenDragged = false;

// Variables for smooth rotation
let isRotatingLeft = false;
let isRotatingRight = false;
let isRotatingUp = false;
let isRotatingDown = false;
const rotationSpeed = 0.02;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    // Auto-rotate the sphere only if it hasn't been dragged and isn't currently being dragged
    if (!hasBeenDragged && !isDragging) {
        sphere.rotation.y -= autoRotationSpeed;
        sphere.rotation.x -= autoRotationSpeedX;
    }

    // Smooth camera rotation
    if (isRotatingLeft) {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
        camera.lookAt(scene.position);
    }
    if (isRotatingRight) {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed);
        camera.lookAt(scene.position);
    }
    if (isRotatingUp) {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotationSpeed);
        camera.lookAt(scene.position);
    }
    if (isRotatingDown) {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotationSpeed);
        camera.lookAt(scene.position);
    }
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    const container = document.querySelector('.sphere-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Mouse event listeners for dragging and clicking
const container = document.querySelector('.sphere-container');
container.addEventListener('mousedown', onMouseDown, false);
container.addEventListener('mousemove', onMouseMove, false);
container.addEventListener('mouseup', onMouseUp, false);
container.addEventListener('click', onClick, false);

function onMouseDown(event) {
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        isDragging = true;
    } else {
        isBackgroundDragging = true;
    }

    previousMousePosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

}

function onMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const currentMousePosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    if (isDragging) {
        const deltaMove = {
            x: currentMousePosition.x - previousMousePosition.x,
            y: currentMousePosition.y - previousMousePosition.y
        };

        sphere.rotation.y += deltaMove.x * 0.01;
        sphere.rotation.x += deltaMove.y * 0.01;
        hasBeenDragged = true;
    } else if (isBackgroundDragging) {
        const deltaMove = {
            x: currentMousePosition.x - previousMousePosition.x,
            y: currentMousePosition.y - previousMousePosition.y
        };

        // Rotate the camera around the sphere
        const rotationSpeed = 0.005;
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaMove.x * rotationSpeed);
        
        // Limit vertical rotation
        const verticalRotation = camera.position.y + deltaMove.y * rotationSpeed;
        camera.position.y = Math.max(Math.min(verticalRotation, 5), -5);

        // Ensure the camera always looks at the center of the scene
        camera.lookAt(scene.position);
    }

    previousMousePosition = currentMousePosition;

    // Update cursor position
    updateCursorPosition(event);
}

function onMouseUp(event) {
    isDragging = false;
    isBackgroundDragging = false;
}

function onClick(event) {
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects([sphere, topCircle, ...circles]);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject === topCircle) {
            console.log("Top circle clicked");
            showModal(`#Top circle clicked`, "This is the top circle.", 0);
        } else if (circles.includes(clickedObject)) {
            const circleIndex = circles.indexOf(clickedObject);
            console.log(`Circle ${circleIndex + 1} clicked`);
            showModal(`#${circleIndex + 1} MSG`, `This is circle ${circleIndex + 1}.`, circleIndex + 1);
        } else if (clickedObject === sphere && !hasBeenDragged) {
            console.log("Sphere clicked");
        }
    }
}

// Add these new functions for modal functionality
function showModal(title, text, index) {
    const modal = document.getElementById('signatureModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const modalImage = document.getElementById('modalImageTag');
    modalTitle.textContent = title;
    modalText.textContent = text;
    
    modal.style.display = 'block';
    console.log(`assets/small_NYC_${index}.jpg`);
    modalImage.src = `assets/small_NYC_${index}.jpg`;
    // Trigger reflow to ensure the transition works
    void modal.offsetWidth;
    
    modal.classList.add('show');
}

// Close the modal when clicking on <span> (x)
document.querySelector('.close').onclick = function() {
    closeModal();
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('signatureModal');
    if (event.target == modal) {
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('signatureModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Wait for the transition to finish before hiding the modal
}

function updateCursorPosition(event) {
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        cursorSphere.position.copy(intersectionPoint);
    }
}

function onKeyDown(event) {
    isDragging = true;
    switch(event.key) {
        case 'ArrowLeft':
            isRotatingLeft = true;
            break;
        case 'ArrowRight':
            isRotatingRight = true;
            break;
        case 'ArrowUp':
            isRotatingUp = true;
            break;
        case 'ArrowDown':
            isRotatingDown = true;
            break;
    }
}

function onKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
            isRotatingLeft = false;
            break;
        case 'ArrowRight':
            isRotatingRight = false;
            break;
        case 'ArrowUp':
            isRotatingUp = false;
            break;
        case 'ArrowDown':
            isRotatingDown = false;
            break;
            
    }
    isDragging = false;
}

// Add these event listeners at the end of your file
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);