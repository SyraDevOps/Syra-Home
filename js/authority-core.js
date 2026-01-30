// AUTHORITY CORE - Master Mode & Directives

let isMasterMode = false;
let masterToken = localStorage.getItem('syn-master-token') || null;
let contextualAffirmations = JSON.parse(localStorage.getItem('syn-affirmations') || '[]');

let _systemDirectives = JSON.parse(localStorage.getItem('syn-directives') || '{"creativity": 0.5, "caution": 0.7, "proactivity": 0.5, "criticality": 0.6}');
let systemDirectives = Object.freeze({ ..._systemDirectives });

function getSystemDirective(key) {
    if (!isMasterMode) {
        return systemDirectives[key];
    }
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
    if (masterModeAuditLog.length > 100) masterModeAuditLog = masterModeAuditLog.slice(-100);
    localStorage.setItem('syn-master-audit', JSON.stringify(masterModeAuditLog));
}

let authorityLog = JSON.parse(localStorage.getItem('syn-authority-log') || '[]');

function logAuthorityChange(parameter, oldValue, newValue, reason = 'manual') {
    const entry = { timestamp: Date.now(), parameter, oldValue, newValue, reason };
    authorityLog.push(entry);
    if (authorityLog.length > 50) authorityLog = authorityLog.slice(-50);
    localStorage.setItem('syn-authority-log', JSON.stringify(authorityLog));
}

function enterMasterMode(token) {
    const validToken = masterToken || 'syra2026';
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
            ${Object.keys(systemDirectives).map(k => `
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 0.8em; color: var(--text);">${k.toUpperCase()}</label>
                    <input type="range" id="slider-${k}" min="0" max="100" value="${systemDirectives[k] * 100}" style="width: 100%;">
                </div>`).join('')}
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
    Object.keys(systemDirectives).forEach(k => {
        const el = document.getElementById(`slider-${k}`);
        if (el) systemDirectives[k] = el.value / 100;
    });
    localStorage.setItem('syn-directives', JSON.stringify(systemDirectives));
    speak("Parâmetros cognitivos atualizados.");
    hapticFeedback(80);
};
