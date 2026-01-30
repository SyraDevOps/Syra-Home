// COGNITIVE PIPELINE - Critical Thinking & Dreaming

async function processCriticalThought() {
    let target = null;
    let type = 'fragment';

    if (cognitiveFragments.length > 0 && Math.random() > 0.5) {
        target = cognitiveFragments[Math.floor(Math.random() * cognitiveFragments.length)];
    } else if (operationalMemories.length > 0) {
        target = operationalMemories[Math.floor(Math.random() * operationalMemories.length)];
        type = 'memory';
        if (!target.debateLog) target.debateLog = [`[MEMORY]: ${target.content}`];
    }

    if (!target) return;

    const content = target.content || target.text;
    const latency = Math.floor(Math.random() * 501 + 300);
    spheres[0].state = 'processing';
    await new Promise(r => setTimeout(r, latency));

    try {
        voxDisplay.innerHTML = `
            <div id="garden-pipeline" style="animation: fadeUp 1s ease; border-left: 2px solid #555; padding-left: 15px;">
                <span style="color:var(--text); opacity:0.5; font-size:0.6em; letter-spacing:2px;">GARDEN_PIPELINE // SEED</span><br>
                <div style="font-size:0.9rem; margin-top:5px; color: rgba(255,255,255,0.7); font-style:italic;">"${content.substring(0, 40)}..."</div>
            </div>`;

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

        await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));

        const critiquePrompt = `Contra "${content}", gere ANTÍTESE direta e afiada. Max 15 palavras.`;
        const critique = await getGeminiInsight(critiquePrompt);

        if (pipelineDiv) {
            pipelineDiv.innerHTML += `
                <div style="margin-top: 10px; border-left: 2px solid #ff4444; padding-left: 10px; animation: fadeUp 1s ease;">
                    <span style="color:#ff4444; font-size:0.6em; letter-spacing:2px;">>> ANTÍTESE</span><br>
                    <div style="color: var(--text); font-weight: 400;">"${critique}"</div>
                </div>`;
        }

        if (type === 'fragment' && target.debateLog) {
            target.debateLog.push(`[DÚVIDA]: ${doubt}`);
            target.debateLog.push(`[ANTÍTESE]: ${critique}`);
            localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        }

        await new Promise(r => setTimeout(r, 4000));

        const synthPrompt = `Tese: "${content}". Crítica: "${critique}". Gere SÍNTESE PARCIAL. Aceite ambiguidade. Seja humilde. Max 15 palavras.`;
        const synthesis = await getGeminiInsight(synthPrompt);

        if (pipelineDiv) {
            pipelineDiv.innerHTML += `
                <div style="margin-top: 15px; border-left: 2px solid #00ffea; padding-left: 10px; animation: fadeUp 1.5s ease;">
                    <span style="color:#00ffea; font-size:0.6em; letter-spacing:2px;">>> SÍNTESE (AMBIGUIDADE)</span><br>
                    <div style="color: var(--text); font-weight: 300;">"${synthesis}"</div>
                </div>`;
        }

        if (type === 'fragment' && target.debateLog) {
            target.debateLog.push(`[SÍNTESE]: ${synthesis}`);
            localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
        }

        spheres[0].state = 'idle';

    } catch (e) {
        spheres[0].state = 'idle';
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
