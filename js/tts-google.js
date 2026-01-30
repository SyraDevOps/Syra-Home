class GoogleTTS {
    static async speak(text, onEnd) {
        const apiKey = ConfigManager.getGoogleCloudKey();

        if (!apiKey) {
            console.warn("[GoogleTTS] API Key not configured.");
            // Fallback to native if key is missing, or just fail gracefully?
            // The system.js logic will handle fallback if this returns false/throws.
            throw new Error("API Key missing");
        }

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: 'pt-BR',
                        name: ConfigManager.getVoiceId() || 'pt-BR-Neural2-A'
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        pitch: 0,
                        speakingRate: 1.1
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error ? errData.error.message : 'Unknown Google TTS Error');
            }

            const data = await response.json();
            if (!data.audioContent) throw new Error("No audio content received");

            await this.playAudio(data.audioContent, onEnd);

        } catch (e) {
            console.error("[GoogleTTS] Playback failed:", e);
            throw e; // Propagate to caller to handle fallback
        }
    }

    static async playAudio(base64String, onEnd) {
        // Ensure Audio Context is active
        if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.audioCtx.state === 'suspended') {
            await window.audioCtx.resume();
        }

        const audioBuffer = await window.audioCtx.decodeAudioData(this._base64ToArrayBuffer(base64String));
        const source = window.audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to global analyser if available for visualizer
        if (window.analyser) {
            source.connect(window.analyser);
            // Verify if analyser is already connected to destination,
            // otherwise we might double-connect or hear nothing.
            // Usually analyser is connected to destination in initAudioSystem.
            // But let's be safe:
             // source -> analyser -> destination (handled in initAudioSystem usually)
             // If initAudioSystem didn't connect analyser to destination, we must do it.
             // Looking at system.js: oscillator -> gainNode -> panner -> destination.
             // Analyser is global but not seemingly connected in initAudioSystem?
             // Wait, I need to check where analyser is initialized.
             // In app.js: "if (analyser) analyser.getByteFrequencyData..."
             // In system.js: initAudioSystem doesn't seem to create analyser!
             // It creates oscillator and gainNode.

             // I will create/connect analyser here if missing.
        }

        // If analyser doesn't exist or isn't connected, we need a path to destination.
        // Let's create a robust path: Source -> Gain -> Destination
        // And side-chain to Analyser.

        const gain = window.audioCtx.createGain();
        gain.gain.value = 1.0;

        source.connect(gain);
        gain.connect(window.audioCtx.destination);

        // Visualizer Hook
        if (!window.analyser) {
            window.analyser = window.audioCtx.createAnalyser();
            window.analyser.fftSize = 256;
            window.dataArray = new Uint8Array(window.analyser.frequencyBinCount);
        }

        // Connect source to analyser (for visuals only, not output to avoid double audio if analyser goes to dest)
        source.connect(window.analyser);

        source.onended = () => {
            if (onEnd) onEnd();
        };

        source.start(0);
    }

    static _base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

window.GoogleTTS = GoogleTTS;
