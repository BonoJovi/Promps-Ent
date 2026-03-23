/**
 * Promps Pro - Floating Palette Tests
 *
 * Tests for floating palette functionality:
 * - Palette initialization
 * - Show/hide/toggle
 * - Minimize state
 * - State persistence
 * - Block rendering
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// In-memory storage for testing
let memoryStorage = {};
let idCounter = 0;

/**
 * Mock BlockFavoritesManager for palette tests
 */
class MockBlockFavoritesManager {
    static STORAGE_KEY = 'promps-pro-block-favorites';

    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            const stored = memoryStorage[MockBlockFavoritesManager.STORAGE_KEY];
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
            // Ignore
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

    saveData() {
        memoryStorage[MockBlockFavoritesManager.STORAGE_KEY] = JSON.stringify(this.data);
    }

    addFavorite(blockData, name = null) {
        if (!blockData) return null;

        const blockType = blockData.type || 'unknown';
        const favoriteName = name || blockType;

        const favorite = {
            id: (++idCounter).toString(),
            name: favoriteName,
            blockType: blockType,
            blockData: blockData,
            createdAt: new Date().toISOString(),
            order: this.data.blocks.length
        };

        this.data.blocks.push(favorite);
        this.saveData();

        return favorite;
    }

    removeFavorite(id) {
        const index = this.data.blocks.findIndex(b => b.id === id);
        if (index === -1) return false;

        this.data.blocks.splice(index, 1);
        this.saveData();

        return true;
    }

    getFavorites() {
        return [...this.data.blocks]
            .map(b => ({ ...b }))
            .sort((a, b) => a.order - b.order);
    }

    getPaletteState() {
        return { ...this.data.paletteState };
    }

    updatePaletteState(state) {
        this.data.paletteState = {
            ...this.data.paletteState,
            ...state
        };
        this.saveData();
    }

    getCount() {
        return this.data.blocks.length;
    }
}

/**
 * FloatingPalette class for testing
 */
class FloatingPalette {
    constructor() {
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.blocksContainer = null;
        this.isVisible = true;
        this.isMinimized = false;

        this.init();
    }

    init() {
        // Create mock DOM elements
        this.element = {
            style: { display: 'flex', left: '', top: '', right: 'auto', bottom: 'auto' },
            classList: {
                _classes: new Set(),
                add(cls) { this._classes.add(cls); },
                remove(cls) { this._classes.delete(cls); },
                toggle(cls) {
                    if (this._classes.has(cls)) {
                        this._classes.delete(cls);
                        return false;
                    } else {
                        this._classes.add(cls);
                        return true;
                    }
                },
                contains(cls) { return this._classes.has(cls); }
            },
            querySelector: () => null,
            getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 300 })
        };

        this.blocksContainer = {
            innerHTML: '',
            querySelectorAll: () => []
        };

        // Restore state from manager
        if (global.blockFavoritesManager) {
            const state = global.blockFavoritesManager.getPaletteState();
            this.applyState(state);
        }
    }

    applyState(state) {
        if (!this.element) return;

        if (state.position && state.position.x !== null && state.position.y !== null) {
            this.element.style.left = `${state.position.x}px`;
            this.element.style.top = `${state.position.y}px`;
        }

        if (state.isMinimized) {
            this.element.classList.add('minimized');
            this.isMinimized = true;
        }

        if (state.isVisible) {
            this.element.style.display = 'flex';
            this.isVisible = true;
        } else {
            this.element.style.display = 'none';
            this.isVisible = false;
        }
    }

    toggleMinimize() {
        if (!this.element) return;

        this.isMinimized = this.element.classList.toggle('minimized');

        if (global.blockFavoritesManager) {
            global.blockFavoritesManager.updatePaletteState({ isMinimized: this.isMinimized });
        }
    }

    show() {
        if (!this.element) return;

        this.element.style.display = 'flex';
        this.isVisible = true;

        if (global.blockFavoritesManager) {
            global.blockFavoritesManager.updatePaletteState({ isVisible: true });
        }
    }

    hide() {
        if (!this.element) return;

        this.element.style.display = 'none';
        this.isVisible = false;

        if (global.blockFavoritesManager) {
            global.blockFavoritesManager.updatePaletteState({ isVisible: false });
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if palette is visible (method version for API compatibility)
     * Note: This class also has an isVisible property for backwards compatibility
     * @returns {boolean}
     */
    isVisibleMethod() {
        if (!this.element) return false;
        return this.element.style.display !== 'none';
    }

    render() {
        if (!this.blocksContainer || !global.blockFavoritesManager) return;

        const favorites = global.blockFavoritesManager.getFavorites();

        if (favorites.length === 0) {
            this.blocksContainer.innerHTML = '<div class="palette-empty">No favorites yet</div>';
            return;
        }

        this.blocksContainer.innerHTML = favorites.map(fav => `
            <div class="palette-block" data-favorite-id="${fav.id}" title="${fav.name}">
                <span class="palette-block-icon">${this.getBlockIcon(fav.blockType)}</span>
                <span class="palette-block-name">${fav.name}</span>
                <button class="palette-block-remove" data-favorite-id="${fav.id}">×</button>
            </div>
        `).join('');
    }

    getBlockIcon(blockType) {
        if (blockType.includes('noun')) return '📝';
        if (blockType.includes('verb')) return '⚡';
        if (blockType.includes('particle')) return '🔗';
        return '🧩';
    }

    truncateName(name) {
        const maxLen = 15;
        if (name.length <= maxLen) return name;
        return name.substring(0, maxLen - 2) + '…';
    }
}

beforeEach(() => {
    memoryStorage = {};
    idCounter = 0;
    global.blockFavoritesManager = new MockBlockFavoritesManager();
});

// ============================================================================
// Floating Palette Tests
// ============================================================================

describe('FloatingPalette', () => {
    describe('initialization', () => {
        test('initializes with default state', () => {
            const palette = new FloatingPalette();

            expect(palette.isVisible).toBe(true);
            expect(palette.isMinimized).toBe(false);
        });

        test('restores saved position', () => {
            global.blockFavoritesManager.updatePaletteState({
                position: { x: 200, y: 300 }
            });

            const palette = new FloatingPalette();

            expect(palette.element.style.left).toBe('200px');
            expect(palette.element.style.top).toBe('300px');
        });

        test('restores minimized state', () => {
            global.blockFavoritesManager.updatePaletteState({
                isMinimized: true
            });

            const palette = new FloatingPalette();

            expect(palette.isMinimized).toBe(true);
            expect(palette.element.classList.contains('minimized')).toBe(true);
        });

        test('restores hidden state', () => {
            global.blockFavoritesManager.updatePaletteState({
                isVisible: false
            });

            const palette = new FloatingPalette();

            expect(palette.isVisible).toBe(false);
            expect(palette.element.style.display).toBe('none');
        });
    });

    describe('show/hide/toggle', () => {
        test('show makes palette visible', () => {
            const palette = new FloatingPalette();
            palette.hide();

            palette.show();

            expect(palette.isVisible).toBe(true);
            expect(palette.element.style.display).toBe('flex');
        });

        test('hide makes palette invisible', () => {
            const palette = new FloatingPalette();

            palette.hide();

            expect(palette.isVisible).toBe(false);
            expect(palette.element.style.display).toBe('none');
        });

        test('toggle switches visibility', () => {
            const palette = new FloatingPalette();
            expect(palette.isVisible).toBe(true);

            palette.toggle();
            expect(palette.isVisible).toBe(false);

            palette.toggle();
            expect(palette.isVisible).toBe(true);
        });

        test('show persists to storage', () => {
            const palette = new FloatingPalette();
            palette.hide();
            palette.show();

            const state = global.blockFavoritesManager.getPaletteState();
            expect(state.isVisible).toBe(true);
        });

        test('hide persists to storage', () => {
            const palette = new FloatingPalette();
            palette.hide();

            const state = global.blockFavoritesManager.getPaletteState();
            expect(state.isVisible).toBe(false);
        });
    });

    describe('minimize', () => {
        test('toggleMinimize toggles minimized state', () => {
            const palette = new FloatingPalette();
            expect(palette.isMinimized).toBe(false);

            palette.toggleMinimize();
            expect(palette.isMinimized).toBe(true);
            expect(palette.element.classList.contains('minimized')).toBe(true);

            palette.toggleMinimize();
            expect(palette.isMinimized).toBe(false);
            expect(palette.element.classList.contains('minimized')).toBe(false);
        });

        test('toggleMinimize persists to storage', () => {
            const palette = new FloatingPalette();

            palette.toggleMinimize();

            const state = global.blockFavoritesManager.getPaletteState();
            expect(state.isMinimized).toBe(true);
        });
    });

    describe('rendering', () => {
        test('renders empty state when no favorites', () => {
            const palette = new FloatingPalette();

            palette.render();

            expect(palette.blocksContainer.innerHTML).toContain('No favorites yet');
        });

        test('renders favorite blocks', () => {
            global.blockFavoritesManager.addFavorite({ type: 'promps_noun' }, 'Test Noun');
            global.blockFavoritesManager.addFavorite({ type: 'promps_verb_analyze' }, 'Analyze');

            const palette = new FloatingPalette();
            palette.render();

            expect(palette.blocksContainer.innerHTML).toContain('Test Noun');
            expect(palette.blocksContainer.innerHTML).toContain('Analyze');
            expect(palette.blocksContainer.innerHTML).toContain('palette-block');
        });

        test('renders block icons correctly', () => {
            const palette = new FloatingPalette();

            expect(palette.getBlockIcon('promps_noun')).toBe('📝');
            expect(palette.getBlockIcon('promps_verb_analyze')).toBe('⚡');
            expect(palette.getBlockIcon('promps_particle_wo')).toBe('🔗');
            expect(palette.getBlockIcon('unknown_type')).toBe('🧩');
        });
    });

    describe('truncateName', () => {
        test('returns short names unchanged', () => {
            const palette = new FloatingPalette();

            expect(palette.truncateName('Short')).toBe('Short');
            expect(palette.truncateName('123456789012345')).toBe('123456789012345'); // exactly 15
        });

        test('truncates long names', () => {
            const palette = new FloatingPalette();

            const result = palette.truncateName('This is a very long name');
            expect(result.length).toBeLessThanOrEqual(15);
            expect(result).toContain('…');
        });
    });

    describe('state persistence', () => {
        test('position persists across instances', () => {
            const palette1 = new FloatingPalette();
            global.blockFavoritesManager.updatePaletteState({
                position: { x: 500, y: 400 }
            });

            const palette2 = new FloatingPalette();

            expect(palette2.element.style.left).toBe('500px');
            expect(palette2.element.style.top).toBe('400px');
        });

        test('visibility persists across instances', () => {
            const palette1 = new FloatingPalette();
            palette1.hide();

            const palette2 = new FloatingPalette();

            expect(palette2.isVisible).toBe(false);
        });

        test('minimized state persists across instances', () => {
            const palette1 = new FloatingPalette();
            palette1.toggleMinimize();

            const palette2 = new FloatingPalette();

            expect(palette2.isMinimized).toBe(true);
        });
    });
});
