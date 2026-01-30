// CONFIG LOADER - SORY
// Loads API keys and configuration from secure config files

let API_CONFIG = null;

async function loadAPIConfig() {
    try {
        // Attempt to load from file first
        const response = await fetch('config/api-config.json');
        if (response.ok) {
            API_CONFIG = await response.json();
            console.log('[CONFIG] API configuration loaded from file:', API_CONFIG.model);
            return API_CONFIG;
        }
    } catch (e) {
        console.warn('[CONFIG] Could not load config file (likely CORS or path), using fallback.');
    }

    // Direct config loading to bypass CORS/Local file restrictions (Fallback)
    // Updated to match user's api-config.json
    API_CONFIG = {
        gemini_api_key: 'AIzaSyB_aACpgPi9lLpfbaPGE2H7aBan9IvqgtM',
        model: 'gemini-2.5-flash-lite',
        temperature: 0.7,
        max_tokens: 150
    };
    console.log('[CONFIG] API configuration loaded (Direct Mode)');
    return API_CONFIG;
}

function getAPIKey() {
    if (!API_CONFIG) {
        console.error('[CONFIG] API config not loaded yet. Call loadAPIConfig() first.');
        return 'AIzaSyB_aACpgPi9lLpfbaPGE2H7aBan9IvqgtM'; // Fallback
    }
    return API_CONFIG.gemini_api_key;
}

function getModelConfig() {
    if (!API_CONFIG) {
        return {
            model: 'gemini-2.0-flash-exp',
            temperature: 0.7,
            max_tokens: 150
        };
    }
    return {
        model: API_CONFIG.model,
        temperature: API_CONFIG.temperature,
        max_tokens: API_CONFIG.max_tokens
    };
}
