/**
 * Promps Ent - AI Import Manager
 *
 * Analyzes AI responses using morpheme analysis and converts them to Blockly blocks.
 * Uses the AI provider to perform morpheme analysis, then maps tokens to block types.
 */

/**
 * AI Import Manager
 * Handles the conversion of AI responses to Blockly blocks
 */
class AiImportManager {
    constructor() {
        this.lastResponse = null;
        this.isAnalyzing = false;
    }

    /**
     * Initialize the AI Import Manager
     */
    init() {
        this.setupEventListeners();
        console.log('AI Import Manager initialized');
    }

    /**
     * Set up event listeners for the import button
     */
    setupEventListeners() {
        const importBtn = document.getElementById('btnImportAsBlocks');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importAsBlocks());
        }
    }

    /**
     * Get the current AI response text
     * @returns {string|null} The response text or null if not available
     */
    getCurrentResponse() {
        const responseContent = document.getElementById('aiResponseContent');
        if (!responseContent) return null;

        // Get text content, excluding error messages
        const errorSpan = responseContent.querySelector('.error-text');
        if (errorSpan) return null;

        return responseContent.textContent.trim();
    }

    /**
     * Get the current provider from the select dropdown
     * @returns {string} The selected provider
     */
    getCurrentProvider() {
        const select = document.getElementById('aiProviderSelect');
        return select ? select.value : '';
    }

    /**
     * Import AI response as Blockly blocks
     */
    async importAsBlocks() {
        // Get the response text
        const responseText = this.getCurrentResponse();
        if (!responseText) {
            const msg = window.t ? window.t('ent.import.noResponse') : 'No AI response to import.';
            alert(msg);
            return;
        }

        // Get the provider
        const provider = this.getCurrentProvider();
        if (!provider) {
            const msg = window.t ? window.t('pro.sendAi.selectProviderError') : 'Please select a provider.';
            alert(msg);
            return;
        }

        // Show loading state
        this.setAnalyzingState(true);

        try {
            // Get locale
            const locale = window.getLocale ? window.getLocale() : 'ja';

            // Call backend to analyze text
            const response = await this.analyzeText(provider, responseText, locale);

            if (response.success && response.tokens && response.tokens.length > 0) {
                // Generate blocks from tokens
                this.generateBlocks(response.tokens, locale);
            } else if (response.success && (!response.tokens || response.tokens.length === 0)) {
                const msg = window.t ? window.t('ent.import.noTokens') : 'AI returned no tokens to import.';
                alert(msg);
            } else {
                const errorMsg = response.error || 'Analysis failed';
                const msg = window.t ? window.t('ent.import.error') : 'Import error: ';
                alert(msg + errorMsg);
            }
        } catch (error) {
            console.error('AI Import error:', error);
            const msg = window.t ? window.t('ent.import.error') : 'Import error: ';
            alert(msg + error.message);
        } finally {
            this.setAnalyzingState(false);
        }
    }

    /**
     * Call backend to analyze text with AI
     * @param {string} provider - AI provider name
     * @param {string} text - Text to analyze
     * @param {string} locale - Current locale
     * @returns {Promise<Object>} Analysis response
     */
    async analyzeText(provider, text, locale) {
        // Get Tauri invoke function
        let invoke;
        if (window.__TAURI_INTERNALS__) {
            invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            invoke = window.__TAURI__.invoke;
        } else {
            throw new Error('Tauri API not available');
        }

        return await invoke('analyze_text_with_ai', {
            provider: provider,
            text: text,
            locale: locale
        });
    }

    /**
     * Set the analyzing state (loading indicator)
     * @param {boolean} isAnalyzing - Whether analysis is in progress
     */
    setAnalyzingState(isAnalyzing) {
        this.isAnalyzing = isAnalyzing;
        const importBtn = document.getElementById('btnImportAsBlocks');
        if (importBtn) {
            importBtn.disabled = isAnalyzing;
            if (isAnalyzing) {
                importBtn.classList.add('analyzing');
                importBtn.title = window.t ? window.t('ent.import.analyzing') : 'Analyzing...';
            } else {
                importBtn.classList.remove('analyzing');
                importBtn.title = window.t ? window.t('ent.import.title') : 'Import as Blocks';
            }
        }
    }

    /**
     * Generate Blockly blocks from morpheme tokens
     * @param {Array<Object>} tokens - Array of {text, type} tokens
     * @param {string} locale - Current locale
     * @returns {number} Number of blocks created
     */
    generateBlocks(tokens, locale) {
        if (!workspace) {
            console.error('AI Import: Blockly workspace not available');
            return 0;
        }

        // Get workspace metrics for positioning
        const metrics = workspace.getMetrics();
        let x = (metrics.viewLeft + 50) / workspace.scale;
        let y = (metrics.viewTop + 50) / workspace.scale;

        let previousBlock = null;
        let blocksCreated = 0;

        for (const token of tokens) {
            const blockType = this.mapTokenToBlockType(token, locale);
            if (!blockType) continue;

            try {
                // Create the block
                const block = workspace.newBlock(blockType);

                // Set text field value for input blocks
                if (blockType === 'promps_noun' || blockType === 'promps_other' || blockType === 'promps_verb_custom') {
                    const textField = block.getField('TEXT');
                    if (textField) {
                        textField.setValue(token.text);
                    }
                }

                // Initialize SVG
                block.initSvg();

                // Position the block
                if (previousBlock) {
                    // Connect to previous block
                    const previousConnection = previousBlock.nextConnection;
                    const currentConnection = block.previousConnection;
                    if (previousConnection && currentConnection) {
                        previousConnection.connect(currentConnection);
                    }
                } else {
                    // First block - position at start
                    block.moveBy(x, y);
                }

                // Render the block
                block.render();

                previousBlock = block;
                blocksCreated++;
            } catch (error) {
                console.warn('AI Import: Failed to create block for token:', token, error);
            }
        }

        // Trigger workspace update
        if (typeof updatePreview === 'function' && typeof getWorkspaceCode === 'function') {
            setTimeout(() => {
                const code = getWorkspaceCode();
                updatePreview(code);
            }, 100);
        }

        return blocksCreated;
    }

    /**
     * Map a morpheme token to a Blockly block type
     * @param {Object} token - Token with text and type
     * @param {string} locale - Current locale
     * @returns {string|null} Blockly block type or null if no mapping
     */
    mapTokenToBlockType(token, locale) {
        const type = token.token_type || token.type;
        const text = token.text;

        switch (type) {
            case 'noun':
                return 'promps_noun';

            case 'particle':
                return this.mapParticleToBlockType(text);

            case 'article':
                return this.mapArticleToBlockType(text);

            case 'verb':
                return this.mapVerbToBlockType(text, locale);

            case 'other':
            default:
                return 'promps_other';
        }
    }

    /**
     * Map a particle text to its specific block type
     * @param {string} text - Particle text
     * @returns {string} Block type
     */
    mapParticleToBlockType(text) {
        const particleMap = {
            'が': 'promps_particle_ga',
            'を': 'promps_particle_wo',
            'に': 'promps_particle_ni',
            'で': 'promps_particle_de',
            'と': 'promps_particle_to',
            'へ': 'promps_particle_he',
            'から': 'promps_particle_kara',
            'まで': 'promps_particle_made',
            'より': 'promps_particle_yori',
            // Common particles that map to closest equivalent
            'の': 'promps_particle_ni',  // possessive, similar to 'ni'
            'も': 'promps_particle_to',  // also, similar to 'to'
            'は': 'promps_particle_ga',  // topic marker, similar to 'ga'
            'か': 'promps_particle_to',  // question/or, use 'to' as fallback
        };

        return particleMap[text] || 'promps_other';
    }

    /**
     * Map an article text to its specific block type
     * @param {string} text - Article text
     * @returns {string} Block type
     */
    mapArticleToBlockType(text) {
        const articleMap = {
            'a': 'promps_article_a',
            'an': 'promps_article_an',
            'the': 'promps_article_the',
            'this': 'promps_article_this',
            'that': 'promps_article_that',
            'please': 'promps_article_please',
        };

        const lowerText = text.toLowerCase();
        return articleMap[lowerText] || 'promps_other';
    }

    /**
     * Map a verb text to its specific block type
     * @param {string} text - Verb text
     * @param {string} locale - Current locale
     * @returns {string} Block type (always custom for user-editable verb)
     */
    mapVerbToBlockType(text, locale) {
        // Check for known verbs
        const verbMapJa = {
            '分析して': 'promps_verb_analyze',
            '要約して': 'promps_verb_summarize',
            '翻訳して': 'promps_verb_translate',
            '作成して': 'promps_verb_create',
            '生成して': 'promps_verb_generate',
            '変換して': 'promps_verb_convert',
            '削除して': 'promps_verb_delete',
            '更新して': 'promps_verb_update',
            '抽出して': 'promps_verb_extract',
            '説明して': 'promps_verb_explain',
            '解説して': 'promps_verb_describe',
            '教えて': 'promps_verb_teach',
        };

        const verbMapEn = {
            'analyze': 'promps_verb_analyze',
            'summarize': 'promps_verb_summarize',
            'translate': 'promps_verb_translate',
            'create': 'promps_verb_create',
            'generate': 'promps_verb_generate',
            'convert': 'promps_verb_convert',
            'delete': 'promps_verb_delete',
            'update': 'promps_verb_update',
            'extract': 'promps_verb_extract',
            'explain': 'promps_verb_explain',
            'describe': 'promps_verb_describe',
            'teach': 'promps_verb_teach',
        };

        const verbMap = locale === 'ja' ? verbMapJa : verbMapEn;
        const lowerText = text.toLowerCase();

        // Return specific block if it's a known verb
        if (verbMap[text]) {
            return verbMap[text];
        }
        if (verbMap[lowerText]) {
            return verbMap[lowerText];
        }

        // Default to custom verb block
        return 'promps_verb_custom';
    }

    /**
     * Update the import button state based on response availability
     */
    updateImportButton() {
        const importBtn = document.getElementById('btnImportAsBlocks');
        if (!importBtn) return;

        const hasResponse = !!this.getCurrentResponse();
        importBtn.disabled = !hasResponse || this.isAnalyzing;
    }
}

// Create global instance
window.aiImportManager = new AiImportManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AiImportManager };
}
