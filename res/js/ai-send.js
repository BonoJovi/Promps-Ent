/**
 * Promps Ent - AI Send Module
 *
 * Handles sending prompts to AI providers and displaying responses.
 */

/**
 * AI Send Manager class
 */
class AiSendManager {
    constructor() {
        this.isInitialized = false;
        this.invoke = null;
        this.providers = [];
        this.selectedProvider = null;
    }

    /**
     * Initialize the AI Send Manager
     */
    async init() {
        if (this.isInitialized) return;

        // Get Tauri invoke function
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            this.invoke = window.__TAURI__.invoke;
        } else {
            console.warn('Tauri API not available');
            return;
        }

        await this.loadProviders();
        this.bindEvents();
        this.isInitialized = true;
    }

    /**
     * Load available AI providers
     */
    async loadProviders() {
        try {
            this.providers = await this.invoke('get_ai_providers');
            this.populateProviderSelect();
        } catch (error) {
            console.error('Failed to load AI providers:', error);
        }
    }

    /**
     * Populate the provider select dropdown
     */
    populateProviderSelect() {
        const select = document.getElementById('aiProviderSelect');
        if (!select) return;

        // Clear existing options except the first placeholder
        const placeholder = window.t ? window.t('pro.sendAi.selectProvider') : 'Select Provider...';
        select.innerHTML = `<option value="" data-i18n="pro.sendAi.selectProvider">${placeholder}</option>`;

        for (const provider of this.providers) {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            select.appendChild(option);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Provider selection
        const select = document.getElementById('aiProviderSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                this.selectedProvider = e.target.value || null;
                this.updateSendButton();
            });
        }

        // Send button
        const sendBtn = document.getElementById('btnSendToAi');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendToAi());
        }

        // Copy response button
        const copyBtn = document.getElementById('btnCopyResponse');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResponse());
        }
    }

    /**
     * Update the send button state
     */
    updateSendButton() {
        const sendBtn = document.getElementById('btnSendToAi');
        const promptPreview = document.getElementById('promptPreview');

        if (!sendBtn) return;

        // Enable button only if provider is selected and there's a prompt
        const hasProvider = !!this.selectedProvider;
        const hasPrompt = promptPreview &&
            promptPreview.textContent.trim() !== '' &&
            !promptPreview.querySelector('.placeholder');

        sendBtn.disabled = !(hasProvider && hasPrompt);
    }

    /**
     * Get the current prompt from the preview (with markers, for display check)
     */
    getCurrentPrompt() {
        const promptPreview = document.getElementById('promptPreview');
        if (!promptPreview) return '';

        // Check if it's a placeholder
        if (promptPreview.querySelector('.placeholder')) {
            return '';
        }

        return promptPreview.textContent.trim();
    }

    /**
     * Get raw prompt (without grammar markers) for AI sending
     */
    async getRawPrompt() {
        // Get the current DSL code from the workspace
        if (typeof getWorkspaceCode !== 'function') {
            console.error('getWorkspaceCode function not available');
            return null;
        }

        const dslCode = getWorkspaceCode();
        if (!dslCode || dslCode.trim() === '') {
            return null;
        }

        try {
            // Generate raw prompt without (NOUN) markers
            const rawPrompt = await this.invoke('generate_raw_prompt_from_text', { input: dslCode });
            return rawPrompt.trim();
        } catch (error) {
            console.error('Failed to generate raw prompt:', error);
            return null;
        }
    }

    /**
     * Send the current prompt to the selected AI provider (Ent feature)
     */
    async sendToAi() {
        if (!this.selectedProvider) {
            alert(window.t ? window.t('pro.sendAi.selectProviderError') : 'Please select an AI provider.');
            return;
        }

        // Check if there's a prompt in preview first
        const displayPrompt = this.getCurrentPrompt();
        if (!displayPrompt) {
            alert(window.t ? window.t('pro.sendAi.createPromptFirst') : 'Please create a prompt first.');
            return;
        }

        // Show loading state
        this.setLoading(true);
        this.hideResponse();

        try {
            // Get raw prompt without grammar markers for AI
            const rawPrompt = await this.getRawPrompt();
            if (!rawPrompt) {
                this.showError('Failed to generate prompt for AI');
                return;
            }

            const response = await this.invoke('send_to_ai', {
                provider: this.selectedProvider,
                prompt: rawPrompt,
                model: null // Use default model
            });

            if (response.success) {
                this.showResponse(response);
            } else {
                this.showError(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Failed to send to AI:', error);
            this.showError(error.toString());
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        const loadingIndicator = document.getElementById('aiLoadingIndicator');
        const sendBtn = document.getElementById('btnSendToAi');

        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        }

        if (sendBtn) {
            sendBtn.disabled = isLoading;
            const sendingText = window.t ? window.t('pro.sendAi.sending') : 'Sending...';
            const sendText = window.t ? window.t('pro.sendAi.send') : 'Send';
            sendBtn.textContent = isLoading ? sendingText : sendText;
        }
    }

    /**
     * Show the AI response
     */
    showResponse(response) {
        const responseArea = document.getElementById('aiResponseArea');
        const providerLabel = document.getElementById('aiResponseProvider');
        const contentDiv = document.getElementById('aiResponseContent');

        if (!responseArea || !providerLabel || !contentDiv) return;

        providerLabel.textContent = `${response.provider} (${response.model})`;
        contentDiv.textContent = response.content;
        responseArea.style.display = 'block';

        // Update Import button state (Ent feature)
        if (window.aiImportManager && typeof window.aiImportManager.updateImportButton === 'function') {
            window.aiImportManager.updateImportButton();
        }
    }

    /**
     * Hide the response area
     */
    hideResponse() {
        const responseArea = document.getElementById('aiResponseArea');
        if (responseArea) {
            responseArea.style.display = 'none';
        }

        // Update Import button state (Ent feature)
        if (window.aiImportManager && typeof window.aiImportManager.updateImportButton === 'function') {
            window.aiImportManager.updateImportButton();
        }
    }

    /**
     * Show an error message
     */
    showError(message) {
        const responseArea = document.getElementById('aiResponseArea');
        const providerLabel = document.getElementById('aiResponseProvider');
        const contentDiv = document.getElementById('aiResponseContent');

        if (!responseArea || !providerLabel || !contentDiv) return;

        providerLabel.textContent = window.t ? window.t('pro.sendAi.error') : 'Error';
        contentDiv.innerHTML = `<span class="error-text">${message}</span>`;
        responseArea.style.display = 'block';
    }

    /**
     * Copy the response to clipboard
     */
    async copyResponse() {
        const contentDiv = document.getElementById('aiResponseContent');
        if (!contentDiv) return;

        const text = contentDiv.textContent;

        try {
            await navigator.clipboard.writeText(text);

            // Show feedback
            const copyBtn = document.getElementById('btnCopyResponse');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '&#10003;';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }
}

// Create and export the AI Send Manager instance
window.aiSendManager = new AiSendManager();
