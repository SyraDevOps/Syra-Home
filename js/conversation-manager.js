class ConversationManager {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('sory_conversation_history') || '[]');
        this.maxTurns = 10; // Keeps last 5 interactions (User + Model pairs)
    }

    /**
     * Adds a message to the history.
     * @param {string} role - 'user' or 'model'
     * @param {string} text - The message content
     */
    add(role, text) {
        if (!text) return;

        // Gemini API expects 'user' or 'model' roles
        const validRole = (role === 'ai' || role === 'assistant') ? 'model' : role;

        this.history.push({
            role: validRole,
            parts: [{ text: text }]
        });

        // Prune old messages to keep context window manageable
        if (this.history.length > this.maxTurns) {
            this.history = this.history.slice(-this.maxTurns);
        }

        this.save();
    }

    getHistory() {
        return this.history;
    }

    clear() {
        this.history = [];
        this.save();
    }

    save() {
        localStorage.setItem('sory_conversation_history', JSON.stringify(this.history));
    }

    getLastUserMessage() {
        const userMsgs = this.history.filter(m => m.role === 'user');
        return userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].parts[0].text : null;
    }
}

// Initialize global instance
window.ConversationManager = new ConversationManager();
