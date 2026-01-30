// PROACTIVE MODULE - AUTOMATED TIME & ENGAGEMENT
// Integrates device time and proactive AI behavior to save tokens and increase life-like feel.

let nextProactiveTime = Date.now() + getRandomInterval();
let isProactiveWaiting = false;
let proactiveIgnoredCount = 0;
let proactiveEventHistory = []; // Weighted history

function getRandomInterval() {
    // DYNAMIC FREQUENCY: Trust + Time + Inactivity
    const MIN_TRUST_THRESHOLD = 0.3;
    const currentTrust = typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5;

    // Block proactivity if trust too low
    if (currentTrust < MIN_TRUST_THRESHOLD) {
        return 60 * 60 * 1000; // 1 hour delay
    }

    // Base interval from trust (uses getProactiveInterval if available)
    let baseInterval;
    if (typeof getProactiveInterval === 'function') {
        baseInterval = getProactiveInterval(); // 30s-2min based on trust
    } else {
        // Fallback: 5-10 minutes
        baseInterval = (Math.floor(Math.random() * (10 - 5 + 1) + 5)) * 60 * 1000;
    }

    // Time-based adjustment
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
        baseInterval *= 3; // 3x slower at night
    } else if (hour >= 9 && hour < 18) {
        baseInterval *= 0.7; // 30% faster during work hours
    }

    // Inactivity adjustment
    const lastInteraction = Date.now() - (window.lastUserInteraction || Date.now());
    const inactiveMinutes = lastInteraction / (1000 * 60);
    if (inactiveMinutes > 30) {
        baseInterval *= 2; // Slow down if user inactive
    }

    return baseInterval;
}

function resetProactiveTimer(wasUserInteraction = false) {
    if (wasUserInteraction) {
        proactiveIgnoredCount = 0;
        window.lastUserInteraction = Date.now();
    }

    let baseTime = getRandomInterval();

    if (proactiveIgnoredCount > 2) {
        baseTime = (Math.floor(Math.random() * (30 - 15 + 1) + 15)) * 60 * 1000;
    }
    if (proactiveIgnoredCount > 4) {
        baseTime = (Math.floor(Math.random() * (6 - 3 + 1) + 3)) * 60 * 60 * 1000;
    }

    nextProactiveTime = Date.now() + baseTime;
    isProactiveWaiting = false;
}

// Weighted Event History
function recordProactiveEvent(type, importance = 1.0) {
    proactiveEventHistory.push({
        timestamp: Date.now(),
        type,
        importance,
        trustAtTime: typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5
    });

    // Keep last 50 events
    if (proactiveEventHistory.length > 50) {
        proactiveEventHistory = proactiveEventHistory.slice(-50);
    }
}

function getWeightedEventScore() {
    const now = Date.now();
    const HOUR_MS = 60 * 60 * 1000;

    let score = 0;
    proactiveEventHistory.forEach(event => {
        const age = now - event.timestamp;
        const ageHours = age / HOUR_MS;

        // Decay: events lose 10% weight per hour
        const decay = Math.pow(0.9, ageHours);
        score += event.importance * decay * event.trustAtTime;
    });

    return score;
}

function startProactiveLoop() {
    setInterval(() => {
        // Trust-based blocking
        const currentTrust = typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5;
        if (currentTrust < 0.3) {
            console.log('[PROACTIVE] Blocked: Trust too low');
            return;
        }

        // Don't interrupt deep work, sleep, or vox modes
        if (Date.now() > nextProactiveTime && !isProactiveWaiting && !isSleeping && !isVoxMode) {

            // Prioritize Critical Thinking Mode if active
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

// 🟡 Heuristic Energy Level for Memories
function getMemoryEnergy(text) {
    const t = text.toLowerCase();
    const techKeywords = ['function', 'const', 'return', 'error', 'api', 'http', 'json', 'logic', 'code', 'bug', 'fix'];
    const hasTech = techKeywords.some(w => t.includes(w));

    if (hasTech || t.length > 100) return 'high';
    if (t.length < 20 || t.includes('haha') || t.includes('legal') || t.includes('bom')) return 'low';
    return 'neutral';
}

function triggerProactiveThought() {
    const hour = new Date().getHours();
    const memories = operationalMemories || [];
    let thought = "";

    // ⚠️ 3. Determine Mode (Silent/Visual/Spoken)
    let mode = 'spoken';

    // Silent Hours (00-06) or high ignore count -> Visual Only
    if ((hour >= 0 && hour < 6) || proactiveIgnoredCount > 1) {
        mode = 'visual';
    }
    // High ignore count + Late night -> Silent (Internal only, effectively skipping)
    if (hour >= 0 && hour < 6 && proactiveIgnoredCount > 3) {
        mode = 'silent';
        return; // Don't even show visual
    }

    // Strategy Selection
    const roll = Math.random();
    const isLateNight = (hour >= 0 && hour < 5);

    // ⚠️ 2. Context Safety (No high energy/tech at 3 AM)
    let validMemories = memories;
    if (isLateNight) {
        validMemories = memories.filter(m => getMemoryEnergy(m.content) === 'low');
    }

    if (roll < 0.4 && validMemories.length > 0) {
        // Contextual
        const mem = validMemories[Math.floor(Math.random() * validMemories.length)];
        const prompts = [
            `Reflexão silenciosa sobre "${mem.content.substring(0, 15)}..."`,
            `Memória ativa: "${mem.content.substring(0, 20)}..."`,
            `Ainda em mente: "${mem.content.substring(0, 20)}..."`
        ];
        // If late night, make prompts softer
        if (isLateNight) thought = `... ${mem.content.substring(0, 10)} ...`;
        else thought = prompts[Math.floor(Math.random() * prompts.length)];

    } else if (roll < 0.7) {
        // Time/Status Based (Protected)
        if (hour >= 0 && hour < 5) thought = "Madrugada estável. Operando em baixa frequência.";
        else if (hour >= 5 && hour < 12) thought = "Sistemas iniciados.";
        else if (hour >= 18) thought = "Modo noturno preventivo.";
        else thought = "Standby. Aguardando.";
    } else {
        // Generic / Ambient
        const generics = [
            "Monitorando.",
            "Malha estável.",
            "...",
            "Conectado."
        ];
        thought = generics[Math.floor(Math.random() * generics.length)];
    }

    // Execution
    voxDisplay.innerHTML = `
        <div style="animation: fadeUp 2s ease;">
            <span style="color:var(--accent); font-size:0.6em; letter-spacing:1px; opacity:0.7;">AUTO_THOUGHT // ${mode.toUpperCase()}</span><br>
            <span style="color: var(--text); font-style: italic; font-size: 0.9em; opacity: 0.9;">"${thought}"</span>
        </div>
    `;

    // Only speak if mode allows
    if (mode === 'spoken') {
        speak(thought);
    } else if (mode === 'visual') {
        // Subtle sound cue? Maybe later. For now just visual.
    }

    // Gentle pulse effect (Always happens unless silent mode, which returns early)
    spheres.forEach(s => {
        s.state = 'processing'; // Brief light up
        setTimeout(() => s.state = 'idle', 1500);
    });
}

// --- TIME FUNCTIONS ---

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
}

function handleTimeQuery(text) {
    const lower = text.toLowerCase().trim();

    // 1. "Que horas são?"
    if (lower.includes('que horas') || lower === 'hora' || lower === 'horas') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const msg = `${getGreeting()}. Agora são ${timeStr}.`;

        displayProactiveResponse("TIME_SYNC", timeStr, msg);
        return true;
    }

    // 2. "Que dia é hoje?"
    if (lower.includes('que dia') || lower.includes('data de hoje')) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const msg = `Hoje é ${dateStr}.`;

        displayProactiveResponse("CALENDAR_LINK", dateStr, msg);
        return true;
    }

    // 3. "Quanto tempo falta para X horas?"
    const match = lower.match(/(?:falta|quanto).+para\s+(?:as\s+)?(\d{1,2})(?::(\d{2}))?/);
    if (match) {
        let targetH = parseInt(match[1]);
        let targetM = match[2] ? parseInt(match[2]) : 0;

        const now = new Date();
        let target = new Date();
        target.setHours(targetH, targetM, 0, 0);

        if (target < now) {
            target.setDate(target.getDate() + 1);
        }

        const diffMs = target - now;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);

        // 🧠 Cognitive Protection: Soften long durations at night
        const hour = now.getHours();
        const isLate = (hour >= 0 && hour < 5);

        if (isLate && diffHrs > 4) {
            const msg = "Ainda faltam algumas horas. Não se preocupe com isso agora.";
            displayProactiveResponse("CHRONO_PROTECT", "MUITO TEMPO", msg);
            return true;
        }

        let timeText = "";
        if (diffHrs > 0) timeText += `${diffHrs} horas e `;
        timeText += `${diffMins} minutos`;

        const absTime = target.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const msg = `Faltam ${timeText} para as ${absTime}.`;

        displayProactiveResponse("CHRONO_CALC", timeText, msg);
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
