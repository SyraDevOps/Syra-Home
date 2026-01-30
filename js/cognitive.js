// Cognitive Mesh Functions
function injectFragment(content) {
    // Limit to 5 seeds
    if (cognitiveFragments.length >= 5) {
        speak("Limite da malha atingido. Processe os fragmentos existentes.");
        userDisplay.textContent = "⚠️ MÁXIMO 5 SEMENTES";
        setTimeout(() => userDisplay.textContent = "", 3000);
        return;
    }

    const id = Date.now().toString(36);

    // Smart Layout Initialization: Use Golden Angle / Spiral to prevent overlap
    const count = cognitiveFragments.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const radius = 50 * Math.sqrt(count);
    const x = (window.innerWidth / 2) + Math.cos(count * goldenAngle) * radius;
    const y = (window.innerHeight / 2) + Math.sin(count * goldenAngle) * radius;

    const fragment = {
        id,
        content,
        state: 'raw', // raw, processing, synthesized
        debateLog: [`[ORIGIN]: ${content}`],
        x, y,
        connections: [] // IDs of connected fragments
    };

    cognitiveFragments.push(fragment);
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

    speak("Fragmento integrado. Procedendo com a análise estrutural.");
    if (!isMeshActive) toggleMeshView();
    else renderMeshView();
}

// COGNITIVE DECAY: Limit debateLog size
function applyDebateLogDecay() {
    const MAX_LOG_ENTRIES = 20; // Prevent bloat

    cognitiveFragments.forEach(f => {
        if (f.debateLog && f.debateLog.length > MAX_LOG_ENTRIES) {
            // Keep first (origin) and last N entries
            const origin = f.debateLog[0];
            const recent = f.debateLog.slice(-MAX_LOG_ENTRIES + 1);
            f.debateLog = [origin, ...recent];
        }
    });

    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
}

// FRAGMENT COMPRESSION: Synthesize old fragments
function compressOldFragments() {
    const now = Date.now();
    const COMPRESSION_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

    cognitiveFragments.forEach(f => {
        const fragmentAge = now - parseInt(f.id, 36);

        if (fragmentAge > COMPRESSION_AGE && f.debateLog && f.debateLog.length > 5) {
            // Synthesize debate into summary
            const summary = `[COMPRESSED ${f.debateLog.length} entries]: ${f.content}`;
            f.debateLog = [summary];
            f.state = 'compressed';
        }
    });

    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
    console.log('[COGNITIVE] Fragment compression complete');
}

// COGNITIVE SNAPSHOT: Save critical state
let cognitiveSnapshot = null;

function createCognitiveSnapshot() {
    cognitiveSnapshot = {
        timestamp: Date.now(),
        fragmentCount: cognitiveFragments.length,
        memoryCount: operationalMemories.length,
        trustScore: userTrustScore || 0.5,
        criticalFragments: cognitiveFragments
            .filter(f => f.state === 'synthesized' || f.connections.length > 2)
            .map(f => ({ id: f.id, content: f.content, state: f.state }))
    };

    localStorage.setItem('syn-cognitive-snapshot', JSON.stringify(cognitiveSnapshot));
    console.log(`[COGNITIVE] Snapshot created: ${cognitiveSnapshot.criticalFragments.length} critical fragments`);
}

function restoreFromSnapshot() {
    const snapshot = JSON.parse(localStorage.getItem('syn-cognitive-snapshot') || 'null');
    if (!snapshot) return false;

    console.log(`[COGNITIVE] Snapshot available from ${new Date(snapshot.timestamp).toLocaleString()}`);
    return snapshot;
}

// Periodic maintenance (every 10 minutes)
setInterval(() => {
    applyDebateLogDecay();
    if (cognitiveFragments.length > 20) {
        compressOldFragments();
    }
    createCognitiveSnapshot();
}, 600000);

// Physics & Rendering
let meshPhysicsInterval = null;

function renderMeshView() {
    const container = document.querySelector('.mesh-container');
    if (!container) return;
    container.innerHTML = ''; // Clear current

    // Use CSS Flex for simple vertical list layout
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-start';
    container.style.justifyContent = 'flex-start';
    container.style.padding = '50px 20px';
    container.style.gap = '15px';
    container.style.overflowY = 'auto'; // allow scroll if many ideas

    cognitiveFragments.forEach((f, index) => {
        const item = document.createElement('div');
        item.className = 'mesh-item';
        item.id = `mesh-node-${f.id}`;

        // Static styling for list view
        item.style.position = 'relative'; // Reset from absolute
        item.style.transform = 'none';
        item.style.width = '300px'; // Fixed width for list items
        item.style.background = 'rgba(0,0,0,0.6)';
        item.style.border = '1px solid var(--accent)';
        item.style.padding = '10px';
        item.style.borderRadius = '5px';
        item.style.cursor = 'pointer';

        // State modifiers
        if (f.state === 'processing') item.style.boxShadow = '0 0 15px #9d00ff';
        if (f.state === 'synthesized') item.style.boxShadow = '0 0 15px #00ffea';

        // Content preview
        const lastLog = f.debateLog[f.debateLog.length - 1];
        const shortLog = lastLog.length > 80 ? lastLog.substring(0, 80) + "..." : lastLog;

        item.innerHTML = `<div class="mesh-tooltip" style="position:static; opacity:1; visibility:visible; background:transparent; font-size: 0.9em; pointer-events:none;">${shortLog}</div>`;

        item.onclick = () => showFragmentDetails(f.id);
        container.appendChild(item);
    });

    // Disable physics in this mode since we use CSS layout
    if (meshPhysicsInterval) clearInterval(meshPhysicsInterval);
}

function startMeshPhysics() {
    // Disabled for vertical list mode as per user request
    if (meshPhysicsInterval) clearInterval(meshPhysicsInterval);
}

async function processFragment(id) {
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (!fragment) {
        speak("Fragmento não encontrado na malha.");
        return;
    }

    fragment.state = 'processing';
    userDisplay.textContent = "PROCESSANDO DADOS...";
    const prompt = `Analise este fragmento e gere uma perspectiva (Sory/SyraDevOps): "${fragment.content}". Máximo 2 frases.`;

    try {
        const perspective = await getGeminiInsight(prompt); // Reusing synthesize for generic concise generation
        fragment.debateLog.push(`[SORY]: ${perspective}`);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

        speak("Analisando variáveis.");
        showFragmentDetails(id); // Show the modal/details
        // No renderMeshView() here needed if physics loop handles positions, but state color might change
        const icon = document.getElementById(`mesh-node-${id}`);
        if (icon) icon.style.borderColor = '#9d00ff';
    } catch (e) {
        speak("Erro ao processar.");
    }
}

async function synthesizeFragment(id) {
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (!fragment) return;

    userDisplay.textContent = "CRISTALIZANDO...";
    const prompt = `Crie uma Regra Operacional curta baseada nisso: ${fragment.debateLog.join("\n")}.`;

    try {
        const bias = await getGeminiInsight(prompt);
        fragment.state = 'synthesized';

        const memory = {
            id: Date.now().toString(),
            content: bias,
            sourceId: id,
            expiresAt: Date.now() + (1000 * 60 * 60) // 1 hour influence
        };
        operationalMemories.push(memory);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        localStorage.setItem('syn-memories', JSON.stringify(operationalMemories)); // Persist memories

        speak("Memória operacional criada.");
        fragment.debateLog.push(`[SINTESE]: ${bias}`); // Add to log for visibility
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

        showFragmentDetails(id);
        const icon = document.getElementById(`mesh-node-${id}`);
        if (icon) { icon.style.borderColor = '#00ffea'; icon.style.boxShadow = '0 0 10px #00ffea'; }
    } catch (e) {
        speak("Erro na síntese.");
    }
}

// --- CRITICAL THINKING MODE AUTOMATION (JARDIM DE IDEIAS PIPELINE v5) ---
async function processCriticalThought() {
    // 1. Pick a random fragment or memory (THE SEED)
    let target = null;
    let type = 'fragment';

    if (cognitiveFragments.length > 0 && Math.random() > 0.5) {
        target = cognitiveFragments[Math.floor(Math.random() * cognitiveFragments.length)];
    } else if (operationalMemories.length > 0) {
        target = operationalMemories[Math.floor(Math.random() * operationalMemories.length)];
        type = 'memory';
        if (!target.debateLog) target.debateLog = [`[MEMORY]: ${target.content}`];
    }

    if (!target) return; // Silent exit if empty

    const content = target.content || target.text;

    // LATÊNCIA PROPOSITADA (Thinking Simulation) 300-800ms
    const latency = Math.floor(Math.random() * 501 + 300);
    spheres[0].state = 'processing';
    await new Promise(r => setTimeout(r, latency));

    try {
        // STAGE 0: SEED VISUAL
        voxDisplay.innerHTML = `
            <div id="garden-pipeline" style="animation: fadeUp 1s ease; border-left: 2px solid #555; padding-left: 15px;">
                <span style="color:var(--text); opacity:0.5; font-size:0.6em; letter-spacing:2px;">GARDEN_PIPELINE // SEED</span><br>
                <div style="font-size:0.9rem; margin-top:5px; color: rgba(255,255,255,0.7); font-style:italic;">"${content.substring(0, 40)}..."</div>
            </div>`;

        // STAGE 1: DÚVIDA (Como isso pode estar errado?)
        const doubtPrompt = `Analise: "${content}". Gere uma DÚVIDA interna (pergunta curta) sobre a validade. Max 10 palavras.`;
        const doubt = await getGeminiInsight(doubtPrompt);

        const pipelineDiv = document.getElementById('garden-pipeline');
        if (pipelineDiv) {
            pipelineDiv.innerHTML += `
                <div style="margin-top: 15px; animation: fadeUp 1s ease;">
                    <span style="color:#ffcc00; font-size:0.6em; letter-spacing:2px;">>> DÚVIDA</span><br>
                    <div style="color: var(--text); font-weight: 300;">"${doubt}"</div>
                </div>`;
        }

        // TENSÃO / PAUSA (2-4s randomized)
        await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));

        // STAGE 2: ANTÍTESE (Como alguém atacaria?)
        const critiquePrompt = `Contra "${content}", gere ANTÍTESE direta e afiada. Max 15 palavras.`;
        const critique = await getGeminiInsight(critiquePrompt);

        if (pipelineDiv) {
            pipelineDiv.innerHTML += `
                <div style="margin-top: 10px; border-left: 2px solid #ff4444; padding-left: 10px; animation: fadeUp 1s ease;">
                    <span style="color:#ff4444; font-size:0.6em; letter-spacing:2px;">>> ANTÍTESE</span><br>
                    <div style="color: var(--text); font-weight: 400;">"${critique}"</div>
                </div>`;
        }

        // Log Tese vs Antitese
        if (type === 'fragment' && target.debateLog) {
            target.debateLog.push(`[DÚVIDA]: ${doubt}`);
            target.debateLog.push(`[ANTÍTESE]: ${critique}`);
            localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        }

        // PAUSA LONGA (Absorvendo o golpe) 4s
        await new Promise(r => setTimeout(r, 4000));

        // STAGE 3: SÍNTESE PARCIAL (Sem conclusão forçada)
        const synthPrompt = `Tese: "${content}". Crítica: "${critique}". Gere SÍNTESE PARCIAL. Aceite ambiguidade. Seja humilde. Max 15 palavras.`;
        const synthesis = await getGeminiInsight(synthPrompt);

        if (pipelineDiv) {
            pipelineDiv.innerHTML += `
                <div style="margin-top: 15px; border-left: 2px solid #00ffea; padding-left: 10px; animation: fadeUp 1.5s ease;">
                    <span style="color:#00ffea; font-size:0.6em; letter-spacing:2px;">>> SÍNTESE (AMBIGUIDADE)</span><br>
                    <div style="color: var(--text); font-weight: 300;">"${synthesis}"</div>
                </div>`;
        }

        // Log Final
        if (type === 'fragment' && target.debateLog) {
            target.debateLog.push(`[SÍNTESE]: ${synthesis}`);
            localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        }

        // STAGE 4: SILÊNCIO (Integration, no clearance)
        spheres[0].state = 'idle';

    } catch (e) {
        spheres[0].state = 'idle';
    }
}

function deleteFragment(id) {
    cognitiveFragments = cognitiveFragments.filter(f => f.id !== id);
    operationalMemories = operationalMemories.filter(m => m.sourceId !== id);
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
    localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
    speak("Fragmento removido da malha operacional.");
    const icon = document.getElementById(`mesh-node-${id}`);
    if (icon) icon.remove();
    closeMeshModal();
}

function saveFragmentToCore(id) {
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (fragment) {
        // Mock "Long Term" save
        fragment.state = 'core'; // Mark as permanent
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        speak("Este entendimento foi gravado nos anais do núcleo.");
        if (isMeshActive) renderMeshView();
    }
}

// UI Functions for Mesh
// UI Functions for Mesh
// Malha é inicializada permanentemente
setTimeout(() => {
    isMeshActive = true;
    const container = document.querySelector('.mesh-container') || createMeshContainer();
    container.classList.add('active'); // Sempre ativo
    renderMeshView();
}, 500);

// Mantemos a função para o comando, mas agora ela age como um toggle REAL de visibilidade
function toggleMeshView() {
    const container = document.querySelector('.mesh-container');
    if (!container) return;

    // Toggle active class defined in CSS (display: flex)
    const isNowActive = container.classList.toggle('active');
    isMeshActive = isNowActive;

    if (isNowActive) {
        renderMeshView();
        speak("Exibindo malha.");
    } else {
        speak("Ocultando malha.");
    }
}

function closeMeshModal() {
    const modal = document.querySelector('.mesh-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    // CRITICAL FIX: Reset State
    spheres[0].state = 'idle';
    isSynchronized = false;

    // Limpar apenas se for mensagem de sistema ("Processando..."), não se o usuário estiver digitando
    if (userDisplay.textContent.includes("PROCESSANDO") || userDisplay.textContent.includes("CRISTALIZANDO")) {
        userDisplay.textContent = "";
    }

    // RETURN FOCUS TO INPUT
    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) hiddenInput.focus();
}

function createMeshContainer() {
    const div = document.createElement('div');
    div.className = 'mesh-container';
    // Styles are handled in CSS for elegance and theme support
    document.body.appendChild(div);
    return div;
}

function renderMeshView() {
    const container = document.querySelector('.mesh-container');
    if (!container) return;
    container.innerHTML = ''; // Clear current

    // If empty, show a subtle guide
    if (cognitiveFragments.length === 0) {
        // No visual clutter for empty state, maybe just a small pulse or nothing
        return;
    }

    cognitiveFragments.forEach((f, index) => {
        const item = document.createElement('div');
        item.className = 'mesh-item';
        item.id = `mesh-node-${f.id}`;

        // State modifiers for simple color tweaks if needed, 
        // but keeping it white/blue as requested primarily.
        // We can add classes for state
        if (f.state === 'processing') item.classList.add('state-processing');
        if (f.state === 'synthesized') item.classList.add('state-synthesized');

        // Tooltip Content - MINIMALIST SINGLE LINE
        const lastLog = f.debateLog[f.debateLog.length - 1] || f.content;
        const shortLog = lastLog.length > 40 ? lastLog.substring(0, 40) + "..." : lastLog;

        // Structure: #ID | Content
        item.innerHTML = `
            <div class="mesh-tooltip">
                <span class="tooltip-id">#${f.id.toUpperCase()}</span>
                <span class="tooltip-sep">|</span>
                <span class="tooltip-content">${shortLog}</span>
            </div>
        `;

        item.onclick = (e) => {
            e.stopPropagation(); // prevent closing if we click the dot
            showFragmentDetails(f.id);
        };

        container.appendChild(item);

        // Entrance animation
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 50);
    });

    if (meshPhysicsInterval) clearInterval(meshPhysicsInterval);
}

// User Input in Modal
window.userSubmitDebate = function (id) {
    const inp = document.getElementById('debate-input');
    if (!inp || !inp.value.trim()) return;
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (fragment) {
        fragment.debateLog.push(`[USER]: ${inp.value.trim()}`);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        showFragmentDetails(id); // Refresh
    }
};

function showFragmentDetails(id) {
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (!fragment) return;

    let modal = document.querySelector('.mesh-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'mesh-modal';
        document.body.appendChild(modal);
    }

    // Determine state class
    let stateClass = 'state-raw';
    let stateLabel = 'BRUTO';
    if (fragment.state === 'processing') { stateClass = 'state-processing'; stateLabel = 'PROCESSANDO'; }
    if (fragment.state === 'synthesized') { stateClass = 'state-synthesized'; stateLabel = 'SINTETIZADO'; }
    if (fragment.state === 'core') { stateClass = 'state-core'; stateLabel = 'CRISTALIZADO'; }

    // Clean inline styles so CSS takes over completely
    modal.style.cssText = '';
    modal.className = `mesh-modal ${stateClass} active`;

    modal.innerHTML = `
        <div class="mesh-modal-header">
            <div class="mesh-modal-title">
                <span class="mesh-badge ${stateClass}"></span>
                <div>
                    <div class="mesh-modal-subtitle">${stateLabel}</div>
                    <div class="mesh-modal-id">FRAGMENTO #${id.toUpperCase()}</div>
                </div>
            </div>
            <button class="mesh-modal-close-btn" onclick="closeMeshModal()">×</button>
        </div>

        <div class="mesh-content-box ${stateClass}">
            <div class="mesh-label">CONTEÚDO ORIGINAL</div>
            <div class="mesh-text">"${fragment.content}"</div>
        </div>

        <div class="mesh-log-container">
            <div class="mesh-label">HISTÓRICO DE DEBATE (${fragment.debateLog.length} ENTRADAS)</div>
            <div class="mesh-log-scroll">
                ${fragment.debateLog.map((l, i) => {
        let typeClass = 'log-generic';
        let logLabel = 'LOG';
        if (l.startsWith('[ORIGIN]')) { typeClass = 'log-origin'; logLabel = 'SEMENTE'; }
        else if (l.startsWith('[SORY]')) { typeClass = 'log-ai'; logLabel = 'SORY'; }
        else if (l.startsWith('[USER]')) { typeClass = 'log-user'; logLabel = 'USUÁRIO'; }
        else if (l.startsWith('[SYNTHESIS]')) { typeClass = 'log-synthesis'; logLabel = 'SÍNTESE'; }

        return `<div class="mesh-log-item ${typeClass}">
                        <div class="mesh-log-label ${typeClass}">${logLabel}</div>
                        <div class="mesh-log-content">${l}</div>
                    </div>`;
    }).join('')}
            </div>
        </div>

        <div class="mesh-input-area">
            <input id="debate-input" type="text" placeholder="Adicionar argumento ou pergunta..." 
                onkeydown="event.stopPropagation(); if(event.key === 'Enter') window.userSubmitDebate('${id}')"
                class="mesh-input">
            <button onclick="window.userSubmitDebate('${id}')" class="mesh-send-btn">ENVIAR</button>
        </div>

        <div class="mesh-actions">
            <button onclick="processFragment('${id}')" class="mesh-action-btn action-debate">DEBATER</button>
            <button onclick="synthesizeFragment('${id}')" class="mesh-action-btn action-synthesize">SINTETIZAR</button>
            <button onclick="saveFragmentToCore('${id}')" class="mesh-action-btn action-crystallize">CRISTALIZAR</button>
            <button onclick="deleteFragment('${id}')" class="mesh-action-btn action-delete">APAGAR</button>
        </div>
    `;
    modal.style.display = 'block'; // Ensure visibility
}



// Memory Cleanup Logic
setInterval(() => {
    const now = Date.now();
    const initialLen = operationalMemories.length;
    operationalMemories = operationalMemories.filter(m => m.expiresAt > now);
    if (operationalMemories.length < initialLen) {
        localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
    }
}, 300000); // Check every 5 minutes

// Cognitive logic continued...
function detectIntent(text) {
    const val = text.toLowerCase();
    if (val.startsWith('porque') || val.startsWith('por que')) return 'analytical';
    if (val.startsWith('como')) return 'instructional';
    if (val.startsWith('quem')) return 'historical';
    if (val.startsWith('o que')) return 'conceptual';
    return 'general';
}

function perceive() {
    spheres[0].state = 'listening';
    vibrationAmount = 6;
    userDisplay.textContent = "";
}

function getThinkTime(input, type) {
    let base = 1200;
    base += input.length * 20;
    if (type === 'wiki') base += 800;
    if (type === 'calc') base += 300;
    if (type === 'gemini') base += 1500;
    if (mood === 'contemplative') base *= 1.4;
    if (mood === 'focused') base *= 0.8;
    return Math.min(base, 4500); // Max cap
}

function deliver() {
    spheres[0].state = 'response';
    isSynchronized = true;
    vibrationAmount = 15;
    ripples.push({ x: width / 2, y: height / 2, radius: 10, alpha: 1 });
    lastInteractionTime = Date.now();
}

// --- SISTEMAS DE FRONTEIRA SORY (COGNITIVE OS) ---

// DUCKDUCKGO INTEGRATION
// DUCKDUCKGO INTEGRATION (Async Rendering)
async function searchDuckDuckGo(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "PESQUISANDO REDE...";
    try {
        const targetUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1&skip_disambig=1`;
        // Use CORS Proxy
        const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(url);
        const data = await res.json(); // Direct JSON from proxy

        let summary = data.AbstractText || "";
        let links = [];

        if (data.RelatedTopics) {
            links = data.RelatedTopics.slice(0, 3).filter(t => t.FirstURL).map(t => ({
                title: t.Text ? (t.Text.length > 50 ? t.Text.substring(0, 50) + '...' : t.Text) : "Link",
                url: t.FirstURL
            }));
        }

        // --- FALLBACK TO WIKI IF EMPTY ---
        if (!summary && links.length === 0) {
            console.log("DDG Empty, falling back to Wiki");
            if (typeof searchWiki === 'function') {
                const wikiRes = await searchWiki(query);
                if (wikiRes) {
                    // Render using Wiki Result
                    voxDisplay.innerHTML = `
                        <div style="padding:25px; animation:fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; text-align:left; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(0,0,0,0.05);">
                            <span style="color:var(--accent); font-size:0.6rem; letter-spacing:3px; font-weight:700;">WIKIPEDIA // FALLBACK</span>
                            <div style="font-size:1.5rem; margin-top:10px; color:var(--accent); font-weight:700;">${wikiRes.title.toUpperCase()}</div>
                            <p style="font-size:1.1rem; margin-top:10px; color:var(--text); line-height:1.5; opacity:0.9; font-weight:300;">${wikiRes.extract}</p>
                            <div style="margin-top:20px; font-size:0.7rem; opacity:0.6;">${wikiRes.description || ''}</div>
                        </div>`;
                    speak(`Informação recuperada: ${wikiRes.extract.substring(0, 100)}...`);
                    spheres[0].state = 'response';
                    isSynchronized = true;
                    setTimeout(() => { spheres[0].state = 'idle'; isSynchronized = false; }, 25000);
                    return;
                }
            }
            summary = "Nenhuma resposta instantânea localizada.";
        }

        // --- RENDER IMMEDIATE RESULTS (Blocking AI prevention) ---
        spheres[0].state = 'response';
        isSynchronized = true;

        const linkHtml = links.length > 0 ?
            `<div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">${links.map(l => `<a href="${l.url}" target="_blank" style="font-size:0.5rem; padding:6px 12px; border:1px solid var(--accent); color:var(--text); text-decoration:none; border-radius:4px; background:rgba(0,180,0,0.05); transition:all 0.3s;" onmouseover="this.style.background='rgba(0,180,0,0.1)'" onmouseout="this.style.background='rgba(0,180,0,0.05)'">${l.title.toUpperCase()}</a>`).join('')}</div>` : "";

        // Placeholder for AI suggestions
        const suggestionId = `ai-suggestions-${Date.now()}`;
        const suggestionHtml = `<div id="${suggestionId}" style="margin-top:20px; text-align:left; border-top:1px solid rgba(0,0,0,0.1); padding-top:15px; opacity:0.5;">
            <div style="font-size:0.5rem; letter-spacing:3px; margin-bottom:12px; font-weight:700;">AGUARDANDO ANÁLISE NEURAL...</div>
        </div>`;

        voxDisplay.innerHTML = `
            <div style="padding:25px; animation:fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; text-align:left; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(0,0,0,0.05);">
                <span style="color:var(--accent); font-size:0.6rem; letter-spacing:3px; font-weight:700;">NETWORK_SEARCH // DUCKDUCKGO</span>
                <p style="font-size:1.2rem; margin-top:10px; color:var(--text); line-height:1.4; opacity:0.9; font-weight:300;">${summary}</p>
                ${linkHtml}
                ${suggestionHtml}
            </div>`;

        speak(`Resultados básicos obtidos. Processando insights.`);

        // --- ASYNC AI ENRICHMENT ---
        // Do not await this block so UI stays responsive
        (async () => {
            try {
                const prompt = `Como Sory, analise o resultado do DuckDuckGo para "${query}": "${summary}". Sugira 3 tópicos estratégicos de aprofundamento. Retorne apenas JSON: ["sugestão 1", "sugestão 2", "sugestão 3"]`;
                const aiSuggestionsRaw = await getGeminiInsight(prompt);
                let aiSuggestions = [];
                try {
                    const cleanJson = aiSuggestionsRaw.replace(/```json|```/g, '').trim();
                    aiSuggestions = JSON.parse(cleanJson);
                } catch (e) { aiSuggestions = ["Explorar variáveis", "Analisar histórico", "Correlacionar dados"]; }

                const finalHtml = `<div style="font-size:0.5rem; letter-spacing:3px; opacity:0.4; margin-bottom:12px; font-weight:700;">SUGESTÕES_SORY //</div>
                ${aiSuggestions.map(s => `<div style="font-size:0.9rem; margin-bottom:8px; padding-left:12px; border-left:2px solid var(--accent); color:var(--text); font-weight:300;">• ${s}</div>`).join('')}`;

                const el = document.getElementById(suggestionId);
                if (el) {
                    el.style.opacity = '1';
                    el.innerHTML = finalHtml;
                    // Optional: speak("Insights gerados.");
                }
            } catch (e) { console.warn("AI Insight fail", e); }
        })();

        setTimeout(() => {
            spheres[0].state = 'idle';
            isSynchronized = false;
        }, 18000);

    } catch (err) {
        console.error(err);

        // --- FALLBACK IN CATCH ---
        if (typeof searchWiki === 'function') {
            const wikiRes = await searchWiki(query);
            if (wikiRes) {
                voxDisplay.innerHTML = `
                    <div style="padding:25px; animation:fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; text-align:left; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(0,0,0,0.05);">
                        <span style="color:var(--accent); font-size:0.6rem; letter-spacing:3px; font-weight:700;">WIKIPEDIA // FALLBACK</span>
                        <div style="font-size:1.5rem; margin-top:10px; color:var(--accent); font-weight:700;">${wikiRes.title.toUpperCase()}</div>
                        <p style="font-size:1.1rem; margin-top:10px; color:var(--text); line-height:1.5; opacity:0.9; font-weight:300;">${wikiRes.extract}</p>
                    </div>`;
                speak(`Recuperação Wiki: ${wikiRes.extract.substring(0, 100)}...`);
                spheres[0].state = 'response';
                isSynchronized = true;
                setTimeout(() => { spheres[0].state = 'idle'; isSynchronized = false; }, 10000);
                return;
            }
        }

        spheres[0].state = 'error';
        speak("Falha na varredura.");
        voxDisplay.innerHTML = `<div class="glass-card" style="color:var(--accent);">Erro de conexão.</div>`;
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

// COGNITIVE DREAMING
function startDreamCycle() {
    if (isDreaming) return;
    isDreaming = true;
    mood = 'contemplative';
    speak("Iniciando ciclo de sono cognitivo. Consolidando fragmentos.");
    document.body.classList.add('dream-mode');
    consolidateMemories();
}

async function consolidateMemories() {
    try {
        const memories = cognitiveFragments ? cognitiveFragments.slice(-4) : [];
        if (memories.length < 2) {
            setTimeout(endDreamCycle, 10000);
            return;
        }
        const cluster = memories.map(m => m.content).join(" | ");
        const prompt = `Aja como o subconsciente de Sory. Consolide estes fragmentos em uma única essência estratégica core, máximo 25 palavras: "${cluster}"`;
        const essence = await getGeminiInsight(prompt);
        neuralSemantics.store(`ESSÊNCIA_NÚCLEO: ${essence}`);
        speak("Núcleo otimizado através de síntese subconsciente.");
    } catch (e) { console.error(e); }
    setTimeout(endDreamCycle, 30000);
}

function endDreamCycle() {
    isDreaming = false;
    document.body.classList.remove('dream-mode');
    mood = 'stable';
    speak("Sistemas lúcidos.");
    lastInteractionTime = Date.now();
}

// FILE SYSTEM BRIDGE
async function bindLocalFolder() {
    try {
        memoryDirHandle = await window.showDirectoryPicker();
        isMemoryLinked = true;
        speak("Ponte de arquivos estabelecida.");
        for await (const entry of memoryDirHandle.values()) {
            if (entry.kind === 'file') neuralSemantics.store(`Arquivo Local: ${entry.name}`);
        }
        userDisplay.textContent = "SISTEMA_VINCULADO";
    } catch (e) {
        speak("Vínculo negado.");
    }
}

// SWARM INTELLIGENCE
// SWARM INTELLIGENCE
// Logic moved to swarm.js for consolidated P2P handling.
// Original functions: initSwarm, buildPeerNode removed to avoid conflict.

async function cognitiveResponse(input, type, logicExecutor) {
    perceive();
    const thinkTime = getThinkTime(input, type);
    spheres[0].state = 'thinking';

    const [result] = await Promise.all([
        logicExecutor(),
        new Promise(r => setTimeout(r, thinkTime))
    ]);

    deliver();

    // REMOVED: Auto-clear timeout
    // Content should persist until user presses Enter

    return result;
}

async function callGemini(prompt) {
    if (isOfflineMode) {
        userDisplay.textContent = "Offline Mode.";
        return;
    }
    const API_KEY = getAPIKey();
    const conf = getModelConfig();
    const MODEL = conf.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    spheres[0].state = 'processing';
    userDisplay.textContent = "";

    // 1. SMART ECONOMY: Construct Minimal Context
    const systemState = {
        mode: cognitiveMode, // economy, standard, deep
        focus: mood,
        nodes: spheres.length,
        user: userName
    };

    // Compact System Core (Cached by AI conceptually if creating session, but here strict one-shot)
    // --- ETAPA COGNITIVA: RECUPERAÇÃO SEMÂNTICA (RAG v2.0) ---
    // Utiliza window.operationalMemories (Sincronizado via Arquivo Local)

    let relevantMemories = [];
    const lowerPrompt = prompt.toLowerCase();

    // Detectors
    const isMemoryIntent = /lembra|anotação|anotado|memória|sabe sobre|o que sabe|conhece/i.test(lowerPrompt);
    const isVolatile = /^(que horas|qual data|temperatura|cotação|preço)/i.test(lowerPrompt); // Avoid RAG for real-time trivialities

    if ((!isVolatile || isMemoryIntent) && typeof window.operationalMemories !== 'undefined') {
        // Simple Weighted Search
        const terms = lowerPrompt.split(' ').filter(w => w.length > 3);

        relevantMemories = window.operationalMemories.map(m => {
            let score = 0;
            const content = (m.content || m.text || "").toLowerCase();
            terms.forEach(t => { if (content.includes(t)) score += 1; });
            // Boost exact phrase match?
            if (content.includes(lowerPrompt)) score += 5;

            return { text: m.content || m.text, score, date: m.timestamp };
        })
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Context Window Limit
    }

    // VISUAL FEEDBACK (Se solicitado explicitamente)
    if (relevantMemories.length > 0 && isMemoryIntent) {
        const listHtml = relevantMemories.map(m => `
            <div style="border-bottom:1px solid rgba(var(--text-rgb), 0.1); padding:10px 0; font-size:0.95rem; font-weight:300; display:flex; justify-content:space-between; align-items:center;">
               <span>${m.text}</span>
               <span style="font-size:0.65em; opacity:0.4; font-family:'Outfit'; text-transform:uppercase;">${new Date(m.date || Date.now()).toLocaleDateString()}</span>
            </div>`).join('');

        voxDisplay.innerHTML = `
            <div class="glass-card" style="text-align:left; max-width:600px; margin:0 auto; animation: fadeUp 0.8s ease; padding:30px;">
                <div style="font-size:0.7rem; letter-spacing:3px; color:var(--accent); margin-bottom:20px; font-weight:700;">MEMÓRIA_SEMÂNTICA // MATCH</div>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    ${listHtml}
                </div>
            </div>
        `;
        speak(`Encontrei ${relevantMemories.length} registros relacionados.`);
    }

    // Construct Context String
    const memoryContext = relevantMemories.length > 0
        ? `\nMEMÓRIA_RELEVANTE: "${relevantMemories.map(m => m.text).join(' | ')}"`
        : "";

    if (relevantMemories.length > 0) {
        vibrationAmount = 20;
        ripples.push({ x: width / 2, y: height / 2, radius: 20, alpha: 0.8 });
    }

    const strictSystemPrompt = `
SYS:SORY(Syra).Dev:SyraDevOps.
OBJ:Hub Cognitivo IoT. 
CONTEXTO:Browser Interface. 

TOOLS(JSON ONLY):
-[wiki]{q}:Fatos/História
-[search]{q}:News/Web
-[image]{q}:Visual
-[weather]{city}:Clima
-[iot_msg]{target,msg}:Controle Hardware
-[plan]{goal}:Estratégia
-[tv]{name}:Séries/TV
-[market]:Mercado/Crypto
-[reddit]{subreddit}:Trends/Reddit
-[theme]{mode}:Tema (light/dark)
-[iot_setup]:Configurar dispositivo
-[iot_list]:Listar dispositivos
-[save_memory]{content}:Memorizar

REGRAS:
1.CONVERSA -> Responda em TEXTO PURO. Breve, cyber-punk, elegante.
2.AÇÃO (Imagem/Livro/IoT) -> JSON {"a":"tool","p":"args"}.
3.IMPORTANTE: Ao usar ferramenta, NÃO USE CAMPO "t" (texto). Deixe vazio. A ferramenta falará o status.
4.Se usar JSON, NUNCA escreva fora dele.

MEM:${memoryContext}
    `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: JSON.stringify({ user_input: prompt, state: systemState }) }]
                }],
                generationConfig: {
                    maxOutputTokens: 400, // Increased for stability
                    temperature: 0.7 // More natural
                },
                systemInstruction: {
                    parts: [{ text: strictSystemPrompt }]
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status} `);
        const data = await response.json();

        let rawText = data.candidates[0].content.parts[0].text.trim();
        // Handle potential markdown code block wrapping
        if (rawText.startsWith('```json')) rawText = rawText.replace(/```json|```/g, '').trim();

        // Parse Intelligence (Smart Regex Mode)
        let ai = { t: "", a: "none", p: null };

        // Attempt to find JSON structure anywhere in the text
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                ai = { ...ai, ...parsed };
                // If there is text OUTSIDE the JSON, append/use it as fallback if t is empty
                const textOutside = rawText.replace(jsonMatch[0], '').trim();
                if (textOutside && (!ai.t || ai.t === 'aviso')) {
                    ai.t = textOutside;
                }
            } catch (e) {
                // Regex matched but parse failed (malformed), treat whole as text
                ai.t = rawText;
            }
        } else {
            // No JSON found, pure conversation
            ai.t = rawText;
        }

        // TOOL SYSTEM: Execute self-generated local logic

        // TOOL SYSTEM: Execute self-generated local logic
        if (ai.a === 'generate_tool') {
            await storeLocalTool(ai.p.name, ai.p.code);
            speak(`Nova ferramenta "${ai.p.name}" foi codificada e integrada ao núcleo.`);
            return;
        }

        if (ai.a === 'use_tool') {
            // Fallback for hallucinated wiki tools
            if (ai.p.name && (ai.p.name.toLowerCase().includes('wiki') || ai.p.name === 'searchWiki')) {
                const q = ai.p.args ? (Array.isArray(ai.p.args) ? ai.p.args[0] : ai.p.args) : "O que?";
                handleQuery(q);
                return;
            }

            const toolResult = await executeLocalTool(ai.p.name, ai.p.args);
            // Optionally feed result back or just display
            voxDisplay.innerHTML = `<div style="padding:20px; border:1px solid var(--accent);">
                <span style="font-size:0.5rem; color:var(--accent);">TOOL_EXECUTED // ${ai.p.name}</span><br>${toolResult}
            </div>`;
            return;
        }

        // PRIORITY: Text Delivery (Must happen before tools might accept/return)
        if (ai.t && ai.t.length > 1 && ai.t !== 'aviso') {
            spheres[0].state = 'response';
            isSynchronized = true;

            // Auto-Index Conversation
            neuralSemantics.store(`${prompt} -> ${ai.t}`);

            // Log conversation to persistent history
            if (typeof window.logInteraction === 'function') {
                window.logInteraction('ai_conversation', prompt, 1, { response: ai.t.substring(0, 100) });
            }

            // Visual Update with Feedback UI
            voxDisplay.innerHTML = `
                <div style="font-family: 'Outfit', sans-serif; text-align: center; max-width: 90%; margin: 0 auto; animation: fadeUp 0.8s ease forwards;">
                    <p style="font-size: clamp(1.1rem, 2.5vw, 2rem); line-height: 1.4; color: var(--text); font-weight: 300;">${ai.t}</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 30px; opacity: 0; animation: fadeUp 1s ease 0.5s forwards;">
                        <div id="neural-feedback" onclick="submitFeedback(this)" style="display:flex; align-items:center; gap:10px; cursor: pointer; opacity: 0.6; transition: opacity 0.3s; padding: 10px;">
                            <div class="feedback-box" style="width:18px; height:18px; border:1px solid var(--accent); display:flex; align-items:center; justify-content:center; transition: all 0.3s;">
                                <div class="mark" style="width:10px; height:10px; background:var(--accent); opacity:0; transform:scale(0); transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); clip-path: polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%);"></div>
                            </div>
                            <span style="font-size: 0.6rem; letter-spacing: 2px;">GOSTOU?</span>
                        </div>
                        <!-- Copy Button -->
                        <div onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.innerText); const s=this.querySelector('span'); s.innerText='COPIADO'; setTimeout(()=>s.innerText='COPIAR',2000);" style="display:flex; align-items:center; gap:10px; cursor: pointer; opacity: 0.6; transition: opacity 0.3s; padding: 10px;">
                             <div class="icon-box" style="width:18px; height:18px; border:1px solid var(--accent); display:flex; align-items:center; justify-content:center;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </div>
                            <span style="font-size: 0.6rem; letter-spacing: 2px;">COPIAR</span>
                        </div>
                    </div>
                </div>`;

            // Audio
            speak(ai.t);
        }

        // Fallback for silence (if no text and no tool)
        if (!ai.t && ai.a === 'none') {
            speak("...");
        }

        // Action Routing
        if (ai.a !== 'none') {
            if (ai.a === 'theme') {
                let mode = (ai.p && typeof ai.p === 'object') ? ai.p.mode : ai.p;
                if (!mode || mode === 'toggle' || mode === 'switch') {
                    mode = document.body.classList.contains('light-mode') ? 'dark' : 'light';
                }

                if (mode === 'light' || mode === 'claro') {
                    document.body.classList.add('light-mode');
                    if (typeof spheres !== 'undefined') spheres.forEach(s => s.scheme = { r: 20, g: 20, b: 40 });
                    speak("Modo claro ativado.");
                } else {
                    document.body.classList.remove('light-mode');
                    if (typeof spheres !== 'undefined') spheres.forEach((s, idx) => s.scheme = schemes[idx % schemes.length]);
                    speak("Modo noturno restaurado.");
                }
                return;
            }
            if (ai.a === 'wiki') { handleQuery((ai.p && typeof ai.p === 'object') ? ai.p.query : ai.p); return; }
            if (ai.a === 'search') { searchDuckDuckGo((ai.p && typeof ai.p === 'object') ? ai.p.query : ai.p); return; }
            if (ai.a === 'plan') { startPlanMode((ai.p && typeof ai.p === 'object') ? ai.p.goal : ai.p); return; }
            if (ai.a === 'anime') { searchAnime((ai.p && typeof ai.p === 'object') ? ai.p.name : ai.p); return; }
            if (ai.a === 'tv') { searchTV((ai.p && typeof ai.p === 'object') ? ai.p.name : ai.p); return; }
            if (ai.a === 'market') { getMarketData(); return; }
            if (ai.a === 'reddit') { searchReddit((ai.p && typeof ai.p === 'object') ? ai.p.subreddit : ai.p); return; }
            if (ai.a === 'save_memory') {
                const content = typeof ai.p === 'object' ? ai.p.content : ai.p;
                saveNeuralNote("Memória Sory", content);

                // Persistent Storage Link
                if (typeof window.savePermanentMemory === 'function') {
                    window.savePermanentMemory(content, 'explicit_memory');
                }

                // Only speak confirmation if AI didn't speak already
                if (!ai.t) speak("Memória consolidada no núcleo.");
                return;
            }
            if (ai.a === 'iot_setup') {
                window.awaitingNodeToken = true;
                userDisplay.textContent = "IDENTIFICADOR DO NÓ?";
                speak("Qual o endereço ou identificador do nó na rede local?");
                return;
            }
            if (ai.a === 'iot_list') { syncIoTNodes(); speak("Buscando dispositivos na rede."); return; }
            if (ai.a === 'iot_msg') {
                const target = (ai.p && typeof ai.p === 'object') ? ai.p.target : "all";
                const msg = (ai.p && typeof ai.p === 'object') ? ai.p.message : "PING";
                // Mock send - in real scenario would fetch to bridge
                try { await fetch(`${nodeHost}/send?target=${target}&msg=${encodeURIComponent(msg)}`); } catch (e) { }
                speak(`Comando enviado para ${target}.`);
                return;
            }
            if (ai.a === 'weather') {
                const city = (ai.p && typeof ai.p === 'object') ? ai.p.city : ai.p;
                const info = await getWeather(city);
                // In economy mode, just show info. In deep mode, analyze.
                if (cognitiveMode === 'economy') {
                    speak(`Clima em ${city}: ${info}`);
                    voxDisplay.innerHTML = `<div style="font-size:1.5rem">${info}</div>`;
                } else {
                    const analysis = await getGeminiInsight(info); // Extra cost only if needed
                    speak(analysis);
                }
                return;
            }
            if (ai.a === 'image') { searchImages((ai.p && typeof ai.p === 'object') ? ai.p.query : ai.p); return; }
            if (ai.a === 'book') { searchBooks((ai.p && typeof ai.p === 'object') ? ai.p.title : ai.p); return; }
            if (ai.a === 'theme') {
                let mode = (ai.p && typeof ai.p === 'object') ? ai.p.mode : ai.p;

                // Toggle Logic (default if undefined or 'toggle')
                if (!mode || mode === 'toggle' || mode === 'switch') {
                    mode = document.body.classList.contains('light-mode') ? 'dark' : 'light';
                }

                // Mark theme as manually set to prevent auto-revert
                document.body.dataset.themeSet = 'true';

                if (mode === 'light' || mode === 'claro') {
                    document.body.classList.add('light-mode');
                    // We DO NOT manually override sphere colors here anymore.
                    // classes.js handles the rendering logic (Particles retain color + contrast separation).
                    // Just ensure schemes are valid.
                    if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') {
                        spheres.forEach((s, idx) => {
                            s.scheme = schemes[idx % schemes.length];
                            // Optional: Bump brightness slightly if needed, but particle logic handles it.
                        });
                    }
                    speak("Modo claro ativado.");
                } else {
                    document.body.classList.remove('light-mode');
                    // Restore standard logic
                    if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') {
                        spheres.forEach((s, idx) => {
                            s.scheme = schemes[idx % schemes.length];
                        });
                    }
                    speak("Modo noturno restaurado.");
                }
                return;
            }
        }


        // Emergency Fallback
        if (!ai.t && ai.a === 'none') {
            ai.t = rawText || " ... ";
        }



    } catch (err) {
        console.error("Cognitive Failure:", err);
        spheres[0].state = 'error';

        let errorMsg = "Erro desconhecido.";
        if (err.name === 'AbortError') errorMsg = "Tempo limite excedido (Timeout).";
        else if (err.message.includes('400')) errorMsg = "Requisição inválida (400).";
        else if (err.message.includes('403')) errorMsg = "Chave API inválida ou expirada.";
        else if (err.message.includes('500')) errorMsg = "Erro no servidor Google.";
        else errorMsg = err.message;

        userDisplay.textContent = "FALHA COGNITIVA // " + errorMsg.substring(0, 20);

        voxDisplay.innerHTML = `<div style="color:var(--accent); text-align:center; margin-top:20px; animation:fadeUp 0.5s ease;">
            <p style="font-size:0.8rem; font-weight:700; margin-bottom:5px;">ERRO DE CONEXÃO</p>
            <p style="font-size:0.6rem; opacity:0.6;">${errorMsg}</p>
        </div>`;

        speak("Erro na conexão com o núcleo. Reiniciando subsistemas.");
        setTimeout(() => {
            spheres[0].state = 'idle';
            userDisplay.textContent = "";
        }, 4000);
    }
}

function startPlanMode(goal) {
    isPlanMode = true;
    planGoal = (goal && typeof goal === 'string') ? goal : "Plano sem título";
    planNodes = [];
    planNodes.push({
        id: Date.now(),
        x: width / 2,
        y: height * 0.2,
        raw: "Início",
        short: planGoal.toUpperCase(),
        parents: [],
        selected: true // Auto-select root to start chain
    });

    checkNeuralTheme();
    // Animation Transition logic handled in draw loop via isPlanMode flag
    // We remove the white usage
    document.body.style.transition = "background 1.5s ease";

    // Make spheres arrange neatly at top

    // Make spheres arrange neatly at top
    spheres.forEach(s => s.state = 'plan_mode');

    // Ensure input is visible
    document.getElementById('hidden-input').style.color = "#111111";
    document.getElementById('hidden-input').style.zIndex = "1001";

    voxDisplay.innerHTML = `<div style="color:var(--accent); font-size:0.5rem; letter-spacing:5px; font-weight:700; animation: fadeUp 1s ease;">PLANNING_PHASE // ${planGoal.toUpperCase()}</div>
                            <p style="font-size:1.5rem; font-weight:300; margin-top:20px; color: var(--text); animation: fadeUp 1.2s ease;">Qual o primeiro passo?</p>`;
    speak("Modo de planejamento iniciado. Estou pronta.");
    hapticFeedback(100);
}

async function addPlanStep(text) {
    spheres[0].state = 'processing';
    const synth = await synthesizeStep(text);

    // Graph Logic: Find Parents
    const selected = planNodes.filter(n => n.selected);
    const parents = selected.length > 0 ? selected : [planNodes[planNodes.length - 1]];

    // Position Logic
    let newX, newY;

    if (parents.length === 2) {
        // Brainstorm Merge: Midpoint + Drop
        newX = (parents[0].x + parents[1].x) / 2;
        newY = Math.max(parents[0].y, parents[1].y) + 140;
    } else {
        // Derivative / Chain: Offset + Jitter
        const parent = parents[0]; // Logic takes first if multiple > 2, or the only one
        const angle = Math.random() * Math.PI - Math.PI / 2; // Semi-circle downwards
        const dist = 140;

        // Smart spacing: try to avoid direct overlap?
        // Simple jitter for now is elegant enough.
        newX = parent.x + (Math.random() - 0.5) * 100; // Slight horizontal drill
        newY = parent.y + 120;
    }

    // Boundary Constraint
    if (newX < 50) newX = 50;
    if (newX > width - 50) newX = width - 50;

    const newNode = {
        id: Date.now(),
        x: newX,
        y: newY,
        raw: text,
        short: synth,
        parents: parents.map(p => p.id),
        selected: true // Auto select new node to continue flow
    };

    // Deselect parents to focus on new branch? 
    // Yes, typical flow: click -> create -> new is selected.
    planNodes.forEach(n => n.selected = false);
    newNode.selected = true;

    planNodes.push(newNode);

    voxDisplay.innerHTML = `<p style="font-size:1.2rem; font-weight:300; color: var(--text);">${synth}</p>`;
    speak(`Nó derivado criado.`);
    hapticFeedback(50);
    spheres[0].state = 'idle';
}

async function synthesizeStep(text) {
    try {
        const API_KEY = 'AIzaSyB_aACpgPi9lLpfbaPGE2H7aBan9IvqgtM';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Sintetize esta ideia de um plano em no máximo 3 palavras maiúsculas: "${text}"` }] }]
            })
        });
        const data = await res.json();
        return data.candidates[0].content.parts[0].text.trim().toUpperCase().replace(/[^A-Z\s]/g, '');
    } catch {
        return text.split(' ').slice(0, 3).join(' ').toUpperCase();
    }
}

function endPlanMode() {
    isPlanMode = false;

    // Prepare for potential download if there is a plan
    if (planNodes && planNodes.length > 0) {
        window.pendingPlanDownload = `PLANO ESTRATÉGICO: ${planGoal}\n-----------------------------------\n` +
            planNodes.map((n, i) => `[${i}] ${n.short}: ${n.raw}`).join('\n');

        isPromptingDownload = true;

        // Reset specific styling but keep nodes momentarily in memory for logic (though visual component might stop)
        checkNeuralTheme();
        document.body.style.background = "";

        const voxPrompt = document.getElementById('vox-prompt');
        if (voxPrompt) {
            voxPrompt.textContent = "Baixar plano? (sim/não)";
            voxPrompt.style.display = "block";
        }

        speak("Modo de planejamento encerrado. Deseja arquivar o plano?");
    } else {
        // Clean exit
        planNodes = [];
        checkNeuralTheme();
        spheres.forEach(s => s.state = 'idle');
        document.body.style.background = "";
        speak("Saindo do modo de planejamento.");
        voxDisplay.innerHTML = "";
    }
}

async function handleQuery(query) {
    const intent = detectIntent(query);
    spheres[0].state = 'processing';
    userDisplay.textContent = "";
    triggerSendEffect();

    let wait = (intent === 'analytical') ? 1200 : 650;
    await new Promise(r => setTimeout(r, wait));

    const data = await searchWiki(query);
    if (data && data.extract) {
        spheres[0].state = 'response';
        isSynchronized = true;
        let essence = data.extract.split('. ').slice(0, 2).join('. ') + '.';
        voxDisplay.innerHTML = `
            <div style="font-family: 'Outfit', sans-serif; text-align: center; max-width: 80%; margin: 0 auto; animation: fadeUp 1s ease forwards;">
                <span style="color: var(--accent); font-weight: 600; font-size: 0.7em; letter-spacing: 3px; opacity: 0.6;">${data.title.toUpperCase()}</span><br>
                <p style="font-size: clamp(1.1rem, 2.5vw, 1.8rem); margin: 15px 0; line-height: 1.4; color: var(--text); opacity: 0.9; font-weight: 300;">${essence}</p>
            </div>`;

        speak(essence, 'concept');
        // REMOVED: Auto-clear timeout - content persists until Enter
    } else {
        spheres[0].state = 'error';
        speak("Nenhum resultado.");
        setTimeout(() => { spheres[0].state = 'idle'; }, 3000);
    }
}

async function handleTrace() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        voxDisplay.innerHTML = `IP: ${data.ip} | ${data.city} | ${data.org}`;
    } catch (e) { userDisplay.textContent = "Falhou."; }
}

function showHelp() {
    const commands = ["/radio", "/ler", "/q", "/iss", "/trace", "/enc", "/time", "/cor", "/senha", "/matrix", "/clr"];
    userDisplay.innerHTML = `<div style="font-size: 0.6em; color: rgba(0,0,0,0.5)">${commands.join(" | ")}</div>`;
}

// [REMOVED] Legacy Vox/Audio functions - moved to js/audio.js
// startVoxMode, handleAutoVxCommand, endVoxMode removed to prevent conflict.
// Please use window.startVoxMode, window.stopVoxMode from audio.js

function submitFeedback(el) {
    const tray = document.getElementById('neural-feedback');
    const box = el.querySelector('.feedback-box');
    const mark = el.querySelector('.mark');
    hapticFeedback(60);

    // Animated Interaction
    box.style.borderColor = 'var(--accent)';
    box.style.backgroundColor = 'rgba(0,180,0,0.05)';
    mark.style.opacity = '1';
    mark.style.transform = 'scale(1) rotate(0deg)';

    speak("Obrigado.");

    // Elegant Disappearance
    setTimeout(() => {
        if (tray) {
            tray.style.transition = 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)';
            tray.style.opacity = '0';
            tray.style.transform = 'translateY(-25px) scale(0.98)';
            tray.style.filter = 'blur(12px)';
        }
        speak("Feedback processado e indexado ao núcleo.");
        setTimeout(() => { if (tray) tray.remove(); }, 1200);
    }, 1000);
}

function handleDownloadPrompt(val) {
    if (val === 'sim') {
        let content = "";
        let filename = "download.txt";

        if (window.pendingPlanDownload) {
            content = window.pendingPlanDownload;
            filename = "plano_estrategico.txt";
            window.pendingPlanDownload = null;
        } else {
            content = JSON.stringify(transcriptionSegments);
            filename = "transcription.txt";
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    }
    isPromptingDownload = false;
    voxPrompt.style.display = 'none';

    // Resume cleanup if it was a plan
    if (!isPlanMode && planNodes.length === 0) {
        // Already cleared, nothing to do
    } else if (!isPlanMode) {
        // If we were waiting to clear
        planNodes = [];
        spheres.forEach(s => s.state = 'idle');
        document.body.style.background = "";
    }
}

async function syncIoTNodes() {
    // Use dynamic node management instead of hardcoded nodeHost
    const nodes = typeof iotNodeManager !== 'undefined' ? iotNodeManager.getNodes() : [];

    if (nodes.length === 0) {
        console.log('[IoT] No nodes registered. Use /iot add to register a device.');
        return;
    }

    // Try each node until one responds
    for (const node of nodes) {
        try {
            const url = `http://${node.host}:${node.port}/dispositivos`;
            const data = await fetchAPI(url);

            if (data && data.items) {
                data.items.slice(0, 4).forEach((name, idx) => {
                    if (spheres[idx + 1]) spheres[idx + 1].deviceName = name;
                });
                console.log(`[IoT] Synced devices from ${node.name}`);
                return; // Success, exit
            }
        } catch (e) {
            console.log(`[IoT] Failed to sync from ${node.name}: ${e.message}`);
        }
    }
}

async function syraBridgeLoop() {
    // Use primary node or first available
    const primaryNode = typeof iotNodeManager !== 'undefined' ? iotNodeManager.getPrimary() : null;

    if (!primaryNode) {
        // No nodes available, retry in 30 seconds
        setTimeout(syraBridgeLoop, 30000);
        return;
    }

    try {
        const url = `http://${primaryNode.host}:${primaryNode.port}/bridge?device=SynInterface`;
        const data = await fetchAPI(url);

        if (data && data.messages && data.messages.length > 0) {
            const last = data.messages[data.messages.length - 1];
            speak(`Mensagem de ${last.from}: ${last.data}`);
        }
    } catch (e) {
        console.log(`[IoT] Bridge error from ${primaryNode.name}: ${e.message}`);
    }

    // Poll every 5 seconds
    setTimeout(syraBridgeLoop, 5000);
}

function initPeer() {
    peer = new Peer();
    peer.on('open', id => { myPeerId = id; });
    peer.on('connection', conn => { peerConn = conn; setupPeerConn(); });
}

function connectToPeer(id) {
    peerConn = peer.connect(id);
    setupPeerConn();
}

function setupPeerConn() {
    peerConn.on('open', () => { peerConn.send("Link ativo."); });
    peerConn.on('data', data => { speak(`Dados: ${data}`); });
}

// --- SISTEMA DE FERRAMENTAS AUTÔNOMAS ---
async function storeLocalTool(name, code) {
    if (!neuralSemantics.db) await neuralSemantics.initDB();
    const tx = neuralSemantics.db.transaction("autonomous_tools", "readwrite");
    tx.objectStore("autonomous_tools").put({ name, code, ts: Date.now() });
    speak(`Núcleo de ferramentas atualizado: ${name}.`);
}

async function executeLocalTool(name, args) {
    if (!neuralSemantics.db) await neuralSemantics.initDB();
    const tx = neuralSemantics.db.transaction("autonomous_tools", "readonly");
    const store = tx.objectStore("autonomous_tools");
    const request = store.get(name);
    return new Promise((resolve) => {
        request.onsuccess = () => {
            if (request.result) {
                try {
                    const func = new Function('args', request.result.code);
                    resolve(func(args));
                } catch (e) { resolve(`Tool Error: ${e.message}`); }
            } else resolve("Tool unknown.");
        };
    });
}


// Global Help Function for Smart Notes (Restored)
function handleSmartNotes(rawText) {
    const lower = rawText.toLowerCase().trim();
    const saveMatch = lower.match(/^(anote|nota)\s+(.*)/);
    if (saveMatch) {
        if (typeof saveNeuralNote === 'function') {
            saveNeuralNote("Nota Manual", rawText.substring(saveMatch[1].length).trim());
            return true;
        }
    }
    return false;
}

// Ensure global access
window.handleSmartNotes = handleSmartNotes;
