let canvas;
let ctx;

let width = window.innerWidth;
let height = window.innerHeight;
let particles = [];
let spheres = [];
const maxSpheres = 5;

// High-Performance Configuration (Elite Performance optimized)
const particleCountPerSphere = 65; // Total ~325 particles (Safe for all PCs)
const sphereRadius = 120;
const interactionRadius = 180;
let cognitiveMode = 'economy'; // economy, standard, deep


let mouse = { x: null, y: null };
let rotationX = 0;
let rotationY = 0;
let isSending = false;
let isVoxMode = false;
let isSystemLoaded = false;
let openSystem = false;
let isPromptingDownload = false;
let transcriptionSegments = []; // Array of {time: string, text: string}
let recognition = null;
let voxStartTime = 0;

// DOM Elements (defined here but might be available/null depending on execution order if not careful. 
// Since script is at end of body, these should be fine)
const voxDisplay = document.getElementById('vox-display');
const voxPrompt = document.getElementById('vox-prompt');
// Note: userDisplay and hiddenInput are defined later in original file, but we should probably define them here to be consistent global refs.
// Original file Lines 1162: const hiddenInput...
// Moving them here for global accessibility.
const hiddenInput = document.getElementById('hidden-input');
const userDisplay = document.getElementById('user-display');
const statusElement = document.getElementById('status'); // Renamed from 'status' to avoid conflict with window.status if any, though original used 'status'. Keeping 'status' might be risky in global scope, but keeping original variable name 'status' is safer to minimize breakage if used elsewhere.
// Original used 'const status = ...', let's stick to it or use window.statusElement if needed. 
// Actually, 'status' is a deprecated property on window. 'const status' in global scope might throw or shadow it. 
// In a module it's fine. In a script tag, it's global. 
// However, the original code had it at line 1164: `const status = document.getElementById('status');` which was likely fine as it shadowed window.status? 
// No, `const` in global scope (script tag) does not create property on window object but sits in the declarative environment record. It should be fine.
const statusDiv = document.getElementById('status');


let radioPlayer = null;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let audioCtx, oscillator, gainNode;

// State & Memory
let userName = localStorage.getItem('syn-user') || 'Operador';
let mood = 'stable'; // stable, contemplative, focused, protective, observing
let lastInteractionTime = Date.now();
let errorSequence = 0;
let isDeepMode = false;
let isSleeping = false;
let commandHistory = [];
let commandStats = { wiki: 0, clima: 0, radio: 0, util: 0 };
let lastCommandTime = 0;
let isSynchronized = false;
let systemLoad = 0;
let ripples = []; // {x, y, r, alpha}
let peer = null;
let remoteSpheres = []; // Stores {id, x, y, state} from peers
let peerConn = null;
let myPeerId = null;
let macros = JSON.parse(localStorage.getItem('syn-macros') || "{}");
let weatherStats = { temp: 20, wind: 5 };
let vibrationAmount = 0;
let isOfflineMode = false;
let memoryDirHandle = null;
let isMemoryEnabled = false;

// Plan Mode State
let isPlanMode = false;
let planNodes = []; // {x, y, raw, short}
let planGoal = "";
let planCamY = 0; // Added from animate loop variable

// Audio Analysis globals
let analyser, dataArray, audioSource, audioLevel = 0;

// Color Schemes
let schemes = [ // Changed to let in case it's reassigned, though original was const schemes but manually assigned indices later (lines 228 etc). Wait, original was `const schemes` but line 228 `schemes[0] = ...`. You can mutate contents of const array.
    { r: 0, g: 180, b: 0 },   // Green (Center)
    { r: 0, g: 100, b: 255 }, // Blue
    { r: 180, g: 0, b: 255 }, // Purple
    { r: 255, g: 100, b: 0 }, // Orange
    { r: 0, g: 200, b: 200 }  // Cyan
];

const deviceNames = ["Aura", "Nebula", "Vector", "Pulse", "Core", "Flux", "Nexus", "Vertex", "Prism", "Nova"];

// IoT & Vox vars
let silenceTimer = null;
let vxAutoSend = false;
const nodeHost = "http://localhost:8000";
let awaitingNodeDomain = false; // from line 1478

// Gallery & Focus State
let currentGallery = { images: [], index: 0, active: false };
let animeModeActive = false;

// Cognitive Mesh (Malha Cognitiva)
let cognitiveFragments = JSON.parse(localStorage.getItem('syn-fragments') || "[]");
let operationalMemories = JSON.parse(localStorage.getItem('syn-memories') || "[]"); // { id, content, expiresAt, sourceId }
let isMeshActive = false;
let meshHoverId = null; // ID of fragment being hovered

// Frontier Features State
let isDreaming = false;
let dreamTimer = null;
let isMemoryLinked = false;
let localTools = JSON.parse(localStorage.getItem('syn-tools') || "{}");
let swarmPeers = [];
let peerId = null;

// Critical Thinking Mode
let isCriticalThinkingMode = false;
let criticalTimer = null;

