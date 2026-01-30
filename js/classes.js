class Sphere {
    constructor(id, scheme) {
        this.id = id;
        this.scheme = scheme;
        this.isForming = false;
        this.state = 'idle'; // idle, listening, thinking, processing, error, response
        this.role = id === 0 ? 'core' : 'sensor';
        this.contextType = 'concept'; // person, place, concept

        const names = ["Syn", "NEX", "AXIS", "VOLT", "ECHO"];
        this.deviceName = names[id] || `Unit-${id}`; // Default names, overridden by IoT Sync
        this.function = ["Core", "Percebe", "Decide", "Age", "Aprende"][id] || "Process";
        this.labelOpacity = 0;
        this.labelPos = { x: 0, y: 150 }; // Drifting labels

        this.xOffset = 0;
        this.yOffset = 0;
        this.zOffset = id * -30;
        this.dynamicScale = 1;
        this.breathing = 0;

        this.particles = [];
        for (let i = 0; i < particleCountPerSphere; i++) {
            const p = new Particle(this);
            this.particles.push(p);
            particles.push(p);
        }

        // Initial formation handled by runSystemChecks
        this.isForming = false;
    }

    updateLayout(count, textLength) {
        if (isSleeping) {
            this.dynamicScale *= 0.99;
            this.breathing *= 0.9;
            return;
        }

        const idleTime = (Date.now() - lastInteractionTime) / 1000;
        if (idleTime > 60 && mood !== 'observing' && mood !== 'contemplative') mood = 'observing';
        if (idleTime > 180 && mood !== 'contemplative') mood = 'contemplative';

        let breathingSpeed = this.role === 'core' ? 0.0015 : 0.001;
        let breathingAmp = this.role === 'core' ? 0.03 : 0.015;

        if (isSynchronized) {
            breathingSpeed = 0.002;
            breathingAmp = 0.04;
        } else if (this.state === 'thinking') {
            breathingSpeed = 0.004;
            breathingAmp = 0.08;
        } else {
            if (mood === 'contemplative') { breathingSpeed *= 0.5; breathingAmp *= 0.5; }
            if (mood === 'observing') { breathingSpeed *= 0.7; breathingAmp *= 0.6; }
            if (mood === 'focused') { breathingSpeed *= 1.5; breathingAmp *= 0.8; }
        }

        this.breathing = (Math.sin(Date.now() * breathingSpeed) * breathingAmp) + (audioLevel * 0.0005);

        let targetX = 0, targetY = 0, targetZ = 0;

        if (this.state === 'plan_mode') {
            // Plan Mode: Align to right side to clear space for text/plan
            targetX = width * 0.4; // Relative to center (0), so 0.4 * width (right side) effectively
            // Note: xOffset is added to center (width/2).
            // Actually Spheres use target positions differently in modular vs monolith? 
            // In modular snippet (lines 63+), it uses targetX relative to center?
            // "const centerX = width / 2 + this.xOffset;" in drawHalo suggests xOffset is offset from center.
            // So width * 0.4 would be near right edge.

            targetX = width * 0.35; // Slight right
            targetY = -height * 0.3 + (this.id * 80);
            targetZ = 0;
            this.dynamicScale = 0.6;
        } else if (this.id === 0) {
            targetY = -height * 0.15;
        } else {
            // ORBIT THE CENTRAL SPHERE (ID 0)
            const angle = ((this.id - 1) * (Math.PI / 2.5)) + (Date.now() * 0.0004);
            const orbitRadiusX = width * 0.15; // Closer orbit
            const orbitRadiusY = height * 0.1;

            // Center is Sphere 0's position relative to screen center
            const centerX = spheres[0].xOffset;
            const centerY = spheres[0].yOffset - (height * 0.15); // Adjust for id 0's offset in logic if needed, but relative diff is safer
            // Actually, id 0's targetY is -height*0.15. so we follow that + offsets.
            // But spheres[0].xOffset is the current position offset.

            targetX = spheres[0].xOffset + Math.cos(angle) * orbitRadiusX;
            targetY = spheres[0].yOffset + Math.sin(angle) * orbitRadiusY;
        }

        this.xOffset += (targetX - this.xOffset) * 0.05;
        this.yOffset += (targetY - this.yOffset) * 0.05;
        this.zOffset += (targetZ - this.zOffset) * 0.05;

        // Dynamic Specialization (Hierarquia Dinâmica)
        let baseScale = 1;
        if (this.state !== 'plan_mode') {
            if (this.id === 2) baseScale += Math.min(commandStats.wiki * 0.05, 0.4);
            if (this.id === 1) baseScale += Math.min(commandStats.clima * 0.1, 0.3);
            this.dynamicScale += (baseScale - this.dynamicScale) * 0.02;
        }

        // Vibration injection
        if (vibrationAmount > 0.1) {
            this.xOffset += (Math.random() - 0.5) * vibrationAmount;
            this.yOffset += (Math.random() - 0.5) * vibrationAmount;
        }
    }

    drawHalo() {
        if (!this.isForming) return;
        const centerX = width / 2 + this.xOffset;
        const centerY = height / 2 + this.yOffset;
        // Audio-reactive expansion
        const radius = sphereRadius * (this.dynamicScale + this.breathing + (audioLevel * 0.005)) * 1.8;

        let haloColor;
        switch (this.state) {
            case 'listening': haloColor = '0, 180, 255'; break;
            case 'thinking': haloColor = '255, 255, 255'; break; // White pulse for thinking
            case 'processing': haloColor = '180, 0, 255'; break;
            case 'error': haloColor = '255, 50, 50'; break; // Softer red
            case 'response':
                if (this.contextType === 'person') haloColor = '255, 150, 0';
                else if (this.contextType === 'place') haloColor = '0, 255, 150';
                else haloColor = '150, 255, 255';
                break;
            default:
                if (mood === 'protective') haloColor = '255, 200, 200';
                else haloColor = `${this.scheme.r}, ${this.scheme.g}, ${this.scheme.b}`;
        }

        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        let alpha = (this.state === 'idle') ? 0.05 : 0.15 + Math.sin(Date.now() * 0.005) * 0.05;
        if (this.state === 'thinking') alpha = 0.2 + Math.sin(Date.now() * 0.004) * 0.1;

        grad.addColorStop(0, `rgba(${haloColor}, ${alpha})`);
        grad.addColorStop(1, `rgba(${haloColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(sphere) {
        this.sphere = sphere;
        this.init();
    }

    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = 0;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2 + 1;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const finalSphereRadius = sphereRadius;
        this.sphereX = finalSphereRadius * Math.sin(phi) * Math.cos(theta);
        this.sphereY = finalSphereRadius * Math.sin(phi) * Math.sin(theta);
        this.sphereZ = finalSphereRadius * Math.cos(phi);

        this.color = { r: 0, g: 0, b: 0, a: 0.6 };
    }

    update() {
        if (!this.sphere.isForming) {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        } else {
            let x = this.sphereX;
            let y = this.sphereY;
            let z = this.sphereZ;

            let cosY = Math.cos(rotationY);
            let sinY = Math.sin(rotationY);
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;

            let cosX = Math.cos(rotationX);
            let sinX = Math.sin(rotationX);
            let y2 = y * cosX - z1 * sinX;
            let z2 = y * sinX + z1 * cosX;

            // Smooth transition to sphere with dynamic target positions
            let dissipation = (spheres[0].state === 'response') ? 4 : 1;
            let targetX = width / 2 + (x1 * (this.sphere.dynamicScale + this.sphere.breathing) * dissipation) + this.sphere.xOffset;
            let targetY = height / 2 + (y2 * (this.sphere.dynamicScale + this.sphere.breathing) * dissipation) + this.sphere.yOffset;
            let finalZ = z2 + this.sphere.zOffset;

            // Ripple Influence
            ripples.forEach(r => {
                const dx = this.x - r.x;
                const dy = this.y - r.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = Math.max(0, (r.radius - dist) / r.radius) * r.alpha * 10;
                targetX += (dx / dist) * force;
                targetY += (dy / dist) * force;
            });

            // Weather Wind Drift (X-Axis)
            targetX += (Math.sin(Date.now() * 0.001) * weatherStats.wind * 0.5);

            // Depth-aware speed
            const speedMult = 0.05 + systemLoad * 0.1;
            this.x += (targetX - this.x) * speedMult;
            this.y += (targetY - this.y) * speedMult;
            this.z = finalZ;

            const normalizedZ = (z2 + sphereRadius) / (sphereRadius * 2);
            this.color.a = 0.4 + (normalizedZ * (0.6 + (audioLevel * 0.001)));

            if (isVoxMode) {
                const isRingParticle = (this.sphere.id === 0 && particles.indexOf(this) % 4 === 0);
                if (isRingParticle) {
                    const ringRadius = 40 + (audioLevel * 0.1);
                    const angle = (particles.indexOf(this) / 40) * Math.PI * 2;
                    targetX = width - 100 + Math.cos(angle + (rotationY * 2)) * ringRadius;
                    targetY = 100 + Math.sin(angle + (rotationY * 2)) * ringRadius;
                    finalZ = 0;
                    this.color.g = 255; this.color.r = 255; this.color.b = 255; this.color.a = 0.9;
                } else {
                    const sideX = (this.sphereX > 0) ? width * 0.9 : width * 0.1;
                    const sideY = (this.sphereY > 0) ? height * 0.9 : height * 0.1;
                    targetX = sideX + (Math.sin(this.sphereX) * 50);
                    targetY = sideY + (Math.cos(this.sphereY) * 50);
                    this.color.a *= 0.2;
                }
            }
            else if (this.sphere.state === 'thinking') {
                // Thinking logic: tighter orbits
                const t = Date.now() * 0.002;
                targetX += Math.sin(t + this.sphere.id) * 30;
                targetY += Math.cos(t + this.sphere.id) * 30;
            } else if (this.sphere.id === 0 && !isSending) {
                const textLength = hiddenInput.value.length;
                if (textLength > 5) {
                    const scatterFactor = Math.min((textLength - 5) * 5, 250);
                    targetX += (Math.sin(this.sphereX + textLength) * scatterFactor);
                    targetY += (Math.cos(this.sphereY + textLength) * scatterFactor);
                }
            }

            this.x += (targetX - this.x) * speedMult;
            this.y += (targetY - this.y) * speedMult;
            this.z = finalZ;

            if (isSending && this.sphere.id === 0) {
                this.color.r = 255; this.color.g = 0; this.color.b = 0;
            } else if (isVoxMode && this.sphere.id === 0) {
                this.color.r = 0; this.color.g = 150; this.color.b = 255;
            } else {
                // LIGHT MODE CONTRAST LOGIC
                if (document.body.classList.contains('light-mode')) {
                    // In light mode, mix of original color and black
                    if (this.sphere.id % 2 === 0 && particles.indexOf(this) % 8 === 0) {
                        // Some pure black particles for style
                        this.color.r = 0; this.color.g = 0; this.color.b = 0;
                        this.color.a = Math.min(this.color.a + 0.2, 0.8); // Darker alpha
                    } else {
                        // Original color but slightly darker/blended for visibility on white
                        this.color.r = Math.floor(normalizedZ * this.sphere.scheme.r);
                        this.color.g = Math.floor(normalizedZ * this.sphere.scheme.g);
                        this.color.b = Math.floor(normalizedZ * this.sphere.scheme.b);
                        // Optional: if it's too bright (like Cyan/Yellow), darken it
                        if (this.color.r > 200 && this.color.g > 200) { this.color.r -= 50; this.color.g -= 50; }
                    }
                } else {
                    // Dark Mode (Standard Neon)
                    this.color.r = Math.floor(normalizedZ * this.sphere.scheme.r);
                    this.color.g = Math.floor(normalizedZ * this.sphere.scheme.g);
                    this.color.b = Math.floor(normalizedZ * this.sphere.scheme.b);
                }
            }
        }
    }

    draw() {
        const perspective = 600;
        const scale = perspective / (perspective - this.z);
        const baseSize = this.size;

        // Optimized Draw (Removed expensive Gaussian Blur)
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, baseSize * scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        ctx.fill();
    }
}
