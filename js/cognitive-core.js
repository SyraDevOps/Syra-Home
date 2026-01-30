// COGNITIVE CORE - Initialization, Intent, Tools

// Snapshot
let cognitiveSnapshot = null;

function createCognitiveSnapshot() {
    cognitiveSnapshot = {
        timestamp: Date.now(),
        fragmentCount: cognitiveFragments.length,
        memoryCount: operationalMemories.length,
        trustScore: typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5,
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

// Logic
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
    return Math.min(base, 4500);
}

function deliver() {
    spheres[0].state = 'response';
    isSynchronized = true;
    vibrationAmount = 15;
    ripples.push({ x: width / 2, y: height / 2, radius: 10, alpha: 1 });
    lastInteractionTime = Date.now();
}

// Core Handlers
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

function submitFeedback(el) {
    const tray = document.getElementById('neural-feedback');
    const box = el.querySelector('.feedback-box');
    const mark = el.querySelector('.mark');
    hapticFeedback(60);

    box.style.borderColor = 'var(--accent)';
    box.style.backgroundColor = 'rgba(0,180,0,0.05)';
    mark.style.opacity = '1';
    mark.style.transform = 'scale(1) rotate(0deg)';

    speak("Obrigado.");

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

// Memory Cleanup Logic
setInterval(() => {
    const now = Date.now();
    const initialLen = operationalMemories.length;
    operationalMemories = operationalMemories.filter(m => m.expiresAt > now);
    if (operationalMemories.length < initialLen) {
        localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
    }
}, 300000);

// File System Bridge
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

// Autonomous Tools
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
window.handleSmartNotes = handleSmartNotes;

// AI Logic (CallGemini) moved here for context
async function cognitiveResponse(input, type, logicExecutor) {
    perceive();
    const thinkTime = getThinkTime(input, type);
    spheres[0].state = 'thinking';

    const [result] = await Promise.all([
        logicExecutor(),
        new Promise(r => setTimeout(r, thinkTime))
    ]);

    deliver();
    return result;
}

async function callGemini(prompt) {
    if (isOfflineMode) {
        userDisplay.textContent = "Offline Mode.";
        return;
    }
    const API_KEY = typeof ConfigManager !== 'undefined' ? ConfigManager.getGeminiKey() : '';
    if (!API_KEY) {
        speak("Chave de API não configurada. Por favor, abra as configurações.");
        if (typeof openSettings === 'function') openSettings();
        return;
    }

    const conf = getModelConfig();
    const MODEL = conf.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    spheres[0].state = 'processing';
    userDisplay.textContent = "";

    const systemState = {
        mode: cognitiveMode,
        focus: mood,
        nodes: spheres.length,
        user: userName
    };

    let relevantMemories = [];
    const lowerPrompt = prompt.toLowerCase();
    const isMemoryIntent = /lembra|anotação|anotado|memória|sabe sobre|o que sabe|conhece/i.test(lowerPrompt);
    const isVolatile = /^(que horas|qual data|temperatura|cotação|preço)/i.test(lowerPrompt);

    if ((!isVolatile || isMemoryIntent) && typeof window.operationalMemories !== 'undefined') {
        const terms = lowerPrompt.split(' ').filter(w => w.length > 3);
        relevantMemories = window.operationalMemories.map(m => {
            let score = 0;
            const content = (m.content || m.text || "").toLowerCase();
            terms.forEach(t => { if (content.includes(t)) score += 1; });
            if (content.includes(lowerPrompt)) score += 5;
            return { text: m.content || m.text, score, date: m.timestamp };
        })
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

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

    if (typeof ConversationManager !== 'undefined') {
        ConversationManager.add('user', JSON.stringify({ user_input: prompt, state: systemState }));
    }

    const history = (typeof ConversationManager !== 'undefined') ? ConversationManager.getHistory() : [{ parts: [{ text: JSON.stringify({ user_input: prompt, state: systemState }) }] }];

    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            signal: controller.signal,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: history,
                generationConfig: {
                    maxOutputTokens: 800,
                    temperature: 0.7
                },
                systemInstruction: {
                    parts: [{ text: strictSystemPrompt }]
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status} `);
        const data = await response.json();

        let rawText = data.candidates[0].content.parts[0].text.trim();
        if (rawText.startsWith('```json')) rawText = rawText.replace(/```json|```/g, '').trim();

        if (typeof ConversationManager !== 'undefined') {
            ConversationManager.add('model', rawText);
        }

        let ai = { t: "", a: "none", p: null };
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                ai = { ...ai, ...parsed };
                const textOutside = rawText.replace(jsonMatch[0], '').trim();
                if (textOutside && (!ai.t || ai.t === 'aviso')) {
                    ai.t = textOutside;
                }
            } catch (e) {
                ai.t = rawText;
            }
        } else {
            ai.t = rawText;
        }

        if (ai.a === 'generate_tool') {
            await storeLocalTool(ai.p.name, ai.p.code);
            speak(`Nova ferramenta "${ai.p.name}" foi codificada e integrada ao núcleo.`);
            return;
        }

        if (ai.a === 'use_tool') {
            if (ai.p.name && (ai.p.name.toLowerCase().includes('wiki') || ai.p.name === 'searchWiki')) {
                const q = ai.p.args ? (Array.isArray(ai.p.args) ? ai.p.args[0] : ai.p.args) : "O que?";
                handleQuery(q);
                return;
            }
            const toolResult = await executeLocalTool(ai.p.name, ai.p.args);
            voxDisplay.innerHTML = `<div style="padding:20px; border:1px solid var(--accent);">
                <span style="font-size:0.5rem; color:var(--accent);">TOOL_EXECUTED // ${ai.p.name}</span><br>${toolResult}
            </div>`;
            return;
        }

        if (ai.t && ai.t.length > 1 && ai.t !== 'aviso') {
            spheres[0].state = 'response';
            isSynchronized = true;
            neuralSemantics.store(`${prompt} -> ${ai.t}`);

            if (typeof window.logInteraction === 'function') {
                window.logInteraction('ai_conversation', prompt, 1, { response: ai.t.substring(0, 100) });
            }

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
            speak(ai.t);
        }

        if (!ai.t && ai.a === 'none') {
            speak("...");
        }

        if (ai.a !== 'none') {
            if (ai.a === 'theme') {
                let mode = (ai.p && typeof ai.p === 'object') ? ai.p.mode : ai.p;
                if (!mode || mode === 'toggle' || mode === 'switch') {
                    mode = document.body.classList.contains('light-mode') ? 'dark' : 'light';
                }
                document.body.dataset.themeSet = 'true';
                if (mode === 'light' || mode === 'claro') {
                    document.body.classList.add('light-mode');
                    if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') {
                        spheres.forEach((s, idx) => {
                            s.scheme = schemes[idx % schemes.length];
                        });
                    }
                    speak("Modo claro ativado.");
                } else {
                    document.body.classList.remove('light-mode');
                    if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') {
                        spheres.forEach((s, idx) => {
                            s.scheme = schemes[idx % schemes.length];
                        });
                    }
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
                if (typeof window.savePermanentMemory === 'function') {
                    window.savePermanentMemory(content, 'explicit_memory');
                }
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
                try { await fetch(`${nodeHost}/send?target=${target}&msg=${encodeURIComponent(msg)}`); } catch (e) { }
                speak(`Comando enviado para ${target}.`);
                return;
            }
            if (ai.a === 'weather') {
                const city = (ai.p && typeof ai.p === 'object') ? ai.p.city : ai.p;
                const info = await getWeather(city);
                if (cognitiveMode === 'economy') {
                    speak(`Clima em ${city}: ${info}`);
                    voxDisplay.innerHTML = `<div style="font-size:1.5rem">${info}</div>`;
                } else {
                    const analysis = await getGeminiInsight(info);
                    speak(analysis);
                }
                return;
            }
            if (ai.a === 'image') { searchImages((ai.p && typeof ai.p === 'object') ? ai.p.query : ai.p); return; }
            if (ai.a === 'book') { searchBooks((ai.p && typeof ai.p === 'object') ? ai.p.title : ai.p); return; }
        }

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
