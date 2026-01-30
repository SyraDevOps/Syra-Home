// AUDIO MODULE - SORY
// Enhanced Speech Recognition with lazy microphone initialization

// recognition managed globally in variables.js
let microphoneStream = null;
let isRecording = false;

// Lazy initialization - only request mic when needed
async function initMicrophone() {
    if (microphoneStream) return true;

    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000
            }
        });
        console.log('[MIC] Initialized successfully');
        return true;
    } catch (e) {
        console.error('[MIC] Permission denied:', e);
        speak("Permissão de microfone negada.");
        return false;
    }
}

function stopMicrophone() {
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
        console.log('[MIC] Stopped and released');
    }
}

function initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('[STT] Speech Recognition not supported');
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();

    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    return rec;
}

// VOX Mode - Continuous transcription with timestamps
// voxTranscript and voxStartTime are managed globally in variables.js

async function startVoxMode() {
    const micReady = await initMicrophone();
    if (!micReady) return;

    if (!recognition) recognition = initRecognition();
    if (!recognition) {
        speak("Reconhecimento de voz não suportado neste navegador.");
        return;
    }

    voxTranscript = [];
    voxStartTime = Date.now();
    isRecording = true;

    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                const text = result[0].transcript.trim();
                const lowerText = text.toLowerCase();

                // Check for exit commands with better detection
                if (lowerText.match(/encerrar\s+(grava[çc][aã]o|vox)/i) ||
                    lowerText.match(/parar\s+(grava[çc][aã]o|vox)/i) ||
                    lowerText.match(/finalizar\s+(grava[çc][aã]o|vox)/i) ||
                    lowerText === 'encerrar' ||
                    lowerText === 'parar') {
                    console.log('[VOX] Exit command detected:', text);
                    promptVoxDownload();
                    return;
                }

                const timestamp = new Date(Date.now()).toLocaleTimeString('pt-BR');

                voxTranscript.push({
                    time: timestamp,
                    text: text,
                    confidence: result[0].confidence
                });

                updateVoxDisplay();
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('[VOX] Error:', event.error);
        if (event.error === 'no-speech' && isRecording) {
            setTimeout(() => {
                if (isRecording) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('[VOX] Recognition already started');
                    }
                }
            }, 500);
        }
    };

    recognition.onend = () => {
        if (isRecording) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('[VOX] Recognition already started');
                }
            }, 100);
        }
    };

    recognition.start();
    spheres[0].state = 'listening';
    userDisplay.textContent = "VOX MODE ATIVO";

    voxDisplay.innerHTML = `
        <div class="glass-card" style="max-width:800px; margin:0 auto; padding:20px; text-align:center; animation:fadeUp 0.8s ease;">
            <div style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700; margin-bottom:15px;">VOX_ATA // GRAVANDO</div>
            <div style="font-size:0.85rem; opacity:0.7; line-height:1.6;">
                Gravação iniciada. Fale normalmente.<br>
                Para encerrar, diga: <span style="color:var(--accent);">"encerrar gravação"</span>
            </div>
        </div>
    `;

    speak("Modo Vox ativado. Gravando ata.");
}

function updateVoxDisplay() {
    const transcriptHtml = voxTranscript.map((entry, idx) => `
        <div style="display:flex; gap:15px; padding:12px; border-bottom:1px solid rgba(var(--text-rgb), 0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(var(--text-rgb), 0.03)'" onmouseout="this.style.background='transparent'">
            <div style="min-width:70px; font-size:0.65rem; opacity:0.5; font-family:'Courier New'; letter-spacing:1px;">${entry.time}</div>
            <div style="flex:1; font-size:0.85rem; line-height:1.5; color:var(--text);">${entry.text}</div>
            <div style="min-width:40px; text-align:right; font-size:0.6rem; opacity:0.3;">${Math.round(entry.confidence * 100)}%</div>
        </div>
    `).join('');

    voxDisplay.innerHTML = `
        <div class="glass-card" style="max-width:800px; margin:0 auto; padding:0; animation:fadeUp 0.8s ease;">
            <div style="padding:20px; border-bottom:1px solid rgba(var(--text-rgb), 0.1); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700;">VOX_ATA // GRAVANDO</span>
                <span style="font-size:0.6rem; opacity:0.5;">${voxTranscript.length} SEGMENTOS</span>
            </div>
            <div style="max-height:60vh; overflow-y:auto;">
                ${transcriptHtml || '<div style="padding:40px; text-align:center; opacity:0.3;">Aguardando fala...</div>'}
            </div>
            <div style="padding:15px; border-top:1px solid rgba(var(--text-rgb), 0.1); text-align:center; font-size:0.7rem; opacity:0.5;">
                Diga "encerrar gravação" para finalizar
            </div>
        </div>
    `;
}

function promptVoxDownload() {
    isRecording = false;
    if (recognition) recognition.stop();

    const duration = Math.floor((Date.now() - voxStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    voxDisplay.innerHTML = `
        <div class="glass-card" style="max-width:500px; margin:0 auto; padding:30px; text-align:center; animation:fadeUp 0.8s ease;">
            <div style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700; margin-bottom:20px;">GRAVAÇÃO ENCERRADA</div>
            <div style="font-size:0.9rem; margin-bottom:25px; opacity:0.8;">
                Duração: ${minutes}min ${seconds}s<br>
                Segmentos: ${voxTranscript.length}
            </div>
            <div style="display:flex; gap:15px; justify-content:center;">
                <button onclick="downloadVoxTranscript()" style="padding:12px 30px; background:var(--accent); color:#000; border:none; border-radius:25px; cursor:pointer; font-size:0.75rem; letter-spacing:2px; font-weight:700; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">BAIXAR ATA</button>
                <button onclick="closeVoxMode()" style="padding:12px 30px; background:transparent; color:var(--text); border:1px solid rgba(var(--text-rgb), 0.3); border-radius:25px; cursor:pointer; font-size:0.75rem; letter-spacing:2px; transition: all 0.2s;" onmouseover="this.style.background='rgba(var(--text-rgb), 0.05)'" onmouseout="this.style.background='transparent'">DESCARTAR</button>
            </div>
        </div>
    `;

    speak("Gravação encerrada. Deseja baixar a ata?");
}

function stopVoxMode() {
    isRecording = false;
    if (recognition) recognition.stop();
    stopMicrophone();
    spheres[0].state = 'idle';
    userDisplay.textContent = "";
}

function closeVoxMode() {
    voxTranscript = [];
    voxDisplay.innerHTML = '';
    stopVoxMode();
    speak("Ata descartada.");
}

function downloadVoxTranscript() {
    const duration = Math.floor((Date.now() - voxStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    let content = `ATA DE REUNIÃO - SORY VOX\n`;
    content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    content += `Duração: ${minutes}min ${seconds}s\n`;
    content += `Segmentos: ${voxTranscript.length}\n`;
    content += `\n${'='.repeat(60)}\n\n`;

    voxTranscript.forEach((entry, idx) => {
        content += `[${entry.time}] ${entry.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ata_sory_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    speak("Ata baixada com sucesso.");
    closeVoxMode();
}

// VX Mode - Conversational with AI (pause detection)
let vxActive = false;
let vxSilenceTimer = null;
let vxCurrentTranscript = '';
let vxWaitingForAI = false;

async function startVxMode() {
    const micReady = await initMicrophone();
    if (!micReady) return;

    if (!recognition) recognition = initRecognition();
    if (!recognition) {
        speak("Reconhecimento de voz não suportado.");
        return;
    }

    vxActive = true;
    isRecording = true;
    vxCurrentTranscript = '';
    vxWaitingForAI = false;

    recognition.onresult = async (event) => {
        if (vxWaitingForAI) return; // Ignore input while AI is responding

        if (vxSilenceTimer) {
            clearTimeout(vxSilenceTimer);
            vxSilenceTimer = null;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];

            if (result.isFinal) {
                const text = result[0].transcript.trim();

                // Check for exit commands
                if (text.toLowerCase().includes('encerrar vx') ||
                    text.toLowerCase().includes('encerrar modo voz') ||
                    text.toLowerCase().includes('desligar voz') ||
                    text.toLowerCase().includes('parar voz')) {
                    stopVxMode();
                    return;
                }

                vxCurrentTranscript += (vxCurrentTranscript ? ' ' : '') + text;
                userDisplay.textContent = vxCurrentTranscript;

                // Start silence detection (2 seconds = send to AI)
                vxSilenceTimer = setTimeout(async () => {
                    if (vxCurrentTranscript.trim() && !vxWaitingForAI) {
                        const toSend = vxCurrentTranscript;
                        vxCurrentTranscript = '';
                        vxWaitingForAI = true;
                        recognition.stop(); // Stop listening while thinking

                        // Send to AI
                        if (typeof callGemini === 'function') {
                            await callGemini(toSend);
                        } else if (typeof cognitiveResponse === 'function') {
                            // Fallback if callGemini missing
                            await cognitiveResponse(toSend);
                        }

                        // Re-enable listening after AI responds
                        setTimeout(() => {
                            vxWaitingForAI = false;
                            if (vxActive) {
                                userDisplay.textContent = "VX MODE ATIVO - Ouvindo...";
                                // Force restart recognition
                                try {
                                    if (recognition) recognition.start();
                                    console.log('[VX] Recognition restarted after AI response');
                                } catch (e) {
                                    console.log('[VX] Recognition already running');
                                }
                            }
                        }, 1000);
                    }
                }, 2000);

            } else {
                // Show interim results
                const interim = result[0].transcript;
                userDisplay.textContent = vxCurrentTranscript + (vxCurrentTranscript ? ' ' : '') + interim + '...';
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('[VX] Error:', event.error);
        if (event.error === 'no-speech' && vxActive && !vxWaitingForAI) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('[VX] Recognition already started');
                }
            }, 500);
        }
    };

    recognition.onend = () => {
        console.log('[VX] Recognition ended, vxActive:', vxActive, 'vxWaitingForAI:', vxWaitingForAI);
        if (vxActive && !vxWaitingForAI) {
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('[VX] Recognition restarted');
                } catch (e) {
                    console.log('[VX] Recognition already started');
                }
            }, 100);
        }
    };

    recognition.start();
    spheres[0].state = 'listening';
    userDisplay.textContent = "VX MODE ATIVO";

    voxDisplay.innerHTML = `
        <div class="glass-card" style="max-width:500px; margin:0 auto; padding:20px; text-align:center; animation:fadeUp 0.8s ease;">
            <div style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700; margin-bottom:15px;">MODO VOZ ATIVO</div>
            <div style="font-size:0.85rem; opacity:0.7; line-height:1.6;">
                Fale sua pergunta e faça uma pausa de 2 segundos.<br>
                Para encerrar, diga: <span style="color:var(--accent);">"encerrar vx"</span><br>
                ou digite: <span style="color:var(--accent);">/vx1</span>
            </div>
        </div>
    `;

    speak("Modo voz ativado. Fale sua pergunta e faça uma pausa.");
}

function stopVxMode() {
    vxActive = false;
    isRecording = false;
    vxCurrentTranscript = '';
    vxWaitingForAI = false;

    if (vxSilenceTimer) {
        clearTimeout(vxSilenceTimer);
        vxSilenceTimer = null;
    }



    if (recognition) recognition.stop();
    stopMicrophone();
    spheres[0].state = 'idle';
    userDisplay.textContent = "";
    voxDisplay.innerHTML = "";
    speak("Modo voz encerrado.");
}

// Global Exports
window.startVoxMode = startVoxMode;
window.stopVoxMode = stopVoxMode;
window.startVxMode = startVxMode;
window.stopVxMode = stopVxMode;
window.promptVoxDownload = promptVoxDownload;
window.downloadVoxTranscript = downloadVoxTranscript;
window.closeVoxMode = closeVoxMode;
