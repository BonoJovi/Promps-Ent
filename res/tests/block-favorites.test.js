/**
 * Promps Pro - Block Favorites Tests
 *
 * Tests for block favorites functionality:
 * - Add block to favorites
 * - Remove block from favorites
 * - Get favorites list
 * - Reorder favorites
 * - Palette state management
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// In-memory storage for testing
let memoryStorage = {};
let idCounter = 0;

/**
 * BlockFavoritesManager class implementation for testing
 */
class BlockFavoritesManager {
    static STORAGE_KEY = 'promps-pro-block-favorites';

    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            const stored = memoryStorage[BlockFavoritesManager.STORAGE_KEY];
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
        memoryStorage[BlockFavoritesManager.STORAGE_KEY] = JSON.stringify(this.data);
    }

    addFavorite(blockData, name = null) {
        if (!blockData) return null;

        const blockType = blockData.type || 'unknown';
        const favoriteName = name || blockType;

        // Check for duplicates
        const existing = this.data.blocks.find(b =>
            b.blockType === blockType &&
            JSON.stringify(b.blockData) === JSON.stringify(blockData)
        );

        if (existing) {
            return existing;
        }

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
            .map(b => ({ ...b }))  // Deep copy each block
            .sort((a, b) => a.order - b.order);
    }

    isFavorite(blockType) {
        return this.data.blocks.some(b => b.blockType === blockType);
    }

    reorderFavorite(id, newOrder) {
        const favorite = this.data.blocks.find(b => b.id === id);
        if (!favorite) return;

        const oldOrder = favorite.order;

        this.data.blocks.forEach(b => {
            if (b.id === id) {
                b.order = newOrder;
            } else if (oldOrder < newOrder) {
                if (b.order > oldOrder && b.order <= newOrder) {
                    b.order--;
                }
            } else {
                if (b.order >= newOrder && b.order < oldOrder) {
                    b.order++;
                }
            }
        });

        this.saveData();
    }

    renameFavorite(id, newName) {
        const favorite = this.data.blocks.find(b => b.id === id);
        if (!favorite) return;

        favorite.name = newName;
        this.saveData();
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

    clearFavorites() {
        this.data.blocks = [];
        this.saveData();
    }

    getCount() {
        return this.data.blocks.length;
    }
}

beforeEach(() => {
    // Clear storage before each test
    memoryStorage = {};
    idCounter = 0;
});

// ============================================================================
// Block Favorites Tests
// ============================================================================

describe('BlockFavoritesManager', () => {
    describe('constructor', () => {
        test('initializes with empty blocks and default palette state', () => {
            const manager = new BlockFavoritesManager();

            expect(manager.data.blocks).toEqual([]);
            expect(manager.data.paletteState.isVisible).toBe(true);
            expect(manager.data.paletteState.isMinimized).toBe(false);
        });

        test('loads existing data from storage', () => {
            memoryStorage['promps-pro-block-favorites'] = JSON.stringify({
                blocks: [{ id: '1', name: 'Test', blockType: 'promps_noun', order: 0 }],
                paletteState: { isVisible: false, isMinimized: true }
            });

            const manager = new BlockFavoritesManager();

            expect(manager.data.blocks.length).toBe(1);
            expect(manager.data.paletteState.isVisible).toBe(false);
        });
    });

    describe('addFavorite', () => {
        test('adds a block to favorites', () => {
            const manager = new BlockFavoritesManager();
            const blockData = { type: 'promps_noun', fields: { TEXT: 'User' } };

            const favorite = manager.addFavorite(blockData, 'My Noun');

            expect(favorite).not.toBeNull();
            expect(favorite.name).toBe('My Noun');
            expect(favorite.blockType).toBe('promps_noun');
            expect(manager.getCount()).toBe(1);
        });

        test('returns null for null block data', () => {
            const manager = new BlockFavoritesManager();

            const favorite = manager.addFavorite(null);

            expect(favorite).toBeNull();
        });

        test('returns existing favorite for duplicate', () => {
            const manager = new BlockFavoritesManager();
            const blockData = { type: 'promps_noun', fields: { TEXT: 'User' } };

            const first = manager.addFavorite(blockData, 'First');
            const second = manager.addFavorite(blockData, 'Second');

            expect(first.id).toBe(second.id);
            expect(manager.getCount()).toBe(1);
        });

        test('uses block type as name when name not provided', () => {
            const manager = new BlockFavoritesManager();
            const blockData = { type: 'promps_verb_analyze' };

            const favorite = manager.addFavorite(blockData);

            expect(favorite.name).toBe('promps_verb_analyze');
        });

        test('assigns sequential order to favorites', () => {
            const manager = new BlockFavoritesManager();

            manager.addFavorite({ type: 'promps_noun' }, 'First');
            manager.addFavorite({ type: 'promps_verb_create' }, 'Second');
            manager.addFavorite({ type: 'promps_particle_wo' }, 'Third');

            const favorites = manager.getFavorites();
            expect(favorites[0].order).toBe(0);
            expect(favorites[1].order).toBe(1);
            expect(favorites[2].order).toBe(2);
        });
    });

    describe('removeFavorite', () => {
        test('removes a favorite by ID', () => {
            const manager = new BlockFavoritesManager();
            const favorite = manager.addFavorite({ type: 'promps_noun' }, 'Test');

            const result = manager.removeFavorite(favorite.id);

            expect(result).toBe(true);
            expect(manager.getCount()).toBe(0);
        });

        test('returns false for non-existent ID', () => {
            const manager = new BlockFavoritesManager();

            const result = manager.removeFavorite('nonexistent');

            expect(result).toBe(false);
        });
    });

    describe('getFavorites', () => {
        test('returns favorites sorted by order', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'promps_noun' }, 'A');
            manager.addFavorite({ type: 'promps_verb_create' }, 'B');
            manager.addFavorite({ type: 'promps_particle_wo' }, 'C');

            // Manually change order to test sorting
            manager.data.blocks[0].order = 2;
            manager.data.blocks[1].order = 0;
            manager.data.blocks[2].order = 1;

            const favorites = manager.getFavorites();

            expect(favorites[0].name).toBe('B');
            expect(favorites[1].name).toBe('C');
            expect(favorites[2].name).toBe('A');
        });

        test('returns empty array when no favorites', () => {
            const manager = new BlockFavoritesManager();

            const favorites = manager.getFavorites();

            expect(favorites).toEqual([]);
        });

        test('returns copies of favorites (not references)', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'promps_noun' }, 'Test');

            const favorites = manager.getFavorites();
            favorites[0].name = 'Modified';

            expect(manager.getFavorites()[0].name).toBe('Test');
        });
    });

    describe('isFavorite', () => {
        test('returns true for favorited block type', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'promps_noun' }, 'Test');

            expect(manager.isFavorite('promps_noun')).toBe(true);
        });

        test('returns false for non-favorited block type', () => {
            const manager = new BlockFavoritesManager();

            expect(manager.isFavorite('promps_noun')).toBe(false);
        });
    });

    describe('reorderFavorite', () => {
        test('moves favorite to new position', () => {
            const manager = new BlockFavoritesManager();
            const a = manager.addFavorite({ type: 'a' }, 'A');
            manager.addFavorite({ type: 'b' }, 'B');
            const c = manager.addFavorite({ type: 'c' }, 'C');

            // Move C (order 2) to position 0
            manager.reorderFavorite(c.id, 0);

            const favorites = manager.getFavorites();
            expect(favorites[0].name).toBe('C');
            expect(favorites[1].name).toBe('A');
            expect(favorites[2].name).toBe('B');
        });

        test('does nothing for non-existent favorite', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'a' }, 'A');

            manager.reorderFavorite('nonexistent', 0);

            expect(manager.getFavorites()[0].name).toBe('A');
        });
    });

    describe('renameFavorite', () => {
        test('renames a favorite', () => {
            const manager = new BlockFavoritesManager();
            const favorite = manager.addFavorite({ type: 'promps_noun' }, 'Old Name');

            manager.renameFavorite(favorite.id, 'New Name');

            expect(manager.getFavorites()[0].name).toBe('New Name');
        });

        test('does nothing for non-existent favorite', () => {
            const manager = new BlockFavoritesManager();

            manager.renameFavorite('nonexistent', 'New Name');

            expect(manager.getCount()).toBe(0);
        });
    });

    describe('palette state', () => {
        test('getPaletteState returns current state', () => {
            const manager = new BlockFavoritesManager();

            const state = manager.getPaletteState();

            expect(state.isVisible).toBe(true);
            expect(state.isMinimized).toBe(false);
        });

        test('updatePaletteState merges partial state', () => {
            const manager = new BlockFavoritesManager();

            manager.updatePaletteState({ isMinimized: true });

            expect(manager.getPaletteState().isMinimized).toBe(true);
            expect(manager.getPaletteState().isVisible).toBe(true);
        });

        test('updatePaletteState persists to storage', () => {
            const manager = new BlockFavoritesManager();
            manager.updatePaletteState({ position: { x: 100, y: 200 } });

            const manager2 = new BlockFavoritesManager();
            expect(manager2.getPaletteState().position.x).toBe(100);
            expect(manager2.getPaletteState().position.y).toBe(200);
        });
    });

    describe('clearFavorites', () => {
        test('removes all favorites', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'a' }, 'A');
            manager.addFavorite({ type: 'b' }, 'B');
            manager.addFavorite({ type: 'c' }, 'C');

            manager.clearFavorites();

            expect(manager.getCount()).toBe(0);
        });

        test('persists clear to storage', () => {
            const manager = new BlockFavoritesManager();
            manager.addFavorite({ type: 'a' }, 'A');
            manager.clearFavorites();

            const manager2 = new BlockFavoritesManager();
            expect(manager2.getCount()).toBe(0);
        });
    });

    describe('persistence', () => {
        test('favorites persist across manager instances', () => {
            const manager1 = new BlockFavoritesManager();
            manager1.addFavorite({ type: 'promps_noun' }, 'Persisted');

            const manager2 = new BlockFavoritesManager();

            expect(manager2.getCount()).toBe(1);
            expect(manager2.getFavorites()[0].name).toBe('Persisted');
        });
    });
});
