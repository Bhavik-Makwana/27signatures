let camera, scene, renderer, video, handSphere;
let model;

async function init() {
    // Set up Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('output') });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);

    // Set up camera position
    camera.position.z = 5;

    // Create a sphere to represent the hand
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('assets/baseball3.jpg');
    
    // Adjust texture mapping to prevent warping
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    // Create a material with the texture
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.5,
        // metalness: 0.1
    });
    
    // Create a mesh with the geometry and material
    handSphere = new THREE.Mesh(geometry, material);

    scene.add(handSphere);

    // Add lighting to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Set up video capture
    video = document.getElementById('video');
    video.width = 640;
    video.height = 480;
    await setupCamera();

    // Load the HandPose model
    model = await handpose.load();

    // Start animation loop
    animate();

    // Add signature circles
    addSignatureCircles();
}

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

async function detectHand() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks;
            const palmBase = landmarks[0];
            const middleFinger = landmarks[12];
            const indexFinger = landmarks[8];
            
            // Update hand sphere position
            handSphere.position.set(
                -((palmBase[0] / video.width) * 4 - 2), // Negate the x-position
                -(palmBase[1] / video.height) * 4 + 2,
                -palmBase[2] / 100
            );
            
            // Calculate rotation
            const palmDirection = new THREE.Vector3(
                middleFinger[0] - palmBase[0],
                middleFinger[1] - palmBase[1],
                middleFinger[2] - palmBase[2]
            ).normalize();
            
            const palmNormal = new THREE.Vector3(
                indexFinger[0] - palmBase[0],
                indexFinger[1] - palmBase[1],
                indexFinger[2] - palmBase[2]
            ).normalize();
            
            const palmSide = new THREE.Vector3().crossVectors(palmDirection, palmNormal);
            
            // Create rotation matrix
            const rotationMatrix = new THREE.Matrix4().makeBasis(palmSide, palmNormal, palmDirection);
            
            // Apply rotation to the sphere
            handSphere.setRotationFromMatrix(rotationMatrix);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    detectHand();
    renderer.render(scene, camera);
}

// Function to enumerate signature entries
function enumerateSignatures() {
    // In a real-world scenario, this would be done server-side or by reading the directory
    // For this example, we'll hardcode the filenames based on the pattern you provided
    return [
        'IMG_3946.jpg',
        'IMG_3947.jpg',
        'IMG_3950.jpg',
        'IMG_3953.jpg',
        // Add more filenames here as needed
    ];
}

function addSignatureCircles() {
    const signatures = enumerateSignatures();
    const numCircles = signatures.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < numCircles; i++) {
        const textureLoader = new THREE.TextureLoader();
        const signatureTexture = textureLoader.load(`assets/${signatures[i]}`);
        const signatureMaterial = new THREE.MeshBasicMaterial({
            map: signatureTexture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const signaturePlane = new THREE.PlaneGeometry(0.2, 0.2);
        const signatureMesh = new THREE.Mesh(signaturePlane, signatureMaterial);
        
        const y = 1 - (i / (numCircles - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        
        const theta = 2 * Math.PI * i / goldenRatio;
        
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        
        signatureMesh.position.set(x * 0.5, y * 0.5, z * 0.5);
        signatureMesh.lookAt(0, 0, 0);
        signatureMesh.translateZ(0.01); // Move slightly above the sphere surface
        
        handSphere.add(signatureMesh);
    }
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / 2 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
});

// Wait for TensorFlow.js to be ready before initializing
tf.ready().then(() => {
    init();
});