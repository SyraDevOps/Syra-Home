// COGNITIVE MESH CORE - Visualization & Fragments

function injectFragment(content) {
    if (cognitiveFragments.length >= 5) {
        speak("Limite da malha atingido. Processe os fragmentos existentes.");
        userDisplay.textContent = "⚠️ MÁXIMO 5 SEMENTES";
        setTimeout(() => userDisplay.textContent = "", 3000);
        return;
    }

    const id = Date.now().toString(36);
    const count = cognitiveFragments.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const radius = 50 * Math.sqrt(count);
    const x = (window.innerWidth / 2) + Math.cos(count * goldenAngle) * radius;
    const y = (window.innerHeight / 2) + Math.sin(count * goldenAngle) * radius;

    const fragment = {
        id,
        content,
        state: 'raw',
        debateLog: [`[ORIGIN]: ${content}`],
        x, y,
        connections: []
    };

    cognitiveFragments.push(fragment);
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

    speak("Fragmento integrado. Procedendo com a análise estrutural.");
    if (!isMeshActive) toggleMeshView();
    else renderMeshView();
}

function applyDebateLogDecay() {
    const MAX_LOG_ENTRIES = 20;
    cognitiveFragments.forEach(f => {
        if (f.debateLog && f.debateLog.length > MAX_LOG_ENTRIES) {
            const origin = f.debateLog[0];
            const recent = f.debateLog.slice(-MAX_LOG_ENTRIES + 1);
            f.debateLog = [origin, ...recent];
        }
    });
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
}

function compressOldFragments() {
    const now = Date.now();
    const COMPRESSION_AGE = 7 * 24 * 60 * 60 * 1000;

    cognitiveFragments.forEach(f => {
        const fragmentAge = now - parseInt(f.id, 36);
        if (fragmentAge > COMPRESSION_AGE && f.debateLog && f.debateLog.length > 5) {
            const summary = `[COMPRESSED ${f.debateLog.length} entries]: ${f.content}`;
            f.debateLog = [summary];
            f.state = 'compressed';
        }
    });

    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
    console.log('[COGNITIVE] Fragment compression complete');
}

// UI Functions for Mesh
function toggleMeshView() {
    const container = document.querySelector('.mesh-container');
    if (!container) return;
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
    spheres[0].state = 'idle';
    isSynchronized = false;
    if (userDisplay.textContent.includes("PROCESSANDO") || userDisplay.textContent.includes("CRISTALIZANDO")) {
        userDisplay.textContent = "";
    }
    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) hiddenInput.focus();
}

function createMeshContainer() {
    const div = document.createElement('div');
    div.className = 'mesh-container';
    document.body.appendChild(div);
    return div;
}

function renderMeshView() {
    const container = document.querySelector('.mesh-container');
    if (!container) return;
    container.innerHTML = '';

    if (cognitiveFragments.length === 0) return;

    cognitiveFragments.forEach((f, index) => {
        const item = document.createElement('div');
        item.className = 'mesh-item';
        item.id = `mesh-node-${f.id}`;

        if (f.state === 'processing') item.classList.add('state-processing');
        if (f.state === 'synthesized') item.classList.add('state-synthesized');

        const lastLog = f.debateLog[f.debateLog.length - 1] || f.content;
        const shortLog = lastLog.length > 40 ? lastLog.substring(0, 40) + "..." : lastLog;

        item.innerHTML = `
            <div class="mesh-tooltip">
                <span class="tooltip-id">#${f.id.toUpperCase()}</span>
                <span class="tooltip-sep">|</span>
                <span class="tooltip-content">${shortLog}</span>
            </div>
        `;

        item.onclick = (e) => {
            e.stopPropagation();
            showFragmentDetails(f.id);
        };

        container.appendChild(item);
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 50);
    });
}

function showFragmentDetails(id) {
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (!fragment) return;

    let modal = document.querySelector('.mesh-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'mesh-modal';
        document.body.appendChild(modal);
    }

    let stateClass = 'state-raw';
    let stateLabel = 'BRUTO';
    if (fragment.state === 'processing') { stateClass = 'state-processing'; stateLabel = 'PROCESSANDO'; }
    if (fragment.state === 'synthesized') { stateClass = 'state-synthesized'; stateLabel = 'SINTETIZADO'; }
    if (fragment.state === 'core') { stateClass = 'state-core'; stateLabel = 'CRISTALIZADO'; }

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
    modal.style.display = 'block';
}

window.userSubmitDebate = function (id) {
    const inp = document.getElementById('debate-input');
    if (!inp || !inp.value.trim()) return;
    const fragment = cognitiveFragments.find(f => f.id === id);
    if (fragment) {
        fragment.debateLog.push(`[USER]: ${inp.value.trim()}`);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        showFragmentDetails(id);
    }
};

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
        const perspective = await getGeminiInsight(prompt);
        fragment.debateLog.push(`[SORY]: ${perspective}`);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

        speak("Analisando variáveis.");
        showFragmentDetails(id);
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
            expiresAt: Date.now() + (1000 * 60 * 60)
        };
        operationalMemories.push(memory);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));

        speak("Memória operacional criada.");
        fragment.debateLog.push(`[SINTESE]: ${bias}`);
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));

        showFragmentDetails(id);
        const icon = document.getElementById(`mesh-node-${id}`);
        if (icon) { icon.style.borderColor = '#00ffea'; icon.style.boxShadow = '0 0 10px #00ffea'; }
    } catch (e) {
        speak("Erro na síntese.");
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
        fragment.state = 'core';
        localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        speak("Este entendimento foi gravado nos anais do núcleo.");
        if (isMeshActive) renderMeshView();
    }
}

// Periodic maintenance
setInterval(() => {
    applyDebateLogDecay();
    if (cognitiveFragments.length > 20) {
        compressOldFragments();
    }
    createCognitiveSnapshot();
}, 600000);

// Initialize Mesh View
setTimeout(() => {
    isMeshActive = true;
    const container = document.querySelector('.mesh-container') || createMeshContainer();
    container.classList.add('active');
    renderMeshView();
}, 500);
