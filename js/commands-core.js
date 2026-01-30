// COMMANDS CORE - Input Handling & Parsing

window.addEventListener('keydown', (e) => {
    // Global Keybinds
    if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        startVoxMode();
        return;
    }

    if (e.key === 'Escape') {
        const modal = document.querySelector('.mesh-modal.active');
        if (modal) {
            closeMeshModal();
            return;
        }
        if (isPlanMode) endPlanMode();
        if (isVoxMode) stopVoxMode();
        if (currentGallery.active) closeGallery();
        if (isTranscriptMode) endTranscript();

        // Settings Modal
        const settings = document.getElementById('settings-modal');
        if (settings && !settings.classList.contains('hidden')) {
            closeSettings();
            return;
        }
        return;
    }

    // Input Focus Management
    const input = document.getElementById('hidden-input');
    const settingsModal = document.getElementById('settings-modal');
    if (document.activeElement.tagName !== 'INPUT' && (!settingsModal || settingsModal.classList.contains('hidden'))) {
        input.focus();
    }
});

// Input Listener
document.getElementById('hidden-input').addEventListener('input', (e) => {
    const val = e.target.value;
    const userDisplay = document.getElementById('user-display');

    // Command Mode Visual
    if (val.startsWith('/')) {
        userDisplay.style.color = 'var(--accent)';
        userDisplay.style.fontWeight = '700';
    } else {
        userDisplay.style.color = 'var(--text)';
        userDisplay.style.fontWeight = '300';
    }

    userDisplay.textContent = val.toUpperCase();
    hapticFeedback(5);
});

// Submit Listener
document.getElementById('hidden-input').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const raw = e.target.value;
        const val = raw.trim();
        e.target.value = '';
        const userDisplay = document.getElementById('user-display');

        // UI Reset
        userDisplay.style.transform = "translate(-50%, -50%) scale(1.1)";
        setTimeout(() => {
            userDisplay.style.transform = "translate(-50%, -50%) scale(1)";
            userDisplay.textContent = "";
        }, 150);

        if (!val) return;

        // Command Routing
        if (val.startsWith('/')) {
            await handleCommand(val.substring(1).toLowerCase());
        } else {
            // Check specific modes
            if (isPlanMode) {
                addPlanStep(val);
                return;
            }
            if (window.awaitingNodeToken) {
                // IoT Token Setup
                iotNodeManager.registerNode(val, 'SyraNode-' + val.substring(0,4));
                window.awaitingNodeToken = false;
                speak("Nó registrado.");
                return;
            }

            // Smart Notes Check
            if (handleSmartNotes(raw)) return;

            // Gallery Navigation
            if (currentGallery.active) {
                if (val.toLowerCase() === 'proxima' || val === '>') navGallery(1);
                else if (val.toLowerCase() === 'anterior' || val === '<') navGallery(-1);
                else closeGallery();
                return;
            }

            // Vox Prompt
            if (isPromptingDownload) {
                handleDownloadPrompt(val.toLowerCase());
                return;
            }

            // Default: Cognitive Response
            if (cognitiveMode === 'deep') {
                callGemini(raw);
            } else {
                callGemini(raw);
            }
        }
    }
});

// Command Handler Wrapper
async function handleCommand(cmdString) {
    const parts = cmdString.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Log
    commandHistory.push(cmdString);
    lastCommandTime = Date.now();

    // Visual Feedback
    spheres[0].state = 'processing';

    // Execute specific logic from command list
    const result = await executeCommand(cmd, args);

    if (result) {
        speak(result);
    } else {
        // If command returns nothing/false, it handled itself or failed silently
        spheres[0].state = 'idle';
    }
}
