class ConfigManager {
    static get(key, defaultValue = null) {
        return localStorage.getItem(`sory_config_${key}`) || defaultValue;
    }

    static set(key, value) {
        localStorage.setItem(`sory_config_${key}`, value);
    }

    static getGeminiKey() {
        return this.get('gemini_key', '');
    }

    static getGoogleCloudKey() {
        return this.get('google_cloud_key', '');
    }

    static getTTSProvider() {
        return this.get('tts_provider', 'native'); // 'native' or 'google'
    }

    static getVoiceId() {
        return this.get('google_voice_id', 'pt-BR-Neural2-A');
    }
}

// Expose globally
window.ConfigManager = ConfigManager;
