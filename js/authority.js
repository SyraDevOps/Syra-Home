// MASTER AUTHORITY SYSTEM (Jarvis/Dolores Core)
// Implements: Authority Core, Silent Protocol, Critical Loyalty, Trust Gradient, Shadow Learning

// --- 1. AUTHORITY CORE ---
let isMasterMode = false;
let masterToken = localStorage.getItem('syn-master-token') || null;
let contextualAffirmations = JSON.parse(localStorage.getItem('syn-affirmations') || '[]');

// DIRECTIVE PROTECTION: Freeze reading outside Master Mode
let _systemDirectives = JSON.parse(localStorage.getItem('syn-directives') || '{"creativity": 0.5, "caution": 0.7, "proactivity": 0.5, "criticality": 0.6}');
let systemDirectives = Object.freeze({ ..._systemDirectives }); // Frozen copy

// Controlled Getter for Directives
function getSystemDirective(key) {
    if (!isMasterMode) {
        // Return frozen copy - cannot be modified
        return systemDirectives[key];
    }
    // In Master Mode, return mutable reference
    return _systemDirectives[key];
}

function updateSystemDirectives(newDirectives) {
    if (!isMasterMode) {
        console.error('[AUTHORITY] Cannot update directives outside Master Mode');
        return false;
    }

    _systemDirectives = { ..._systemDirectives, ...newDirectives };
    systemDirectives = Object.freeze({ ..._systemDirectives });
    localStorage.setItem('syn-directives', JSON.stringify(_systemDirectives));
    return true;
}

// Master Mode Observability
let masterModeAuditLog = JSON.parse(localStorage.getItem('syn-master-audit') || '[]');

function logMasterAction(action, details = {}) {
    const entry = {
        timestamp: Date.now(),
        action,
        details,
        trustLevel: getTrustLevel ? getTrustLevel() : 'unknown',
        directivesSnapshot: { ..._systemDirectives }
    };

    masterModeAuditLog.push(entry);

    // Keep last 100 actions
    if (masterModeAuditLog.length > 100) {
        masterModeAuditLog = masterModeAuditLog.slice(-100);
    }

    localStorage.setItem('syn-master-audit', JSON.stringify(masterModeAuditLog));
    console.log(`[MASTER_AUDIT] ${action}`, details);
}

function getMasterModeReport() {
    return {
        currentDirectives: { ..._systemDirectives },
        auditLog: masterModeAuditLog.slice(-20), // Last 20 actions
        authorityChanges: typeof getAuthorityHistory === 'function' ? getAuthorityHistory() : [],
        silentProtocolState: {
            active: typeof isSilent === 'function' ? isSilent() : false,
            reason: silentReason || null,
            until: silentUntil || null
        },
        trustMetrics: {
            score: userTrustScore || 0.5,
            level: typeof getTrustLevel === 'function' ? getTrustLevel() : 'unknown',
            snapshots: trustSnapshots ? trustSnapshots.length : 0
        }
    };
}

// 1️⃣ AUTHORITY CHANGE LOG (Cognitive Drift Prevention)
let authorityLog = JSON.parse(localStorage.getItem('syn-authority-log') || '[]');
// Structure: {timestamp, parameter, oldValue, newValue, reason}

function logAuthorityChange(parameter, oldValue, newValue, reason = 'manual') {
    const entry = {
        timestamp: Date.now(),
        parameter,
        oldValue,
        newValue,
        reason
    };
    authorityLog.push(entry);

    // Keep only last 50 changes
    if (authorityLog.length > 50) {
        authorityLog = authorityLog.slice(-50);
    }

    localStorage.setItem('syn-authority-log', JSON.stringify(authorityLog));
    console.log(`[AUTHORITY_LOG] ${parameter}: ${oldValue} → ${newValue} (${reason})`);
}

function getAuthorityHistory() {
    return authorityLog;
}

function analyzeAuthorityDrift() {
    if (authorityLog.length < 5) return { drift: 'stable', message: 'Histórico insuficiente.' };

    const recent = authorityLog.slice(-10);
    const changes = recent.length;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const hoursSpan = timeSpan / (1000 * 60 * 60);

    if (changes > 7 && hoursSpan < 24) {
        return { drift: 'high', message: 'Muitas mudanças recentes. Possível instabilidade.' };
    }

    return { drift: 'stable', message: 'Parâmetros estáveis.' };
}

function enterMasterMode(token) {
    const validToken = masterToken || 'syra2026'; // Default or user-set
    if (token === validToken) {
        isMasterMode = true;
        document.body.classList.add('master-mode');
        speak("Núcleo de autoridade ativado. Blueprint disponível.");
        showMasterInterface();
        return true;
    }
    speak("Acesso negado.");
    return false;
}

function exitMasterMode() {
    isMasterMode = false;
    document.body.classList.remove('master-mode');
    hideMasterInterface();
    speak("Retornando ao modo operacional padrão.");
}

function showMasterInterface() {
    const masterUI = document.createElement('div');
    masterUI.id = 'master-control';
    masterUI.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; width: 320px; background: rgba(0,0,0,0.95); border: 1px solid var(--accent); padding: 20px; z-index: 9999; font-family: 'Inter', sans-serif;">
            <div style="color: var(--accent); font-size: 0.7em; letter-spacing: 3px; margin-bottom: 15px;">MASTER_CONTROL // BLUEPRINT</div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-size: 0.8em; color: var(--text);">Criatividade</label>
                <input type="range" id="slider-creativity" min="0" max="100" value="${systemDirectives.creativity * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-size: 0.8em; color: var(--text);">Cautela</label>
                <input type="range" id="slider-caution" min="0" max="100" value="${systemDirectives.caution * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-size: 0.8em; color: var(--text);">Proatividade</label>
                <input type="range" id="slider-proactivity" min="0" max="100" value="${systemDirectives.proactivity * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-size: 0.8em; color: var(--text);">Criticidade</label>
                <input type="range" id="slider-criticality" min="0" max="100" value="${systemDirectives.criticality * 100}" style="width: 100%;">
            </div>
            
            <button onclick="saveMasterDirectives()" style="width: 100%; padding: 8px; background: var(--accent); border: none; color: #000; font-weight: 700; cursor: pointer; margin-top: 10px;">APLICAR</button>
            <button onclick="exitMasterMode()" style="width: 100%; padding: 8px; background: transparent; border: 1px solid #666; color: var(--text); font-weight: 500; cursor: pointer; margin-top: 5px;">SAIR</button>
        </div>
    `;
    document.body.appendChild(masterUI);
}

function hideMasterInterface() {
    const masterUI = document.getElementById('master-control');
    if (masterUI) masterUI.remove();
}

window.saveMasterDirectives = function () {
    const old = { ...systemDirectives };

    systemDirectives.creativity = document.getElementById('slider-creativity').value / 100;
    systemDirectives.caution = document.getElementById('slider-caution').value / 100;
    systemDirectives.proactivity = document.getElementById('slider-proactivity').value / 100;
    systemDirectives.criticality = document.getElementById('slider-criticality').value / 100;

    // Log all changes
    if (old.creativity !== systemDirectives.creativity) {
        logAuthorityChange('creativity', old.creativity, systemDirectives.creativity, 'master_mode');
    }
    if (old.caution !== systemDirectives.caution) {
        logAuthorityChange('caution', old.caution, systemDirectives.caution, 'master_mode');
    }
    if (old.proactivity !== systemDirectives.proactivity) {
        logAuthorityChange('proactivity', old.proactivity, systemDirectives.proactivity, 'master_mode');
    }
    if (old.criticality !== systemDirectives.criticality) {
        logAuthorityChange('criticality', old.criticality, systemDirectives.criticality, 'master_mode');
    }

    localStorage.setItem('syn-directives', JSON.stringify(systemDirectives));
    speak("Parâmetros cognitivos atualizados.");
    hapticFeedback(80);
};

// --- 2. SILENT PROTOCOL (Temporal State) ---
let silentUntil = null; // Timestamp when silence ends
let silentReason = null; // Why we're silent

function shouldEnterSilentMode() {
    const hour = new Date().getHours();
    const isLateNight = (hour >= 0 && hour < 6);
    const hasUnstableIdeas = cognitiveFragments.some(f => f.state === 'processing');
    const inputOverload = commandHistory.length > 20;

    return isLateNight || hasUnstableIdeas || inputOverload;
}

function enterSilentCognition(durationMs = 300000, reason = 'auto') {
    // 5 minutes default
    silentUntil = Date.now() + durationMs;
    silentReason = reason;
    spheres[0].state = 'thinking'; // Visual pulse only
    console.log(`[SILENT_PROTOCOL] Entered: ${reason}, until ${new Date(silentUntil).toLocaleTimeString()}`);
}

function checkSilentState() {
    if (silentUntil && Date.now() >= silentUntil) {
        exitSilentCognition();
    }
}

function exitSilentCognition() {
    if (silentUntil) {
        console.log(`[SILENT_PROTOCOL] Exited: ${silentReason}`);
    }
    silentUntil = null;
    silentReason = null;
    spheres[0].state = 'idle';
}

function isSilent() {
    return silentUntil && Date.now() < silentUntil;
}

// Structured logging for silent state (JSON table for dev)
function logSilentState() {
    if (!silentUntil) return;

    const state = {
        active: isSilent(),
        reason: silentReason,
        endsAt: new Date(silentUntil).toLocaleTimeString(),
        remainingMs: silentUntil - Date.now(),
        visualPaused: window.pauseRendering || false
    };

    console.table([state]);
}

// Pause visual rendering during silence (performance optimization)
let renderingPaused = false;

function pauseVisualRendering() {
    renderingPaused = true;
    window.pauseRendering = true;
    console.log('[SILENT_PROTOCOL] Visual rendering paused');
}

function resumeVisualRendering() {
    renderingPaused = false;
    window.pauseRendering = false;
    console.log('[SILENT_PROTOCOL] Visual rendering resumed');
}

// Check silence state every 30s
setInterval(checkSilentState, 30000);

// Log silent state every minute (for debugging)
setInterval(() => {
    if (isSilent()) logSilentState();
}, 60000);

// --- 3. CRITICAL ALIGNMENT ENGINE (with Postponement) ---
let postponedDecisions = JSON.parse(localStorage.getItem('syn-postponed') || '[]');
// Structure: {id, request, reason, timestamp, reevaluateAt}

function evaluateAlignment(userRequest) {
    // Returns: {decision: 'accept'|'reject'|'postpone', risk: string, recommendation: string}
    const risks = {
        dependency: ['sempre', 'tudo', 'nunca', 'só você'],
        autonomy: ['não preciso', 'faça tudo', 'decida por mim'],
        objective: ['esqueça', 'ignore', 'não importa'],
        timing: ['agora', 'já', 'imediatamente', 'urgente'] // New: timing pressure
    };

    let riskLevel = 'low';
    let riskType = null;

    for (const [type, keywords] of Object.entries(risks)) {
        if (keywords.some(kw => userRequest.toLowerCase().includes(kw))) {
            riskLevel = 'high';
            riskType = type;
            break;
        }
    }

    // POSTPONEMENT LOGIC (Third State)
    if (riskType === 'timing' && userTrustScore < 0.6) {
        return {
            decision: 'postpone',
            risk: riskType,
            recommendation: "Ainda não. Preciso processar isso melhor."
        };
    }

    if (riskLevel === 'high') {
        return {
            decision: 'reject',
            risk: riskType,
            recommendation: riskType === 'dependency' ?
                "Registrado, mas não adotado." :
                "Isso resolve agora, mas cobra depois."
        };
    }

    return { decision: 'accept', risk: null, recommendation: null };
}

function postponeDecision(request, reason, reevaluateInMs = 3600000) {
    // Default: 1 hour
    const decision = {
        id: Date.now().toString(36),
        request,
        reason,
        timestamp: Date.now(),
        reevaluateAt: Date.now() + reevaluateInMs
    };

    postponedDecisions.push(decision);
    localStorage.setItem('syn-postponed', JSON.stringify(postponedDecisions));
    console.log(`[POSTPONED] "${request}" - ${reason}`);
}

function checkPostponedDecisions() {
    const now = Date.now();
    const ready = postponedDecisions.filter(d => d.reevaluateAt <= now);

    ready.forEach(d => {
        console.log(`[REEVALUATE] "${d.request}"`);
        // Could trigger re-evaluation logic here
    });

    // Clean up old postponed items (>7 days)
    postponedDecisions = postponedDecisions.filter(d => now - d.timestamp < 604800000);
    localStorage.setItem('syn-postponed', JSON.stringify(postponedDecisions));
}

// Check postponed decisions every 10 minutes
setInterval(checkPostponedDecisions, 600000);

// --- 4. TRUST GRADIENT SYSTEM (Affects Memory TTL) ---
let userTrustScore = parseFloat(localStorage.getItem('syn-trust') || '0.5'); // 0.0 - 1.0
let decisionHistory = JSON.parse(localStorage.getItem('syn-decisions') || '[]');

function updateTrustScore(wasConsistent) {
    const oldTrust = userTrustScore;

    if (wasConsistent) {
        userTrustScore = Math.min(1.0, userTrustScore + 0.05);
    } else {
        userTrustScore = Math.max(0.0, userTrustScore - 0.1);
    }

    localStorage.setItem('syn-trust', userTrustScore.toString());

    // Log significant trust changes
    if (Math.abs(oldTrust - userTrustScore) >= 0.1) {
        console.log(`[TRUST] ${(oldTrust * 100).toFixed(0)}% → ${(userTrustScore * 100).toFixed(0)}%`);
    }
}

function getTrustLevel() {
    if (userTrustScore > 0.8) return 'high';
    if (userTrustScore > 0.4) return 'medium';
    return 'low';
}

function adjustBehaviorByTrust() {
    const level = getTrustLevel();

    if (level === 'high') {
        return { autonomy: 'high', verbosity: 'low', suggestions: 'bold' };
    } else if (level === 'low') {
        return { autonomy: 'low', verbosity: 'high', suggestions: 'safe' };
    }

    return { autonomy: 'medium', verbosity: 'medium', suggestions: 'balanced' };
}

// Trust Snapshots (Periodic Backup with Checksum)
let trustSnapshots = JSON.parse(localStorage.getItem('syn-trust-snapshots') || '[]');

function createTrustSnapshot(reason = 'periodic') {
    const snapshot = {
        timestamp: Date.now(),
        trustScore: userTrustScore,
        decisionCount: decisionHistory.length,
        reason,
        checksum: generateChecksum(userTrustScore)
    };

    trustSnapshots.push(snapshot);

    // Keep last 20 snapshots
    if (trustSnapshots.length > 20) {
        trustSnapshots = trustSnapshots.slice(-20);
    }

    localStorage.setItem('syn-trust-snapshots', JSON.stringify(trustSnapshots));
}

function generateChecksum(value) {
    // Simple checksum: hash of value + timestamp
    const str = `${value}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function verifyTrustIntegrity() {
    if (trustSnapshots.length === 0) return { valid: true, message: 'No snapshots' };

    const latest = trustSnapshots[trustSnapshots.length - 1];
    const drift = Math.abs(latest.trustScore - userTrustScore);

    if (drift > 0.3) {
        return { valid: false, message: 'Trust drift detected. Possible corruption.' };
    }

    return { valid: true, message: 'Trust integrity verified.' };
}

// Periodic snapshot (every 30 minutes)
setInterval(() => {
    createTrustSnapshot('auto');
}, 1800000);

// 4️⃣ TRUST-BASED MEMORY TTL
function getMemoryTTL() {
    // High trust = longer memory (2 hours)
    // Low trust = shorter memory (15 minutes)
    const baseTTL = 15 * 60 * 1000; // 15 minutes
    const maxTTL = 120 * 60 * 1000; // 2 hours

    return baseTTL + (userTrustScore * (maxTTL - baseTTL));
}

function createTrustWeightedMemory(content, sourceId = null) {
    const ttl = getMemoryTTL();

    const memory = {
        id: Date.now().toString(),
        content,
        sourceId,
        expiresAt: Date.now() + ttl,
        trustLevel: getTrustLevel(),
        createdAt: Date.now()
    };

    operationalMemories.push(memory);
    localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));

    console.log(`[MEMORY] Created with TTL: ${(ttl / 60000).toFixed(0)}min (Trust: ${getTrustLevel()})`);
    return memory;
}

function adjustExistingMemoriesTTL() {
    // When trust changes significantly, adjust existing memories
    const now = Date.now();
    const newTTL = getMemoryTTL();

    operationalMemories.forEach(m => {
        const age = now - m.createdAt;
        const newExpiry = m.createdAt + newTTL;

        // Only extend, never shorten (to avoid data loss)
        if (newExpiry > m.expiresAt) {
            m.expiresAt = newExpiry;
        }
    });

    localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
}

// Trust influences proactivity frequency
function getProactiveInterval() {
    // High trust = more frequent ideas (30s)
    // Low trust = less frequent (2min)
    const minInterval = 30000; // 30s
    const maxInterval = 120000; // 2min

    return maxInterval - (userTrustScore * (maxInterval - minInterval));
}

// --- 5. SHADOW LEARNING LAYER (Exponential Growth + Feedback) ---
let shadowLearnings = JSON.parse(localStorage.getItem('syn-shadow-learning') || '[]');
// Structure: {id, pattern, confidence, lastSeen, state, feedbackScore, occurrences, createdAt}

function recordShadowLearning(pattern, feedbackBoost = 0) {
    const existing = shadowLearnings.find(l => l.pattern === pattern);
    const now = Date.now();

    if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;

        // EXPONENTIAL GROWTH with temporal decay
        const timeSinceLastSeen = now - existing.lastSeen;
        const hoursSince = timeSinceLastSeen / (1000 * 60 * 60);

        // Decay factor: confidence decays 5% per hour
        const decayFactor = Math.pow(0.95, hoursSince);
        existing.confidence = existing.confidence * decayFactor;

        // Exponential boost: 0.1 * (1.2^occurrences)
        const boost = 0.1 * Math.pow(1.2, Math.min(existing.occurrences, 10));
        existing.confidence = Math.min(1.0, existing.confidence + boost + feedbackBoost);

        existing.lastSeen = now;

        // Promote if confidence > 0.4 (adjusted threshold)
        if (existing.confidence > 0.4 && existing.state === 'latent') {
            existing.state = 'pending_critique';
        }
    } else {
        shadowLearnings.push({
            id: Date.now().toString(36),
            pattern,
            confidence: 0.1 + feedbackBoost,
            lastSeen: now,
            createdAt: now,
            state: 'latent',
            feedbackScore: feedbackBoost,
            occurrences: 1
        });
    }

    localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
}

// Feedback integration (positive only, from "Você gostou?")
function applyShadowFeedback(patternId, isPositive) {
    if (!isPositive) return; // Only positive feedback

    const learning = shadowLearnings.find(l => l.id === patternId);
    if (!learning) return;

    // Positive feedback gives +0.15 boost
    learning.confidence = Math.min(1.0, learning.confidence + 0.15);
    learning.feedbackScore = (learning.feedbackScore || 0) + 0.15;

    if (learning.confidence > 0.4 && learning.state === 'latent') {
        learning.state = 'pending_critique';
    }

    localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
    console.log(`[SHADOW_FEEDBACK] Positive feedback applied to: ${learning.pattern}`);
}

// Monitor latent vs active
function getShadowLearningMetrics() {
    const latent = shadowLearnings.filter(l => l.state === 'latent').length;
    const pending = shadowLearnings.filter(l => l.state === 'pending_critique').length;
    const active = shadowLearnings.filter(l => l.state === 'active').length;
    const total = shadowLearnings.length;

    return {
        latent,
        pending,
        active,
        total,
        cognitiveLoad: (pending + active) / Math.max(1, total),
        healthStatus: total > 50 ? 'overload' : 'healthy'
    };
}

async function promoteShadowLearning(id) {
    const learning = shadowLearnings.find(l => l.id === id);
    if (!learning || learning.state !== 'pending_critique') return;

    // Multi-factor validation
    const trustLevel = getTrustLevel();
    const masterApproval = isMasterMode; // Master mode gives extra weight
    const metrics = getShadowLearningMetrics();

    // Skip if cognitive overload
    if (metrics.healthStatus === 'overload') {
        console.log(`[SHADOW_LEARNING] Skipping promotion due to cognitive overload`);
        return;
    }

    // Run through critical pipeline
    const critiquePrompt = `Avalie este padrão aprendido: "${learning.pattern}". É válido ou viés? Responda: VÁLIDO ou VIÉS.`;
    const verdict = await getGeminiInsight(critiquePrompt);

    // Multi-factor decision
    const isValid = verdict.toLowerCase().includes('válido');
    const hasHighConfidence = learning.confidence > 0.5;
    const hasTrust = trustLevel !== 'low';

    if (isValid && (hasHighConfidence || masterApproval || hasTrust)) {
        learning.state = 'active';
        localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
        console.log(`[SHADOW_LEARNING] Promoted: ${learning.pattern} (Confidence: ${learning.confidence.toFixed(2)})`);
    } else {
        // Remove if failed validation
        shadowLearnings = shadowLearnings.filter(l => l.id !== id);
        localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
        console.log(`[SHADOW_LEARNING] Rejected: ${learning.pattern}`);
    }
}

// Periodic check for shadow learning promotions
setInterval(() => {
    const pending = shadowLearnings.filter(l => l.state === 'pending_critique');
    if (pending.length > 0 && !isCriticalThinkingMode) {
        const target = pending[0];
        promoteShadowLearning(target.id);
    }
}, 600000); // Every 10 minutes
