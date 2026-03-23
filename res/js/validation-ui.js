/**
 * Promps Phase 5-6 - Validation UI
 *
 * This file handles displaying validation results in the UI,
 * highlighting blocks with errors, and applying auto-fixes.
 * Includes i18n support for translated messages.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function vt(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Validation UI Manager
 */
const validationUI = {
    /**
     * Display validation result in the UI
     * @param {Object} result - ValidationResult from backend
     */
    displayResult: function(result) {
        const container = document.getElementById('validationResult');
        if (!container) {
            console.warn('Validation result container not found');
            return;
        }

        // Clear previous content
        container.innerHTML = '';

        if (result.isValid && result.warningCount === 0) {
            // Success state
            container.className = 'validation-result validation-success';
            container.innerHTML = '<span class="validation-icon">&#10003;</span> ' + vt('validation.passed', 'Grammar check passed');
        } else if (result.errorCount > 0) {
            // Error state
            container.className = 'validation-result validation-error';
            this.renderErrors(container, result);
        } else if (result.warningCount > 0) {
            // Warning only state
            container.className = 'validation-result validation-warning';
            this.renderErrors(container, result);
        }
    },

    /**
     * Render error list
     * @param {HTMLElement} container - Container element
     * @param {Object} result - ValidationResult
     */
    renderErrors: function(container, result) {
        // Summary line
        const summary = document.createElement('div');
        summary.className = 'validation-summary';

        const parts = [];
        if (result.errorCount > 0) {
            const errorLabel = result.errorCount > 1 ? vt('validation.errors', 'errors') : vt('validation.error', 'error');
            parts.push(`${result.errorCount} ${errorLabel}`);
        }
        if (result.warningCount > 0) {
            const warningLabel = result.warningCount > 1 ? vt('validation.warnings', 'warnings') : vt('validation.warning', 'warning');
            parts.push(`${result.warningCount} ${warningLabel}`);
        }

        const icon = result.errorCount > 0 ? '&#10007;' : '&#9888;';
        summary.innerHTML = `<span class="validation-icon">${icon}</span> ${parts.join(', ')}`;
        container.appendChild(summary);

        // Error list
        const list = document.createElement('ul');
        list.className = 'validation-error-list';

        for (const error of result.errors) {
            const item = document.createElement('li');
            item.className = `validation-item validation-${error.severity}`;

            // Message
            const message = document.createElement('span');
            message.className = 'validation-message';
            message.textContent = error.message;
            item.appendChild(message);

            // Auto-fix button (if available)
            if (error.autofix) {
                const fixBtn = document.createElement('button');
                fixBtn.className = 'validation-fix-btn';
                fixBtn.textContent = error.autofix.label;
                fixBtn.addEventListener('click', () => {
                    this.applyAutoFix(error.autofix);
                });
                item.appendChild(fixBtn);
            } else if (error.suggestion) {
                // Suggestion text (only if no autofix)
                const suggestion = document.createElement('span');
                suggestion.className = 'validation-suggestion';
                suggestion.textContent = ` → ${error.suggestion}`;
                item.appendChild(suggestion);
            }

            list.appendChild(item);
        }

        container.appendChild(list);
    },

    /**
     * Clear validation display
     */
    clear: function() {
        const container = document.getElementById('validationResult');
        if (container) {
            container.className = 'validation-result';
            container.innerHTML = '';
        }

        // Clear any block highlights
        this.clearBlockHighlights();
    },

    /**
     * Show a warning message (v1.1.0 - for block limit warnings)
     * @param {string} message - Warning message to display
     */
    showWarning: function(message) {
        const container = document.getElementById('validationResult');
        if (!container) return;

        container.className = 'validation-result validation-warning';
        container.innerHTML = `<span class="validation-icon">&#9888;</span> ${message}`;

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (container.classList.contains('validation-warning')) {
                container.innerHTML = '';
                container.className = 'validation-result';
            }
        }, 5000);
    },

    /**
     * Show an error message (v1.1.0 - for block limit errors)
     * @param {string} message - Error message to display
     */
    showError: function(message) {
        const container = document.getElementById('validationResult');
        if (!container) return;

        container.className = 'validation-result validation-error';
        container.innerHTML = `<span class="validation-icon">&#10007;</span> ${message}`;
    },

    /**
     * Highlight blocks with errors in the Blockly workspace
     * @param {Object} result - ValidationResult from backend
     * @param {Array} blockPositions - Map of token positions to block IDs
     */
    highlightBlocks: function(result, blockPositions) {
        // Clear existing highlights
        this.clearBlockHighlights();

        if (!workspace || !result.errors || result.errors.length === 0) {
            return;
        }

        for (const error of result.errors) {
            const blockId = blockPositions[error.position];
            if (blockId) {
                const block = workspace.getBlockById(blockId);
                if (block) {
                    // Set warning text on block
                    block.setWarningText(error.message);

                    // Add CSS class for visual highlight
                    const svgRoot = block.getSvgRoot();
                    if (svgRoot) {
                        if (error.severity === 'error') {
                            svgRoot.classList.add('validation-block-error');
                        } else {
                            svgRoot.classList.add('validation-block-warning');
                        }
                    }
                }
            }
        }
    },

    /**
     * Clear all block highlights
     */
    clearBlockHighlights: function() {
        if (!workspace) {
            return;
        }

        const allBlocks = workspace.getAllBlocks(false);
        for (const block of allBlocks) {
            // Clear warning text
            block.setWarningText(null);

            // Remove CSS classes
            const svgRoot = block.getSvgRoot();
            if (svgRoot) {
                svgRoot.classList.remove('validation-block-error');
                svgRoot.classList.remove('validation-block-warning');
            }
        }
    },

    /**
     * Build block position mapping from workspace
     * Maps token positions to block IDs for error highlighting
     * @returns {Object} Map of position -> blockId
     */
    buildBlockPositions: function() {
        if (!workspace) {
            return {};
        }

        const positions = {};
        const topBlocks = workspace.getTopBlocks(true);
        let position = 0;

        for (const topBlock of topBlocks) {
            let block = topBlock;
            while (block) {
                // Each block represents one token position
                positions[position] = block.id;
                position++;
                block = block.getNextBlock();
            }
        }

        return positions;
    },

    /**
     * Apply an auto-fix action
     * @param {Object} autofix - AutoFixAction from backend
     */
    applyAutoFix: function(autofix) {
        if (!workspace) {
            console.warn('Workspace not available for auto-fix');
            return;
        }

        try {
            // IMPORTANT: Build block positions BEFORE creating the new block
            const blockPositions = this.buildBlockPositions();
            const targetBlockId = blockPositions[autofix.targetPosition];

            // Create the new block
            const newBlock = workspace.newBlock(autofix.blockType);
            newBlock.initSvg();
            newBlock.render();

            if (targetBlockId) {
                const targetBlock = workspace.getBlockById(targetBlockId);
                if (targetBlock) {
                    if (autofix.actionType === 'insert_before') {
                        this.insertBlockBefore(newBlock, targetBlock);
                    } else if (autofix.actionType === 'insert_after') {
                        this.insertBlockAfter(newBlock, targetBlock);
                    }
                } else {
                    // Target block not found, place at workspace origin
                    this.placeBlockAtOrigin(newBlock);
                }
            } else {
                // No blocks in workspace, place at origin
                this.placeBlockAtOrigin(newBlock);
            }

            // Trigger workspace change event to update preview
            workspace.fireChangeListener(new Blockly.Events.BlockCreate(newBlock));

        } catch (error) {
            console.error('Failed to apply auto-fix:', error);
        }
    },

    /**
     * Insert a new block before a target block
     * @param {Blockly.Block} newBlock - Block to insert
     * @param {Blockly.Block} targetBlock - Block to insert before
     */
    insertBlockBefore: function(newBlock, targetBlock) {
        // Get the previous block (if any)
        const previousBlock = targetBlock.getPreviousBlock();

        // First, disconnect target from its previous block
        if (targetBlock.previousConnection && targetBlock.previousConnection.isConnected()) {
            targetBlock.previousConnection.disconnect();
        }

        // Position the new block near the target
        const targetXY = targetBlock.getRelativeToSurfaceXY();
        newBlock.moveBy(targetXY.x, targetXY.y);

        // Connect new block to target (new block's next -> target's previous)
        if (newBlock.nextConnection && targetBlock.previousConnection) {
            newBlock.nextConnection.connect(targetBlock.previousConnection);
        }

        // Connect previous block to new block (if there was one)
        if (previousBlock && previousBlock.nextConnection && newBlock.previousConnection) {
            previousBlock.nextConnection.connect(newBlock.previousConnection);
        }
    },

    /**
     * Insert a new block after a target block
     * @param {Blockly.Block} newBlock - Block to insert
     * @param {Blockly.Block} targetBlock - Block to insert after
     */
    insertBlockAfter: function(newBlock, targetBlock) {
        // Get the next block (if any)
        const nextBlock = targetBlock.getNextBlock();

        // First, disconnect target from its next block
        if (targetBlock.nextConnection && targetBlock.nextConnection.isConnected()) {
            targetBlock.nextConnection.disconnect();
        }

        // Position the new block near the target
        const targetXY = targetBlock.getRelativeToSurfaceXY();
        newBlock.moveBy(targetXY.x, targetXY.y + 40);

        // Connect target to new block (target's next -> new block's previous)
        if (targetBlock.nextConnection && newBlock.previousConnection) {
            targetBlock.nextConnection.connect(newBlock.previousConnection);
        }

        // Connect new block to original next block (if there was one)
        if (nextBlock && newBlock.nextConnection && nextBlock.previousConnection) {
            newBlock.nextConnection.connect(nextBlock.previousConnection);
        }
    },

    /**
     * Place a block at the workspace origin
     * @param {Blockly.Block} block - Block to place
     */
    placeBlockAtOrigin: function(block) {
        block.moveBy(50, 50);
    }
};

/**
 * Pattern Template UI Manager (Phase 6 Step 3)
 */
const patternUI = {
    /**
     * Display pattern templates in the UI
     * @param {Array} patterns - Array of PatternTemplate from backend
     */
    displayPatterns: function(patterns) {
        const container = document.getElementById('patternTemplates');
        if (!container) {
            console.warn('Pattern templates container not found');
            return;
        }

        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'pattern-header';
        header.innerHTML = '<span class="pattern-icon">📋</span> ' + vt('pattern.header', 'Pattern Templates');
        container.appendChild(header);

        const list = document.createElement('div');
        list.className = 'pattern-list';

        for (const pattern of patterns) {
            const item = document.createElement('div');
            item.className = 'pattern-item';

            const name = document.createElement('div');
            name.className = 'pattern-name';
            name.textContent = pattern.name;
            item.appendChild(name);

            const structure = document.createElement('div');
            structure.className = 'pattern-structure';
            structure.textContent = pattern.structure;
            item.appendChild(structure);

            const example = document.createElement('div');
            example.className = 'pattern-example';
            example.textContent = `${vt('pattern.example', 'Example')}: ${pattern.example}`;
            item.appendChild(example);

            const applyBtn = document.createElement('button');
            applyBtn.className = 'pattern-apply-btn';
            applyBtn.textContent = vt('pattern.apply', 'Apply');
            applyBtn.addEventListener('click', () => {
                this.applyPattern(pattern);
            });
            item.appendChild(applyBtn);

            list.appendChild(item);
        }

        container.appendChild(list);
    },

    /**
     * Display pattern match results (suggestions based on current input)
     * @param {Array} matchResults - Array of PatternMatchResult from backend
     */
    displayMatchResults: function(matchResults) {
        const container = document.getElementById('patternSuggestions');
        if (!container) {
            return; // Suggestions container is optional
        }

        container.innerHTML = '';

        // Only show patterns with score > 0
        const relevantPatterns = matchResults.filter(r => r.matchScore > 0);

        if (relevantPatterns.length === 0) {
            return;
        }

        // Store match results for later use
        this.currentMatchResults = matchResults;

        const header = document.createElement('div');
        header.className = 'suggestion-header';
        header.innerHTML = '<span class="suggestion-icon">💡</span> ' + vt('suggestion.header', 'Recommended Patterns');
        container.appendChild(header);

        const list = document.createElement('div');
        list.className = 'suggestion-list';

        // Show top 3 matches
        for (const match of relevantPatterns.slice(0, 3)) {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            if (match.isComplete) {
                item.classList.add('suggestion-complete');
            }

            const name = document.createElement('span');
            name.className = 'suggestion-name';
            name.textContent = match.patternName;
            item.appendChild(name);

            const score = document.createElement('span');
            score.className = 'suggestion-score';
            score.textContent = `${Math.round(match.matchScore * 100)}%`;
            item.appendChild(score);

            if (match.isComplete) {
                const badge = document.createElement('span');
                badge.className = 'suggestion-badge';
                badge.textContent = vt('suggestion.complete', 'Complete');
                item.appendChild(badge);
            } else {
                // Add apply button for incomplete patterns
                const applyBtn = document.createElement('button');
                applyBtn.className = 'suggestion-apply-btn';
                applyBtn.textContent = vt('suggestion.apply', 'Apply');
                applyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyPatternById(match.patternId);
                });
                item.appendChild(applyBtn);
            }

            list.appendChild(item);
        }

        container.appendChild(list);
    },

    /**
     * Clear pattern suggestions
     * Called when language changes or workspace is cleared
     */
    clearSuggestions: function() {
        const container = document.getElementById('patternSuggestions');
        if (container) {
            container.innerHTML = '';
        }
        this.currentMatchResults = null;
    },

    /**
     * Apply pattern by ID - adds missing blocks only (for suggestions)
     * @param {string} patternId - Pattern ID to apply
     */
    applyPatternById: async function(patternId) {
        try {
            const invoke = this.getInvoke();
            if (!invoke) {
                return;
            }
            // Get all patterns and find the one to apply
            const locale = window.i18n ? window.i18n.getLocale() : 'ja';
            const patterns = await invoke('get_patterns', { locale });
            const pattern = patterns.find(p => p.id === patternId);
            if (pattern) {
                this.completePattern(pattern);
            }
        } catch (error) {
            console.warn('Failed to apply pattern:', error);
        }
    },

    /**
     * Complete a pattern by adding missing blocks (keeps existing blocks)
     * @param {Object} pattern - PatternTemplate object
     */
    completePattern: function(pattern) {
        if (!workspace) {
            console.warn('Workspace not available for pattern completion');
            return;
        }

        try {
            // Get current blocks in order
            const topBlocks = workspace.getTopBlocks(true);
            let currentBlocks = [];

            for (const topBlock of topBlocks) {
                let block = topBlock;
                while (block) {
                    currentBlocks.push(block);
                    block = block.getNextBlock();
                }
            }

            // Get last block in chain (to append new blocks after)
            let lastBlock = currentBlocks.length > 0 ? currentBlocks[currentBlocks.length - 1] : null;

            // Get current block types with specific particle info
            const currentTypes = currentBlocks.map(b => this.getBlockSignature(b.type));

            // Get pattern block signatures
            const patternSignatures = pattern.blocks.map(b => this.getBlockSignature(b.blockType));

            // Find matching position - where do current blocks fit in the pattern?
            let matchStart = this.findPatternMatch(currentTypes, patternSignatures);

            if (matchStart === -1) {
                // No match found, just add remaining blocks at end
                matchStart = 0;
            }

            // Calculate which blocks are needed before and after current blocks
            const beforeBlocks = pattern.blocks.slice(0, matchStart);
            const afterBlocks = pattern.blocks.slice(matchStart + currentBlocks.length);

            // Insert blocks before (at the beginning)
            let firstBlock = currentBlocks.length > 0 ? currentBlocks[0] : null;
            for (let i = beforeBlocks.length - 1; i >= 0; i--) {
                const blockDef = beforeBlocks[i];
                const newBlock = workspace.newBlock(blockDef.blockType);

                // Set default value if specified
                if (blockDef.defaultValue) {
                    const field = newBlock.getField('TEXT');
                    if (field) {
                        field.setValue(blockDef.defaultValue);
                    }
                }

                newBlock.initSvg();
                newBlock.render();

                if (firstBlock) {
                    // Insert before first block
                    validationUI.insertBlockBefore(newBlock, firstBlock);
                    firstBlock = newBlock;
                } else {
                    newBlock.moveBy(50, 50);
                    lastBlock = newBlock;
                }
            }

            // Add blocks after (at the end)
            for (const blockDef of afterBlocks) {
                const newBlock = workspace.newBlock(blockDef.blockType);

                // Set default value if specified
                if (blockDef.defaultValue) {
                    const field = newBlock.getField('TEXT');
                    if (field) {
                        field.setValue(blockDef.defaultValue);
                    }
                }

                newBlock.initSvg();
                newBlock.render();

                if (lastBlock && lastBlock.nextConnection && newBlock.previousConnection) {
                    lastBlock.nextConnection.connect(newBlock.previousConnection);
                } else if (!lastBlock) {
                    newBlock.moveBy(50, 50);
                }

                lastBlock = newBlock;
            }

            // Trigger workspace change to update preview
            if (lastBlock) {
                workspace.fireChangeListener(new Blockly.Events.BlockCreate(lastBlock));
            }

        } catch (error) {
            console.error('Failed to complete pattern:', error);
        }
    },

    /**
     * Get a signature for a block type (includes specific particle)
     * @param {string} blockType - Block type string
     * @returns {string} Signature string
     */
    getBlockSignature: function(blockType) {
        if (blockType.includes('noun')) return 'noun';
        if (blockType.includes('particle_ga')) return 'particle_ga';
        if (blockType.includes('particle_wo')) return 'particle_wo';
        if (blockType.includes('particle_ni')) return 'particle_ni';
        if (blockType.includes('particle_de')) return 'particle_de';
        if (blockType.includes('particle_to')) return 'particle_to';
        if (blockType.includes('particle_he')) return 'particle_he';
        if (blockType.includes('particle_kara')) return 'particle_kara';
        if (blockType.includes('particle_made')) return 'particle_made';
        if (blockType.includes('particle')) return 'particle_other';
        if (blockType.includes('verb')) return 'verb';
        return 'other';
    },

    /**
     * Find where current blocks match in the pattern
     * @param {Array} current - Current block signatures
     * @param {Array} pattern - Pattern block signatures
     * @returns {number} Start index in pattern, or -1 if no match
     */
    findPatternMatch: function(current, pattern) {
        if (current.length === 0) return 0;

        // Try to find current sequence in pattern
        for (let start = 0; start <= pattern.length - current.length; start++) {
            let matches = true;
            for (let i = 0; i < current.length; i++) {
                if (current[i] !== pattern[start + i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return start;
            }
        }

        return -1;
    },

    /**
     * Apply a pattern template to the workspace
     * @param {Object} pattern - PatternTemplate object
     */
    applyPattern: function(pattern) {
        if (!workspace) {
            console.warn('Workspace not available for pattern application');
            return;
        }

        try {
            // Clear workspace
            workspace.clear();

            let previousBlock = null;
            let startX = 50;
            let startY = 50;

            for (const blockDef of pattern.blocks) {
                // Create the block
                const newBlock = workspace.newBlock(blockDef.blockType);

                // Set default value if specified
                if (blockDef.defaultValue) {
                    const field = newBlock.getField('TEXT');
                    if (field) {
                        field.setValue(blockDef.defaultValue);
                    }
                }

                newBlock.initSvg();
                newBlock.render();

                // Position and connect
                if (previousBlock === null) {
                    // First block
                    newBlock.moveBy(startX, startY);
                } else {
                    // Connect to previous block
                    if (previousBlock.nextConnection && newBlock.previousConnection) {
                        previousBlock.nextConnection.connect(newBlock.previousConnection);
                    }
                }

                previousBlock = newBlock;
            }

            // Trigger workspace change to update preview
            if (previousBlock) {
                workspace.fireChangeListener(new Blockly.Events.BlockCreate(previousBlock));
            }

        } catch (error) {
            console.error('Failed to apply pattern:', error);
        }
    },

    /**
     * Get Tauri invoke function (compatible with v1 and v2)
     */
    getInvoke: function() {
        if (window.__TAURI_INTERNALS__) {
            return window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__ && window.__TAURI__.core) {
            return window.__TAURI__.core.invoke;
        } else if (window.__TAURI__) {
            return window.__TAURI__.invoke;
        }
        return null;
    },

    /**
     * Load patterns from backend and display
     */
    loadPatterns: async function() {
        try {
            const invoke = this.getInvoke();
            if (!invoke) {
                console.warn('Tauri API not available for pattern loading');
                return;
            }
            // Get current locale for language-specific patterns
            const locale = window.i18n ? window.i18n.getLocale() : 'ja';
            const patterns = await invoke('get_patterns', { locale });
            this.displayPatterns(patterns);
        } catch (error) {
            console.warn('Failed to load patterns:', error);
        }
    },

    /**
     * Analyze current input and show suggestions
     * @param {string} dslInput - Current DSL input
     */
    analyzeCurrent: async function(dslInput) {
        try {
            const invoke = this.getInvoke();
            if (!invoke) {
                return;
            }
            // Get current locale for language-specific pattern matching
            const locale = window.i18n ? window.i18n.getLocale() : 'ja';
            const results = await invoke('analyze_dsl_patterns', { input: dslInput, locale });
            this.displayMatchResults(results);
        } catch (error) {
            console.warn('Failed to analyze patterns:', error);
        }
    }
};

// Export for use in main.js
if (typeof window !== 'undefined') {
    window.validationUI = validationUI;
    window.patternUI = patternUI;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validationUI };
}
