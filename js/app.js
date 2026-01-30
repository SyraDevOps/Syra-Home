// Main Initialization and Animation Loop

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Event listeners moved to init function


function drawDeviceLabel(sphere) {
    const centerX = width / 2 + sphere.xOffset;
    const centerY = height / 2 + sphere.yOffset;

    // Random drifting labels
    sphere.labelPos.x += (Math.sin(Date.now() * 0.001 + sphere.id) * 0.2);
    sphere.labelPos.y += (Math.cos(Date.now() * 0.001 + sphere.id) * 0.2);

    const dist = Math.sqrt((mouse.x - centerX) ** 2 + (mouse.y - centerY) ** 2);
    if (dist < 100 && !isVoxMode) {
        ctx.font = '300 12px Inter';
        // Contrast Check
        ctx.fillStyle = (typeof isDeepMode !== 'undefined' && isDeepMode) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = "3px";
        ctx.fillText(sphere.deviceName.toUpperCase(), centerX + sphere.labelPos.x, centerY + sphere.labelPos.y);
    }
}

function animate() {
    if (auraRenderer) auraRenderer.render(width, height, mouse.x, mouse.y); // Render Aura Background

    if (isPlanMode) {
        // Holographic Blueprint Design - using CSS variables for theme correctness
        const computedStyle = getComputedStyle(document.body);
        const planBg = computedStyle.getPropertyValue('--plan-bg').trim();
        const planLine = computedStyle.getPropertyValue('--plan-line').trim();
        const planNode = computedStyle.getPropertyValue('--plan-node').trim();
        const planText = computedStyle.getPropertyValue('--plan-text').trim();
        const accent = computedStyle.getPropertyValue('--accent').trim();

        ctx.fillStyle = planBg;
        ctx.fillRect(0, 0, width, height);

        // Subtle Grid
        ctx.strokeStyle = planLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = 0; gx < width; gx += 40) { ctx.moveTo(gx, 0); ctx.lineTo(gx, height); }
        for (let gy = 0; gy < height; gy += 40) { ctx.moveTo(0, gy); ctx.lineTo(width, gy); }
        ctx.stroke();

        // Auto-Scroll Camera Logic
        const lastNode = planNodes[planNodes.length - 1];
        let targetCamY = 0;
        if (planNodes.length > 0) {
            targetCamY = -lastNode.y + (height * 0.5);
        }

        if (!window.planCamY) window.planCamY = 0;

        if (window.targetWheelY !== undefined) {
            window.planCamY += (window.targetWheelY - window.planCamY) * 0.1;
            if (Math.abs(window.planCamY - window.targetWheelY) < 1) window.targetWheelY = undefined;
        } else {
            window.planCamY += (targetCamY - window.planCamY) * 0.1;
        }

        ctx.save();
        ctx.translate(0, window.planCamY);

        // Draw connecting lines
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = planLine; // Dynamic variable line color
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = planLine;

        if (planNodes.length > 1) {
            planNodes.forEach(node => {
                if (node.parents && node.parents.length > 0) {
                    node.parents.forEach(pid => {
                        const parent = planNodes.find(p => p.id === pid);
                        if (parent) {
                            const midY = (parent.y + node.y) / 2;
                            ctx.moveTo(parent.x, parent.y);
                            ctx.bezierCurveTo(parent.x, midY, node.x, midY, node.x, node.y);
                        }
                    });
                }
            });
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for text/other elements if needed

        // Draw nodes
        planNodes.forEach((node, i) => {
            const isLast = i === planNodes.length - 1;

            // Holo Node (Interactive Sphere)
            ctx.beginPath();
            const r = isLast ? 18 : 12; // Increased size to fit text inside
            ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

            // Selection Highlight
            if (node.selected) {
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = 25;
                ctx.shadowColor = "#ffffff";
            } else {
                ctx.fillStyle = isLast ? accent : planNode; // Use variable accent vs node
                ctx.shadowBlur = isLast ? 20 : 10;
                ctx.shadowColor = accent;
            }

            ctx.fill();

            if (node.selected) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = accent;
                ctx.stroke();
            }

            ctx.shadowBlur = 0;

            // Draw Title Beside Node
            const textX = node.x + r + 10;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            // Main Label (Short)
            ctx.fillStyle = planText;  // Dynamic text color
            ctx.font = isLast ? "700 12px 'Outfit'" : "500 10px 'Inter'";
            ctx.fillText(node.short, textX, node.y - 5);

            // Sub Label (Raw Snippet)
            if (isLast) {
                // Dimmed sub-label, manual alpha calc or use var if defined. 
                // We'll use planText with globalAlpha for simplicity to ensure it matches theme
                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = planText;
                ctx.font = "300 9px Inter";
                ctx.fillText(node.raw.substring(0, 30) + "...", textX, node.y + 8);
                ctx.restore();
            }
        });

        ctx.restore();

    } else {
        // Dynamic Background from CSS Variable
        const computedStyle = getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg').trim();

        if (document.body.classList.contains('light-mode')) {
            ctx.fillStyle = bgColor || '#ffffff';
            ctx.fillRect(0, 0, width, height);
        } else {
            // Deep Mode / Dark Mode Gradient
            const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
            grad.addColorStop(0, '#121212');
            grad.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // Update Ripples
    if (!isPlanMode) {
        ripples.forEach((r, i) => {
            r.radius += 10;
            r.alpha *= 0.95;
            if (r.alpha < 0.01) ripples.splice(i, 1);
        });
    }

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0; for (let i = 0; i < 60; i++) sum += dataArray[i];
        audioLevel = sum / 60;
    }
    rotationX += 0.005; rotationY += 0.007;
    const currentTextLength = hiddenInput.value.length;
    spheres.forEach(s => s.updateLayout(spheres.length, currentTextLength));

    if (vibrationAmount > 0) vibrationAmount *= 0.92;

    // Parallax Display Effect
    if (voxDisplay.innerHTML !== "") {
        const offX = (mouse.x - width / 2) * 0.02;
        const offY = (mouse.y - height / 2) * 0.02;
        voxDisplay.style.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px))`;
    }

    if (spheres[0].state === 'response' || spheres[0].state === 'processing') {
        ctx.beginPath(); ctx.lineWidth = 0.5; ctx.strokeStyle = `rgba(0, 180, 0, ${0.1 + (audioLevel * 0.002)})`;
        const coreX = width / 2 + spheres[0].xOffset; const coreY = height / 2 + spheres[0].yOffset;
        spheres.slice(1).forEach(s => { ctx.moveTo(coreX, coreY); ctx.lineTo(width / 2 + s.xOffset, height / 2 + s.yOffset); });
        ctx.stroke();
    }

    spheres.forEach(s => s.drawHalo());

    // Neural Graph Connections
    if (typeof drawMeshConnections === 'function') drawMeshConnections();

    // Dreaming Idle Check
    const idleTime = Date.now() - lastInteractionTime;
    if (idleTime > 5 * 60 * 1000 && !isDreaming && !isVoxMode && typeof startDreamCycle === 'function') {
        startDreamCycle();
    }

    // Render Remote Spheres (Swarm Ghost Nodes)
    if (typeof remoteSpheres !== 'undefined' && remoteSpheres.length > 0) {
        ctx.save();
        remoteSpheres.forEach(rs => {
            // Smooth Interpolation (Lerp)
            if (rs.targetX !== undefined) {
                rs.xOffset = (rs.xOffset || 0) + (rs.targetX - (rs.xOffset || 0)) * 0.1;
                rs.yOffset = (rs.yOffset || 0) + (rs.targetY - (rs.yOffset || 0)) * 0.1;
            }

            const rsX = width / 2 + (rs.xOffset || 0);
            const rsY = height / 2 + (rs.yOffset || 0);

            // Dynamic Ghost Effect
            ctx.beginPath();
            // Pulse radius slightly
            ctx.arc(rsX, rsY, 120 + (Math.sin(Date.now() * 0.005) * 5), 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)"; // Cyan for Swarm
            ctx.setLineDash([2, 5]); // Dashed "data" look
            ctx.stroke();

            // Inner Core
            ctx.beginPath();
            ctx.arc(rsX, rsY, 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
            ctx.fill();

            // Label
            ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
            ctx.font = "300 9px Inter";
            ctx.textAlign = "center";
            ctx.fillText(rs.role ? rs.role.toUpperCase() : "SWARM_NODE", rsX, rsY + 140);
        });
        ctx.restore();
    }

    // Rendering Optim: Single loop particles
    let i = particles.length;
    while (i--) {
        particles[i].update();
        particles[i].draw();
    }

    spheres.forEach(s => drawDeviceLabel(s));
    requestAnimationFrame(animate);
}

// Initialize all 5 spheres at once
// System Status Checks (Loading Screen)
async function runSystemChecks() {
    isSystemLoaded = false;
    const loader = document.getElementById('loader-overlay');
    const text = document.getElementById('loader-text');

    if (loader) loader.classList.remove('hidden');

    // Simulate/Real checks with visual feedback
    const checks = [
        { name: "NEURAL_CORE", action: () => new Promise(r => setTimeout(r, 600)) },
        { name: "AUDIO_SYNTH", action: () => new Promise(r => setTimeout(r, 400)) },
        { name: "API_GATEWAY", action: () => new Promise(r => setTimeout(r, 500)) },
        { name: "IOT_BRIDGE", action: () => new Promise(r => setTimeout(r, 400)) }
    ];

    for (const check of checks) {
        if (text) text.textContent = `${check.name}... CHECK`;
        await check.action();
    }

    if (text) text.textContent = "SYSTEM READY";
    speak("Sistema online.", "system");

    // Finalize Load
    setTimeout(() => {
        isSystemLoaded = true;

        // Blur out loader
        if (loader) loader.classList.add('hidden');
        if (text) text.textContent = "";

        // Trigger sphere formation
        if (spheres && spheres.length > 0) {
            spheres.forEach((s, i) => {
                setTimeout(() => s.isForming = true, i * 200); // Staggered formation
            });
        }
    }, 800);
}

// Initialize Application (Safe Start)
function init() {
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');

    // Aura Renderer Initialization
    if (typeof AuraRenderer === 'function') {
        auraRenderer = new AuraRenderer('background-aura');
    }

    // Initial Resize
    resize();

    // Event Listeners
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    // Initialize all 5 spheres at once
    while (spheres.length < 5) {
        spheres.push(new Sphere(spheres.length, schemes[spheres.length % schemes.length]));
    }

    // Start Systems
    if (typeof checkNeuralTheme === 'function') checkNeuralTheme();
    if (typeof checkNeuralTheme === 'function') setInterval(checkNeuralTheme, 60000); // Check every minute

    runSystemChecks();

    if (typeof syraBridgeLoop === 'function') syraBridgeLoop();
    if (typeof syncIoTNodes === 'function') {
        // syncIoTNodes(); // Silenced to prevent 'No nodes' log spam
        setInterval(syncIoTNodes, 30000); // Sync labels every 30s
    }

    if (typeof startProactiveLoop === 'function') startProactiveLoop();
    if (typeof initMemorySystem === 'function') initMemorySystem();

    // Load API configuration
    if (typeof loadAPIConfig === 'function') {
        loadAPIConfig().then(() => {
            console.log('[INIT] API configuration loaded');
        }).catch(err => {
            console.error('[INIT] Failed to load API config:', err);
        });
    }

    animate();
}

// Wait for DOM
window.addEventListener('DOMContentLoaded', init);
