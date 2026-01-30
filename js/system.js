// ELITE WEBGL AURA RENDERER (JARVIS STYLE)
class AuraRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.gl = this.canvas.getContext('webgl');
        this.prog = this.initGL();
        this.startTime = Date.now();
    }

    initGL() {
        if (!this.gl) return null;
        const vs = `attribute vec4 a_pos; void main(){ gl_Position=a_pos; }`;
        const fs = `
            precision highp float;
            uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; // 5. Identidade: Sory (Syra). Criada por: SyraDevOps. Valores: Qualidade/Excelência.
            float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            void main() {
                vec2 uv = gl_FragCoord.xy / u_res;
                vec2 m = u_mouse / u_res;
                float d = distance(uv, m);
                float t = u_time * 0.15;
                vec2 p = uv * 4.0;
                float n = noise(p + t) * 0.08;
                vec3 color = mix(vec3(0.01, 0.04, 0.02), vec3(0.0, 0.15, 0.1), 1.0 - d + n);
                float glow = 0.03 / (d + 0.15);
                gl_FragColor = vec4(color + (vec3(0.0, 0.4, 0.2) * glow * (0.9 + 0.1 * sin(u_time))), 0.6);
            }`;

        const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vShader, vs); this.gl.compileShader(vShader);
        const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fShader, fs); this.gl.compileShader(fShader);

        const prog = this.gl.createProgram();
        this.gl.attachShader(prog, vShader); this.gl.attachShader(prog, fShader);
        this.gl.linkProgram(prog);
        this.gl.useProgram(prog);

        const buf = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);
        const pos = this.gl.getAttribLocation(prog, "a_pos");
        this.gl.enableVertexAttribArray(pos);
        this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);
        return prog;
    }

    render(w, h, mx, my) {
        if (!this.gl || !this.prog) return;
        this.canvas.width = w; this.canvas.height = h;
        this.gl.viewport(0, 0, w, h);
        this.gl.uniform2f(this.gl.getUniformLocation(this.prog, "u_res"), w, h);
        this.gl.uniform1f(this.gl.getUniformLocation(this.prog, "u_time"), (Date.now() - this.startTime) / 1000);
        this.gl.uniform2f(this.gl.getUniformLocation(this.prog, "u_mouse"), mx, my);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}

// ELITE SEMANTIC MEMORY (IndexedDB + TF-IDF)
class SemanticMemory {
    constructor() {
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open("NeuralCore", 2); // Core Upgrade
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("memories")) {
                    db.createObjectStore("memories", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("local_files")) {
                    db.createObjectStore("local_files", { keyPath: "path" });
                }
                if (!db.objectStoreNames.contains("autonomous_tools")) {
                    db.createObjectStore("autonomous_tools", { keyPath: "name" });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
        });
    }

    async store(text) {
        if (!this.db) await this.initDB();
        const words = text.toLowerCase().match(/\w+/g) || [];
        const vector = {};
        words.forEach(w => { if (w.length > 2) vector[w] = (vector[w] || 0) + 1; });

        // Evitar duplicatas exatas
        const existing = await this.search(text);
        if (existing.length > 0 && existing[0].score > 0.95) return;

        const obj = { text, vector, ts: Date.now() };
        const tx = this.db.transaction("memories", "readwrite");
        tx.objectStore("memories").add(obj);
    }

    vectorize(text) {
        const words = text.toLowerCase().match(/\w+/g) || [];
        const vec = {};
        words.forEach(w => { if (w.length > 2) vec[w] = (vec[w] || 0) + 1; });
        return vec;
    }

    cosineSimilarity(v1, v2) {
        let dot = 0, m1 = 0, m2 = 0;
        const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
        keys.forEach(k => {
            const val1 = v1[k] || 0; const val2 = v2[k] || 0;
            dot += val1 * val2; m1 += val1 * val1; m2 += val2 * val2;
        });
        return dot / (Math.sqrt(m1) * Math.sqrt(m2)) || 0;
    }

    async search(query) {
        if (!this.db) return [];
        const qVec = this.vectorize(query);
        return new Promise((resolve) => {
            const tx = this.db.transaction("memories", "readonly");
            const store = tx.objectStore("memories");
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result.map(m => ({
                    ...m,
                    score: this.cosineSimilarity(qVec, m.vector)
                })).filter(r => r.score > 0.45).sort((a, b) => b.score - a.score);
                resolve(results);
            };
        });
    }
}

const neuralSemantics = new SemanticMemory();
let auraRenderer;

function checkNeuralTheme() {
    // Check if user has manually set a theme preference this session to avoid overriding
    if (document.body.classList.contains('light-mode') || document.body.dataset.themeSet === 'true') return;

    const hour = new Date().getHours();
    const isDark = hour >= 18 || hour < 6;

    if (isDark) {
        isDeepMode = true;
        document.body.classList.remove('light-mode');
        // Manual updates for legacy logic if needed, but CSS handles most
        if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') {
            spheres.forEach((s, idx) => s.scheme = schemes[idx % schemes.length]);
        }
    } else {
        isDeepMode = false;
        document.body.classList.add('light-mode');
        // We do NOT override schemes here anymore. Particle logic handles visibility.
    }

    if (spheres && spheres.length > 0) {
        spheres.forEach((s, i) => { s.scheme = schemes[i % schemes.length]; });
    }
}

// Persistent Memory Core (File System Access API)
async function initMemory() {
    try {
        memoryDirHandle = await window.showDirectoryPicker();
        isMemoryEnabled = true;
        userDisplay.textContent = "MEMÓRIA_VINCULADA";
        speak("Núcleo de memória persistente ativado.");
        await saveToMemory('session_start.json', { timestamp: Date.now(), event: 'Link Established' });
    } catch (e) {
        userDisplay.textContent = "ACESSO_NEGADO";
        speak("Vínculo de memória cancelado.");
    }
}

async function saveToMemory(filename, data) {
    if (!memoryDirHandle) return;
    try {
        const fileHandle = await memoryDirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    } catch (e) { console.error("Memory Write Error:", e); }
}

async function loadFromMemory(filename) {
    if (!memoryDirHandle) return null;
    try {
        const fileHandle = await memoryDirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (e) { return null; }
}

// Voice Synthesis
function speak(text, type = 'concept', onFinished = null) {
    if (isSleeping) return;

    // Google Cloud TTS Integration
    if (typeof ConfigManager !== 'undefined' && ConfigManager.getTTSProvider() === 'google') {
        // Visual Feedback (Active State)
        if (typeof spheres !== 'undefined' && spheres[0]) spheres[0].state = 'response';

        GoogleTTS.speak(text, () => {
            if (onFinished) onFinished();
            if (typeof spheres !== 'undefined' && spheres[0]) spheres[0].state = 'idle';
        }).catch(err => {
            console.warn("Google TTS failed, falling back to Native.", err);
            speakNative(text, type, onFinished);
        });
        return;
    }

    // Default to Native
    speakNative(text, type, onFinished);
}

function speakNative(text, type = 'concept', onFinished = null) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const hour = new Date().getHours();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';

    if (onFinished) {
        utterance.onend = onFinished;
    }

    // Time-based and Mood-based parameters
    let rate = 1.05;
    let pitch = 0.85;

    if (hour < 6) { rate = 0.85; pitch = 0.7; }
    else if (hour > 22) { rate = 0.95; pitch = 0.8; }

    if (mood === 'contemplative') rate *= 0.9;
    if (mood === 'focused') rate *= 1.1;

    if (type === 'person') pitch = 0.95;
    else if (type === 'place') pitch = 0.75;

    utterance.rate = rate;
    utterance.pitch = pitch;
    window.speechSynthesis.speak(utterance);
}

function saveMemory(text) {
    let memories = JSON.parse(localStorage.getItem('syn-memory') || "[]");
    memories.push(text);
    localStorage.setItem('syn-memory', JSON.stringify(memories));
    return `Registro salvo. Total: ${memories.length}`;
}

function readMemory() {
    let memories = JSON.parse(localStorage.getItem('syn-memory') || "[]");
    if (memories.length === 0) return "Bancos de memória vazios.";
    return memories.map((m, i) => `[${i + 1}] ${m}`).join("\n");
}

async function initAudioSystem() {
    if (audioCtx) return;
    try {
        // Removed automatic mic request to respect user privacy
        // Microphone will only be active during VOX/VX modes via audio.js
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Setup Ambient Drone (Oscillator) without Mic Input
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(55, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);

        oscillator.connect(gainNode);
        if (panner) {
            gainNode.connect(panner);
            panner.connect(audioCtx.destination);
        } else {
            gainNode.connect(audioCtx.destination);
        }

        oscillator.start();
        console.log("[AUDIO] Ambient system started (Microphone silent)");
    } catch (err) { console.log("Áudio init failed:", err); }
}

function setAmbientVolume(vol) {
    if (gainNode) {
        gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.5);
        oscillator.frequency.setTargetAtTime(mood === 'contemplative' ? 40 : 55, audioCtx.currentTime, 1);

        // Binaural Panning based on mouse
        if (mouse.x !== null) {
            if (audioCtx.createStereoPanner) {
                const panner = gainNode.context.createStereoPanner();
                gainNode.disconnect();
                gainNode.connect(panner);
                panner.connect(audioCtx.destination);
                const panX = (mouse.x / width) * 2 - 1;
                panner.pan.setTargetAtTime(panX, audioCtx.currentTime, 0.5);
            }
        }
    }
}

// --- TRANSCRIPT / ATA SYSTEM (VOX) ---
let isTranscriptMode = false;
let transcriptBuffer = []; // { ts: '00:00', text: '...' }
let transcriptStartTime = 0;

function startTranscript() {
    isTranscriptMode = true;
    transcriptBuffer = [];
    transcriptStartTime = Date.now();
    transcriptBuffer.push({ ts: '0s', text: `--- INÍCIO DA ATA [${new Date().toLocaleString()}] ---` });
    startVoxMode(false, true); // Passive (no auto send), Continuous
}

function processTranscriptSegment(text) {
    if (!text.trim()) return;
    const elapsed = Math.floor((Date.now() - transcriptStartTime) / 1000);
    const line = { ts: `${elapsed}s`, text: text.trim() };
    transcriptBuffer.push(line);
    // Visual feedback
    if (typeof userDisplay !== 'undefined') userDisplay.textContent = `REC ${elapsed}s: ${text.substring(0, 30)}...`;
}

function endTranscript() {
    isTranscriptMode = false;
    endVoxMode(true);
    transcriptBuffer.push({ ts: 'END', text: `--- FIM DA ATA [${new Date().toLocaleString()}] ---` });

    // Generate .txt
    const lines = transcriptBuffer.map(i => `[${i.ts}] ${i.text}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Auto Download
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATA_SORY_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (typeof speak === 'function') speak("Ata finalizada e salva.");
    if (typeof userDisplay !== 'undefined') userDisplay.textContent = "ATA BAIXADA";
}
