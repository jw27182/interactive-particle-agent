const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status');

let width, height;
let particles = [];
let handData = [];
const PARTICLE_COUNT = 800;
const MAX_DISTANCE = 150;
const FORCE = 0.5;
const FRICTION = 0.95;

// Particle Class
class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2 + 1;
        this.baseColor = { h: 180 + Math.random() * 60, s: 100, l: 50 };
        this.color = `hsla(${this.baseColor.h}, ${this.baseColor.s}%, ${this.baseColor.l}%, 0.8)`;
    }

    update() {
        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Interaction with hands
        handData.forEach(hand => {
            const hx = hand.index.x * width;
            const hy = hand.index.y * height;
            
            const dx = hx - this.x;
            const dy = hy - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAX_DISTANCE) {
                const angle = Math.atan2(dy, dx);
                const force = (MAX_DISTANCE - dist) / MAX_DISTANCE;
                
                if (hand.is_pinching) {
                    // Repel / Explode if pinching
                    this.vx -= Math.cos(angle) * force * 15;
                    this.vy -= Math.sin(angle) * force * 15;
                    this.color = `hsla(0, 100%, 50%, 0.8)`; // Turn red
                } else {
                    // Attract
                    this.vx += Math.cos(angle) * force * FORCE;
                    this.vy += Math.sin(angle) * force * FORCE;
                    this.color = `hsla(${this.baseColor.h}, ${this.baseColor.s}%, ${this.baseColor.l}%, 0.8)`;
                }
            }
        });

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > width) { this.x = width; this.vx *= -1; }
        if (this.y < 0) { this.y = 0; this.vy *= -1; }
        if (this.y > height) { this.y = height; this.vy *= -1; }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

window.addEventListener('resize', resize);
resize();

// WebSocket Setup
let socket;
function connectWS() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        statusDisplay.textContent = 'Status: Connected to Backend';
        statusDisplay.style.color = '#00ff88';
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handData = data.hands;
    };

    socket.onclose = () => {
        statusDisplay.textContent = 'Status: Disconnected. Retrying...';
        statusDisplay.style.color = '#ff4444';
        setTimeout(connectWS, 2000);
    };

    socket.onerror = (err) => {
        console.error('WS Error:', err);
    };
}

connectWS();

function animate() {
    // Semi-transparent background for trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw lines between particles that are close (optional, but looks cool)
    // Removed for performance with high particle counts

    // Draw hand indicators (debugging/visual)
    handData.forEach(hand => {
        const hx = hand.index.x * width;
        const hy = hand.index.y * height;
        
        ctx.strokeStyle = hand.is_pinching ? '#ff0000' : '#00f2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, 10, 0, Math.PI * 2);
        ctx.stroke();

        if (hand.is_pinching) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fill();
        }
    });

    requestAnimationFrame(animate);
}

animate();
