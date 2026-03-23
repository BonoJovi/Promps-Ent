/**
 * Promps Ent - AI Compare Module
 *
 * Handles sending the same prompt to multiple AI providers in parallel
 * and displaying results side-by-side for comparison.
 */

/**
 * AI Compare Manager class
 */
class AiCompareManager {
    constructor() {
        this.isInitialized = false;
        this.invoke = null;
        this.providers = [];
        this.selectedProviders = new Map(); // provider id -> { selected, model }
    }

    /**
     * Initialize the AI Compare Manager
     */
    async init() {
        if (this.isInitialized) return;

        // Bind events first (so button responds even if provider loading fails)
        this.bindEvents();

        // Get Tauri invoke function
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            this.invoke = window.__TAURI__.invoke;
        } else {
            console.warn('AiCompareManager: Tauri API not available');
            this.isInitialized = true;
            return;
        }

        await this.loadProviders();
        this.isInitialized = true;
        console.log('AiCompareManager initialized');
    }

    /**
     * Load available AI providers
     */
    async loadProviders() {
        try {
            this.providers = await this.invoke('get_ai_providers');
        } catch (error) {
            console.error('AiCompareManager: Failed to load providers:', error);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Compare button
        const compareBtn = document.getElementById('btnCompareAi');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.showCompareModal().catch(err => {
                    console.error('AiCompareManager: showCompareModal failed:', err);
                });
            });
        }

        // Close modal
        const closeBtn = document.getElementById('btnCloseCompareModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCompareModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('btnCancelCompare');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCompareModal());
        }

        // Compare (submit) button
        const submitBtn = document.getElementById('btnStartCompare');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.startComparison().catch(err => {
                    console.error('AiCompareManager: startComparison failed:', err);
                });
            });
        }

        // Close modal on backdrop click
        const modal = document.getElementById('aiCompareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCompareModal();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCompareModal();
            }
        });
    }

    /**
     * Show the compare modal
     */
    async showCompareModal() {
        // Check if there's a prompt
        const promptPreview = document.getElementById('promptPreview');
        if (!promptPreview || promptPreview.querySelector('.placeholder') || !promptPreview.textContent.trim()) {
            alert(window.t ? window.t('ent.compare.noPrompt') : 'Please create a prompt first.');
            return;
        }

        // Show prompt preview in modal
        const promptText = document.getElementById('comparePromptText');
        if (promptText) {
            promptText.textContent = promptPreview.textContent.trim();
        }

        // Lazy-load providers if not loaded yet
        if (this.providers.length === 0 && this.invoke) {
            await this.loadProviders();
        }

        // Load provider checkboxes with API key status
        await this.loadProviderCheckboxes();

        // Clear previous results
        const resultsContainer = document.getElementById('compareResultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }

        // Hide results section, show provider section
        const resultsSection = document.getElementById('compareResultsSection');
        if (resultsSection) resultsSection.style.display = 'none';

        // Reset total time
        const totalTime = document.getElementById('compareTotalTime');
        if (totalTime) totalTime.textContent = '';

        // Show modal
        const modal = document.getElementById('aiCompareModal');
        if (modal) {
            modal.classList.add('modal-visible');
        }
    }

    /**
     * Hide the compare modal
     */
    hideCompareModal() {
        const modal = document.getElementById('aiCompareModal');
        if (modal) {
            modal.classList.remove('modal-visible');
        }
    }

    /**
     * Load provider checkboxes with API key status
     */
    async loadProviderCheckboxes() {
        const container = document.getElementById('compareProviderList');
        if (!container) return;

        container.innerHTML = '';
        this.selectedProviders.clear();

        for (const provider of this.providers) {
            let hasKey = false;
            try {
                hasKey = await this.invoke('has_api_key', { provider: provider.id });
            } catch (e) {
                console.warn(`Failed to check API key for ${provider.id}:`, e);
            }

            const item = document.createElement('div');
            item.className = `compare-provider-item${hasKey ? '' : ' disabled'}`;
            item.dataset.providerId = provider.id;

            const noKeyText = window.t ? window.t('ent.compare.noApiKey') : 'No API key';
            const configureText = window.t ? window.t('ent.compare.configureKey') : 'Configure key';

            let modelSelect = '';
            if (provider.models && provider.models.length > 0) {
                const options = provider.models.map(m =>
                    `<option value="${m}"${m === provider.defaultModel ? ' selected' : ''}>${m}</option>`
                ).join('');
                modelSelect = `<select class="compare-model-select" ${hasKey ? '' : 'disabled'}>${options}</select>`;
            }

            item.innerHTML = `
                <div class="provider-header">
                    <input type="checkbox" id="compare_${provider.id}" ${hasKey ? '' : 'disabled'}>
                    <label class="provider-name" for="compare_${provider.id}">${provider.name}</label>
                </div>
                ${hasKey ? modelSelect : `<span class="provider-no-key">${noKeyText} - <a href="#" class="configure-key-link">${configureText}</a></span>`}
            `;

            // Checkbox change handler
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && hasKey) {
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        const modelEl = item.querySelector('.compare-model-select');
                        const model = modelEl ? modelEl.value : provider.defaultModel;
                        this.selectedProviders.set(provider.id, { model });
                        item.classList.add('selected');
                    } else {
                        this.selectedProviders.delete(provider.id);
                        item.classList.remove('selected');
                    }
                });

                // Model select change
                const modelEl = item.querySelector('.compare-model-select');
                if (modelEl) {
                    modelEl.addEventListener('change', () => {
                        if (this.selectedProviders.has(provider.id)) {
                            this.selectedProviders.set(provider.id, { model: modelEl.value });
                        }
                    });
                }

                // Click on card (not checkbox) toggles selection
                item.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' &&
                        e.target.tagName !== 'A' && e.target.tagName !== 'OPTION') {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            }

            // Configure key link
            const configLink = item.querySelector('.configure-key-link');
            if (configLink) {
                configLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideCompareModal();
                    if (window.apiKeyManager) {
                        window.apiKeyManager.showModal();
                    }
                });
            }

            container.appendChild(item);
        }
    }

    /**
     * Start comparison - send prompt to all selected providers
     */
    async startComparison() {
        // Validate at least 2 providers selected
        if (this.selectedProviders.size < 2) {
            alert(window.t ? window.t('ent.compare.noProviders') : 'Please select at least 2 providers.');
            return;
        }

        // Get raw prompt for AI
        let rawPrompt;
        if (window.aiSendManager && typeof window.aiSendManager.getRawPrompt === 'function') {
            rawPrompt = await window.aiSendManager.getRawPrompt();
        }

        if (!rawPrompt) {
            alert(window.t ? window.t('ent.compare.noPrompt') : 'No prompt available.');
            return;
        }

        // Build requests
        const requests = [];
        for (const [providerId, config] of this.selectedProviders) {
            requests.push({
                provider: providerId,
                model: config.model || null,
            });
        }

        // Show loading state
        this.setLoading(true);

        // Show results section
        const resultsSection = document.getElementById('compareResultsSection');
        if (resultsSection) resultsSection.style.display = 'block';

        // Show loading in results container
        const resultsContainer = document.getElementById('compareResultsContainer');
        if (resultsContainer) {
            const sendingText = window.t ? window.t('ent.compare.sending') : 'Sending...';
            resultsContainer.innerHTML = `
                <div class="compare-loading">
                    <div class="loading-spinner"></div>
                    <span>${sendingText}</span>
                </div>
            `;
        }

        try {
            const response = await this.invoke('send_to_multiple_ai', {
                prompt: rawPrompt,
                requests: requests,
            });

            this.displayResults(response);
        } catch (error) {
            console.error('AI Compare failed:', error);
            if (resultsContainer) {
                const errorText = window.t ? window.t('ent.compare.error') : 'Error';
                resultsContainer.innerHTML = `
                    <div class="compare-result-column">
                        <div class="compare-result-header">
                            <span class="result-provider">${errorText}</span>
                        </div>
                        <div class="compare-result-content">
                            <span class="error-text">${error}</span>
                        </div>
                    </div>
                `;
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Display comparison results
     * @param {Object} response - AiCompareResponse from backend
     */
    displayResults(response) {
        const resultsContainer = document.getElementById('compareResultsContainer');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'compare-results-grid';

        response.results.forEach((result, index) => {
            const column = document.createElement('div');
            column.className = 'compare-result-column';

            const elapsedText = window.t
                ? window.t('ent.compare.elapsed', { ms: result.elapsedMs })
                : `${result.elapsedMs}ms`;
            const copyText = window.t ? window.t('ent.compare.copy') : 'Copy';
            const errorLabel = window.t ? window.t('ent.compare.error') : 'Error';

            let contentHtml;
            if (result.success && result.content) {
                contentHtml = document.createElement('div');
                contentHtml.className = 'compare-result-content';
                contentHtml.textContent = result.content;
            } else {
                contentHtml = document.createElement('div');
                contentHtml.className = 'compare-result-content error-content';
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-text';
                errorSpan.textContent = `${errorLabel}: ${result.error || 'Unknown error'}`;
                contentHtml.appendChild(errorSpan);
            }

            column.innerHTML = `
                <div class="compare-result-header">
                    <span class="result-provider">${result.provider}</span>
                    <span class="result-model">${result.model}</span>
                </div>
            `;

            column.appendChild(contentHtml);

            const footer = document.createElement('div');
            footer.className = 'compare-result-footer';
            footer.innerHTML = `
                <span class="compare-result-time">${elapsedText}</span>
                <button class="btn-copy-result" data-index="${index}">${copyText}</button>
            `;

            // Copy button handler
            const copyBtn = footer.querySelector('.btn-copy-result');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyResult(result, copyBtn));
            }

            column.appendChild(footer);
            grid.appendChild(column);
        });

        resultsContainer.appendChild(grid);

        // Update total time
        const totalTime = document.getElementById('compareTotalTime');
        if (totalTime) {
            const totalText = window.t
                ? window.t('ent.compare.totalTime', { ms: response.totalElapsedMs })
                : `Total: ${response.totalElapsedMs}ms`;
            totalTime.textContent = totalText;
        }
    }

    /**
     * Copy a single result to clipboard
     * @param {Object} result - AiCompareResult
     * @param {HTMLElement} btn - The copy button element
     */
    async copyResult(result, btn) {
        const text = result.content || result.error || '';
        try {
            await navigator.clipboard.writeText(text);
            const copiedText = window.t ? window.t('ent.compare.copied') : 'Copied';
            const copyText = window.t ? window.t('ent.compare.copy') : 'Copy';
            btn.textContent = copiedText;
            setTimeout(() => {
                btn.textContent = copyText;
            }, 1500);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    /**
     * Set loading state
     * @param {boolean} isLoading
     */
    setLoading(isLoading) {
        const submitBtn = document.getElementById('btnStartCompare');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            const sendingText = window.t ? window.t('ent.compare.sending') : 'Sending...';
            const compareText = window.t ? window.t('ent.compare.compare') : 'Compare';
            submitBtn.textContent = isLoading ? sendingText : compareText;
        }
    }

    /**
     * Update the compare button state based on license and prompt
     */
    updateCompareButton() {
        const btn = document.getElementById('btnCompareAi');
        if (!btn) return;

        // Enable if there's a prompt in preview
        const promptPreview = document.getElementById('promptPreview');
        const hasPrompt = promptPreview &&
            promptPreview.textContent.trim() !== '' &&
            !promptPreview.querySelector('.placeholder');

        btn.disabled = !hasPrompt;
    }
}

// Create and export the AI Compare Manager instance
window.aiCompareManager = new AiCompareManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AiCompareManager };
}
