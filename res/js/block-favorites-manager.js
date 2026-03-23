/**
 * Promps Ent - Block Favorites Manager
 *
 * Manages favorite blocks for quick access via floating palette.
 * Ent feature - requires license.
 */

/**
 * Helper function to get translation with fallback
 */
function blockFavT(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * BlockFavoritesManager - Manages block favorites
 */
class BlockFavoritesManager {
    static STORAGE_KEY = 'promps-ent-block-favorites';

    constructor() {
        this.data = this.loadData();
    }

    /**
     * Load data from localStorage
     * @returns {Object} Block favorites data
     */
    loadData() {
        try {
            const stored = localStorage.getItem(BlockFavoritesManager.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    blocks: parsed.blocks || [],
                    paletteState: parsed.paletteState || {
                        position: { x: null, y: null },
                        isMinimized: false,
                        isVisible: true
                    }
                };
            }
        } catch (error) {
            console.error('Failed to load block favorites:', error);
        }
        return {
            blocks: [],
            paletteState: {
                position: { x: null, y: null },
                isMinimized: false,
                isVisible: true
            }
        };
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(BlockFavoritesManager.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save block favorites:', error);
        }
    }

    /**
     * Add a block to favorites
     * @param {Blockly.Block} block - The block to add
     * @param {string} name - Optional custom name
     * @returns {Object|null} The created favorite or null
     */
    addFavorite(block, name = null) {
        if (!block) return null;

        try {
            // Serialize the block
            const blockData = Blockly.serialization.blocks.save(block);

            // Get block type for identification
            const blockType = block.type;

            // Generate name from block type or use custom name
            const favoriteName = name || this.generateBlockName(block);

            // Check for duplicates
            const existing = this.data.blocks.find(b =>
                b.blockType === blockType &&
                JSON.stringify(b.blockData) === JSON.stringify(blockData)
            );

            if (existing) {
                return existing;
            }

            const favorite = {
                id: Date.now().toString(),
                name: favoriteName,
                blockType: blockType,
                blockData: blockData,
                createdAt: new Date().toISOString(),
                order: this.data.blocks.length
            };

            this.data.blocks.push(favorite);
            this.saveData();

            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('blockfavoritechange', {
                detail: { action: 'add', favorite }
            }));

            return favorite;
        } catch (error) {
            console.error('Failed to add block to favorites:', error);
            return null;
        }
    }

    /**
     * Remove a block from favorites
     * @param {string} id - Favorite ID
     * @returns {boolean} True if removed
     */
    removeFavorite(id) {
        const index = this.data.blocks.findIndex(b => b.id === id);
        if (index === -1) return false;

        const removed = this.data.blocks.splice(index, 1)[0];
        this.saveData();

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('blockfavoritechange', {
            detail: { action: 'remove', favorite: removed }
        }));

        return true;
    }

    /**
     * Get all favorite blocks
     * @returns {Array} Array of favorite objects (deep copies)
     */
    getFavorites() {
        return [...this.data.blocks]
            .map(b => ({ ...b }))
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Check if a block type is already favorited
     * @param {string} blockType - Block type
     * @returns {boolean} True if favorited
     */
    isFavorite(blockType) {
        return this.data.blocks.some(b => b.blockType === blockType);
    }

    /**
     * Update favorite order (for drag-and-drop reordering)
     * @param {string} id - Favorite ID
     * @param {number} newOrder - New order position
     */
    reorderFavorite(id, newOrder) {
        const favorite = this.data.blocks.find(b => b.id === id);
        if (!favorite) return;

        const oldOrder = favorite.order;

        // Update orders for affected favorites
        this.data.blocks.forEach(b => {
            if (b.id === id) {
                b.order = newOrder;
            } else if (oldOrder < newOrder) {
                // Moving down
                if (b.order > oldOrder && b.order <= newOrder) {
                    b.order--;
                }
            } else {
                // Moving up
                if (b.order >= newOrder && b.order < oldOrder) {
                    b.order++;
                }
            }
        });

        this.saveData();

        window.dispatchEvent(new CustomEvent('blockfavoritechange', {
            detail: { action: 'reorder' }
        }));
    }

    /**
     * Rename a favorite
     * @param {string} id - Favorite ID
     * @param {string} newName - New name
     */
    renameFavorite(id, newName) {
        const favorite = this.data.blocks.find(b => b.id === id);
        if (!favorite) return;

        favorite.name = newName;
        this.saveData();

        window.dispatchEvent(new CustomEvent('blockfavoritechange', {
            detail: { action: 'rename', favorite }
        }));
    }

    /**
     * Generate a display name for a block
     * @param {Blockly.Block} block - The block
     * @returns {string} Display name
     */
    generateBlockName(block) {
        // Try to get a meaningful name from block type or fields
        const type = block.type;

        // Check for text input field
        const textField = block.getField('TEXT');
        if (textField) {
            return textField.getValue() || type;
        }

        // Use block type with better formatting
        const typeMap = {
            'promps_noun': blockFavT('blockly.category.noun', 'Noun'),
            'promps_other': blockFavT('blockly.category.other', 'Other'),
            'promps_particle_ga': 'が',
            'promps_particle_wo': 'を',
            'promps_particle_ni': 'に',
            'promps_particle_de': 'で',
            'promps_particle_to': 'と',
            'promps_particle_he': 'へ',
            'promps_particle_kara': 'から',
            'promps_particle_made': 'まで',
            'promps_particle_yori': 'より',
            'promps_article_a': 'a',
            'promps_article_an': 'an',
            'promps_article_the': 'the',
            'promps_article_this': 'this',
            'promps_article_that': 'that',
            'promps_article_please': 'please',
            'promps_verb_analyze': blockFavT('blockly.verb.analyze.label', '分析して'),
            'promps_verb_summarize': blockFavT('blockly.verb.summarize.label', '要約して'),
            'promps_verb_translate': blockFavT('blockly.verb.translate.label', '翻訳して'),
            'promps_verb_create': blockFavT('blockly.verb.create.label', '作成して'),
            'promps_verb_generate': blockFavT('blockly.verb.generate.label', '生成して'),
            'promps_verb_convert': blockFavT('blockly.verb.convert.label', '変換して'),
            'promps_verb_delete': blockFavT('blockly.verb.delete.label', '削除して'),
            'promps_verb_update': blockFavT('blockly.verb.update.label', '更新して'),
            'promps_verb_extract': blockFavT('blockly.verb.extract.label', '抽出して'),
            'promps_verb_explain': blockFavT('blockly.verb.explain.label', '説明して'),
            'promps_verb_describe': blockFavT('blockly.verb.describe.label', '解説して'),
            'promps_verb_teach': blockFavT('blockly.verb.teach.label', '教えて'),
            'promps_verb_custom': blockFavT('blockly.verb.label', '動詞')
        };

        return typeMap[type] || type.replace('promps_', '').replace(/_/g, ' ');
    }

    /**
     * Insert a favorite block into the workspace
     * @param {string} id - Favorite ID
     * @param {number} x - Optional X position
     * @param {number} y - Optional Y position
     * @returns {Blockly.Block|null} The inserted block or null
     */
    insertFavorite(id, x = null, y = null) {
        if (!window.workspace) {
            return null;
        }

        const favorite = this.data.blocks.find(b => b.id === id);
        if (!favorite) return null;

        try {
            // Clone the block data
            const blockData = JSON.parse(JSON.stringify(favorite.blockData));

            // Set position if provided, otherwise use center of visible area
            if (x !== null && y !== null) {
                blockData.x = x;
                blockData.y = y;
            } else {
                const svg = window.workspace.getParentSvg();
                const rect = svg.getBoundingClientRect();
                const svgPoint = svg.createSVGPoint();
                svgPoint.x = rect.left + rect.width / 2;
                svgPoint.y = rect.top + rect.height / 2;
                const ctm = window.workspace.getCanvas().getScreenCTM();
                const wsPoint = ctm ? svgPoint.matrixTransform(ctm.inverse()) : { x: 50, y: 50 };
                blockData.x = wsPoint.x;
                blockData.y = wsPoint.y;
            }

            // Append block to workspace
            const block = Blockly.serialization.blocks.append(blockData, window.workspace);

            // Trigger preview update
            setTimeout(() => {
                if (typeof window.updatePreview === 'function' && typeof window.getWorkspaceCode === 'function') {
                    const code = window.getWorkspaceCode();
                    window.updatePreview(code);
                }
            }, 100);

            return block;
        } catch (error) {
            console.error('Failed to insert favorite block:', error);
            return null;
        }
    }

    /**
     * Get palette state
     * @returns {Object} Palette state
     */
    getPaletteState() {
        return { ...this.data.paletteState };
    }

    /**
     * Update palette state
     * @param {Object} state - Partial state to update
     */
    updatePaletteState(state) {
        this.data.paletteState = {
            ...this.data.paletteState,
            ...state
        };
        this.saveData();
    }

    /**
     * Clear all favorites
     */
    clearFavorites() {
        this.data.blocks = [];
        this.saveData();

        window.dispatchEvent(new CustomEvent('blockfavoritechange', {
            detail: { action: 'clear' }
        }));
    }

    /**
     * Get favorites count
     * @returns {number} Number of favorites
     */
    getCount() {
        return this.data.blocks.length;
    }
}

// Create singleton instance
window.blockFavoritesManager = new BlockFavoritesManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockFavoritesManager };
}
