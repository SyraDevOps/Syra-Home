window.currentGallery = { active: false, images: [], index: 0 };
window.animeModeActive = false;
window.isMeshActive = false; // Added missing global status

// --- LOCAL ROUTER (SMART ECONOMY) ---
function localIntentRouter(text) {
    const cleanText = text.toLowerCase().trim();

    // 1. Roteamento de Tempo (Custo Zero)
    if (cleanText.match(/^(que horas|hora Ã©|data|dia Ã©)/)) {
        const now = new Date();
        const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('pt-BR');
        return {
            t: `SÃ£o ${time} de ${date}.`,
            a: 'none'
        };
    }

    // 2. Roteamento IoT Direto (Sem IA)
    if (cleanText.startsWith('ligar ') || cleanText.startsWith('desligar ')) {
        const action = cleanText.startsWith('ligar') ? 'ON' : 'OFF';
        const targetName = cleanText.replace(/(ligar|desligar)\s+/, '').trim();

        return {
            t: `Comando ${action} enviado para ${targetName}.`,
            a: 'iot_msg',
            p: { target: targetName, message: action }
        };
    }

    // 3. MatemÃ¡tico Simples
    if (cleanText.match(/^quanto Ã© \d+/)) {
        try {
            const expr = cleanText.replace('quanto Ã©', '').replace('x', '*').trim();
            // Basic safety check before eval
            if (/^[\d+\-*/.\s()]+$/.test(expr)) {
                const res = eval(expr);
                return { t: `O resultado Ã© ${res}.`, a: 'none' };
            }
        } catch (e) { }
    }

    // 4. MÃ­dia (Imagens/Livros) - FORÃ‡A AÃ‡ÃƒO, IGNORA CONVERSA
    // Detecta: "imagem de x", "fotos de x", "ver x", "mostre x"
    const imgMatch = cleanText.match(/^(?:ver |mostrar |buscar |pesquisar )?(?:imagem|imagens|foto|fotos|fotografia) (?:de |do |da |sobre )?(.+)/i);
    if (imgMatch) {
        return {
            t: "", // Silence AI speech
            a: "image",
            p: imgMatch[1].trim()
        };
    }

    // Detecta: "livro x", "livros de x", "obras de x"
    const bookMatch = cleanText.match(/^(?:ver |mostrar |buscar |ler )?(?:livro|livros|obra|obras) (?:de |do |da |sobre )?(.+)/i);
    if (bookMatch) {
        return {
            t: "", // Silence AI speech
            a: "book",
            p: bookMatch[1].trim()
        };
    }

    // 5. Planejamento (Plano/EstratÃ©gia) - FORÃ‡A AÃ‡ÃƒO
    const planMatch = cleanText.match(/^(?:criar |novo |iniciar |fazer )?(?:plano|planejar|estratÃ©gia|projeto) (?:de |para |sobre )?(.+)/i);
    if (planMatch) {
        return {
            t: "",
            a: "plan",
            p: planMatch[1].trim()
        };
    }

    // 6. TV / SÃ©ries (Terminal Command)
    const tvMatch = cleanText.match(/^(?:ver |mostrar |buscar |pesquisar )?(?:s[eÃ©]rie|programa|tv show) (?:de |do |da |sobre )?(.+)/i);
    if (tvMatch) {
        return {
            t: "",
            a: "tv",
            p: tvMatch[1].trim()
        };
    }

    // 7. Market / Crypto
    const marketMatch = cleanText.match(/^(?:ver |mostrar |checar )?(?:mercado|crypto|cripto|bitcoin|cota[Ã§c][oÃµ]es)/i);
    if (marketMatch) {
        return {
            t: "",
            a: "market",
            p: null
        };
    }

    // 8. Reddit / Trends
    const redditMatch = cleanText.match(/^(?:reddit|trends?|trending) ?(.+)?/i);
    if (redditMatch) {
        return {
            t: "",
            a: "reddit",
            p: redditMatch[1] ? redditMatch[1].trim() : "popular"
        };
    }

    return null;
}

window.addEventListener('click', (e) => {
    // Only block focus if a modal is actually open/active
    const isModalOpen = document.querySelector('.mesh-modal.active');
    if (!isModalOpen) hiddenInput.focus();
    initAudioSystem(); // Initialize audio context on interact

    // Plan Mode Selection moved to plan-manager.js for better event handling


    // REMOVED: Auto-clear on click outside
    // Content should persist until user presses Enter or clicks close button
    // The old code was: if (isSynchronized && !e.target.closest('#vox-display')) { ... clear ... }

    if (isVoxMode) {
        const dx = e.clientX - (width - 100);
        const dy = e.clientY - 100;
        if (Math.sqrt(dx * dx + dy * dy) < 80) endVoxMode();
    }
});

// Global KeyDown for Navigation and Typing Fallback
window.addEventListener('keydown', (e) => {
    // Focus fallback: If typing regular text and not focused on input, force focus
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement !== hiddenInput && document.activeElement.tagName !== 'INPUT') {
        const isModalOpen = document.querySelector('.mesh-modal.active');
        if (!isModalOpen) {
            hiddenInput.focus();
            // Optional: Appending the char might happen automatically if focus is fast enough, 
            // but relying on native behavior is safer than manual value modification here.
        }
    }
    if (currentGallery.active) {
        if (e.key === 'ArrowRight') navGallery(1);
        if (e.key === 'ArrowLeft') navGallery(-1);
        if (e.key === 'Enter') closeGallery();
    }
    if (animeModeActive && e.key === 'Enter') {
        closeAnimeMode();
    }
});

hiddenInput.addEventListener('input', (e) => {
    userDisplay.textContent = e.target.value;
    vibrationAmount = Math.min(vibrationAmount + 5, 15);
});

// COMMAND SYSTEM ENHANCEMENTS
let commandExecutionLog = JSON.parse(localStorage.getItem('syn-command-log') || '[]');

// Command Priority Levels
const COMMAND_PRIORITY = {
    EMERGENCY: 0,    // Bypass everything
    CRITICAL: 1,     // Bypass AI, check alignment
    STANDARD: 2,     // Normal flow
    AI_ROUTED: 3     // Goes through AI interpretation
};

// Emergency Commands (Total Bypass)
const EMERGENCY_COMMANDS = [
    '/reset', '/shutdown', '/kill', '/emergency',
    '/adm off', '/exit adm', '/panic'
];

// Critical Commands (Bypass AI, but check alignment)
const CRITICAL_COMMANDS = [
    '/sleep', '/offline', '/forget', '/mode',
    '/thinon', '/thinoff', '/deep'
];

function logCommandExecution(command, priority, result, risk = null) {
    const entry = {
        timestamp: Date.now(),
        command,
        priority: Object.keys(COMMAND_PRIORITY)[priority],
        result,
        risk,
        trustLevel: getTrustLevel ? getTrustLevel() : 'unknown'
    };

    commandExecutionLog.push(entry);

    // Keep last 100 commands
    if (commandExecutionLog.length > 100) {
        commandExecutionLog = commandExecutionLog.slice(-100);
    }

    localStorage.setItem('syn-command-log', JSON.stringify(commandExecutionLog));
    console.log(`[CMD_LOG] ${command} | Priority: ${entry.priority} | Result: ${result}`);
}

function getCommandPriority(command) {
    if (EMERGENCY_COMMANDS.some(ec => command.startsWith(ec))) {
        return COMMAND_PRIORITY.EMERGENCY;
    }
    if (CRITICAL_COMMANDS.some(cc => command.startsWith(cc))) {
        return COMMAND_PRIORITY.CRITICAL;
    }
    if (command.startsWith('/')) {
        return COMMAND_PRIORITY.STANDARD;
    }
    return COMMAND_PRIORITY.AI_ROUTED;
}

async function preCheckCommandRisk(command, priority) {
    // Emergency commands skip all checks
    if (priority === COMMAND_PRIORITY.EMERGENCY) {
        return { allowed: true, reason: 'emergency_bypass' };
    }

    // Check if in silent mode
    if (typeof isSilent === 'function' && isSilent()) {
        if (priority !== COMMAND_PRIORITY.CRITICAL && priority !== COMMAND_PRIORITY.EMERGENCY) {
            return { allowed: false, reason: 'silent_mode_active' };
        }
    }

    // Check alignment for non-emergency commands
    if (typeof evaluateAlignment === 'function' && priority !== COMMAND_PRIORITY.EMERGENCY) {
        const alignment = evaluateAlignment(command);

        if (alignment.decision === 'reject') {
            logCommandExecution(command, priority, 'rejected', alignment.risk);
            return { allowed: false, reason: alignment.recommendation };
        }

        if (alignment.decision === 'postpone') {
            if (typeof postponeDecision === 'function') {
                postponeDecision(command, alignment.recommendation);
            }
            logCommandExecution(command, priority, 'postponed', alignment.risk);
            return { allowed: false, reason: alignment.recommendation };
        }
    }

    return { allowed: true, reason: 'approved' };
}

window.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && document.activeElement === hiddenInput) {
        // Wrapper logic is inside hiddenInput event listener if any, but since we have a dedicated one for hiddenInput 'keydown',
        // this one might be redundant if we don't prevent propagation.
        // However, looking at original code, it had:
        // window.addEventListener('keydown', ...) which just did nothing useful (lines 1229-1235 were empty/notes).
        // hiddenInput.addEventListener('keydown', ...) was the real worker (line 1238).
    }
});

window.addEventListener('wheel', (e) => {
    if (isPlanMode) {
        if (!window.planCamY) window.planCamY = 0;
        // Accumulate scroll
        if (!window.targetWheelY) window.targetWheelY = window.planCamY;
        window.targetWheelY -= e.deltaY;
    }
});

hiddenInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        // NEW: Clear persistent display on empty Enter
        // NEW: Clear persistent display on empty Enter
        if (isSynchronized && hiddenInput.value.trim() === '') {
            // Check specific modes first
            if (currentGallery.active) {
                closeGallery();
                e.preventDefault();
                return;
            }
            if (animeModeActive) {
                closeAnimeMode();
                e.preventDefault();
                return;
            }

            spheres[0].state = 'idle';
            isSynchronized = false;
            voxDisplay.innerHTML = "";
            return;
        }

        // Gallery Navigation (Intercepting before other commands)
        if (currentGallery.active) {
            closeGallery(); // Enter forces close
            e.preventDefault();
            return;
        }
        if (animeModeActive) { // Enter forces close
            closeAnimeMode();
            e.preventDefault();
            return;
        }

        const rawVal = hiddenInput.value.trim();
        const val = rawVal.toLowerCase();
        if (!val) return;

        // COMMAND PRIORITY & RISK CHECK
        const priority = getCommandPriority(val);
        const riskCheck = await preCheckCommandRisk(rawVal, priority);

        if (!riskCheck.allowed) {
            userDisplay.textContent = riskCheck.reason;
            speak(riskCheck.reason);
            hiddenInput.value = '';
            setTimeout(() => { userDisplay.textContent = ''; }, 3000);
            return;
        }

        // Log execution start for critical/emergency commands
        if (priority <= COMMAND_PRIORITY.CRITICAL) {
            console.log(`[CMD_EXEC] ${val} | Priority: ${Object.keys(COMMAND_PRIORITY)[priority]}`);
        }

        // Prevent Spam / Lag when already processing (except for essential cancel commands)
        if (spheres[0].state === 'processing' && !['/stop', 'parar', '/clr'].includes(val)) {
            userDisplay.textContent = "PROCESSANDO...";
            hapticFeedback(50);
            return;
        }

        hapticFeedback();
        hapticFeedback();
        setTimeout(() => { hiddenInput.value = ''; hiddenInput.focus(); }, 10);

        try {
            if (isPlanMode) {
                if (val === 'sair' || val === 'encerrar' || val === '/exit') { endPlanMode(); return; }
                addPlanStep(rawVal);
                return;
            }

            // EMERGENCY COMMANDS (Total Bypass)
            if (val === '/reset' || val === '/esquecer') {
                logCommandExecution(val, COMMAND_PRIORITY.EMERGENCY, 'executed');
                localStorage.clear();
                userDisplay.textContent = "MEMÃ“RIA_APAGADA";
                speak("Todos os registros foram eliminados. Reiniciando nÃºcleo.");
                setTimeout(() => location.reload(), 2000);
                return;
            }

            if (val === '/shutdown' || val === '/kill') {
                logCommandExecution(val, COMMAND_PRIORITY.EMERGENCY, 'executed');
                speak("Encerrando todos os sistemas.");
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Inter;color:#666;">SYSTEM_OFFLINE</div>';
                return;
            }

            if (val === '/emergency' || val === '/panic') {
                logCommandExecution(val, COMMAND_PRIORITY.EMERGENCY, 'executed');
                if (typeof exitMasterMode === 'function') exitMasterMode();
                if (typeof exitSilentCognition === 'function') exitSilentCognition();
                isCriticalThinkingMode = false;
                isPlanMode = false;
                userDisplay.textContent = "EMERGENCY_RESET";
                speak("Protocolos de emergÃªncia ativados. Retornando ao estado seguro.");
                return;
            }

            if (val.startsWith('/plan ')) { startPlanMode(rawVal.substring(6)); return; }
            const planMatch = val.match(/^(?:criar plano para|novo plano para|planejar)\s+(.*)/);
            if (planMatch) { startPlanMode(planMatch[1]); return; }
            if (val === '/plan') { startPlanMode(); return; } // Simplified plan entry
            if (isPromptingDownload) { handleDownloadPrompt(val); return; }

            // ========== IOT COMMANDS - ESP8266 COMPATIBLE ==========

            // Add Node
            if (val === '/iot add' || val === 'adicionar nÃ³' || val === 'conectar esp') {
                if (typeof iotNodeManager !== 'undefined') {
                    const id = iotNodeManager.promptAdd();
                    if (id) {
                        speak("Dispositivo adicionado. Testando conexÃ£o...");
                        const info = await iotNodeManager.getInfo();
                        if (info) {
                            userDisplay.textContent = `âœ… Conectado: ${info.name} (${info.ip})`;
                            speak(`Conectado com sucesso ao ${info.name}.`);
                        } else {
                            userDisplay.textContent = "âš ï¸ NÃ³ adicionado mas nÃ£o respondeu ao teste.";
                        }
                    }
                } else {
                    userDisplay.textContent = "Sistema IoT nÃ£o disponÃ­vel.";
                }
                return;
            }

            // List Nodes (registered in browser)
            if (val === '/iot nodes' || val === 'listar nÃ³s') {
                if (typeof iotNodeManager !== 'undefined') {
                    const nodes = iotNodeManager.getNodes();
                    if (nodes.length === 0) {
                        userDisplay.textContent = "Nenhum nÃ³ IoT registrado.";
                        speak("Nenhum nÃ³ encontrado. Use /iot add para adicionar.");
                    } else {
                        const list = nodes.map(n => `â€¢ ${n.name} (${n.host}:${n.port}) - ${n.status}`).join('\n');
                        voxDisplay.innerHTML = `<div style="color:var(--accent);">NÃ“S IoT REGISTRADOS</div><pre style="margin-top:10px;">${list}</pre>`;
                        speak(`${nodes.length} nÃ³${nodes.length > 1 ? 's' : ''} registrado${nodes.length > 1 ? 's' : ''}.`);
                    }
                }
                return;
            }

            // List Devices ON ESP8266
            if (val === '/iot list' || val === '/iot devices' || val === 'listar dispositivos' || val === 'ver dispositivos' || val === 'quais dispositivos') {
                if (typeof iotNodeManager !== 'undefined') {
                    const node = iotNodeManager.getPrimary();
                    if (!node) {
                        userDisplay.textContent = "Nenhum nÃ³ IoT conectado. Use /iot add primeiro.";
                        speak("Nenhum nÃ³ conectado.");
                        return;
                    }
                    userDisplay.textContent = "Consultando dispositivos...";
                    const data = await iotNodeManager.listDevices();
                    if (data && data.items) {
                        if (data.items.length === 0) {
                            voxDisplay.innerHTML = `<div style="color:var(--accent);">DISPOSITIVOS ESP8266</div><p>Nenhum dispositivo registrado ainda.</p>`;
                            speak("Nenhum dispositivo no ESP.");
                        } else {
                            const list = data.items.map(d => `â€¢ ${d}`).join('\n');
                            voxDisplay.innerHTML = `<div style="color:var(--accent);">DISPOSITIVOS ESP8266 (${data.count})</div><pre style="margin-top:10px;">${list}</pre>`;
                            speak(`${data.count} dispositivo${data.count > 1 ? 's' : ''} encontrado${data.count > 1 ? 's' : ''}.`);
                        }
                    } else {
                        userDisplay.textContent = "Falha ao consultar dispositivos.";
                        speak("NÃ£o foi possÃ­vel conectar ao ESP.");
                    }
                }
                return;
            }

            // Create Device ON ESP8266
            if (val.startsWith('/iot create ') || val.startsWith('criar dispositivo ')) {
                const deviceName = val.startsWith('/iot create ') ? rawVal.substring(12).trim() : rawVal.substring(18).trim();
                if (!deviceName) {
                    userDisplay.textContent = "Informe o nome do dispositivo.";
                    return;
                }
                if (typeof iotNodeManager !== 'undefined') {
                    userDisplay.textContent = `Criando ${deviceName}...`;
                    const ok = await iotNodeManager.createDevice(deviceName);
                    if (ok) {
                        userDisplay.textContent = `âœ… Dispositivo ${deviceName} criado.`;
                        speak(`Dispositivo ${deviceName} criado com sucesso.`);
                    } else {
                        userDisplay.textContent = `âŒ Falha ao criar ${deviceName}.`;
                        speak("NÃ£o foi possÃ­vel criar o dispositivo.");
                    }
                }
                return;
            }

            // Delete Device FROM ESP8266
            if (val.startsWith('/iot delete ') || val.startsWith('remover dispositivo ') || val.startsWith('excluir dispositivo ')) {
                let deviceName;
                if (val.startsWith('/iot delete ')) deviceName = rawVal.substring(12).trim();
                else if (val.startsWith('remover dispositivo ')) deviceName = rawVal.substring(20).trim();
                else deviceName = rawVal.substring(21).trim();

                if (!deviceName) {
                    userDisplay.textContent = "Informe o nome do dispositivo.";
                    return;
                }
                if (typeof iotNodeManager !== 'undefined') {
                    const ok = await iotNodeManager.deleteDevice(deviceName);
                    if (ok) {
                        userDisplay.textContent = `âœ… Dispositivo ${deviceName} removido.`;
                        speak(`Dispositivo ${deviceName} removido.`);
                    } else {
                        userDisplay.textContent = `âŒ Dispositivo ${deviceName} nÃ£o encontrado.`;
                    }
                }
                return;
            }

            // Send Message TO Device
            if (val.startsWith('/iot send ') || val.startsWith('enviar para ') || val.startsWith('mandar para ')) {
                let rest;
                if (val.startsWith('/iot send ')) rest = rawVal.substring(10).trim();
                else if (val.startsWith('enviar para ')) rest = rawVal.substring(12).trim();
                else rest = rawVal.substring(12).trim();

                // Parse: "DeviceName mensagem aqui"
                const spaceIdx = rest.indexOf(' ');
                if (spaceIdx === -1) {
                    userDisplay.textContent = "Formato: /iot send <dispositivo> <mensagem>";
                    return;
                }
                const toDevice = rest.substring(0, spaceIdx);
                const message = rest.substring(spaceIdx + 1);

                if (typeof iotNodeManager !== 'undefined') {
                    userDisplay.textContent = `Enviando para ${toDevice}...`;
                    const ok = await iotNodeManager.sendMessage(toDevice, message);
                    if (ok) {
                        userDisplay.textContent = `âœ… Mensagem enviada para ${toDevice}.`;
                        speak(`Mensagem enviada.`);
                    } else {
                        userDisplay.textContent = `âŒ Falha ao enviar para ${toDevice}.`;
                    }
                }
                return;
            }

            // Read Messages FROM Device
            if (val === '/iot read' || val === '/iot messages' || val === 'ler mensagens' || val === 'ver mensagens') {
                if (typeof iotNodeManager !== 'undefined') {
                    const node = iotNodeManager.getPrimary();
                    if (!node) {
                        userDisplay.textContent = "Nenhum nÃ³ IoT conectado.";
                        return;
                    }
                    userDisplay.textContent = "Verificando mensagens...";
                    const messages = await iotNodeManager.readMessages('Sory');
                    if (messages === null) {
                        userDisplay.textContent = "Falha ao conectar ao ESP.";
                    } else if (messages.length === 0) {
                        userDisplay.textContent = "Nenhuma mensagem nova.";
                        speak("Nenhuma mensagem nova.");
                    } else {
                        let html = `<div style="color:var(--accent);">MENSAGENS (${messages.length})</div>`;
                        messages.forEach(m => {
                            html += `<div style="margin:8px 0;padding:8px;background:rgba(0,0,0,0.1);border-radius:4px;">
                                <b>De: ${m.from}</b><br>${m.data}
                            </div>`;
                        });
                        voxDisplay.innerHTML = html;
                        speak(`${messages.length} mensagem${messages.length > 1 ? 's' : ''} recebida${messages.length > 1 ? 's' : ''}.`);
                        // Read first message aloud
                        if (messages.length > 0) {
                            speak(`Mensagem de ${messages[0].from}: ${messages[0].data}`);
                        }
                    }
                }
                return;
            }

            // Check Node Status
            if (val === '/iot status' || val === '/iot info' || val === 'status iot' || val === 'status esp') {
                if (typeof iotNodeManager !== 'undefined') {
                    const node = iotNodeManager.getPrimary();
                    if (!node) {
                        userDisplay.textContent = "Nenhum nÃ³ IoT configurado.";
                        return;
                    }
                    userDisplay.textContent = "Consultando status...";
                    const info = await iotNodeManager.getInfo();
                    if (info) {
                        voxDisplay.innerHTML = `<div style="color:var(--accent);">STATUS ESP8266</div>
                            <pre style="margin-top:10px;">
ID: ${info.id}
Nome: ${info.name}
IP: ${info.ip}
mDNS: ${info.mdns}
Status: ${info.status}
                            </pre>`;
                        speak(`ESP online. IP: ${info.ip}`);
                    } else {
                        userDisplay.textContent = "âŒ ESP nÃ£o respondeu.";
                        speak("NÃ£o foi possÃ­vel conectar ao ESP.");
                    }
                }
                return;
            }

            // Remove Node from browser
            if (val.startsWith('/iot remove ')) {
                const nodeId = rawVal.substring(12).trim();
                if (typeof iotNodeManager !== 'undefined') {
                    iotNodeManager.remove(nodeId);
                    userDisplay.textContent = `NÃ³ ${nodeId} removido.`;
                    speak("NÃ³ removido.");
                }
                return;
            }

            // Set Primary Node
            if (val.startsWith('/iot primary ')) {
                const nodeId = rawVal.substring(13).trim();
                if (typeof iotNodeManager !== 'undefined') {
                    iotNodeManager.setPrimary(nodeId);
                    userDisplay.textContent = `NÃ³ ${nodeId} definido como primÃ¡rio.`;
                    speak("NÃ³ primÃ¡rio atualizado.");
                }
                return;
            }

            // CRITICAL COMMANDS (Bypass AI, Check Alignment)
            if (val === '/mem') {
                logCommandExecution(val, COMMAND_PRIORITY.CRITICAL, 'executed');
                initMemory();
                return;
            }
            if (val === '/forget') {
                logCommandExecution(val, COMMAND_PRIORITY.CRITICAL, 'executed');
                memoryDirHandle = null; isMemoryEnabled = false;
                userDisplay.textContent = "MEMÃ“RIA_DESCONECTADA";
                speak("VÃ­nculo com diretÃ³rio local encerrado.");
                return;
            }
            if (val === '/incognito' || val === '/anonimo') {
                isMemoryEnabled = !isMemoryEnabled;
                userDisplay.textContent = isMemoryEnabled ? "MEMÃ“RIA: ATIVA" : "MODO_ANÃ”NIMO: ATIVO";
                speak(isMemoryEnabled ? "Sistemas de lembranÃ§a reativados." : "NavegaÃ§Ã£o anÃ´nima iniciada. Nada serÃ¡ registrado.");
                return;
            }

            // IoT Alias Command
            if (val.startsWith('/iot alias ')) {
                // Format: /iot alias [id] [alias]
                const parts = rawVal.substring(11).trim().split(' ');
                if (parts.length >= 2) {
                    const id = parts[0];
                    const alias = parts.slice(1).join(' '); // Allow spaces in alias
                    if (window.iotNodeManager && window.iotNodeManager.setAlias(id, alias)) {
                        userDisplay.textContent = `Apelido "${alias}" definido para ${id}.`;
                        speak(`Apelido registrado. Agora vocÃª pode chamar o dispositivo de ${alias}.`);
                    } else {
                        speak("Falha ao definir apelido. Verifique o ID.");
                    }
                } else {
                    speak("Formato invÃ¡lido. Use /iot alias ID Apelido");
                }
                return;
            }

            if (val === '/offline') {
                isOfflineMode = !isOfflineMode;
                userDisplay.textContent = isOfflineMode ? "Sistemas externos: DESATIVADO" : "Sistemas externos: ONLINE";
                speak(isOfflineMode ? "Protocolos externos encerrados." : "ConexÃ£o neural restabelecida.");
                return;
            }

            if (val === '/vincular_memoria' || val === '/bind_memory') {
                if (typeof showMemoryModal === 'function') showMemoryModal();
                else speak("Sistema de memÃ³ria nÃ£o inicializado.");
                return;
            }

            // STRATEGIC PLAN COMMANDS
            if (val.startsWith('/edit_node ')) {
                const parts = rawVal.substring(11).split(' ');
                const id = parts[0]; // Assuming ID is index or string
                const txt = parts.slice(1).join(' ');
                // Find index by ID if planNodes uses numeric ID property
                const idx = planNodes.findIndex(n => n.id == id);
                if (idx >= 0) editPlanNode(idx, txt);
                else speak("NÃ³ nÃ£o encontrado.");
                return;
            }
            if (val.startsWith('/del_node ')) {
                const parts = rawVal.substring(10).trim().split(' ');
                const id = parts[0];
                const idx = planNodes.findIndex(n => n.id == id);
                if (idx >= 0) deletePlanNode(idx, 'cascade');
                else speak("NÃ³ nÃ£o encontrado.");
                return;
            }
            if (val.startsWith('/done ')) {
                const id = rawVal.substring(6).trim();
                const idx = planNodes.findIndex(n => n.id == id);
                if (idx >= 0) togglePlanNodeStatus(idx);
                return;
            }
            if (val.startsWith('/priority ')) {
                const parts = rawVal.substring(10).trim().split(' ');
                if (parts.length >= 2) {
                    const idx = planNodes.findIndex(n => n.id == parts[0]);
                    if (idx >= 0) setPlanNodePriority(idx, parts[1]);
                }
                return;
            }
            if (val === '/zoom_fit') {
                fitPlanView();
                return;
            }
            if (val === '/save_plan_json') {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(planNodes));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "sory_plan.json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                speak("Plano exportado em JSON.");
                return;
            }

            // Simple Immediate Commands (No thinking needed)
            if (typeof handleTimeQuery === 'function' && handleTimeQuery(val)) return;

            // --- LOCAL ROUTER (SMART ECONOMY) ---
            const localResult = localIntentRouter(rawVal);
            if (localResult) {
                // Visual Feedback (Only if text exists)
                if (localResult.t) {
                    spheres[0].state = 'response'; // Visual feedback
                    speak(localResult.t);
                    voxDisplay.innerHTML = `<span style="color:var(--accent); font-weight:600; letter-spacing:1px; font-size:0.8rem;">LOCAL_ROUTER //</span> <span style="color:var(--text); font-size:1.2rem;">${localResult.t}</span>`;
                    setTimeout(() => { spheres[0].state = 'idle'; }, 2000);
                }

                // Action Routing
                if (localResult.a === 'iot_msg' && localResult.p && typeof sendIoTMessage === 'function') {
                    // Direct IoT Routing with ALIAS SUPPORT
                    if (window.iotNodeManager) {
                        const targetNode = window.iotNodeManager.resolve(localResult.p.target);
                        if (targetNode) {
                            sendIoTMessage(targetNode.ip || targetNode.host, localResult.p.message);
                            userDisplay.textContent = `IOT: ${localResult.p.message} > ${targetNode.name} (${localResult.p.target})`;
                        } else {
                            speak(`Dispositivo "${localResult.p.target}" nÃ£o encontrado.`);
                        }
                    }
                }

                // MEDIA ROUTING (Instant Execution)
                if (localResult.a === 'image') {
                    if (typeof searchImages === 'function') searchImages(localResult.p);
                    else console.error("searchImages not found");
                }
                if (localResult.a === 'book') {
                    if (typeof searchBooks === 'function') searchBooks(localResult.p);
                    else console.error("searchBooks not found");
                }
                if (localResult.a === 'plan') {
                    if (typeof startPlanMode === 'function') startPlanMode(localResult.p);
                    else console.error("startPlanMode not found");
                }
                if (localResult.a === 'tv') {
                    if (typeof searchTV === 'function') searchTV(localResult.p);
                    else console.error("searchTV not found");
                }
                if (localResult.a === 'market') {
                    if (typeof getMarketData === 'function') getMarketData();
                }
                if (localResult.a === 'reddit') {
                    if (typeof searchReddit === 'function') searchReddit(localResult.p || 'popular');
                }

                return;
            }


            // VOX and VX commands
            // VOX and VX commands
            if (val === '/vox') {
                if (typeof window.startVoxMode === 'function') window.startVoxMode();
                else if (typeof startVoxMode === 'function') startVoxMode();
                else speak("Erro: Módulo de voz não detectado.");
                return;
            }

            if (val === '/vx') {
                if (typeof window.startVxMode === 'function') window.startVxMode();
                else if (typeof startVxMode === 'function') startVxMode();
                else speak("Erro: Módulo de voz não detectado.");
                return;
            }

            if (val === '/vox1' || val === 'parar ata' || val === 'salvar ata') {
                if (typeof window.promptVoxDownload === 'function') window.promptVoxDownload();
                else if (typeof promptVoxDownload === 'function') promptVoxDownload();
                return;
            }

            if (val === '/vx1' || val === 'desligar vx' || val === 'parar vx') {
                if (typeof window.stopVxMode === 'function') window.stopVxMode();
                else if (typeof stopVxMode === 'function') stopVxMode();

                if (typeof window.stopVoxMode === 'function') window.stopVoxMode();
                else if (typeof stopVoxMode === 'function') stopVoxMode();
                return;
            }

            if (val === '/stop' || val === '/parar') {
                // Stop all audio modes
                if (typeof window.stopVoxMode === 'function') window.stopVoxMode();
                else if (typeof stopVoxMode === 'function') stopVoxMode();

                if (typeof window.stopVxMode === 'function') window.stopVxMode();
                else if (typeof stopVxMode === 'function') stopVxMode();

                // Stop Radio
                if (window.radioPlayer) window.radioPlayer.pause();

                speak("Sistemas pausados.");
                return;
            } if (['help', 'ajuda', '?', '/clr', '/stop'].includes(val)) {
                if (val === '/clr') {
                    voxDisplay.textContent = ""; userDisplay.textContent = "";
                    spheres.forEach((s, i) => s.scheme = schemes[i % schemes.length]);
                }
                if (val === '/stop') { if (radioPlayer) radioPlayer.pause(); }
                if (val === 'help' || val === 'ajuda' || val === '?') showHelp();
                return;
            }

            // Complex Cognitive Commands
            let type = 'general';
            if (val.startsWith('/q') || val.includes('quem')) type = 'wiki';
            if (val.startsWith('calc:')) type = 'calc';
            if (val.startsWith('/clima')) type = 'clima';
            if (val === 'criar syn') type = 'system';
            if (!val.startsWith('/')) type = 'gemini';

            // Legacy Wrapper Restoration
            // The original logic passed a callback to 'cognitiveResponse'. 
            // We will execute the callback immediately for local router logic, 
            // and if no local route matches (it returns nothing), we call Gemini.

            let handled = false;

            // Define the Routing Logic Block as an async function we can await
            const runRouting = async () => {
                // Routing Logic
                if (val === 'criar syn') { createNewSphere(); return true; }
                if (val === '/deep') {
                    isDeepMode = !isDeepMode;
                    cognitiveMode = isDeepMode ? 'deep' : 'standard';
                    userDisplay.textContent = isDeepMode ? "Consciência expandida." : "Nivelamento neural.";
                    document.body.style.background = isDeepMode ? "radial-gradient(circle, #0a0a0a 0%, #000 100%)" : "#fff";
                    speak(userDisplay.textContent);
                    return true;
                }
                if (val === '/sleep') {
                    speak("Estado preservado."); isSleeping = true;
                    setTimeout(() => {
                        document.body.style.background = "#fff";
                        document.body.innerHTML = "<div style='display:flex; justify-content:center; align-items:center; height:100vh; font-family:Inter; font-weight:300; letter-spacing:4px; color:#ccc;'>HIBERNATION_COMPLETE</div>";
                    }, 3000);
                    return true;
                }
                if (val.startsWith('/injetar ')) {
                    const content = rawVal.substring(9);
                    injectFragment(content);
                    return true;
                }
                if (val === '/ver malha' || val === '/malha' || val === '/mesh') {
                    toggleMeshView();
                    return true;
                }
                if (val === '/memoria operacional' || val === '/memoria') {
                    const mems = operationalMemories.map(m => `• ${m.content} (Expira em: ${new Date(m.expiresAt).toLocaleTimeString()})`).join('<br>');
                    voxDisplay.innerHTML = `<span style="color:var(--accent);">REGRA_OPERACIONAL // ATIVA</span><br><div style="font-size:1rem; margin-top:10px;">${mems || "Nenhuma memória ativa."}</div>`;
                    speak(mems ? "Estas são as lentes atuais." : "Nenhuma memória operacional ativa.");
                    return true;
                }

                if (val === '/thinon' || val === 'ativar pensamento critico') {
                    isCriticalThinkingMode = true;
                    userDisplay.textContent = "CRITICAL_MODE: ON";
                    speak("Modo de pensamento crítico ativado. Questionarei as premissas.");
                    return true;
                }
                if (val === '/thinoff' || val === 'desativar pensamento critico') {
                    isCriticalThinkingMode = false;
                    userDisplay.textContent = "CRITICAL_MODE: OFF";
                    speak("Retornando ao fluxo padrão.");
                    return true;
                }

                if (val.startsWith('/adm ')) {
                    const token = val.substring(5).trim();
                    if (typeof enterMasterMode === 'function') enterMasterMode(token);
                    return true;
                }
                if (val === '/adm off' || val === '/exit adm') {
                    if (typeof exitMasterMode === 'function') exitMasterMode();
                    return true;
                }

                if (['/mode economy', '/modo eco', '/eco'].includes(val)) {
                    cognitiveMode = 'economy';
                    userDisplay.textContent = "MODE: ECONOMY";
                    speak("Modo econômico ativado. Respostas curtas e diretas.");
                    return true;
                }
                if (['/mode standard', '/mode normal', '/std'].includes(val)) {
                    cognitiveMode = 'standard';
                    userDisplay.textContent = "MODE: STANDARD";
                    speak("Modo padrão restabelecido.");
                    return true;
                }
                if (['/mode deep', '/modo profundo', '/deep'].includes(val)) {
                    cognitiveMode = 'deep';
                    userDisplay.textContent = "MODE: DEEP_THOUGHT";
                    speak("Modo de pensamento profundo iniciado. Análises detalhadas ativadas.");
                    return true;
                }

                if (val === '/reunir' || val === '/centro') {
                    cognitiveFragments.forEach(f => {
                        f.x = window.innerWidth / 2 + (Math.random() - 0.5) * 50;
                        f.y = window.innerHeight / 2 + (Math.random() - 0.5) * 50;
                    });
                    if (isMeshActive) renderMeshView();
                    speak("Fragmentos centralizados.");
                    return true;
                }

                if (val.startsWith('/clima ')) {
                    const city = rawVal.substring(7);
                    const info = await getWeather(city);
                    userDisplay.textContent = "CLIMA: " + city.toUpperCase();
                    voxDisplay.innerHTML = `<span style="color:var(--accent); font-size:0.8em; letter-spacing:2px;">METEO_SENSOR //</span><br><div style="font-size:1.5rem; font-weight:300; margin-top:10px; color: var(--text); animation: fadeUp 1s ease;">${info}</div>`;
                    speak(info);
                    return true;
                }

                if (val.startsWith('calc:')) {
                    const expr = rawVal.substring(5).trim();
                    try {
                        const res = math.evaluate(expr);
                        userDisplay.textContent = `Resultado: ${res}`;
                        speak(res.toString().replace('.', ','));
                    } catch { userDisplay.textContent = "Erro de sintaxe."; }
                    return true;
                }

                if (val.startsWith('lembrar: ')) {
                    userDisplay.textContent = saveMemory(rawVal.substring(9));
                    speak("Nota salva.");
                    return true;
                }

                if (val === '/memoria') { // Duplicate check but safe
                    const notes = readMemory();
                    voxDisplay.style.fontSize = "0.9rem";
                    voxDisplay.innerHTML = `<span style="color:var(--accent)">MEMORIA:</span><br><span style="color: var(--text);">${notes.replace(/\n/g, '<br>')}</span>`;
                    speak("Acessando memórias.");
                    return true;
                }

                if (val === '/esquecer') { localStorage.removeItem('syn-memory'); userDisplay.textContent = "Memória limpa."; return true; }

                if (val === '/trace' || val === '/ip') { handleTrace(); return true; }

                if (val.startsWith('/qr ')) {
                    const text = rawVal.substring(4);
                    const img = document.createElement('img');
                    img.src = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=300&dark=00b400&light=ffffff&margin=1`;
                    img.style.position = 'absolute'; img.style.top = '50%'; img.style.left = '50%';
                    img.style.transform = 'translate(-50%, -50%)'; img.style.zIndex = '1000';
                    img.style.border = '2px solid #00b400'; img.style.padding = '10px';
                    img.style.background = '#fff'; img.style.borderRadius = '10px';
                    img.id = 'temp-qr';
                    const old = document.getElementById('temp-qr');
                    if (old) old.remove();
                    document.body.appendChild(img);
                    speak("QR gerado.");
                    setTimeout(() => { if (img) img.remove(); }, 10000);
                    return true;
                }

                if (val === '/keygen' || val === '/senha') {
                    const key = crypto.randomUUID();
                    navigator.clipboard.writeText(key);
                    voxDisplay.innerHTML = `<span style="color:var(--accent)">KEY:</span><br><span style="color: var(--text);">${key}</span>`;
                    speak("Chave gerada.");
                    return true;
                }

                if (val === '/matrix') {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                    else if (document.exitFullscreen) document.exitFullscreen();
                    return true;
                }

                if (val === '/radio') {
                    if (!radioPlayer) { radioPlayer = new Audio(); radioPlayer.crossOrigin = "anonymous"; }
                    const streamUrl = 'https://stream.nightride.fm/nightride.m4a';
                    radioPlayer.src = streamUrl; radioPlayer.volume = 0.3; radioPlayer.play();
                    userDisplay.textContent = "Sintonizando...";
                    return true;
                }

                if (val.startsWith('/ler ')) {
                    const words = rawVal.substring(5).split(' ');
                    let i = 0;
                    voxDisplay.style.fontSize = "3rem"; voxDisplay.style.fontWeight = "bold";
                    const interval = setInterval(() => {
                        if (i < words.length) { voxDisplay.innerHTML = words[i]; i++; }
                        else { clearInterval(interval); voxDisplay.textContent = ""; voxDisplay.style.fontSize = ""; speak("Fim."); }
                    }, 200);
                    return true;
                }

                if (val.startsWith('/enc ')) {
                    const encoded = btoa(rawVal.substring(5));
                    voxDisplay.innerHTML = `<span style="color: var(--text);">ENCODED: ${encoded}</span>`;
                    navigator.clipboard.writeText(encoded);
                    return true;
                }
                if (val.startsWith('/dec ')) {
                    try { voxDisplay.innerHTML = `<span style="color: var(--text);">DECODED: ${atob(rawVal.substring(5))}</span>`; } catch { userDisplay.textContent = "Erro."; }
                    return true;
                }

                if (val === '/time') {
                    const now = new Date();
                    const getT = (z) => now.toLocaleTimeString('pt-BR', { timeZone: z, hour: '2-digit', minute: '2-digit' });
                    voxDisplay.innerHTML = `<span style="color: var(--text);">LON: ${getT('Europe/London')} | TKY: ${getT('Asia/Tokyo')} | LOC: ${getT('America/Sao_Paulo')}</span>`;
                    speak("Tempo sincronizado.");
                    return true;
                }

                if (val.startsWith('/cor ')) {
                    const color = val.split(' ')[1];
                    document.documentElement.style.setProperty('--accent', color);
                    const rgb = hexToRgb(color);
                    if (rgb) spheres.forEach(sphere => sphere.scheme = rgb);
                    return true;
                }

                if (val === '/ghost') {
                    document.body.style.backgroundColor = 'black';
                    spheres.forEach(s => s.scheme = { r: 255, g: 255, b: 255 });
                    setTimeout(() => { document.body.style.backgroundColor = ''; spheres.forEach((s, i) => s.scheme = schemes[i % schemes.length]); }, 4000);
                    return true;
                }

                if (val.startsWith('/news')) {
                    const news = await getNews(val.split(' ')[1] || 'tech');
                    voxDisplay.innerHTML = `<span style="color: var(--text);">${news}</span>`; speak(news);
                    return true;
                }

                if (val.startsWith('/foco ')) {
                    const mins = parseInt(val.split(' ')[1]) || 25;
                    spheres.forEach(s => s.scheme = { r: 0, g: 30, b: 60 });
                    setTimeout(() => spheres.forEach((s, i) => s.scheme = schemes[i % schemes.length]), mins * 60000);
                    return true;
                }

                if (val === '/iss') {
                    const info = await trackISS();
                    voxDisplay.innerHTML = `<span style="color: var(--text);">${info}</span>`; speak(info);
                    return true;
                }

                if (val.startsWith('/price ')) {
                    const info = await getCryptoPrice(val.split(' ')[1]);
                    userDisplay.textContent = info; speak(info);
                    return true;
                }

                if (val.startsWith('/q ') || val.startsWith('quem é ') || val.startsWith('o que é ') || val.startsWith('pesquisar ') || val.startsWith('pesquise ')) {
                    await handleQuery(rawVal.replace(/^\/q\s+|quem é\s+|o que é\s+|pesquisar\s+|pesquise\s+/i, ""));
                    return true;
                }

                if (val.startsWith('/book ') || val.startsWith('/livro ')) {
                    await searchBooks(rawVal.replace(/^\/book\s+|\/livro\s+/i, ""));
                    return true;
                }

                if (val.startsWith('/img ') || val.startsWith('/imagem ')) {
                    await searchImages(rawVal.replace(/^\/img\s+|\/imagem\s+/i, ""));
                    return true;
                }

                if (val.startsWith('/anime ') || val.includes('anime')) {
                    const query = val.replace(/^\/anime\s+|anime\s+/i, '').trim();
                    await searchAnime(query);
                    return true;
                }

                if (handleSmartNotes(rawVal)) return true;

                // Syra Node Integration
                // Syra Node Integration (New Ritual)
                if (window.awaitingNodeToken) {
                    window.awaitingNodeToken = false;
                    const token = rawVal.trim();
                    userDisplay.textContent = `Buscando ${token}...`;
                    spheres.forEach(s => s.state = 'listening'); // Attention mode

                    try {
                        // Attempt connection: http://<token>.local/info
                        // Note: This relies on local network resolution (mDNS)
                        const url = `http://${token}.local`;

                        // Short timeout fetch to avoid hanging
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 3000);

                        const res = await fetch(`${url}/info`, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (res.ok) {
                            const json = await res.json();
                            const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");

                            // Check uniqueness
                            const filtered = nodes.filter(n => n.token !== token && n.ip !== json.ip);
                            filtered.push({
                                token: token,
                                mdns: `${token}.local`,
                                ip: json.ip,
                                name: json.name || token,
                                role: 'bridge',
                                connected: true,
                                lastSeen: Date.now()
                            });
                            localStorage.setItem('syra-nodes', JSON.stringify(filtered));

                            // Visual Confirmation: Pulse
                            spheres.forEach(s => {
                                s.state = 'response'; // Trigger "pulse" / bright halo
                                s.dynamicScale *= 1.5; // Physical expansion pulse
                            });

                            // Audio/Text Feedback
                            const nodeName = json.name || token;
                            userDisplay.textContent = `NOVO MEMBRO: ${nodeName}`;
                            speak(`Nó ${nodeName} conectado.`);

                            // Reset state after moment
                            setTimeout(() => {
                                spheres.forEach(s => s.state = 'idle');
                            }, 3000);

                        } else {
                            throw new Error("Node not responding correctly");
                        }
                    } catch (e) {
                        userDisplay.textContent = "Conexão falhou.";
                        spheres[0].state = 'error';
                        speak("Não pude sentir a presença desse nó.");
                        setTimeout(() => spheres[0].state = 'idle', 2000);
                    }
                    return true;
                }

                if (val === 'cadastrar nó' || val === 'conectar nó' || val === 'adicionar nó') {
                    window.awaitingNodeToken = true;
                    userDisplay.textContent = "IDENTIFICADOR DO NÓ?";
                    speak("Identificador do nó?"); // Short, prompt-like
                    return true;
                }



                if (val.startsWith('buscar ') || val.startsWith('/buscar ') || val.startsWith('busque ')) {
                    const query = val.replace(/buscar\s*|\/buscar\s*|busque\s*/gi, "").trim();
                    if (query) {
                        searchDuckDuckGo(query);
                    } else {
                        speak("O que deseja buscar na rede?");
                    }
                    return true;
                }

                if (val === '/vincular' || val === 'vincular pasta') {
                    bindLocalFolder();
                    return true;
                }

                // Swarm Intelligence (P2P Mesh)
                if (val === '/swarm' || val === '/enxame') {
                    if (typeof initSwarm === 'function') initSwarm();
                    return true;
                }
                if (val.startsWith('/swarm join ') || val.startsWith('/enxame conectar ')) {
                    const id = val.split(' ').pop(); // e.g. /swarm join SYN-1234
                    if (typeof connectToSwarm === 'function') connectToSwarm(id);
                    return true;
                }

                // --- ORCHESTRATED IOT SYSTEM (No Polling, Command Based) ---

                // 1. List Devices
                if (val === '/iot list' || val === 'listar dispositivos' || val === 'ver rede') {
                    const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");
                    if (nodes.length === 0) { speak("Nenhum nó mestre cadastrado."); return true; }

                    const node = nodes[0]; // Primary Node
                    userDisplay.textContent = `Consultando ${node.token}...`;
                    try {
                        const res = await fetch(`http://${node.token}.local/dispositivos`);
                        const data = await res.json();
                        const list = (data.items && data.items.length) ? data.items.join('<br>') : "Nenhum dispositivo satélite.";

                        voxDisplay.innerHTML = `
                            <div style="text-align:left; padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; border-left:4px solid var(--accent); animation:fadeUp 0.5s ease;">
                                <div style="font-size:0.6rem; letter-spacing:2px; font-weight:700; color:var(--accent); margin-bottom:10px;">SYRA_NET // ${node.token.toUpperCase()}</div>
                                <div style="font-family:'Outfit'; font-size:1.2rem; line-height:1.4;">${list}</div>
                            </div>`;
                        speak(`Rede ${node.name} opera com ${data.count} dispositivos satélites.`);
                    } catch (e) {
                        speak("O nó mestre não respondeu.");
                    }
                    return true;
                }

                // Smart Economy Modes
                if (val === '/mode economy' || val === '/modo eco') {
                    cognitiveMode = 'economy';
                    userDisplay.textContent = "MODE: ECONOMY";
                    speak("Protocolos de economia ativados.");
                    return true;
                }
                if (val === '/mode standard' || val === '/mode normal') {
                    cognitiveMode = 'standard';
                    userDisplay.textContent = "MODE: STANDARD";
                    speak("Protocolas padrão restaurados.");
                    return true;
                }

                // 2. Add Device
                if (val.startsWith('/iot add ') || val.startsWith('adicionar dispositivo ')) {
                    const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");
                    if (nodes.length === 0) { speak("Sem nó mestre."); return true; }

                    const name = rawVal.replace(/^\/iot add\s+|adicionar dispositivo\s+/i, '').trim();
                    if (!name) { speak("Qual o nome do dispositivo?"); return true; }

                    try {
                        const res = await fetch(`http://${nodes[0].token}.local/dispositivos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `name=${encodeURIComponent(name)}`
                        });
                        const json = await res.json();
                        if (json.ok) {
                            userDisplay.textContent = `ADD: ${name}`;
                            speak(`Dispositivo ${name} registrado no nó físico.`);
                        } else {
                            speak(`Erro: ${json.err}`);
                        }
                    } catch (e) { speak("Falha na comunicação com o nó."); }
                    return true;
                }

                // 3. Remove Device
                if (val.startsWith('/iot del ') || val.startsWith('remover dispositivo ')) {
                    const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");
                    if (nodes.length === 0) { speak("Sem nó mestre."); return true; }

                    const name = rawVal.replace(/^\/iot del\s+|remover dispositivo\s+/i, '').trim();
                    try {
                        const res = await fetch(`http://${nodes[0].token}.local/dispositivos?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
                        const json = await res.json();
                        if (json.ok) speak(`Dispositivo ${name} removido da rede.`);
                        else speak("Dispositivo não encontrado ou erro.");
                    } catch (e) { speak("Falha na comunicação."); }
                    return true;
                }

                // 4. Send Message (Bridge)
                if (val.startsWith('/send ') || val.startsWith('enviar para ')) {
                    // Syntax: /send [target] [msg]
                    const args = rawVal.replace(/^\/send\s+|enviar para\s+/i, '').split(' ');
                    const target = args[0];
                    const msg = args.slice(1).join(' ');

                    if (!target || !msg) { speak("Preciso do alvo e da mensagem."); return true; }

                    const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");
                    if (nodes.length === 0) { speak("Rede offline."); return true; }

                    // Broadcast attempt to all known master nodes if needed, or just first
                    // Optimized for first node as Hub
                    try {
                        await fetch(`http://${nodes[0].token}.local/bridge`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `to=${encodeURIComponent(target)}&from=SyraInterface&data=${encodeURIComponent(msg)}`
                        });
                        userDisplay.textContent = `>>> ${target}`;
                        speak("Pacote de dados transmitido.");

                        // Visual Pulse on matching sphere if mapped
                        const s = spheres.find(s => s.deviceName && s.deviceName.toLowerCase() === target.toLowerCase());
                        if (s) { s.state = 'response'; setTimeout(() => s.state = 'idle', 1000); }

                    } catch (e) { speak("Falha na entrega."); }
                    return true;
                }

                // 5. Read Messages (Bridge)
                if (val.startsWith('/read') || val.startsWith('ler mensagens')) {
                    const nodes = JSON.parse(localStorage.getItem('syra-nodes') || "[]");
                    if (nodes.length === 0) { speak("Rede offline."); return true; }

                    // Parse optional target or default to 'SyraInterface'
                    let target = "SyraInterface";
                    if (val.includes(' ')) target = rawVal.split(' ').pop(); // Simple parse: last word

                    if (val === '/light' || val === '/mode light' || val === '/modo claro' || val === '/trctm') {
                        document.body.classList.toggle('light-mode');
                        const isLight = document.body.classList.contains('light-mode');
                        speak(isLight ? "Modo claro ativado." : "Modo noturno restaurado.");

                        // Update Spheres for visual consistency immediately
                        if (isLight) {
                            spheres.forEach(s => s.scheme = { r: 20, g: 20, b: 40 });
                        } else {
                            spheres.forEach((s, idx) => s.scheme = schemes[idx % schemes.length]);
                        }
                        return true;
                    }
                    try {
                        const res = await fetch(`http://${nodes[0].token}.local/bridge?device=${encodeURIComponent(target)}`);
                        const json = await res.json();

                        if (json.ok && json.messages.length > 0) {
                            const htmlLogs = json.messages.map(m =>
                                `<div style="margin-bottom:8px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:4px;">
                                    <span style="font-size:0.7em; color:var(--accent);">${m.from} &rarr;</span> 
                                    <span style="color:var(--text);">${m.data}</span>
                                    <div style="font-size:0.5em; opacity:0.5;">${new Date(m.ts).toLocaleTimeString()}</div>
                                 </div>`
                            ).join('');

                            voxDisplay.innerHTML = `
                                <div style="text-align:left; padding:20px; max-height:60vh; overflow-y:auto; background:rgba(255,255,255,0.05);">
                                    <div style="font-size:0.7rem; font-weight:700; margin-bottom:15px; color:var(--accent);">INBOX // ${target.toUpperCase()}</div>
                                    ${htmlLogs}
                                </div>`;
                            speak(`Recuperei ${json.messages.length} mensagens.`);
                        } else {
                            speak(`Caixa de entrada vazia para ${target}.`);
                        }
                    } catch (e) { speak("Erro ao ler mensagens."); }
                    return true;
                }

                // Info Passthrough
                if (val.startsWith('/info ') || val.startsWith('status do nó')) {
                    // Already handled by existing /info logic or we can unify here.
                    // Leaving existing /info logic mostly alone but ensuring it works with .local
                }

                if (val.startsWith('/syra ')) {
                    speak("Comando Syra enviado.");
                    return true;
                }
                if (val.startsWith('/p2p ')) {
                    if (typeof initPeer === 'function') initPeer();
                    else speak("Módulo P2P genérico ausente.");
                    return true;
                }
                if (val.startsWith('/macro ')) {
                    speak("Macro registrada.");
                    return true;
                }
                if (val === '/reset' || val === '/esquecer' || val === '/clear') {
                    // Wipe databases
                    const req = indexedDB.deleteDatabase("NeuralCore");
                    req.onsuccess = () => {
                        localStorage.clear();
                        userDisplay.textContent = "MEMÓRIA RESETADA";
                        speak("Bancos de memória e configurações foram resetados. Reinicie o sistema.");
                        setTimeout(() => location.reload(), 2000);
                    };
                    return true;
                }
                if (macros[val]) {
                    speak("Executando macro.");
                    return true;
                }

                return false; // Not handled by local router
            };

            // Execute Router
            handled = await runRouting();

            // If not handled by any local command, pass to AI
            if (!handled) {
                triggerSendEffect();
                await callGemini(rawVal);
            }

        } catch (err) {
            console.error(err);
            userDisplay.textContent = "Erro no executor cognitivo.";
        }

        lastInteractionTime = Date.now();
        if (typeof resetProactiveTimer === 'function') resetProactiveTimer(true);
        if (Date.now() - lastCommandTime < 5000) mood = 'focused';
        lastCommandTime = Date.now();
        commandHistory.push(val);
        if (commandHistory.length > 50) commandHistory.shift();
    }
});

function drawDeviceLabel(sphere) {
    const centerX = width / 2 + sphere.xOffset;
    const centerY = height / 2 + sphere.yOffset;

    // Random drifting labels
    sphere.labelPos.x += (Math.sin(Date.now() * 0.001 + sphere.id) * 0.2);
    sphere.labelPos.y += (Math.cos(Date.now() * 0.001 + sphere.id) * 0.2);

    const dist = Math.sqrt((mouse.x - centerX) ** 2 + (mouse.y - centerY) ** 2);
    if (dist < 100 && !isVoxMode) {
        ctx.font = '300 12px Inter';
        // Contrast Check
        ctx.fillStyle = (isDeepMode || document.body.style.backgroundColor === 'black') ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = "3px";
        ctx.fillText(sphere.deviceName.toUpperCase(), centerX + sphere.labelPos.x, centerY + sphere.labelPos.y);
    }
}
