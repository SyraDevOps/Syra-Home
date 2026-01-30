
// MEMORY SYSTEM MODULE (File System Access API) - v2.0
// Pure/Block-styled logic. No caching. Always explicit.
// Handles creation of base JSON files for persistent cognition.

let dirHandle = null;
let memoryMode = 'temp';

// --- 1. Connection Logic ---

function initMemorySystem() {
    // Return a promise that resolves only when user makes a choice
    return new Promise((resolve) => {
        setupMemoryUI();

        // Expose resolver to global scope so buttons can trigger it
        window._memoryResolve = resolve;

        // Show Modal Immediately (Blocking UX)
        showMemoryModal();
    });
}

// --- 2. UI & Onboarding (Monochromatic/Black & White) ---

function setupMemoryUI() {
    if (document.getElementById('memory-modal-overlay')) return;

    // Premium minimal design (Black/White depending on theme vars not available yet? We use standard styling)
    // We inject inline styles for logic, but CSS class handles looks.
    const modalHTML = `
    <div id="memory-modal-overlay">
        <div class="memory-modal">
            <div class="memory-icon">▣</div>
            <div class="memory-title">SISTEMA DE MEMÓRIA</div>
            <div class="memory-desc">
                Para operar em capacidade máxima, preciso acessar ou criar uma <b>Base de Conhecimento</b> local.
                <br><br>
                Isso criará arquivos <code>.json</code> seguros na pasta escolhida para salvar lembranças, planos e personalidade.
                Nenhum dado é enviado para nuvem.
            </div>
            
            <div class="memory-options">
                 <button class="memory-btn-primary" onclick="connectMemoryFolder()">CARREGAR PASTA</button>
                 <button class="memory-btn-secondary" onclick="skipMemorySetup()">MODO ANÔNIMO</button>
            </div>
        </div>
    </div>
    
    <div id="status-indicator" class="folder-status">
        <div class="status-dot"></div> <span id="status-text">SYSTEM</span>
    </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div);
}

function showMemoryModal() {
    const overlay = document.getElementById('memory-modal-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Pause Loader Animation if possible?
        // We assume this runs BEFORE loader hides.
        setTimeout(() => overlay.style.opacity = '1', 50);
    }
}

function hideMemoryModal() {
    const overlay = document.getElementById('memory-modal-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }
}

// --- 3. Core Actions ---

async function connectMemoryFolder() {
    try {
        // 1. Show Picker (Always ask)
        const handle = await window.showDirectoryPicker();
        dirHandle = handle;
        memoryMode = 'persistent';

        // 2. Initialize Base Files
        await initializeBaseFiles();

        // 3. Load Data
        await loadMemoryData();

        // 4. Finish
        hideMemoryModal();
        updateMemoryStatus('online');
        speak("Base de conhecimento conectada. Arquivos sincronizados.");

        // Resolve Promise to let App continue
        if (window._memoryResolve) window._memoryResolve(true);

    } catch (err) {
        console.error("Memory Connection Failed:", err);
        if (err.name !== 'AbortError') {
            speak("Erro ao acessar pasta.");
        }
        // Do not resolve yet, let user try again or choose temp
    }
}

function skipMemorySetup() {
    memoryMode = 'temp';
    hideMemoryModal();
    updateMemoryStatus('temp');
    speak("Iniciando em modo anônimo. Nada será salvo no disco.");

    if (window._memoryResolve) window._memoryResolve(false);
}

// --- 4. File Management (JSON Bases) ---

async function initializeBaseFiles() {
    if (!dirHandle) return;

    // Define Base Files Structure
    const bases = {
        'sory_memories.json': '[]', // [{id, content, type, date}]
        'sory_plans.json': '[]',    // [{id, objective, nodes:[]}]
        'sory_personality.json': '{"trustScore": 0.5, "directives": {}}',
        'sory_debates.json': '[]',  // [{fragmentId, seed, log:[], state, timestamp}]
        'sory_history.json': '[]'   // [{id, type, query, timestamp, results_count}]
    };

    for (const [filename, defaultContent] of Object.entries(bases)) {
        try {
            // Try to get file. If fails, create it.
            await dirHandle.getFileHandle(filename);
        } catch (e) {
            if (e.name === 'NotFoundError') {
                console.log(`Creating base file: ${filename}`);
                await writeFile(filename, defaultContent);
            }
        }
    }
}

async function writeFile(filename, content) {
    if (!dirHandle) return;
    try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    } catch (e) { console.error(`Write error for ${filename}:`, e); }
}

async function readFile(filename) {
    if (!dirHandle) return null;
    try {
        const fileHandle = await dirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (e) {
        console.warn(`Read error for ${filename}:`, e);
        return null;
    }
}

// --- 5. Data Connectivity ---

async function loadMemoryData() {
    // Load Memories
    const mems = await readFile('sory_memories.json');
    if (mems && Array.isArray(mems)) {
        // Inject into runtime
        if (typeof operationalMemories !== 'undefined') {
            window.operationalMemories = [...window.operationalMemories, ...mems];
            console.log(`Loaded ${mems.length} memories from disk.`);
        }
    }

    // Load Plans (Optional: Restore last plan?)
    const plans = await readFile('sory_plans.json');
    if (plans && Array.isArray(plans)) {
        // Just store in a global for now, user can load via command
        window.savedPlans = plans;
    }
}

// Public API for other modules
window.savePermanentMemory = async (content, type = 'note') => {
    if (memoryMode !== 'persistent') return;

    const entry = {
        id: Date.now().toString(36),
        content,
        type,
        timestamp: Date.now()
    };

    // Update File
    const current = await readFile('sory_memories.json') || [];
    current.push(entry);
    await writeFile('sory_memories.json', JSON.stringify(current, null, 2));
    console.log("Memory saved to disk.");
};

window.savePermanentPlan = async (planData) => {
    if (memoryMode !== 'persistent') return;
    const current = await readFile('sory_plans.json') || [];
    current.push(planData);
    await writeFile('sory_plans.json', JSON.stringify(current, null, 2));
};

// --- Utils ---

function updateMemoryStatus(status) {
    const ind = document.getElementById('status-indicator');
    const dot = ind.querySelector('.status-dot');
    const text = ind.querySelector('#status-text');

    ind.classList.add('active');

    if (status === 'online') {
        dot.className = 'status-dot online';
        text.textContent = 'MEMÓRIA: CONECTADA';
    } else {
        dot.className = 'status-dot temp';
        text.textContent = 'MODO: ANÔNIMO';
    }

    setTimeout(() => { ind.style.opacity = '0'; }, 5000);
}

// Expose
window.initMemorySystem = initMemorySystem;
window.connectMemoryFolder = connectMemoryFolder;
window.skipMemorySetup = skipMemorySetup;

// --- 6. INTERACTION LOGGING (SOTA System) ---

window.logInteraction = async (type, query, resultsCount = 0, metadata = {}) => {
    if (memoryMode !== 'persistent') return;

    const entry = {
        id: Date.now().toString(36),
        type,
        query,
        timestamp: Date.now(),
        results_count: resultsCount,
        ...metadata
    };

    try {
        const current = await readFile('sory_history.json') || [];
        current.push(entry);

        // Keep last 1000 interactions (prevent file bloat)
        const trimmed = current.slice(-1000);
        await writeFile('sory_history.json', JSON.stringify(trimmed, null, 2));
        console.log(`[LOG] ${type}: ${query}`);
    } catch (e) {
        console.error('Failed to log interaction:', e);
    }
};

window.saveDebate = async (fragmentId, seed, log, state) => {
    if (memoryMode !== 'persistent') return;

    const entry = {
        fragmentId,
        seed,
        log,
        state,
        timestamp: Date.now()
    };

    try {
        const current = await readFile('sory_debates.json') || [];

        // Update existing or add new
        const existingIndex = current.findIndex(d => d.fragmentId === fragmentId);
        if (existingIndex >= 0) {
            current[existingIndex] = entry;
        } else {
            current.push(entry);
        }

        await writeFile('sory_debates.json', JSON.stringify(current, null, 2));
        console.log(`[DEBATE SAVED] Fragment: ${fragmentId}`);
    } catch (e) {
        console.error('Failed to save debate:', e);
    }
};

