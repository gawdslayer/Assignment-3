// Crystalline Nebula - 3D Background Animation

class CrystallineNebula {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.crystal = null;
        this.particles = null;
        this.mouse = new THREE.Vector2();

        this.init();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 15;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('bg-canvas'),
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        this.addLighting();

        // Crystalline Core
        this.createCrystal();

        // Particle Field
        this.createParticles();
        
        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    addLighting() {
        const ambientLight = new THREE.AmbientLight(0x58a6ff, 0.2);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x58a6ff, 0.8, 100);
        pointLight1.position.set(10, 10, 20);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xa371f7, 0.6, 100);
        pointLight2.position.set(-20, -15, 10);
        this.scene.add(pointLight2);
    }

    createCrystal() {
        const geometry = new THREE.IcosahedronGeometry(4, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe6edf3,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.4,
            wireframe: true,
            wireframeLinewidth: 0.5,
        });
        this.crystal = new THREE.Mesh(geometry, material);
        this.scene.add(this.crystal);
    }

    createParticles() {
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color1 = new THREE.Color(0x58a6ff);
        const color2 = new THREE.Color(0xa371f7);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;

            const mixedColor = color1.clone().lerp(color2, Math.random());
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = Date.now() * 0.0001;

        // Animate Crystal
        if (this.crystal) {
            this.crystal.rotation.y = 0.1 * time;
            this.crystal.rotation.x = 0.05 * time;
        }

        // Animate Particles
        if (this.particles) {
            this.particles.rotation.y = -0.02 * time;
        }

        // Mouse Parallax Effect
        this.camera.position.x += (this.mouse.x * 5 - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouse.y * 5 - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE !== 'undefined') {
        new CrystallineNebula();
    } else {
        console.warn('Three.js not loaded, background animation skipped.');
    }
}); 