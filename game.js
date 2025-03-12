import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0x8080c0, 0.5);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Post-Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
bloomPass.threshold = 0.7;
composer.addPass(bloomPass);

// Audio Setup (Minimal for Shape Sounds)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const shapes = [];
const waves = [];
const particleBursts = [];
const constellationLines = [];
const particlePool = [];

const music = new Audio();
const tracks = {
    track1: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', art: 'https://via.placeholder.com/50/FF6F61', name: 'Ambient Space' },
    track2: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', art: 'https://via.placeholder.com/50/6B7280', name: 'Cosmic Drift' },
    track3: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', art: 'https://via.placeholder.com/50/88D498', name: 'Nebula Waves' },
    track4: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', art: 'https://via.placeholder.com/50/FFD700', name: 'Star Pulse' },
    track5: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', art: 'https://via.placeholder.com/50/FF00FF', name: 'Galactic Echo' }
};
const trackKeys = Object.keys(tracks);
let currentTrackIndex = Math.floor(Math.random() * trackKeys.length);
music.loop = false;

const playPauseBtn = document.getElementById('play-pause');
const trackArt = document.getElementById('track-art');
const trackName = document.getElementById('track-name');
const trackSelect = document.getElementById('track-select');
const visualizer = document.getElementById('visualizer');
const menuToggle = document.getElementById('menu-toggle');
const mainMenu = document.getElementById('main-menu');
const closeMenu = document.getElementById('close-menu');
const menuThemeSelect = document.getElementById('menu-theme-select');
const volumeControl = document.getElementById('volume-control');
const musicToggle = document.getElementById('music-toggle');

function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % trackKeys.length;
    const track = tracks[trackKeys[currentTrackIndex]];
    music.src = track.url;
    trackArt.src = track.art;
    trackName.textContent = track.name;
    trackSelect.value = trackKeys[currentTrackIndex];
    if (!music.paused) music.play();
}

playPauseBtn.addEventListener('click', () => {
    if (music.paused) {
        music.play();
        playPauseBtn.classList.remove('play');
        playPauseBtn.classList.add('pause');
        visualizer.classList.add('playing');
    } else {
        music.pause();
        playPauseBtn.classList.remove('pause');
        playPauseBtn.classList.add('play');
        visualizer.classList.remove('playing');
    }
});

trackSelect.addEventListener('change', (e) => {
    currentTrackIndex = trackKeys.indexOf(e.target.value);
    const track = tracks[e.target.value];
    music.src = track.url;
    trackArt.src = track.art;
    trackName.textContent = track.name;
    if (!music.paused) music.play();
});

music.addEventListener('ended', playNextTrack);

// Game State
let score = 0;
let level = 1;
let targetScore = 20;
let timeLeft = 30;
let gameOver = false;
let powerUpSpawned = false;
let scoreSubmitted = false;
let gameStarted = false;
let paused = false;
let targetShape = 'circle';
let burstSequence = [];
let comboMultiplier = 1;
let comboCount = 0;
let lastBurstTime = 0;

// UI Elements
const tutorialScreen = document.getElementById('tutorial-screen');
const closeTutorial = document.getElementById('close-tutorial');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-game');
const themeSelect = document.getElementById('theme-select');
const gameUi = document.getElementById('game-ui');
const centerObjective = document.getElementById('center-objective');
const musicPlayer = document.getElementById('music-player');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const targetDisplay = document.getElementById('target');
const timerDisplay = document.getElementById('timer');
const comboDisplay = document.getElementById('combo');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const leaderboardList = document.getElementById('leaderboard-list');
const playerNameInput = document.getElementById('player-name');
const submitScoreBtn = document.getElementById('submit-score');
const clearLeaderboardBtn = document.getElementById('clear-leaderboard');
const restartButton = document.getElementById('restart');
const pauseButton = document.getElementById('pause-game');

function adjustButtonSizes() {
    const buttons = [playPauseBtn, startButton, pauseButton, submitScoreBtn, restartButton, closeTutorial, clearLeaderboardBtn, closeMenu];
    buttons.forEach(btn => {
        btn.style.minWidth = '80px';
        btn.style.padding = '15px 30px';
        btn.style.fontSize = '18px';
    });
    playerNameInput.style.padding = '10px';
    playerNameInput.style.minWidth = '150px';
}
adjustButtonSizes();
window.addEventListener('resize', adjustButtonSizes);

// Color Themes with Cycle
const themes = {
    nebula: { uiGlow: '#800080', mushroomBase: 0x800080, textShadow: '#ff00ff', buttonColor: '#800080', gradientColors: [0x800080, 0xff00ff, 0xc0c0ff] },
    cosmic: { uiGlow: '#0000ff', mushroomBase: 0x0000ff, textShadow: '#00ffff', buttonColor: '#0000ff', gradientColors: [0x0000ff, 0x00ffff, 0x8080ff] },
    galactic: { uiGlow: '#008000', mushroomBase: 0x008000, textShadow: '#00ff00', buttonColor: '#008000', gradientColors: [0x008000, 0x00ff00, 0x80ff80] }
};

function applyTheme(themeName, targetElement) {
    const theme = themes[themeName];
    targetElement.style.boxShadow = `0 0 30px ${theme.uiGlow}`;
    targetElement.querySelectorAll('h1, .ui-item').forEach(item => {
        item.style.textShadow = `0 0 5px ${theme.textShadow}`;
    });
    if (targetElement === gameUi) {
        document.querySelectorAll('.label').forEach(label => {
            label.style.color = theme.textShadow;
        });
        centerObjective.style.textShadow = `0 0 15px ${theme.textShadow}`;
    }
    if (targetElement === startScreen || targetElement === gameOverScreen || targetElement === musicPlayer || targetElement === tutorialScreen || targetElement === mainMenu) {
        document.documentElement.style.setProperty('--glow-color', `${theme.uiGlow}80`);
    }
    document.querySelectorAll('#start-game, #theme-select, #play-pause, #submit-score, #restart, #close-tutorial, #pause-game, #close-menu').forEach(btn => {
        btn.style.backgroundColor = theme.buttonColor;
    });
    clearLeaderboardBtn.style.backgroundColor = '#6b7280';
    visualizer.style.borderColor = theme.buttonColor;
}

// Shape Objectives
const shapeObjectives = [
    { shape: 'circle', message: 'Burst Circles!' },
    { shape: 'cube', message: 'Burst Cubes!' },
    { shape: 'triangle', message: 'Burst Triangles!' },
    { shape: 'torus', message: 'Burst Toruses!' }
];

// Constellation Line Class with Enhanced Visuals
class ConstellationLine {
    constructor(start, end) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
        this.line = new THREE.Line(geometry, material);
        scene.add(this.line);
        this.lifespan = 2;
        this.thickness = 0.1;
    }

    update(delta) {
        this.lifespan -= delta;
        this.thickness += delta * 0.05; // Pulsing thickness
        this.line.material.opacity = this.lifespan / 2;
        this.line.material.linewidth = Math.sin(Date.now() * 0.005) * 0.1 + this.thickness;
        if (this.lifespan <= 0) {
            scene.remove(this.line);
            this.line.geometry.dispose();
            this.line.material.dispose();
            return false;
        }
        return true;
    }
}

// Shape Class with Trails and Color Cycling
class Shape {
    constructor(isPowerUp = false, powerUpType = null) {
        this.isPowerUp = isPowerUp;
        this.powerUpType = isPowerUp ? (powerUpType || (Math.random() < 0.5 ? 'time' : 'multiplier')) : null;
        this.isBoss = false;
        this.shape = isPowerUp ? 'powerUp' : this.getRandomShape();
        this.size = Math.random() * 2 + 1;
        let geometry;
        switch (this.shape) {
            case 'circle': geometry = new THREE.IcosahedronGeometry(this.size, 3); break;
            case 'cube': geometry = new THREE.BoxGeometry(this.size, this.size, this.size); break;
            case 'triangle': geometry = new THREE.TetrahedronGeometry(this.size); break;
            case 'torus': geometry = new THREE.TorusGeometry(this.size * 0.5, this.size * 0.2, 16, 32); break;
            case 'powerUp': geometry = new THREE.IcosahedronGeometry(2, 3); break;
        }

        // Assign a single specific color with cycling potential
        const themeColors = themes[themeSelect.value].gradientColors;
        this.baseColor = themeColors[Math.floor(Math.random() * themeColors.length)];
        const material = new THREE.MeshStandardMaterial({
            color: this.baseColor,
            emissive: this.baseColor,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            metalness: 0.2,
            roughness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        scene.add(this.mesh);

        // Add Trail
        this.trail = [];
        this.trailLength = 10;

        this.oscillator = audioContext.createOscillator();
        this.gainNode = audioContext.createGain();
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        this.oscillator.frequency.value = isPowerUp ? 800 : this.getFrequency();
        this.gainNode.gain.value = 0;
        this.oscillator.start();

        this.time = Math.random() * 100;
        this.baseLifespan = 2.5 + Math.random() * 2;
        this.lifespan = Math.max(1.5, this.baseLifespan - (level * 0.06));
        this.initialLifespan = this.lifespan;
        this.rotationSpeed = 0.5 + level * 0.1;
        this.hitsLeft = this.isBoss ? 3 : 1;
        this.pulseFactor = 1.0;
        this.colorCycle = 0; // For color transition
    }

    getRandomShape() {
        const rand = Math.random();
        if (rand < 0.7) return targetShape;
        const shapes = shapeObjectives.map(o => o.shape).filter(s => s !== targetShape);
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    getFrequency() {
        return 200 + Math.random() * 500;
    }

    update(delta) {
        this.time += delta;
        this.lifespan -= delta;
        this.pulseFactor = 1 + Math.sin(this.time * 2) * 0.1;
        this.mesh.scale.set(this.pulseFactor, this.pulseFactor, this.pulseFactor);
        this.mesh.rotation.x += delta * this.rotationSpeed;
        this.mesh.rotation.y += delta * this.rotationSpeed;
        const lifeRatio = this.lifespan / this.initialLifespan;
        this.mesh.material.opacity = Math.max(0.4, lifeRatio);

        // Color Cycling
        this.colorCycle += delta * 0.1;
        const themeColors = themes[themeSelect.value].gradientColors;
        const colorIdx = Math.floor((Math.sin(this.colorCycle) + 1) / 2 * (themeColors.length - 1));
        this.mesh.material.color.set(themeColors[colorIdx]);
        this.mesh.material.emissive.set(themeColors[colorIdx]);

        // Trail Effect
        this.trail.push(this.mesh.position.clone());
        if (this.trail.length > this.trailLength) this.trail.shift();
        this.updateTrail();

        if (this.lifespan <= 0) {
            this.cleanup();
            return false;
        }
        return true;
    }

    updateTrail() {
        if (this.trailGeometry) scene.remove(this.trailMesh);
        const positions = new Float32Array(this.trail.length * 3);
        for (let i = 0; i < this.trail.length; i++) {
            positions[i * 3] = this.trail[i].x;
            positions[i * 3 + 1] = this.trail[i].y;
            positions[i * 3 + 2] = this.trail[i].z;
        }
        const trailGeometry = new THREE.BufferGeometry();
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const trailMaterial = new THREE.LineBasicMaterial({
            color: this.mesh.material.color,
            transparent: true,
            opacity: 0.5
        });
        this.trailMesh = new THREE.Line(trailGeometry, trailMaterial);
        scene.add(this.trailMesh);
    }

    burst() {
        if (this.isBoss) {
            this.hitsLeft--;
            if (this.hitsLeft > 0) {
                this.createPopup(`Hits Left: ${this.hitsLeft}`, '#ff0000');
                for (let i = 0; i < 2; i++) {
                    const miniShape = new Shape();
                    miniShape.mesh.position.copy(this.mesh.position);
                    miniShape.mesh.position.x += (Math.random() - 0.5) * 2;
                    miniShape.mesh.position.y += (Math.random() - 0.5) * 2;
                    shapes.push(miniShape);
                }
                return;
            }
        }

        const now = Date.now();
        if (this.isPowerUp) {
            if (this.powerUpType === 'time') {
                timeLeft += 15;
                powerUpSpawned = false;
                this.createPopup('+15 Time', '#ffd700');
            } else if (this.powerUpType === 'multiplier') {
                comboMultiplier = 2;
                powerUpSpawned = false;
                this.createPopup('x2 Multiplier!', '#00ffff');
                setTimeout(() => {
                    comboMultiplier = 1;
                    flashCenterObjective('Multiplier Expired!');
                }, 10000);
            }
        } else if (this.shape === targetShape) {
            const sizeBonus = Math.floor(this.size);
            const speedBonus = Math.floor(this.rotationSpeed);
            const points = Math.floor((10 + sizeBonus + speedBonus) * comboMultiplier);
            score += points;
            comboCount++;
            if (now - lastBurstTime < 1000) comboMultiplier = Math.min(3, comboMultiplier + 0.5);
            else comboMultiplier = 1;
            lastBurstTime = now;
            this.createPopup(`+${points} x${comboMultiplier.toFixed(1)}`, `#${this.baseColor.toString(16).padStart(6, '0')}`);
            comboDisplay.textContent = comboCount;
            burstSequence.push({ time: now, position: this.mesh.position.clone() });
            this.checkConstellation();
            if (comboCount > 2) {
                bloomPass.strength = Math.min(1.5, 0.8 + comboCount * 0.1);
                setTimeout(() => bloomPass.strength = 0.6, 500);
            }
        } else {
            score -= 5;
            comboMultiplier = 1;
            comboCount = 0;
            this.createPopup('-5', '#ff0000');
            comboDisplay.textContent = comboCount;
        }
        scoreDisplay.textContent = Math.max(0, score);

        this.gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);

        const wave = new Wave(this.mesh.position.clone());
        waves.push(wave);
        const burst = createParticleBurst(this.mesh.position.clone(), this.mesh.material.color.getHex());
        particleBursts.push(burst);

        this.cleanup();
    }

    checkConstellation() {
        const now = Date.now();
        burstSequence = burstSequence.filter(b => now - b.time < 3000);
        if (burstSequence.length >= 3) {
            const bonus = 20 * comboMultiplier;
            score += bonus;
            this.createPopup(`+${bonus} Constellation!`, '#ffff00');
            scoreDisplay.textContent = score;
            for (let i = 0; i < burstSequence.length - 1; i++) {
                constellationLines.push(new ConstellationLine(burstSequence[i].position, burstSequence[i + 1].position));
            }
            burstSequence = [];
            if (comboCount >= 5 && Math.random() < 0.3) {
                flashCenterObjective('Slow Time!');
                lastSpawn = -2;
                setTimeout(() => lastSpawn = 0, 5000);
            }
        }
    }

    createPopup(text, color) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.color = color;
        const rect = renderer.domElement.getBoundingClientRect();
        const vector = new THREE.Vector3().copy(this.mesh.position).project(camera);
        popup.style.left = `${rect.left + (vector.x + 1) * 0.5 * window.innerWidth}px`;
        popup.style.top = `${rect.top + (-vector.y + 1) * 0.5 * window.innerHeight}px`;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.style.transform = 'translateY(-50px)';
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 1000);
        }, 10);
    }

    cleanup() {
        if (this.mesh) {
            scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
        if (this.trailMesh) {
            scene.remove(this.trailMesh);
            this.trailMesh.geometry.dispose();
            this.trailMesh.material.dispose();
        }
        if (this.oscillator) this.oscillator.stop();
        if (this.gainNode) this.gainNode.disconnect();
    }
}

// Wave Class
class Wave {
    constructor(origin) {
        const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x6060a0,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(origin);
        scene.add(this.mesh);
        this.scale = 0.1;
        this.opacity = 0.5;
    }

    update(delta) {
        this.scale += delta * 5;
        this.opacity -= delta * 0.5;
        this.mesh.scale.set(this.scale, this.scale, 1);
        this.mesh.material.opacity = this.opacity;
        if (this.opacity <= 0) {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            return false;
        }
        return true;
    }
}

// Particle Burst Class with Object Pooling
class ParticleBurst {
    constructor(position, color) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = position.x;
            positions[i + 1] = position.y;
            positions[i + 2] = position.z;
            velocities[i] = (Math.random() - 0.5) * 2;
            velocities[i + 1] = (Math.random() - 0.5) * 2;
            velocities[i + 2] = (Math.random() - 0.5) * 2;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.velocities = velocities;
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.3,
            transparent: true,
            opacity: 1
        });
        this.points = new THREE.Points(geometry, material);
        scene.add(this.points);
        this.lifespan = 2;
        this.active = true;
    }

    update(delta) {
        if (!this.active) return false;
        this.lifespan -= delta;
        const positions = this.points.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += this.velocities[i] * delta;
            positions[i + 1] += this.velocities[i + 1] * delta;
            positions[i + 2] += this.velocities[i + 2] * delta;
        }
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.material.opacity = this.lifespan / 2;
        if (this.lifespan <= 0) {
            scene.remove(this.points);
            this.points.geometry.dispose();
            this.points.material.dispose();
            this.active = false;
            particlePool.push(this);
            return false;
        }
        return true;
    }

    reset(position, color) {
        const positions = this.points.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = position.x;
            positions[i + 1] = position.y;
            positions[i + 2] = position.z;
            this.velocities[i] = (Math.random() - 0.5) * 2;
            this.velocities[i + 1] = (Math.random() - 0.5) * 2;
            this.velocities[i + 2] = (Math.random() - 0.5) * 2;
        }
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.material.color.setHex(color);
        this.points.material.opacity = 1;
        this.lifespan = 2;
        this.active = true;
        scene.add(this.points);
    }
}

function createParticleBurst(position, color) {
    let burst = particlePool.find(b => !b.active);
    if (burst) {
        burst.reset(position, color);
        return burst;
    }
    return new ParticleBurst(position, color);
}

// Space Travel Effect with Flares
const starCount = 500;
const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 200;
    starPositions[i + 1] = (Math.random() - 0.5) * 200;
    starPositions[i + 2] = (Math.random() - 0.5) * 200;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0.8
});
const stars = new THREE.Points(starsGeometry, starMaterial);
scene.add(stars);

// Occasional Light Flare
function addLightFlare() {
    if (Math.random() < 0.01) { // 1% chance per frame
        const flareGeometry = new THREE.PlaneGeometry(5, 5);
        const flareMaterial = new THREE.MeshBasicMaterial({
            color: themes[themeSelect.value].gradientColors[Math.floor(Math.random() * 3)],
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        flare.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, -50);
        scene.add(flare);
        setTimeout(() => {
            scene.remove(flare);
            flare.geometry.dispose();
            flare.material.dispose();
        }, 1000);
    }
}

// Nebula Background
const nebulaGeometry = new THREE.SphereGeometry(100, 32, 32);
const nebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(themes[themeSelect.value].uiGlow) },
        color2: { value: new THREE.Color(0x1a1a2e) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
            float noise = fract(sin(dot(vUv.xy ,vec2(12.9898,78.233))) * 43758.5453 + time);
            vec3 color = mix(color1, color2, noise * 0.5);
            gl_FragColor = vec4(color, 0.2);
        }
    `,
    side: THREE.BackSide,
    transparent: true
});
const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
scene.add(nebula);

camera.position.z = 20;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
    if (gameOver || !gameStarted || paused || !mainMenu.classList.contains('hidden')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes.map(s => s.mesh));
    if (intersects.length > 0) {
        const shape = shapes.find(s => s.mesh === intersects[0].object);
        if (shape) {
            shape.burst();
            shapes.splice(shapes.indexOf(shape), 1);
        }
    }
}

window.addEventListener('click', onClick);
window.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    onClick(event);
});

function spawnShape() {
    if (gameOver || !gameStarted || paused) return;
    const isPowerUp = !powerUpSpawned && Math.random() < 0.06;
    const isBoss = level % 5 === 0 && Math.random() < 0.1 && !shapes.some(s => s.isBoss);
    if (isBoss) {
        const bossShape = new Shape();
        bossShape.isBoss = true;
        bossShape.size *= 2;
        bossShape.mesh.scale.setScalar(2);
        bossShape.hitsLeft = 3;
        shapes.push(bossShape);
    } else if (isPowerUp) {
        const shape = new Shape(true);
        shapes.push(shape);
        powerUpSpawned = true;
    } else {
        shapes.push(new Shape());
    }
}

function flashCenterObjective(message) {
    centerObjective.textContent = message;
    centerObjective.classList.remove('hidden');
    setTimeout(() => centerObjective.classList.add('hidden'), 2000);
}

function nextLevel() {
    level++;
    targetScore += 25;
    timeLeft = 30;
    powerUpSpawned = false;
    burstSequence = [];
    comboMultiplier = 1;
    comboCount = 0;
    comboDisplay.textContent = comboCount;
    levelDisplay.textContent = level;
    targetDisplay.textContent = targetScore;
    shapes.forEach(shape => {
        scene.remove(shape.mesh);
        shape.cleanup();
    });
    shapes.length = 0;
    targetShape = shapeObjectives[Math.floor(Math.random() * shapeObjectives.length)].shape;
    const message = shapeObjectives.find(o => o.shape === targetShape).message;
    flashCenterObjective(message);
    gameUi.classList.remove('glow');
}

if (!localStorage.getItem('tutorialShown')) {
    tutorialScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    applyTheme(themeSelect.value, tutorialScreen);
}

closeTutorial.addEventListener('click', () => {
    tutorialScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    localStorage.setItem('tutorialShown', 'true');
});

themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value, startScreen);
    applyTheme(themeSelect.value, gameUi);
    applyTheme(themeSelect.value, musicPlayer);
    applyTheme(themeSelect.value, gameOverScreen);
    applyTheme(themeSelect.value, tutorialScreen);
    nebulaMaterial.uniforms.color1.value.set(themes[themeSelect.value].uiGlow);
});

startButton.addEventListener('click', () => {
    gameStarted = true;
    startScreen.classList.add('hidden');
    gameUi.classList.remove('hidden');
    targetShape = shapeObjectives[Math.floor(Math.random() * shapeObjectives.length)].shape;
    const message = shapeObjectives.find(o => o.shape === targetShape).message;
    flashCenterObjective(message);
    applyTheme(themeSelect.value, gameUi);
    applyTheme(themeSelect.value, musicPlayer);
    const track = tracks[trackKeys[currentTrackIndex]];
    music.src = track.url;
    trackArt.src = track.art;
    trackName.textContent = track.name;
    trackSelect.value = trackKeys[currentTrackIndex];
    music.volume = volumeControl.value;
    if (musicToggle.checked) music.play();
    playPauseBtn.classList.remove('play');
    playPauseBtn.classList.add('pause');
    visualizer.classList.add('playing');
});

submitScoreBtn.addEventListener('click', () => {
    if (scoreSubmitted) return;
    let name = playerNameInput.value.trim();
    if (name.length < 1 || name.length > 10) name = 'Anonymous';
    leaderboard.push({ name, score });
    updateLeaderboard();
    scoreSubmitted = true;
    submitScoreBtn.disabled = true;
    playerNameInput.disabled = true;
});

clearLeaderboardBtn.addEventListener('click', () => {
    leaderboard = [];
    updateLeaderboard();
});

pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    if (paused) music.pause();
    else if (musicToggle.checked) music.play();
});

menuToggle.addEventListener('click', () => {
    paused = !paused;
    mainMenu.classList.toggle('hidden');
    if (!mainMenu.classList.contains('hidden')) {
        music.pause();
        applyTheme(themeSelect.value, mainMenu);
    } else if (gameStarted && !gameOver && musicToggle.checked) {
        music.play();
    }
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
});

closeMenu.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    paused = false;
    if (gameStarted && !gameOver && musicToggle.checked) music.play();
    pauseButton.textContent = 'Pause';
});

menuThemeSelect.addEventListener('change', () => {
    themeSelect.value = menuThemeSelect.value;
    applyTheme(menuThemeSelect.value, startScreen);
    applyTheme(menuThemeSelect.value, gameUi);
    applyTheme(menuThemeSelect.value, musicPlayer);
    applyTheme(menuThemeSelect.value, gameOverScreen);
    applyTheme(menuThemeSelect.value, tutorialScreen);
    applyTheme(menuThemeSelect.value, mainMenu);
    nebulaMaterial.uniforms.color1.value.set(themes[menuThemeSelect.value].uiGlow);
});

volumeControl.addEventListener('input', () => {
    music.volume = volumeControl.value;
});

musicToggle.addEventListener('change', () => {
    if (musicToggle.checked) {
        music.play();
        playPauseBtn.classList.remove('play');
        playPauseBtn.classList.add('pause');
        visualizer.classList.add('playing');
    } else {
        music.pause();
        playPauseBtn.classList.remove('pause');
        playPauseBtn.classList.add('play');
        visualizer.classList.remove('playing');
    }
});

let clock = new THREE.Clock();
let lastSpawn = 0;
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
    requestAnimationFrame(animate);
    if (paused) return;

    const elapsed = currentTime - lastFrameTime;
    if (elapsed < frameInterval) return;
    lastFrameTime = currentTime - (elapsed % frameInterval);

    const delta = clock.getDelta();

    if (gameStarted && !gameOver) {
        timeLeft -= delta;
        timerDisplay.textContent = Math.max(0, Math.round(timeLeft));
        lastSpawn += delta;
        const spawnInterval = Math.max(0.4, 1 - (level * 0.07) + (Math.sin(Date.now() * 0.001) * 0.2));
        if (lastSpawn >= spawnInterval) {
            spawnShape();
            lastSpawn = 0;
        }

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (!shapes[i].update(delta)) shapes.splice(i, 1);
        }

        constellationLines.forEach((l, i) => {
            if (!l.update(delta)) constellationLines.splice(i, 1);
        });

        if (timeLeft <= 10 && timeLeft > 0) gameUi.classList.add('glow');
        else gameUi.classList.remove('glow');

        if (timeLeft <= 0) {
            gameOver = true;
            gameOverScreen.classList.remove('hidden');
            finalScoreDisplay.textContent = score;
            updateLeaderboard();
            submitScoreBtn.disabled = false;
            playerNameInput.disabled = false;
            playerNameInput.value = '';
            scoreSubmitted = false;
            gameUi.classList.remove('glow');
            applyTheme(themeSelect.value, gameOverScreen);
            shapes.forEach(shape => {
                scene.remove(shape.mesh);
                shape.cleanup();
            });
            shapes.length = 0;
        } else if (score >= targetScore) {
            nextLevel();
        }
    }

    waves.forEach((w, i) => {
        if (!w.update(delta)) waves.splice(i, 1);
    });
    particleBursts.forEach((b, i) => {
        if (!b.update(delta)) particleBursts.splice(i, 1);
    });

    const starPos = stars.geometry.attributes.position.array;
    for (let i = 2; i < starPos.length; i += 3) {
        starPos[i] += delta * 10;
        if (starPos[i] > 100) starPos[i] = -100;
    }
    stars.geometry.attributes.position.needsUpdate = true;

    nebulaMaterial.uniforms.time.value += delta * 0.1;
    addLightFlare(); // Occasional flares

    composer.render();
}
animate(performance.now());

restartButton.addEventListener('click', () => {
    score = 0;
    level = 1;
    targetScore = 20;
    timeLeft = 30;
    gameOver = false;
    powerUpSpawned = false;
    scoreSubmitted = false;
    burstSequence = [];
    comboMultiplier = 1;
    comboCount = 0;
    comboDisplay.textContent = comboCount;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    targetDisplay.textContent = targetScore;
    timerDisplay.textContent = timeLeft;
    gameOverScreen.classList.add('hidden');
    shapes.forEach(shape => {
        scene.remove(shape.mesh);
        shape.cleanup();
    });
    shapes.length = 0;
    constellationLines.length = 0;
    submitScoreBtn.disabled = true;
    playerNameInput.disabled = true;
    targetShape = shapeObjectives[Math.floor(Math.random() * shapeObjectives.length)].shape;
    const message = shapeObjectives.find(o => o.shape === targetShape).message;
    flashCenterObjective(message);
    applyTheme(themeSelect.value, gameUi);
    applyTheme(themeSelect.value, musicPlayer);
    gameUi.classList.remove('glow');
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    adjustButtonSizes();
});

let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function updateLeaderboard() {
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    leaderboardList.innerHTML = leaderboard.map(entry => `<li>${entry.name}: ${entry.score}</li>`).join('');
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const themeKeys = Object.keys(themes);
const randomTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
themeSelect.value = randomTheme;
menuThemeSelect.value = randomTheme;
applyTheme(randomTheme, startScreen);
applyTheme(randomTheme, gameUi);
applyTheme(randomTheme, musicPlayer);
applyTheme(randomTheme, gameOverScreen);
applyTheme(randomTheme, tutorialScreen);
applyTheme(randomTheme, mainMenu);