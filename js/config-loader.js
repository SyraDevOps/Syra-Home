// CONFIG LOADER - SORY (Refactored)
// Bridges legacy calls to ConfigManager

async function loadAPIConfig() {
    // ConfigManager is synchronous (localStorage), so we just acknowledge initialization
    console.log('[CONFIG] ConfigManager active.');
    return {};
}

function getAPIKey() {
    if (typeof ConfigManager !== 'undefined') {
        return ConfigManager.getGeminiKey();
    }
    return '';
}

function getModelConfig() {
    // Future: Add model selection to settings modal
    return {
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        max_tokens: 800
    };
}
