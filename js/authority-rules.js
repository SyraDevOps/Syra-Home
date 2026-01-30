// AUTHORITY RULES - Protocols, Alignment, Trust, Shadow Learning

// --- SILENT PROTOCOL ---
let silentUntil = null;
let silentReason = null;

function shouldEnterSilentMode() {
    const hour = new Date().getHours();
    const isLateNight = (hour >= 0 && hour < 6);
    const hasUnstableIdeas = cognitiveFragments.some(f => f.state === 'processing');
    return isLateNight || hasUnstableIdeas || commandHistory.length > 20;
}

function enterSilentCognition(durationMs = 300000, reason = 'auto') {
    silentUntil = Date.now() + durationMs;
    silentReason = reason;
    spheres[0].state = 'thinking';
}

function checkSilentState() {
    if (silentUntil && Date.now() >= silentUntil) exitSilentCognition();
}

function exitSilentCognition() {
    silentUntil = null;
    silentReason = null;
    spheres[0].state = 'idle';
}

function isSilent() {
    return silentUntil && Date.now() < silentUntil;
}

// --- CRITICAL ALIGNMENT ---
let postponedDecisions = JSON.parse(localStorage.getItem('syn-postponed') || '[]');

function evaluateAlignment(userRequest) {
    const risks = {
        dependency: ['sempre', 'tudo', 'nunca', 'só você'],
        autonomy: ['não preciso', 'faça tudo', 'decida por mim'],
        objective: ['esqueça', 'ignore', 'não importa'],
        timing: ['agora', 'já', 'imediatamente', 'urgente']
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

    if (riskType === 'timing' && userTrustScore < 0.6) {
        return { decision: 'postpone', risk: riskType, recommendation: "Ainda não. Preciso processar isso melhor." };
    }

    if (riskLevel === 'high') {
        return {
            decision: 'reject',
            risk: riskType,
            recommendation: riskType === 'dependency' ? "Registrado, mas não adotado." : "Isso resolve agora, mas cobra depois."
        };
    }

    return { decision: 'accept', risk: null, recommendation: null };
}

// --- TRUST GRADIENT ---
let userTrustScore = parseFloat(localStorage.getItem('syn-trust') || '0.5');
let trustSnapshots = JSON.parse(localStorage.getItem('syn-trust-snapshots') || '[]');

function updateTrustScore(wasConsistent) {
    userTrustScore = wasConsistent ? Math.min(1.0, userTrustScore + 0.05) : Math.max(0.0, userTrustScore - 0.1);
    localStorage.setItem('syn-trust', userTrustScore.toString());
}

function getTrustLevel() {
    if (userTrustScore > 0.8) return 'high';
    if (userTrustScore > 0.4) return 'medium';
    return 'low';
}

function createTrustSnapshot(reason = 'periodic') {
    const snapshot = {
        timestamp: Date.now(),
        trustScore: userTrustScore,
        reason
    };
    trustSnapshots.push(snapshot);
    if (trustSnapshots.length > 20) trustSnapshots = trustSnapshots.slice(-20);
    localStorage.setItem('syn-trust-snapshots', JSON.stringify(trustSnapshots));
}

// --- SHADOW LEARNING ---
let shadowLearnings = JSON.parse(localStorage.getItem('syn-shadow-learning') || '[]');

function recordShadowLearning(pattern, feedbackBoost = 0) {
    const existing = shadowLearnings.find(l => l.pattern === pattern);
    const now = Date.now();

    if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
        const timeSinceLastSeen = now - existing.lastSeen;
        const hoursSince = timeSinceLastSeen / 3600000;
        const decayFactor = Math.pow(0.95, hoursSince);

        existing.confidence = existing.confidence * decayFactor;
        const boost = 0.1 * Math.pow(1.2, Math.min(existing.occurrences, 10));
        existing.confidence = Math.min(1.0, existing.confidence + boost + feedbackBoost);
        existing.lastSeen = now;

        if (existing.confidence > 0.4 && existing.state === 'latent') existing.state = 'pending_critique';
    } else {
        shadowLearnings.push({
            id: Date.now().toString(36),
            pattern,
            confidence: 0.1 + feedbackBoost,
            lastSeen: now,
            createdAt: now,
            state: 'latent',
            occurrences: 1
        });
    }
    localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
}

async function promoteShadowLearning(id) {
    const learning = shadowLearnings.find(l => l.id === id);
    if (!learning || learning.state !== 'pending_critique') return;

    const critiquePrompt = `Avalie este padrão aprendido: "${learning.pattern}". É válido ou viés? Responda: VÁLIDO ou VIÉS.`;
    const verdict = await getGeminiInsight(critiquePrompt);

    if (verdict.toLowerCase().includes('válido') && (learning.confidence > 0.5 || getTrustLevel() !== 'low')) {
        learning.state = 'active';
        console.log(`[SHADOW_LEARNING] Promoted: ${learning.pattern}`);
    } else {
        shadowLearnings = shadowLearnings.filter(l => l.id !== id);
        console.log(`[SHADOW_LEARNING] Rejected: ${learning.pattern}`);
    }
    localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
}

// Background Loops
setInterval(checkSilentState, 30000);
setInterval(() => {
    const pending = shadowLearnings.filter(l => l.state === 'pending_critique');
    if (pending.length > 0 && !isCriticalThinkingMode) promoteShadowLearning(pending[0].id);
}, 600000);
