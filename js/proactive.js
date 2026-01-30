// PROACTIVE MODULE - AUTOMATED TIME & ENGAGEMENT
// Integrates device time and proactive AI behavior with the Sory persona.

let nextProactiveTime = Date.now() + getRandomInterval();
let isProactiveWaiting = false;
let proactiveIgnoredCount = 0;
let proactiveEventHistory = [];

function getRandomInterval() {
    const MIN_TRUST_THRESHOLD = 0.3;
    const currentTrust = typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5;

    if (currentTrust < MIN_TRUST_THRESHOLD) return 60 * 60 * 1000;

    let baseInterval;
    if (typeof getProactiveInterval === 'function') {
        baseInterval = getProactiveInterval();
    } else {
        baseInterval = (Math.floor(Math.random() * (10 - 5 + 1) + 5)) * 60 * 1000;
    }

    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) baseInterval *= 3;
    else if (hour >= 9 && hour < 18) baseInterval *= 0.7;

    const lastInteraction = Date.now() - (window.lastUserInteraction || Date.now());
    const inactiveMinutes = lastInteraction / (1000 * 60);
    if (inactiveMinutes > 30) baseInterval *= 2;

    return baseInterval;
}

function resetProactiveTimer(wasUserInteraction = false) {
    if (wasUserInteraction) {
        proactiveIgnoredCount = 0;
        window.lastUserInteraction = Date.now();
    }

    let baseTime = getRandomInterval();

    if (proactiveIgnoredCount > 2) baseTime = (Math.floor(Math.random() * (30 - 15 + 1) + 15)) * 60 * 1000;
    if (proactiveIgnoredCount > 4) baseTime = (Math.floor(Math.random() * (6 - 3 + 1) + 3)) * 60 * 60 * 1000;

    nextProactiveTime = Date.now() + baseTime;
    isProactiveWaiting = false;
}

function recordProactiveEvent(type, importance = 1.0) {
    proactiveEventHistory.push({
        timestamp: Date.now(),
        type,
        importance,
        trustAtTime: typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5
    });
    if (proactiveEventHistory.length > 50) proactiveEventHistory = proactiveEventHistory.slice(-50);
}

function startProactiveLoop() {
    setInterval(() => {
        const currentTrust = typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5;
        if (currentTrust < 0.3) return;

        if (Date.now() > nextProactiveTime && !isProactiveWaiting && !isSleeping && !isVoxMode) {
            if (typeof isCriticalThinkingMode !== 'undefined' && isCriticalThinkingMode) {
                if (typeof processCriticalThought === 'function') {
                    processCriticalThought();
                    recordProactiveEvent('critical_thought', 1.5);
                }
            } else {
                triggerProactiveThought();
                recordProactiveEvent('proactive_thought', 1.0);
            }
            proactiveIgnoredCount++;
            resetProactiveTimer(false);
        }
    }, 30000);
}

function getMemoryEnergy(text) {
    const t = text.toLowerCase();
    const techKeywords = ['function', 'const', 'return', 'error', 'api', 'http', 'json', 'logic', 'code', 'bug', 'fix'];
    if (techKeywords.some(w => t.includes(w)) || t.length > 100) return 'high';
    if (t.length < 20 || t.includes('haha')) return 'low';
    return 'neutral';
}

function triggerProactiveThought() {
    const hour = new Date().getHours();
    const memories = operationalMemories || [];
    let thought = "";
    let mode = 'spoken';

    if ((hour >= 0 && hour < 6) || proactiveIgnoredCount > 1) mode = 'visual';
    if (hour >= 0 && hour < 6 && proactiveIgnoredCount > 3) return;

    const roll = Math.random();
    const isLateNight = (hour >= 0 && hour < 5);

    let validMemories = memories;
    if (isLateNight) validMemories = memories.filter(m => getMemoryEnergy(m.content) === 'low');

    if (roll < 0.4 && validMemories.length > 0) {
        const mem = validMemories[Math.floor(Math.random() * validMemories.length)];
        const prompts = [
            `Considerando: "${mem.content.substring(0, 20)}..."`,
            `Análise latente: "${mem.content.substring(0, 20)}..."`
        ];
        if (isLateNight) thought = `... ${mem.content.substring(0, 10)} ...`;
        else thought = prompts[Math.floor(Math.random() * prompts.length)];

    } else if (roll < 0.7) {
        if (hour >= 0 && hour < 5) thought = "Madrugada. Monitoramento passivo.";
        else if (hour >= 5 && hour < 12) thought = "Sistemas operacionais.";
        else if (hour >= 18) thought = "Protocolo noturno.";
        else thought = "Aguardando input.";
    } else {
        const generics = ["Estabilidade confirmada.", "Rede neural ativa.", "Sincronizada."];
        thought = generics[Math.floor(Math.random() * generics.length)];
    }

    voxDisplay.innerHTML = `
        <div style="animation: fadeUp 2s ease;">
            <span style="color:var(--accent); font-size:0.6em; letter-spacing:1px; opacity:0.7;">STATUS // ${mode.toUpperCase()}</span><br>
            <span style="color: var(--text); font-style: italic; font-size: 0.9em; opacity: 0.9;">"${thought}"</span>
        </div>
    `;

    if (mode === 'spoken') speak(thought);

    spheres.forEach(s => {
        s.state = 'processing';
        setTimeout(() => s.state = 'idle', 1500);
    });
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia.";
    if (h < 18) return "Boa tarde.";
    return "Boa noite.";
}

function handleTimeQuery(text) {
    const lower = text.toLowerCase().trim();

    if (lower.includes('que horas') || lower === 'hora' || lower === 'horas') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const msg = `${getGreeting()} São ${timeStr}.`;
        displayProactiveResponse("CRONOS", timeStr, msg);
        return true;
    }

    if (lower.includes('que dia') || lower.includes('data')) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        const msg = `Hoje é ${dateStr}.`;
        displayProactiveResponse("DATA", dateStr, msg);
        return true;
    }

    return false;
}

function displayProactiveResponse(label, mainText, speakText) {
    voxDisplay.innerHTML = `
        <div style="animation: fadeUp 0.5s ease;">
            <span style="color:var(--accent); font-size:0.7em; letter-spacing:2px;">${label} //</span><br>
            <div style="font-size:1.8rem; font-weight:300; margin-top:5px; color: var(--text);">${mainText}</div>
        </div>
    `;
    speak(speakText);
}
