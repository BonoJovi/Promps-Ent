/**
 * Promps - Blockly.js Configuration
 *
 * This file defines custom blocks and initializes the Blockly workspace.
 * Includes full i18n support for block labels, outputs, and tooltips.
 *
 * Japanese mode: generates Japanese prompts (SOV with particles)
 * English mode: generates English prompts (SVO)
 */

// Global workspace variable
let workspace = null;

// ========================================================================
// Block Limit Constants (v1.1.0)
// ========================================================================
const BLOCK_WARNING_THRESHOLD = 50;
const BLOCK_LIMIT = 100;

// ========================================================================
// Template Manager - Save and reuse block groups (macros)
// v1.2.0: Enhanced with icon, color, category support
// ========================================================================

/**
 * Template version constants
 */
const TEMPLATE_VERSION = '2';

/**
 * Available template icons (v1.2.0)
 */
const TEMPLATE_ICONS = {
    star: '⭐',
    heart: '❤️',
    lightning: '⚡',
    fire: '🔥',
    leaf: '🌿',
    gem: '💎',
    rocket: '🚀',
    flag: '🚩',
    bookmark: '🔖',
    folder: '📁',
    document: '📄',
    code: '💻',
    chat: '💬',
    search: '🔍',
    tool: '🔧',
    custom: '📦'
};

/**
 * Template color palette (HSV hue values) (v1.2.0)
 */
const TEMPLATE_COLORS = {
    green: 120,
    cyan: 180,
    blue: 230,
    purple: 290,
    pink: 330,
    red: 0,
    orange: 30,
    yellow: 60
};

/**
 * Default template values (v1.2.0)
 */
const TEMPLATE_DEFAULTS = {
    color: 330,          // pink (default template color)
    icon: 'custom',
    category: 'default',
    description: '',
    version: TEMPLATE_VERSION
};

/**
 * Template Manager for saving and loading block templates
 * Stores templates in localStorage for persistence
 * v1.2.0: Enhanced with icon, color, category, export/import support
 */
const templateManager = {
    STORAGE_KEY: 'promps-ent-templates',
    CATEGORY_STORAGE_KEY: 'promps-ent-template-categories',

    /**
     * Get all saved templates (migrated to v2 if needed)
     * @returns {Array} Array of template objects
     */
    getTemplates() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return [];

        const templates = JSON.parse(data);
        // Migrate v1 templates to v2 if needed
        const migratedTemplates = templates.map(t => this.migrateToV2(t));

        // Check if migration occurred and save
        const needsMigration = templates.some((t, i) =>
            !t.version || t.version !== migratedTemplates[i].version
        );
        if (needsMigration) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedTemplates));
        }

        return migratedTemplates;
    },

    /**
     * Migrate a v1 template to v2 format
     * @param {Object} template - Template object (v1 or v2)
     * @returns {Object} Template in v2 format
     */
    migrateToV2(template) {
        // Already v2
        if (template.version === TEMPLATE_VERSION) {
            return template;
        }

        // Calculate block count from serialized blocks
        const blockCount = this._countBlocks(template.blocks);

        // Generate preview text from blocks
        const previewText = this._generatePreviewText(template.blocks);

        return {
            ...template,
            version: TEMPLATE_VERSION,
            color: template.color ?? TEMPLATE_DEFAULTS.color,
            icon: template.icon ?? TEMPLATE_DEFAULTS.icon,
            category: template.category ?? TEMPLATE_DEFAULTS.category,
            description: template.description ?? TEMPLATE_DEFAULTS.description,
            blockCount: blockCount,
            previewText: previewText
        };
    },

    /**
     * Count blocks in serialized block data
     * @param {Object} blockData - Serialized block data
     * @returns {number} Block count
     */
    _countBlocks(blockData) {
        if (!blockData || typeof blockData !== 'object') return 0;

        let count = 1;  // Count this block

        // Count chained blocks (next)
        if (blockData.next && blockData.next.block) {
            count += this._countBlocks(blockData.next.block);
        }

        // Count nested blocks (inputs)
        if (blockData.inputs) {
            for (const inputName in blockData.inputs) {
                const input = blockData.inputs[inputName];
                if (input && input.block) {
                    count += this._countBlocks(input.block);
                }
            }
        }

        return count;
    },

    /**
     * Generate preview text from serialized block data
     * @param {Object} blockData - Serialized block data
     * @returns {string} Preview text (first ~50 chars)
     */
    _generatePreviewText(blockData) {
        if (!blockData || typeof blockData !== 'object') return '';

        const parts = [];
        this._extractTextFromBlocks(blockData, parts);

        const fullText = parts.join(' ').trim();
        if (fullText.length > 50) {
            return fullText.substring(0, 47) + '...';
        }
        return fullText;
    },

    /**
     * Extract text values from blocks recursively
     * @param {Object} blockData - Serialized block data
     * @param {Array} parts - Array to collect text parts
     */
    _extractTextFromBlocks(blockData, parts) {
        if (!blockData || typeof blockData !== 'object') return;

        // Extract field values
        if (blockData.fields) {
            for (const fieldName in blockData.fields) {
                const value = blockData.fields[fieldName];
                if (typeof value === 'string' && value.trim()) {
                    parts.push(value.trim());
                }
            }
        }

        // Process chained blocks
        if (blockData.next && blockData.next.block) {
            this._extractTextFromBlocks(blockData.next.block, parts);
        }

        // Process nested blocks
        if (blockData.inputs) {
            for (const inputName in blockData.inputs) {
                const input = blockData.inputs[inputName];
                if (input && input.block) {
                    this._extractTextFromBlocks(input.block, parts);
                }
            }
        }
    },

    /**
     * Save a block chain as a template
     * @param {string} name - Template name
     * @param {Blockly.Block} block - Starting block of the chain
     * @param {Object} options - Optional v1.2.0 options (color, icon, category, description)
     */
    saveTemplate(name, block, options = {}) {
        const templates = this.getTemplates();
        const blockJson = Blockly.serialization.blocks.save(block);
        const blockCount = this._countBlocks(blockJson);
        const previewText = this._generatePreviewText(blockJson);

        const newTemplate = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            blocks: blockJson,
            createdAt: new Date().toISOString(),
            // v1.2.0 fields
            version: TEMPLATE_VERSION,
            color: options.color ?? TEMPLATE_DEFAULTS.color,
            icon: options.icon ?? TEMPLATE_DEFAULTS.icon,
            category: options.category ?? TEMPLATE_DEFAULTS.category,
            description: options.description ?? TEMPLATE_DEFAULTS.description,
            blockCount: blockCount,
            previewText: previewText
        };

        templates.push(newTemplate);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
        this.refreshToolbox();

        return newTemplate;
    },

    /**
     * Update an existing template (v1.2.0)
     * @param {string} id - Template ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated template or null if not found
     */
    updateTemplate(id, updates) {
        const templates = this.getTemplates();
        const index = templates.findIndex(t => t.id === id);

        if (index === -1) return null;

        // Apply updates (only allowed fields)
        const allowedFields = ['name', 'color', 'icon', 'category', 'description'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                templates[index][field] = updates[field];
            }
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
        this.refreshToolbox();

        return templates[index];
    },

    /**
     * Get a single template by ID (v1.2.0)
     * @param {string} id - Template ID
     * @returns {Object|null} Template or null if not found
     */
    getTemplateById(id) {
        return this.getTemplates().find(t => t.id === id) || null;
    },

    /**
     * Get templates by category (v1.2.0)
     * @param {string} categoryId - Category ID
     * @returns {Array} Templates in the category
     */
    getTemplatesByCategory(categoryId) {
        return this.getTemplates().filter(t => t.category === categoryId);
    },

    /**
     * Delete a template by ID
     * @param {string} id - Template ID
     */
    deleteTemplate(id) {
        const templates = this.getTemplates().filter(t => t.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));

        // Close the flyout first, then refresh toolbox
        if (workspace) {
            const toolbox = workspace.getToolbox();
            if (toolbox) {
                toolbox.clearSelection();  // Close the flyout
            }
        }
        this.refreshToolbox();
    },

    /**
     * Insert a template into the workspace at center of visible area
     * @param {string} id - Template ID
     */
    /**
     * Remove block IDs from serialized block data recursively
     * This ensures Blockly generates new unique IDs for each insertion
     * @param {Object} blockData - Serialized block data
     */
    _removeBlockIds(blockData) {
        if (!blockData || typeof blockData !== 'object') return;

        // Remove the id field
        delete blockData.id;

        // Recursively process nested blocks (next, inputs)
        if (blockData.next && blockData.next.block) {
            this._removeBlockIds(blockData.next.block);
        }
        if (blockData.inputs) {
            for (const inputName in blockData.inputs) {
                const input = blockData.inputs[inputName];
                if (input && input.block) {
                    this._removeBlockIds(input.block);
                }
            }
        }
    },

    insertTemplate(id) {
        const template = this.getTemplates().find(t => t.id === id);
        if (template && workspace) {
            // Block limit check before insertion (v1.1.0)
            const countBefore = workspace.getAllBlocks(false).length;
            if (countBefore >= BLOCK_LIMIT) {
                showBlockLimitWarning();
                return;
            }

            try {
                // Calculate center of visible area using SVG coordinate transform
                const svg = workspace.getParentSvg();
                const rect = svg.getBoundingClientRect();
                const svgPoint = svg.createSVGPoint();
                svgPoint.x = rect.left + rect.width / 2;
                svgPoint.y = rect.top + rect.height / 2;
                const ctm = workspace.getCanvas().getScreenCTM();
                const wsPoint = ctm ? svgPoint.matrixTransform(ctm.inverse()) : { x: 50, y: 50 };

                // Clone the template blocks data and set position
                const blockData = JSON.parse(JSON.stringify(template.blocks));
                blockData.x = wsPoint.x;
                blockData.y = wsPoint.y;

                // Remove block IDs to ensure Blockly generates new unique IDs (v1.1.0)
                this._removeBlockIds(blockData);

                // Get blocks before insertion to identify new blocks
                const blocksBefore = new Set(workspace.getAllBlocks(false).map(b => b.id));

                // Insert blocks (serialization API doesn't record undo)
                Blockly.serialization.blocks.append(blockData, workspace);

                // Get newly created blocks
                const allBlocks = workspace.getAllBlocks(false);
                const newBlocks = allBlocks.filter(b => !blocksBefore.has(b.id));

                // Manually fire BLOCK_CREATE events for undo support (v1.1.0)
                if (newBlocks.length > 0) {
                    const eventGroup = Blockly.utils.idGenerator.genUid();
                    Blockly.Events.setGroup(eventGroup);
                    try {
                        newBlocks.forEach(block => {
                            const event = new Blockly.Events.BlockCreate(block);
                            event.recordUndo = true;
                            Blockly.Events.fire(event);
                        });
                    } finally {
                        Blockly.Events.setGroup(false);
                    }
                    // Update Undo/Redo buttons immediately after events (v1.1.0)
                    if (typeof updateUndoRedoButtons === 'function') {
                        updateUndoRedoButtons();
                    }
                }
            } catch (e) {
                console.error('Error inserting template:', e);
                // Fallback: insert without positioning
                const fallbackData = JSON.parse(JSON.stringify(template.blocks));
                this._removeBlockIds(fallbackData);
                Blockly.serialization.blocks.append(fallbackData, workspace);
            }

            // Block limit check after insertion (v1.1.0)
            const countAfter = workspace.getAllBlocks(false).length;
            if (countAfter > BLOCK_LIMIT) {
                // Remove newly inserted blocks directly (undo may not work reliably)
                const allBlocksNow = workspace.getAllBlocks(false);
                const blocksToRemove = allBlocksNow.filter(b => !blocksBefore.has(b.id));

                // Disable events during removal to avoid triggering change handlers
                Blockly.Events.disable();
                try {
                    blocksToRemove.forEach(block => {
                        if (block && !block.disposed) {
                            block.dispose(false, false);
                        }
                    });
                } finally {
                    Blockly.Events.enable();
                }

                // Clear the undo stack entries we just added
                workspace.clearUndo();

                showBlockLimitWarning();
                updateBlockCounter();
                if (typeof updateUndoRedoButtons === 'function') {
                    updateUndoRedoButtons();
                }
                return;
            }

            // Trigger preview update and validation after inserting template
            // Use setTimeout to ensure blocks are fully added to workspace
            setTimeout(() => {
                if (typeof updatePreview === 'function') {
                    const code = getWorkspaceCode();
                    updatePreview(code);
                }
                // Update block counter (v1.1.0)
                updateBlockCounter();
            }, 100);
        }
    },

    /**
     * Refresh the toolbox to show updated templates
     */
    refreshToolbox() {
        if (workspace) {
            // Re-register button callbacks for new templates
            this.registerButtonCallbacks();
            // Update the toolbox
            workspace.updateToolbox(buildToolbox());
        }
    },

    /**
     * Register button callbacks for all templates
     * Called during workspace initialization and after template changes
     */
    registerButtonCallbacks() {
        if (!workspace) return;

        this.getTemplates().forEach(template => {
            workspace.registerButtonCallback(`insert_template_${template.id}`, () => {
                this.insertTemplate(template.id);
            });
            workspace.registerButtonCallback(`edit_template_${template.id}`, () => {
                this.showTemplateEditor(template.id);
            });
            workspace.registerButtonCallback(`export_template_${template.id}`, () => {
                if (window.templateExportManager) {
                    window.templateExportManager.exportTemplate(template.id);
                }
            });
            workspace.registerButtonCallback(`delete_template_${template.id}`, async () => {
                const confirmMsg = tt('template.deleteConfirm', 'Delete this template?');
                // Tauri's confirm() returns a Promise
                if (await confirm(`${confirmMsg}\n${template.name}`)) {
                    this.deleteTemplate(template.id);
                }
            });
        });

        // Register import template button callback
        workspace.registerButtonCallback('import_template', () => {
            if (window.templateExportManager) {
                window.templateExportManager.importTemplate();
            }
        });

        // Register manage categories button callback (v1.2.0)
        workspace.registerButtonCallback('manage_categories', () => {
            if (window.categoryEditor) {
                window.categoryEditor.showModal();
            }
        });
    },

    /**
     * Show template editor modal (v1.2.0)
     * @param {string} id - Template ID
     */
    showTemplateEditor(id) {
        const template = this.getTemplateById(id);
        if (!template) return;

        // Dispatch event for template editor modal
        window.dispatchEvent(new CustomEvent('showTemplateEditor', {
            detail: { template }
        }));
    },

    /**
     * Export a template to file (v1.2.0)
     * @param {string} id - Template ID
     * @returns {Object} Export data structure
     */
    exportTemplate(id) {
        const template = this.getTemplateById(id);
        if (!template) return null;

        return {
            type: 'promps-template',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            exportedFrom: 'Promps Ent v1.2.0',
            template: {
                name: template.name,
                description: template.description,
                color: template.color,
                icon: template.icon,
                category: template.category,
                blocks: template.blocks,
                blockCount: template.blockCount,
                previewText: template.previewText
            }
        };
    },

    /**
     * Import a template from file data (v1.2.0)
     * @param {Object} data - Imported file data
     * @returns {Object|null} Created template or null if invalid
     */
    importTemplate(data) {
        // Validate structure
        if (!data || data.type !== 'promps-template' || !data.template) {
            console.error('Invalid template file format');
            return null;
        }

        const imported = data.template;

        // Validate required fields
        if (!imported.name || !imported.blocks) {
            console.error('Template missing required fields');
            return null;
        }

        // Create new template with imported data
        const templates = this.getTemplates();
        const blockCount = imported.blockCount || this._countBlocks(imported.blocks);
        const previewText = imported.previewText || this._generatePreviewText(imported.blocks);

        const newTemplate = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            name: imported.name,
            blocks: imported.blocks,
            createdAt: new Date().toISOString(),
            version: TEMPLATE_VERSION,
            color: imported.color ?? TEMPLATE_DEFAULTS.color,
            icon: imported.icon ?? TEMPLATE_DEFAULTS.icon,
            category: imported.category ?? TEMPLATE_DEFAULTS.category,
            description: imported.description ?? TEMPLATE_DEFAULTS.description,
            blockCount: blockCount,
            previewText: previewText,
            importedFrom: data.exportedFrom,
            importedAt: new Date().toISOString()
        };

        templates.push(newTemplate);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
        this.refreshToolbox();

        return newTemplate;
    }
};

// Export to global scope
window.templateManager = templateManager;

// ========================================================================
// Category Manager - Organize templates into categories (v1.2.0)
// ========================================================================

/**
 * Category Manager for organizing templates
 * Stores categories in localStorage for persistence
 */
const categoryManager = {
    STORAGE_KEY: 'promps-ent-template-categories',

    /**
     * Default category (cannot be deleted)
     */
    DEFAULT_CATEGORY: {
        id: 'default',
        name: 'category.default',  // i18n key
        color: 330,
        order: 0
    },

    /**
     * Get all categories
     * @returns {Array} Array of category objects
     */
    getCategories() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const userCategories = data ? JSON.parse(data) : [];

        // Always include default category at the beginning
        return [this.DEFAULT_CATEGORY, ...userCategories];
    },

    /**
     * Get user-created categories (excluding default)
     * @returns {Array} Array of user category objects
     */
    getUserCategories() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Create a new category
     * @param {string} name - Category name
     * @param {number} color - HSV hue value (0-360)
     * @returns {Object} Created category
     */
    createCategory(name, color = 330) {
        const categories = this.getUserCategories();
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.order || 0), 0);

        const newCategory = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            color: color,
            order: maxOrder + 1,
            createdAt: new Date().toISOString()
        };

        categories.push(newCategory);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));

        return newCategory;
    },

    /**
     * Update a category
     * @param {string} id - Category ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated category or null if not found/default
     */
    updateCategory(id, updates) {
        // Cannot update default category
        if (id === 'default') return null;

        const categories = this.getUserCategories();
        const index = categories.findIndex(c => c.id === id);

        if (index === -1) return null;

        // Apply updates (only allowed fields)
        const allowedFields = ['name', 'color', 'order'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                categories[index][field] = updates[field];
            }
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));

        return categories[index];
    },

    /**
     * Delete a category
     * @param {string} id - Category ID
     * @returns {boolean} True if deleted, false if not found/default
     */
    deleteCategory(id) {
        // Cannot delete default category
        if (id === 'default') return false;

        const categories = this.getUserCategories();
        const newCategories = categories.filter(c => c.id !== id);

        if (newCategories.length === categories.length) return false;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newCategories));

        // Move templates in deleted category to default
        const templates = templateManager.getTemplates();
        const updatedTemplates = templates.map(t => {
            if (t.category === id) {
                return { ...t, category: 'default' };
            }
            return t;
        });
        localStorage.setItem(templateManager.STORAGE_KEY, JSON.stringify(updatedTemplates));

        return true;
    },

    /**
     * Get a category by ID
     * @param {string} id - Category ID
     * @returns {Object|null} Category or null if not found
     */
    getCategoryById(id) {
        if (id === 'default') return this.DEFAULT_CATEGORY;
        return this.getUserCategories().find(c => c.id === id) || null;
    },

    /**
     * Get category name for display (handles i18n keys)
     * @param {Object} category - Category object
     * @returns {string} Display name
     */
    getCategoryDisplayName(category) {
        if (!category) return '';

        // Check if name is an i18n key
        if (category.name && category.name.startsWith('category.')) {
            return tt(category.name, category.name.split('.').pop());
        }

        return category.name || '';
    },

    /**
     * Get categories sorted by order
     * @returns {Array} Sorted categories
     */
    getSortedCategories() {
        return this.getCategories().sort((a, b) => (a.order || 0) - (b.order || 0));
    }
};

// Export to global scope
window.categoryManager = categoryManager;

// Export template constants to global scope (v1.2.0)
window.TEMPLATE_ICONS = TEMPLATE_ICONS;
window.TEMPLATE_COLORS = TEMPLATE_COLORS;
window.TEMPLATE_DEFAULTS = TEMPLATE_DEFAULTS;

// Create JavaScript generator
const javascriptGenerator = Blockly.JavaScript || new Blockly.Generator('JavaScript');

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function tt(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Register all block definitions with current locale translations
 * This function can be called multiple times to update block labels
 */
function registerBlockDefinitions() {
    // ========================================================================
    // Noun Block
    // ========================================================================
    Blockly.Blocks['promps_noun'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(tt('blockly.noun.label', 'Noun:'))
                .appendField(new Blockly.FieldTextInput("User"), "TEXT");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip(() => tt('blockly.noun.tooltip', 'Noun block (_N: prefix)'));
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['promps_noun'] = function(block, generator) {
        const text = block.getFieldValue('TEXT');
        return '_N:' + text + ' ';
    };

    // ========================================================================
    // Other Block
    // ========================================================================
    Blockly.Blocks['promps_other'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(tt('blockly.other.label', 'Other:'))
                .appendField(new Blockly.FieldTextInput("text"), "TEXT");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.other.tooltip', 'Other block'));
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['promps_other'] = function(block, generator) {
        const text = block.getFieldValue('TEXT');
        return text + ' ';
    };

    // ========================================================================
    // Particle Blocks
    // ========================================================================

    // が (subject marker)
    Blockly.Blocks['promps_particle_ga'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.ga.label', 'が')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.ga.tooltip', 'Subject marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_ga'] = function(block, generator) {
        return tt('blockly.particle.ga.output', 'が ');
    };

    // を (object marker)
    Blockly.Blocks['promps_particle_wo'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.wo.label', 'を')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.wo.tooltip', 'Object marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_wo'] = function(block, generator) {
        return tt('blockly.particle.wo.output', 'を ');
    };

    // に (direction/target marker)
    Blockly.Blocks['promps_particle_ni'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.ni.label', 'に')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.ni.tooltip', 'Direction marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_ni'] = function(block, generator) {
        return tt('blockly.particle.ni.output', 'に ');
    };

    // で (means/location marker)
    Blockly.Blocks['promps_particle_de'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.de.label', 'で')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.de.tooltip', 'Means marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_de'] = function(block, generator) {
        return tt('blockly.particle.de.output', 'で ');
    };

    // と (and/with marker)
    Blockly.Blocks['promps_particle_to'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.to.label', 'と')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.to.tooltip', 'And/with marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_to'] = function(block, generator) {
        return tt('blockly.particle.to.output', 'と ');
    };

    // へ (direction marker)
    Blockly.Blocks['promps_particle_he'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.he.label', 'へ')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.he.tooltip', 'Direction marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_he'] = function(block, generator) {
        return tt('blockly.particle.he.output', 'へ ');
    };

    // から (from marker)
    Blockly.Blocks['promps_particle_kara'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.kara.label', 'から')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.kara.tooltip', 'From marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_kara'] = function(block, generator) {
        return tt('blockly.particle.kara.output', 'から ');
    };

    // まで (until marker)
    Blockly.Blocks['promps_particle_made'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.made.label', 'まで')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.made.tooltip', 'Until marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_made'] = function(block, generator) {
        return tt('blockly.particle.made.output', 'まで ');
    };

    // より (comparison marker)
    Blockly.Blocks['promps_particle_yori'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.particle.yori.label', 'より')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip(() => tt('blockly.particle.yori.tooltip', 'Comparison marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_particle_yori'] = function(block, generator) {
        return tt('blockly.particle.yori.output', 'より ');
    };

    // ========================================================================
    // Article Blocks (English mode only)
    // ========================================================================

    // a (indefinite article)
    Blockly.Blocks['promps_article_a'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.a.label', 'a')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.a.tooltip', 'Indefinite article'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_a'] = function(block, generator) {
        return tt('blockly.article.a.output', 'a ');
    };

    // an (indefinite article for vowels)
    Blockly.Blocks['promps_article_an'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.an.label', 'an')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.an.tooltip', 'Indefinite article for vowels'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_an'] = function(block, generator) {
        return tt('blockly.article.an.output', 'an ');
    };

    // the (definite article)
    Blockly.Blocks['promps_article_the'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.the.label', 'the')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.the.tooltip', 'Definite article'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_the'] = function(block, generator) {
        return tt('blockly.article.the.output', 'the ');
    };

    // this (demonstrative)
    Blockly.Blocks['promps_article_this'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.this.label', 'this')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.this.tooltip', 'Demonstrative for nearby'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_this'] = function(block, generator) {
        return tt('blockly.article.this.output', 'this ');
    };

    // that (demonstrative)
    Blockly.Blocks['promps_article_that'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.that.label', 'that')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.that.tooltip', 'Demonstrative for distant'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_that'] = function(block, generator) {
        return tt('blockly.article.that.output', 'that ');
    };

    // please (polite marker)
    Blockly.Blocks['promps_article_please'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.article.please.label', 'please')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(180);
            this.setTooltip(() => tt('blockly.article.please.tooltip', 'Polite request marker'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_article_please'] = function(block, generator) {
        return tt('blockly.article.please.output', 'please ');
    };

    // ========================================================================
    // Verb Blocks
    // ========================================================================

    // 分析して (analyze)
    Blockly.Blocks['promps_verb_analyze'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.analyze.label', '分析して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.analyze.tooltip', 'Verb: analyze'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_analyze'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.analyze.output', '分析して ');
    };

    // 要約して (summarize)
    Blockly.Blocks['promps_verb_summarize'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.summarize.label', '要約して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.summarize.tooltip', 'Verb: summarize'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_summarize'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.summarize.output', '要約して ');
    };

    // 翻訳して (translate)
    Blockly.Blocks['promps_verb_translate'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.translate.label', '翻訳して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.translate.tooltip', 'Verb: translate'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_translate'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.translate.output', '翻訳して ');
    };

    // 作成して (create)
    Blockly.Blocks['promps_verb_create'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.create.label', '作成して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.create.tooltip', 'Verb: create'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_create'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.create.output', '作成して ');
    };

    // 生成して (generate)
    Blockly.Blocks['promps_verb_generate'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.generate.label', '生成して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.generate.tooltip', 'Verb: generate'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_generate'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.generate.output', '生成して ');
    };

    // 変換して (convert)
    Blockly.Blocks['promps_verb_convert'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.convert.label', '変換して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.convert.tooltip', 'Verb: convert'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_convert'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.convert.output', '変換して ');
    };

    // 削除して (delete)
    Blockly.Blocks['promps_verb_delete'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.delete.label', '削除して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.delete.tooltip', 'Verb: delete'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_delete'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.delete.output', '削除して ');
    };

    // 更新して (update)
    Blockly.Blocks['promps_verb_update'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.update.label', '更新して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.update.tooltip', 'Verb: update'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_update'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.update.output', '更新して ');
    };

    // 抽出して (extract)
    Blockly.Blocks['promps_verb_extract'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.extract.label', '抽出して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.extract.tooltip', 'Verb: extract'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_extract'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.extract.output', '抽出して ');
    };

    // 説明して (explain)
    Blockly.Blocks['promps_verb_explain'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.explain.label', '説明して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.explain.tooltip', 'Verb: explain'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_explain'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.explain.output', '説明して ');
    };

    // 解説して (describe)
    Blockly.Blocks['promps_verb_describe'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.describe.label', '解説して')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.describe.tooltip', 'Verb: describe'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_describe'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.describe.output', '解説して ');
    };

    // 教えて (teach)
    Blockly.Blocks['promps_verb_teach'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.verb.teach.label', '教えて')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.teach.tooltip', 'Verb: teach'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_teach'] = function(block, generator) {
        return '_V:' + tt('blockly.verb.teach.output', '教えて ');
    };

    // Custom Verb (user input)
    Blockly.Blocks['promps_verb_custom'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(tt('blockly.verb.label', '動詞:'))
                .appendField(new Blockly.FieldTextInput(tt('blockly.verb.custom.default', '作成して')), "TEXT");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip(() => tt('blockly.verb.custom.tooltip', 'Custom verb block'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_verb_custom'] = function(block, generator) {
        const text = block.getFieldValue('TEXT');
        return '_V:' + text + ' ';
    };

    // ========================================================================
    // Punctuation Blocks
    // ========================================================================

    // 、(touten - comma)
    Blockly.Blocks['promps_punct_touten'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.touten.label', '、')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.touten.tooltip', 'Punctuation: comma'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_touten'] = function(block, generator) {
        return tt('blockly.punct.touten.output', '、 ');
    };

    // 。(kuten - period)
    Blockly.Blocks['promps_punct_kuten'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.kuten.label', '。')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.kuten.tooltip', 'Punctuation: period'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_kuten'] = function(block, generator) {
        return tt('blockly.punct.kuten.output', '。 ');
    };

    // ！(exclamation)
    Blockly.Blocks['promps_punct_exclaim'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.exclaim.label', '！')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.exclaim.tooltip', 'Punctuation: exclamation'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_exclaim'] = function(block, generator) {
        return tt('blockly.punct.exclaim.output', '！ ');
    };

    // ？(question)
    Blockly.Blocks['promps_punct_question'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.question.label', '？')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.question.tooltip', 'Punctuation: question'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_question'] = function(block, generator) {
        return tt('blockly.punct.question.output', '？ ');
    };

    // "(double quote)
    Blockly.Blocks['promps_punct_dquote'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.dquote.label', '"')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.dquote.tooltip', 'Punctuation: double quote'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_dquote'] = function(block, generator) {
        return tt('blockly.punct.dquote.output', '" ');
    };

    // '(single quote)
    Blockly.Blocks['promps_punct_squote'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.squote.label', "'")));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.squote.tooltip', 'Punctuation: single quote'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_squote'] = function(block, generator) {
        return tt('blockly.punct.squote.output', "' ");
    };

    // ,(comma)
    Blockly.Blocks['promps_punct_comma'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.comma.label', ',')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.comma.tooltip', 'Punctuation: comma'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_comma'] = function(block, generator) {
        return tt('blockly.punct.comma.output', ', ');
    };

    // /(slash)
    Blockly.Blocks['promps_punct_slash'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.slash.label', '/')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.slash.tooltip', 'Punctuation: slash'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_slash'] = function(block, generator) {
        return tt('blockly.punct.slash.output', '/ ');
    };

    // &(ampersand)
    Blockly.Blocks['promps_punct_amp'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.amp.label', '&')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.amp.tooltip', 'Punctuation: ampersand'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_amp'] = function(block, generator) {
        return tt('blockly.punct.amp.output', '& ');
    };

    // . (period)
    Blockly.Blocks['promps_punct_period'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(tt('blockly.punct.period.label', '.')));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(60);
            this.setTooltip(() => tt('blockly.punct.period.tooltip', 'Punctuation: period'));
            this.setHelpUrl("");
        }
    };
    javascriptGenerator.forBlock['promps_punct_period'] = function(block, generator) {
        return tt('blockly.punct.period.output', '. ');
    };

    console.log('Block definitions registered');
}

// Register blocks on initial load
registerBlockDefinitions();

/**
 * Build toolbox definition with translated category names
 * @returns {Object} Toolbox definition
 */
function buildToolbox() {
    return {
        "kind": "categoryToolbox",
        "contents": [
            // Noun category
            {
                "kind": "category",
                "name": tt('blockly.category.noun', 'Noun'),
                "colour": "120",
                "contents": [
                    { "kind": "block", "type": "promps_noun" }
                ]
            },
            // Particle/Connector category
            {
                "kind": "category",
                "name": tt('blockly.category.particle', 'Particle'),
                "colour": "230",
                "contents": (function() {
                    const isJapanese = typeof window.getLocale === 'function' && window.getLocale() === 'ja';
                    const particles = [];
                    // Subject/object markers only shown in Japanese mode
                    if (isJapanese) {
                        particles.push({ "kind": "block", "type": "promps_particle_ga" });
                        particles.push({ "kind": "block", "type": "promps_particle_wo" });
                    }
                    // Other particles shown in both modes
                    particles.push({ "kind": "block", "type": "promps_particle_ni" });
                    particles.push({ "kind": "block", "type": "promps_particle_de" });
                    particles.push({ "kind": "block", "type": "promps_particle_to" });
                    particles.push({ "kind": "block", "type": "promps_particle_he" });
                    particles.push({ "kind": "block", "type": "promps_particle_kara" });
                    particles.push({ "kind": "block", "type": "promps_particle_made" });
                    particles.push({ "kind": "block", "type": "promps_particle_yori" });
                    return particles;
                })()
            },
            // Article category (English and French mode)
            ...(function() {
                const locale = typeof window.getLocale === 'function' ? window.getLocale() : 'ja';
                const isEnglish = locale === 'en' || locale === 'fr';
                if (!isEnglish) return [];
                return [{
                    "kind": "category",
                    "name": tt('blockly.category.article', 'Article'),
                    "colour": "180",
                    "contents": [
                        { "kind": "block", "type": "promps_article_a" },
                        { "kind": "block", "type": "promps_article_an" },
                        { "kind": "block", "type": "promps_article_the" },
                        { "kind": "block", "type": "promps_article_this" },
                        { "kind": "block", "type": "promps_article_that" },
                        { "kind": "block", "type": "promps_article_please" }
                    ]
                }];
            })(),
            // Verb/Action category
            {
                "kind": "category",
                "name": tt('blockly.category.verb', 'Verb'),
                "colour": "290",
                "contents": [
                    { "kind": "block", "type": "promps_verb_analyze" },
                    { "kind": "block", "type": "promps_verb_summarize" },
                    { "kind": "block", "type": "promps_verb_translate" },
                    { "kind": "block", "type": "promps_verb_create" },
                    { "kind": "block", "type": "promps_verb_generate" },
                    { "kind": "block", "type": "promps_verb_convert" },
                    { "kind": "block", "type": "promps_verb_delete" },
                    { "kind": "block", "type": "promps_verb_update" },
                    { "kind": "block", "type": "promps_verb_extract" },
                    { "kind": "block", "type": "promps_verb_explain" },
                    { "kind": "block", "type": "promps_verb_describe" },
                    { "kind": "block", "type": "promps_verb_teach" },
                    { "kind": "block", "type": "promps_verb_custom" }
                ]
            },
            // Punctuation category (language-specific to avoid duplicates)
            {
                "kind": "category",
                "name": tt('blockly.category.punctuation', 'Punctuation'),
                "colour": "60",
                "contents": (typeof window.getLocale === 'function' && window.getLocale() === 'ja') ? [
                    // Japanese mode: use Japanese punctuation (touten/kuten) + common symbols
                    { "kind": "block", "type": "promps_punct_touten" },
                    { "kind": "block", "type": "promps_punct_kuten" },
                    { "kind": "block", "type": "promps_punct_exclaim" },
                    { "kind": "block", "type": "promps_punct_question" },
                    { "kind": "block", "type": "promps_punct_dquote" },
                    { "kind": "block", "type": "promps_punct_squote" },
                    { "kind": "block", "type": "promps_punct_slash" },
                    { "kind": "block", "type": "promps_punct_amp" },
                    { "kind": "block", "type": "promps_punct_comma" },
                    { "kind": "block", "type": "promps_punct_period" }
                ] : [
                    // English mode: use ASCII punctuation only (no touten/kuten)
                    { "kind": "block", "type": "promps_punct_comma" },
                    { "kind": "block", "type": "promps_punct_period" },
                    { "kind": "block", "type": "promps_punct_exclaim" },
                    { "kind": "block", "type": "promps_punct_question" },
                    { "kind": "block", "type": "promps_punct_dquote" },
                    { "kind": "block", "type": "promps_punct_squote" },
                    { "kind": "block", "type": "promps_punct_slash" },
                    { "kind": "block", "type": "promps_punct_amp" }
                ]
            },
            // Other category
            {
                "kind": "category",
                "name": tt('blockly.category.other', 'Other'),
                "colour": "20",
                "contents": [
                    { "kind": "block", "type": "promps_other" }
                ]
            },
            // My Templates category (dynamic)
            {
                "kind": "category",
                "name": tt('toolbox.myTemplates', 'My Templates'),
                "colour": "330",
                "custom": "MY_TEMPLATES",
                "toolboxitemid": "catMyTemplates"
            }
        ]
    };
}

/**
 * Register a dynamic template block (v1.2.0)
 * Creates a Blockly block definition for a template that can be dragged into the workspace
 * @param {Object} template - Template object
 */
function registerTemplateBlock(template) {
    const blockType = `promps_template_${template.id}`;

    // Delete old registration if exists (to allow updates)
    if (Blockly.Blocks[blockType]) {
        delete Blockly.Blocks[blockType];
    }

    const icon = TEMPLATE_ICONS[template.icon] || TEMPLATE_ICONS.custom;
    const displayText = `${icon} ${template.name}`;
    const tooltipText = `${icon} ${template.name} (${template.blockCount} ${tt('blocks.counter.label', 'blocks')})`;

    // Register the block
    Blockly.Blocks[blockType] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel(displayText));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(template.color || TEMPLATE_DEFAULTS.color);
            this.setTooltip(tooltipText);
            this.setHelpUrl("");

            // Store template ID for expansion
            this._templateId = template.id;
        }
    };

    // Register the generator - returns empty string since this block will be expanded
    javascriptGenerator.forBlock[blockType] = function(block, generator) {
        // Template blocks should be expanded, not generated as-is
        // This is a fallback if expansion fails
        return '';
    };

    return blockType;
}

/**
 * Expand a template block into its component blocks
 * Called when a template block is dropped into the workspace
 * @param {Blockly.Block} templateBlock - The template block to expand
 */
function expandTemplateBlock(templateBlock) {
    const templateId = templateBlock._templateId;
    if (!templateId) return;

    const template = templateManager.getTemplateById(templateId);
    if (!template) return;

    // Block limit check before expansion (template block itself counts as 1,
    // but expanded blocks may be many more)
    const currentCount = workspace.getAllBlocks(false).length;
    if (currentCount >= BLOCK_LIMIT) {
        showBlockLimitWarning();
        // Remove the template block since it was just dragged in
        Blockly.Events.disable();
        try {
            templateBlock.dispose(false, false);
        } finally {
            Blockly.Events.enable();
        }
        updateBlockCounter();
        return;
    }

    // Clone template block data - place at workspace origin
    const blockData = JSON.parse(JSON.stringify(template.blocks));
    blockData.x = 0;
    blockData.y = 0;

    // Remove block IDs for unique generation
    templateManager._removeBlockIds(blockData);

    // Store template block ID to clean up undo stack
    const templateBlockId = templateBlock.id;

    // Track blocks before insertion
    const blockIdsBefore = new Set(workspace.getAllBlocks(false).map(b => b.id));

    // Disable all events during dispose + append + center offset
    Blockly.Events.disable();
    try {
        templateBlock.dispose(false, false);
        Blockly.serialization.blocks.append(blockData, workspace);

        // Center block on origin: shift by half block size
        const newBlock = workspace.getAllBlocks(false).find(b => !blockIdsBefore.has(b.id));
        if (newBlock) {
            const size = newBlock.getHeightWidth();
            newBlock.moveBy(-size.width / 2, -size.height / 2);
        }
    } finally {
        Blockly.Events.enable();
    }

    // Remove template block events from undo stack (v1.2.0)
    // This ensures clean undo behavior - only expanded blocks are undoable
    if (workspace.undoStack_) {
        workspace.undoStack_ = workspace.undoStack_.filter(event =>
            event.blockId !== templateBlockId
        );
    }

    // Get newly created blocks (excluding pre-existing blocks)
    const newBlocks = workspace.getAllBlocks(false).filter(b =>
        !blockIdsBefore.has(b.id) && b.id !== templateBlockId
    );

    // Fire grouped events for undo/redo support
    if (newBlocks.length > 0) {
        const eventGroup = Blockly.utils.idGenerator.genUid();
        Blockly.Events.setGroup(eventGroup);
        try {
            // Fire a single create event for the top block only
            const topBlock = newBlocks.find(b => !b.getParent()) || newBlocks[0];
            if (topBlock) {
                const event = new Blockly.Events.BlockCreate(topBlock);
                event.recordUndo = true;
                Blockly.Events.fire(event);
            }
        } finally {
            Blockly.Events.setGroup(false);
        }
    }

    // Update undo/redo buttons
    if (typeof updateUndoRedoButtons === 'function') {
        updateUndoRedoButtons();
    }

    // Update counters
    if (typeof updateBlockCounter === 'function') {
        updateBlockCounter();
    }

    // Trigger preview update
    setTimeout(() => {
        if (typeof updatePreview === 'function') {
            const code = getWorkspaceCode();
            updatePreview(code);
        }
    }, 50);

    // Delayed block limit check after expansion
    setTimeout(() => {
        updateBlockCounter();
    }, 200);
}

/**
 * Generate dynamic content for My Templates category
 * @param {Blockly.Workspace} ws - The workspace
 * @returns {Array} Array of toolbox items
 */
function generateTemplateCategory(ws) {
    const blockList = [];
    const templates = templateManager.getTemplates();
    const categories = categoryManager.getSortedCategories();

    if (templates.length === 0) {
        blockList.push({
            kind: 'label',
            text: tt('template.empty', 'No templates saved')
        });
        return blockList;
    }

    // Group templates by category
    const templatesByCategory = {};
    templates.forEach(template => {
        const catId = template.category || 'default';
        if (!templatesByCategory[catId]) {
            templatesByCategory[catId] = [];
        }
        templatesByCategory[catId].push(template);
    });

    // Generate blocks for each category
    categories.forEach(category => {
        const catTemplates = templatesByCategory[category.id] || [];
        if (catTemplates.length === 0) return;

        // Add category label if not default or if multiple categories exist
        const hasMultipleCategories = Object.keys(templatesByCategory).length > 1;
        if (hasMultipleCategories) {
            const catName = categoryManager.getCategoryDisplayName(category);
            blockList.push({
                kind: 'label',
                text: `── ${catName} ──`
            });
        }

        // Add template blocks
        catTemplates.forEach(template => {
            // Register the dynamic block
            const blockType = registerTemplateBlock(template);

            // Add block to toolbox
            blockList.push({
                kind: 'block',
                type: blockType
            });
        });
    });

    // Add separator and action buttons
    if (templates.length > 0) {
        blockList.push({
            kind: 'label',
            text: '──────────'
        });

        // Add action buttons for each template (edit/delete/export)
        templates.forEach(template => {
            const icon = TEMPLATE_ICONS[template.icon] || TEMPLATE_ICONS.custom;
            blockList.push({
                kind: 'button',
                text: `${tt('template.edit', 'Edit')}: ${icon} ${template.name}`,
                callbackKey: `edit_template_${template.id}`
            });
            blockList.push({
                kind: 'button',
                text: `${tt('template.export', 'Export')}: ${icon} ${template.name}`,
                callbackKey: `export_template_${template.id}`
            });
            blockList.push({
                kind: 'button',
                text: `${tt('template.delete', 'Delete')}: ${icon} ${template.name}`,
                callbackKey: `delete_template_${template.id}`
            });
        });
    }

    // Add management buttons at the end (always visible)
    blockList.push({
        kind: 'label',
        text: '──────────'
    });
    blockList.push({
        kind: 'button',
        text: tt('category.manage', 'Manage Categories'),
        callbackKey: 'manage_categories'
    });
    blockList.push({
        kind: 'button',
        text: tt('template.import', 'Import Template'),
        callbackKey: 'import_template'
    });

    return blockList;
}

/**
 * Show custom modal for template name input.
 * Uses custom modal instead of native prompt() to avoid
 * Blockly context menu cleanup issues in Tauri WebView.
 */
function showTemplateNameModal(onConfirm) {
    var modal = document.getElementById('templateNameModal');
    var input = document.getElementById('templateNameInput');
    var btnSave = document.getElementById('btnSaveTemplateName');
    var btnCancel = document.getElementById('btnCancelTemplateName');
    var btnClose = document.getElementById('btnCloseTemplateNameModal');

    if (!modal || !input) return;

    input.value = '';
    modal.classList.add('modal-visible');
    input.focus();

    function cleanup() {
        modal.classList.remove('modal-visible');
        btnSave.removeEventListener('click', handleSave);
        btnCancel.removeEventListener('click', handleCancel);
        btnClose.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleOverlay);
        input.removeEventListener('keydown', handleKeydown);
    }

    function handleSave() {
        var name = input.value;
        cleanup();
        if (onConfirm) onConfirm(name);
    }

    function handleCancel() {
        cleanup();
    }

    function handleOverlay(e) {
        if (e.target === modal) cleanup();
    }

    function handleKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
        else if (e.key === 'Escape') { handleCancel(); }
    }

    btnSave.addEventListener('click', handleSave);
    btnCancel.addEventListener('click', handleCancel);
    btnClose.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleOverlay);
    input.addEventListener('keydown', handleKeydown);
}

/**
 * Register custom context menu for saving blocks as templates
 */
function registerTemplateContextMenu() {
    // Ensure Blockly is loaded
    if (typeof Blockly === 'undefined' || !Blockly.ContextMenuRegistry) {
        console.error('Blockly not loaded, cannot register context menu');
        return;
    }

    // Check if already registered to avoid duplicate registration
    try {
        if (Blockly.ContextMenuRegistry.registry.getItem('save_as_template')) {
            console.log('Template context menu already registered');
            return;
        }
    } catch (e) {
        // Item doesn't exist, continue with registration
    }

    try {
        Blockly.ContextMenuRegistry.registry.register({
            id: 'save_as_template',
            weight: 10,  // Low weight = appears near top of menu
            displayText: function() {
                return tt('template.saveAs', 'Save as Template');
            },
            preconditionFn: function(scope) {
                // Only show for blocks in the main workspace (not flyout)
                if (scope.block && !scope.block.isInFlyout) {
                    return 'enabled';
                }
                return 'hidden';
            },
            callback: function(scope) {
                // Use custom modal instead of native prompt() to avoid
                // Blockly context menu cleanup issues in Tauri WebView
                setTimeout(function() {
                    showTemplateNameModal(function(name) {
                        if (name && name.trim()) {
                            templateManager.saveTemplate(name.trim(), scope.block);
                        }
                    });
                }, 0);
            },
            scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK
        });
        console.log('Template context menu registered successfully');
    } catch (e) {
        console.error('Failed to register template context menu:', e);
    }
}

/**
 * Register context menu for adding blocks to favorites (v1.5.0)
 * Ent feature - requires license
 */
function registerBlockFavoritesContextMenu() {
    // Ensure Blockly is loaded
    if (typeof Blockly === 'undefined' || !Blockly.ContextMenuRegistry) {
        console.error('Blockly not loaded, cannot register favorites context menu');
        return;
    }

    // Check if already registered to avoid duplicate registration
    try {
        if (Blockly.ContextMenuRegistry.registry.getItem('add_to_favorites')) {
            console.log('Block favorites context menu already registered');
            return;
        }
    } catch (e) {
        // Item doesn't exist, continue with registration
    }

    try {
        Blockly.ContextMenuRegistry.registry.register({
            id: 'add_to_favorites',
            weight: 11,  // After save_as_template
            displayText: function() {
                const label = tt('blockFavorites.addToFavorites', 'Add to Favorites');
                return label + ' [Ent]';
            },
            preconditionFn: function(scope) {
                // Only show for blocks in the main workspace (not flyout)
                if (scope.block && !scope.block.isInFlyout) {
                    return 'enabled';
                }
                return 'hidden';
            },
            callback: function(scope) {
                if (window.blockFavoritesManager && scope.block) {
                    const result = window.blockFavoritesManager.addFavorite(scope.block);
                    if (result) {
                        // Update floating palette if it exists
                        if (window.floatingPaletteInstance) {
                            window.floatingPaletteInstance.updatePalette();
                        }
                    }
                }
            },
            scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK
        });
        console.log('Block favorites context menu registered successfully');
    } catch (e) {
        console.error('Failed to register block favorites context menu:', e);
    }
}

/**
 * Override Blockly's delete block confirmation for Tauri (v1.2.0)
 * Tauri's confirm() returns a Promise which breaks Blockly's sync flow.
 * Simply disable the confirmation dialog - blocks can be restored via undo.
 */
function overrideDeleteBlockContextMenu() {
    if (typeof Blockly === 'undefined') {
        return;
    }

    // Override global confirm to always return true synchronously
    // This disables Blockly's built-in confirmation dialogs
    window.confirm = function(message) {
        return true;
    };
}

/**
 * Register the dynamic template category callback
 */
function registerTemplateCategory() {
    if (!workspace) return;

    workspace.registerToolboxCategoryCallback('MY_TEMPLATES', generateTemplateCategory);
    templateManager.registerButtonCallbacks();

    console.log('Template category registered');
}

/**
 * Get CSS custom property value from the document root
 */
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Create Blockly dark theme
 */
function createDarkTheme() {
    return Blockly.Theme.defineTheme('dark', {
        'base': Blockly.Themes.Classic,
        'componentStyles': {
            'workspaceBackgroundColour': getCSSVar('--bg-primary'),
            'toolboxBackgroundColour': getCSSVar('--blockly-toolbox-bg'),
            'toolboxForegroundColour': getCSSVar('--text-primary'),
            'flyoutBackgroundColour': getCSSVar('--blockly-flyout-bg'),
            'flyoutForegroundColour': getCSSVar('--text-primary'),
            'flyoutOpacity': 1,
            'scrollbarColour': getCSSVar('--scrollbar-thumb'),
            'scrollbarOpacity': 0.8,
            'insertionMarkerColour': getCSSVar('--blockly-insertion-marker-color'),
            'insertionMarkerOpacity': 0.3,
            'cursorColour': getCSSVar('--blockly-cursor-color')
        },
        'fontStyle': {
            'family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'weight': 'normal',
            'size': 12
        }
    });
}

/**
 * Get current theme based on data-theme attribute
 */
function getCurrentBlocklyTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        return createDarkTheme();
    }
    return Blockly.Themes.Classic;
}

/**
 * Update Blockly theme when app theme changes
 */
function updateBlocklyTheme() {
    if (workspace) {
        workspace.setTheme(getCurrentBlocklyTheme());
    }
}

/**
 * Initialize Blockly workspace
 */
function initBlockly() {
    const blocklyDiv = document.getElementById('blocklyDiv');

    // Remove placeholder
    blocklyDiv.innerHTML = '';

    // Build toolbox with translated category names
    const toolbox = buildToolbox();

    // Workspace options
    const options = {
        toolbox: toolbox,
        theme: getCurrentBlocklyTheme(),
        collapse: false,
        comments: false,
        disable: false,
        maxBlocks: Infinity,
        trashcan: true,
        horizontalLayout: false,
        toolboxPosition: 'start',
        css: true,
        media: 'https://unpkg.com/blockly/media/',
        rtl: false,
        scrollbars: true,
        sounds: true,
        oneBasedIndex: true,
        grid: {
            spacing: 20,
            length: 3,
            colour: getCSSVar('--blockly-grid-color'),
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        }
    };

    // Inject Blockly workspace
    workspace = Blockly.inject(blocklyDiv, options);

    // Register template context menu (global, only once)
    registerTemplateContextMenu();

    // Register block favorites context menu (v1.5.0 Ent feature)
    registerBlockFavoritesContextMenu();

    // Override block dispose for async confirm (v1.2.0)
    overrideDeleteBlockContextMenu();

    // Register dynamic template category (must be after workspace creation)
    registerTemplateCategory();

    // Add change listener for real-time preview
    workspace.addChangeListener(onBlocklyChange);

    // Initialize block counter (v1.1.0)
    updateBlockCounter();

    // Center workspace origin (0,0) in the viewport
    requestAnimationFrame(() => {
        const metrics = workspace.getMetrics();
        workspace.scroll(metrics.viewWidth / 2, metrics.viewHeight / 2);
    });

    console.log('Blockly workspace initialized');
}

/**
 * Handle Blockly workspace changes
 */
function onBlocklyChange(event) {
    // Ignore UI events
    if (event.isUiEvent) {
        return;
    }

    // Only process events from main workspace
    if (!workspace || event.workspaceId !== workspace.id) {
        return;
    }

    let shouldMarkDirty = false;

    // Track newly created blocks (from flyout)
    if (!window._newlyCreatedBlocks) {
        window._newlyCreatedBlocks = new Map();
    }

    // Create event - track as newly created
    if (event.type === Blockly.Events.BLOCK_CREATE) {
        window._newlyCreatedBlocks.set(event.blockId, null);

        // Template block - track for expansion on drop (v1.2.0)
        const block = workspace.getBlockById(event.blockId);
        if (block && block.type && block.type.startsWith('promps_template_') && block._templateId) {
            // Track this template block for expansion after drag ends
            window._pendingTemplateExpansion = event.blockId;
            return; // Don't process further - expansion will happen on BLOCK_MOVE
        }

        // Block limit enforcement (v1.1.0)
        const currentCount = workspace.getAllBlocks(false).length;
        if (currentCount > BLOCK_LIMIT) {
            // Mark this block for removal after drag completes
            const blockId = event.blockId;
            window._blockToRemoveAfterDrag = blockId;
        } else if (currentCount === BLOCK_WARNING_THRESHOLD) {
            // Show warning when threshold is reached
            showBlockWarning();
        }
    }

    // Handle block limit removal after drag ends (v1.1.0)
    if (event.type === Blockly.Events.BLOCK_MOVE && window._blockToRemoveAfterDrag) {
        const blockId = window._blockToRemoveAfterDrag;
        if (event.blockId === blockId) {
            window._blockToRemoveAfterDrag = null;
            const block = workspace.getBlockById(blockId);
            if (block) {
                block.dispose();
                showBlockLimitWarning();
                updateBlockCounter();
                return; // Don't process further
            }
        }
    }

    // Template block expansion after drop (v1.2.0)
    if (event.type === Blockly.Events.BLOCK_MOVE && window._pendingTemplateExpansion) {
        const blockId = window._pendingTemplateExpansion;
        if (event.blockId === blockId) {
            window._pendingTemplateExpansion = null;
            const templateBlock = workspace.getBlockById(blockId);
            if (templateBlock && !templateBlock.isInFlyout) {
                // Use setTimeout to ensure the block is fully placed
                setTimeout(() => {
                    const block = workspace.getBlockById(blockId);
                    if (block) {
                        expandTemplateBlock(block);
                    }
                }, 50);
            }
            return; // Don't process further - expansion will handle everything
        }
    }

    // Move event
    if (event.type === Blockly.Events.BLOCK_MOVE) {
        if (window._newlyCreatedBlocks.has(event.blockId)) {
            const existingTimer = window._newlyCreatedBlocks.get(event.blockId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            const timerId = setTimeout(() => {
                if (window._newlyCreatedBlocks.has(event.blockId)) {
                    window._newlyCreatedBlocks.delete(event.blockId);
                    const block = workspace.getBlockById(event.blockId);
                    if (block && window.projectManager && typeof window.projectManager.markDirty === 'function') {
                        window.projectManager.markDirty();
                    }
                }
            }, 150);
            window._newlyCreatedBlocks.set(event.blockId, timerId);
        } else {
            shouldMarkDirty = true;
        }
    }

    // Delete event
    if (event.type === Blockly.Events.BLOCK_DELETE) {
        if (window._newlyCreatedBlocks.has(event.blockId)) {
            const timerId = window._newlyCreatedBlocks.get(event.blockId);
            if (timerId) {
                clearTimeout(timerId);
            }
            window._newlyCreatedBlocks.delete(event.blockId);
        } else {
            shouldMarkDirty = true;
        }
    }

    // Field change event
    if (event.type === Blockly.Events.BLOCK_CHANGE) {
        shouldMarkDirty = true;
    }

    if (shouldMarkDirty) {
        if (window.projectManager && typeof window.projectManager.markDirty === 'function') {
            window.projectManager.markDirty();
        }
    }

    // Generate DSL code from all blocks
    let code = '';
    const topBlocks = workspace.getTopBlocks(true);

    for (const block of topBlocks) {
        code += javascriptGenerator.blockToCode(block);
    }

    // Update preview
    if (typeof updatePreview === 'function') {
        updatePreview(code.trim());
    }

    // Update block counter (v1.1.0)
    updateBlockCounter();
}

/**
 * Get DSL code from current workspace
 */
function getWorkspaceCode() {
    if (!workspace) {
        return '';
    }

    let code = '';
    const topBlocks = workspace.getTopBlocks(true);

    for (const block of topBlocks) {
        code += javascriptGenerator.blockToCode(block);
    }

    return code.trim();
}

/**
 * Reinitialize Blockly workspace (called when language changes)
 * Preserves workspace blocks and rebuilds with new language-specific toolbox
 */
function reinitializeBlockly() {
    if (!workspace) {
        console.warn('Workspace not initialized, cannot reinitialize');
        return;
    }

    try {
        // Save workspace state before disposing (v1.1.0)
        const savedState = Blockly.serialization.workspaces.save(workspace);

        // Get the blockly div
        const blocklyDiv = document.getElementById('blocklyDiv');

        // Dispose of the old workspace
        workspace.dispose();
        workspace = null;

        // Clear the container
        blocklyDiv.innerHTML = '';

        // Re-register block definitions with new translations
        registerBlockDefinitions();

        // Build new toolbox with updated translations
        const toolbox = buildToolbox();

        // Workspace options
        const options = {
            toolbox: toolbox,
            theme: getCurrentBlocklyTheme(),
            collapse: false,
            comments: false,
            disable: false,
            maxBlocks: Infinity,
            trashcan: true,
            horizontalLayout: false,
            toolboxPosition: 'start',
            css: true,
            media: 'https://unpkg.com/blockly/media/',
            rtl: false,
            scrollbars: true,
            sounds: true,
            oneBasedIndex: true,
            grid: {
                spacing: 20,
                length: 3,
                colour: getCSSVar('--blockly-grid-color'),
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            }
        };

        // Inject new workspace
        workspace = Blockly.inject(blocklyDiv, options);

        // Re-register dynamic template category
        registerTemplateCategory();

        // Re-add change listener
        workspace.addChangeListener(onBlocklyChange);

        // Restore workspace state (v1.1.0)
        if (savedState && Object.keys(savedState).length > 0) {
            Blockly.serialization.workspaces.load(savedState, workspace);
        }

        // Clear undo stack (language change should not be undoable)
        workspace.clearUndo();

        // Update Undo/Redo buttons
        if (typeof updateUndoRedoButtons === 'function') {
            updateUndoRedoButtons();
        }

        // Update block counter
        updateBlockCounter();

        // Center workspace origin (0,0) in the viewport
        requestAnimationFrame(() => {
            const metrics = workspace.getMetrics();
            workspace.scroll(metrics.viewWidth / 2, metrics.viewHeight / 2);
        });

        console.log('Blockly workspace reinitialized with new language (blocks preserved)');

        // Update preview with current blocks
        if (typeof updatePreview === 'function') {
            const code = getWorkspaceCode();
            updatePreview(code);
        }

        // Reset block counter (v1.1.0)
        updateBlockCounter();

    } catch (error) {
        console.error('Failed to reinitialize Blockly:', error);
    }
}

// ========================================================================
// Block Counter Functions (v1.1.0)
// ========================================================================

/**
 * Update block counter display and return current count
 * @returns {number} Current block count
 */
function updateBlockCounter() {
    if (!workspace) {
        return 0;
    }

    const count = workspace.getAllBlocks(false).length;
    const counter = document.getElementById('blockCounter');
    const countSpan = document.getElementById('blockCount');

    if (!counter || !countSpan) {
        return count;
    }

    countSpan.textContent = count;
    counter.classList.remove('warning', 'danger');

    // Remove existing tooltip
    const existingTooltip = counter.querySelector('.block-limit-tooltip');
    if (existingTooltip) existingTooltip.remove();

    if (count >= BLOCK_LIMIT) {
        counter.classList.add('danger');
        const msg = window.t ? window.t('blocks.warning.limit')
            : 'Block limit reached (100). Remove some blocks to add more.';
        const tooltip = document.createElement('span');
        tooltip.className = 'block-limit-tooltip';
        tooltip.textContent = msg;
        counter.appendChild(tooltip);
    } else if (count >= BLOCK_WARNING_THRESHOLD) {
        counter.classList.add('warning');
    }

    return count;
}

/**
 * Show block warning message (threshold reached)
 */
function showBlockWarning() {
    const msg = window.t ? window.t('blocks.warning.threshold')
        : 'Warning: You have many blocks. Consider simplifying your prompt.';
    if (window.validationUI && typeof window.validationUI.showWarning === 'function') {
        window.validationUI.showWarning(msg);
    }
}

/**
 * Show block limit error message (limit reached)
 */
function showBlockLimitWarning() {
    // Tooltip is shown by updateBlockCounter; this is for pre-insertion checks
    const counter = document.getElementById('blockCounter');
    if (counter && !counter.querySelector('.block-limit-tooltip')) {
        const msg = window.t ? window.t('blocks.warning.limit')
            : 'Block limit reached (100). Remove some blocks to add more.';
        const tooltip = document.createElement('span');
        tooltip.className = 'block-limit-tooltip';
        tooltip.textContent = msg;
        counter.appendChild(tooltip);
    }
}

// Export to global scope for use by other modules
window.updateBlockCounter = updateBlockCounter;
