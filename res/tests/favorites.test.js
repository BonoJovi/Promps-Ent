/**
 * Promps Pro - Favorites Feature Tests
 *
 * Tests for project favorites functionality:
 * - Toggle favorite status
 * - Get favorite projects
 * - Check if project is favorite
 * - Reorder favorites
 * - Persistence of favorite status
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// In-memory storage for testing
let memoryStorage = {};

// ProjectIndexManager class implementation for testing (with favorites)
class ProjectIndexManager {
    static STORAGE_KEY = 'promps-project-index';
    static MAX_RECENT = 20;

    constructor() {
        this.index = this.loadIndex();
    }

    loadIndex() {
        try {
            const stored = memoryStorage[ProjectIndexManager.STORAGE_KEY];
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    projects: parsed.projects || {},
                    recentOrder: parsed.recentOrder || [],
                    allTags: parsed.allTags || [],
                    favoriteOrder: parsed.favoriteOrder || []
                };
            }
        } catch (error) {
            // Ignore parse errors
        }
        return {
            projects: {},
            recentOrder: [],
            allTags: [],
            favoriteOrder: []
        };
    }

    saveIndex() {
        memoryStorage[ProjectIndexManager.STORAGE_KEY] = JSON.stringify(this.index);
    }

    addToIndex(project, path) {
        if (!path || !project) return;

        // Preserve existing favorite status if project exists
        const existing = this.index.projects[path];
        const isFavorite = existing ? existing.isFavorite : false;

        const entry = {
            path: path,
            name: project.metadata?.name || 'Untitled',
            description: project.metadata?.description || null,
            tags: project.metadata?.tags || [],
            modifiedAt: project.metadata?.modifiedAt || new Date().toISOString(),
            lastOpened: new Date().toISOString(),
            isFavorite: isFavorite
        };

        this.index.projects[path] = entry;

        // Update recent order (move to front)
        this.index.recentOrder = this.index.recentOrder.filter(p => p !== path);
        this.index.recentOrder.unshift(path);

        // Limit recent projects
        if (this.index.recentOrder.length > ProjectIndexManager.MAX_RECENT) {
            this.index.recentOrder = this.index.recentOrder.slice(0, ProjectIndexManager.MAX_RECENT);
        }

        // Update all tags
        this.rebuildAllTags();
        this.saveIndex();
    }

    removeFromIndex(path) {
        delete this.index.projects[path];
        this.index.recentOrder = this.index.recentOrder.filter(p => p !== path);
        this.index.favoriteOrder = this.index.favoriteOrder.filter(p => p !== path);
        this.rebuildAllTags();
        this.saveIndex();
    }

    rebuildAllTags() {
        const tagSet = new Set();
        for (const project of Object.values(this.index.projects)) {
            if (project.tags) {
                project.tags.forEach(tag => tagSet.add(tag));
            }
        }
        this.index.allTags = Array.from(tagSet).sort();
    }

    getAllTags() {
        return this.index.allTags || [];
    }

    getProject(path) {
        return this.index.projects[path] || null;
    }

    hasProject(path) {
        return !!this.index.projects[path];
    }

    clearIndex() {
        this.index = {
            projects: {},
            recentOrder: [],
            allTags: [],
            favoriteOrder: []
        };
        this.saveIndex();
    }

    getStats() {
        return {
            totalProjects: Object.keys(this.index.projects).length,
            totalTags: this.index.allTags.length,
            recentCount: this.index.recentOrder.length,
            favoriteCount: this.index.favoriteOrder.length
        };
    }

    /**
     * Toggle favorite status of a project
     * @param {string} path - File path
     * @returns {boolean} New favorite status
     */
    toggleFavorite(path) {
        const project = this.index.projects[path];
        if (!project) return false;

        project.isFavorite = !project.isFavorite;

        if (project.isFavorite) {
            // Add to favorite order if not already present
            if (!this.index.favoriteOrder.includes(path)) {
                this.index.favoriteOrder.push(path);
            }
        } else {
            // Remove from favorite order
            this.index.favoriteOrder = this.index.favoriteOrder.filter(p => p !== path);
        }

        this.saveIndex();
        return project.isFavorite;
    }

    /**
     * Get all favorite projects
     * @returns {Array<Object>} Favorite project entries in order
     */
    getFavoriteProjects() {
        const favorites = [];
        for (const path of this.index.favoriteOrder) {
            const project = this.index.projects[path];
            if (project && project.isFavorite) {
                favorites.push({ ...project });
            }
        }
        return favorites;
    }

    /**
     * Check if a project is a favorite
     * @param {string} path - File path
     * @returns {boolean} True if project is a favorite
     */
    isFavorite(path) {
        const project = this.index.projects[path];
        return project ? project.isFavorite : false;
    }

    /**
     * Reorder favorites (for drag-and-drop support)
     * @param {string} path - Path of project to move
     * @param {number} newIndex - New position in favorites
     */
    reorderFavorite(path, newIndex) {
        const currentIndex = this.index.favoriteOrder.indexOf(path);
        if (currentIndex === -1) return;

        // Remove from current position
        this.index.favoriteOrder.splice(currentIndex, 1);
        // Insert at new position
        this.index.favoriteOrder.splice(newIndex, 0, path);

        this.saveIndex();
    }
}

beforeEach(() => {
    // Clear storage before each test
    memoryStorage = {};
});

// ============================================================================
// Favorites Feature Tests
// ============================================================================

describe('ProjectIndexManager - Favorites', () => {
    describe('toggleFavorite', () => {
        test('adds project to favorites when not favorited', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test Project' } }, '/path/test.promps');

            const result = manager.toggleFavorite('/path/test.promps');

            expect(result).toBe(true);
            expect(manager.isFavorite('/path/test.promps')).toBe(true);
            expect(manager.index.favoriteOrder).toContain('/path/test.promps');
        });

        test('removes project from favorites when already favorited', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test Project' } }, '/path/test.promps');

            // First toggle - add to favorites
            const firstResult = manager.toggleFavorite('/path/test.promps');
            expect(firstResult).toBe(true);
            expect(manager.isFavorite('/path/test.promps')).toBe(true);

            // Second toggle - remove from favorites
            const secondResult = manager.toggleFavorite('/path/test.promps');
            expect(secondResult).toBe(false);
            expect(manager.isFavorite('/path/test.promps')).toBe(false);
            expect(manager.index.favoriteOrder).not.toContain('/path/test.promps');
        });

        test('returns false for non-existent project', () => {
            const manager = new ProjectIndexManager();

            const result = manager.toggleFavorite('/nonexistent/path.promps');

            expect(result).toBe(false);
        });

        test('persists to storage after toggling', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            // Create new manager from same storage
            const manager2 = new ProjectIndexManager();
            expect(manager2.isFavorite('/path/test.promps')).toBe(true);
        });
    });

    describe('getFavoriteProjects', () => {
        test('returns empty array when no favorites', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');

            const favorites = manager.getFavoriteProjects();

            expect(favorites).toEqual([]);
        });

        test('returns favorited projects', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Project A' } }, '/path/a.promps');
            manager.addToIndex({ metadata: { name: 'Project B' } }, '/path/b.promps');
            manager.toggleFavorite('/path/a.promps');

            const favorites = manager.getFavoriteProjects();

            expect(favorites.length).toBe(1);
            expect(favorites[0].name).toBe('Project A');
        });

        test('returns favorites in order they were added', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'First' } }, '/path/first.promps');
            manager.addToIndex({ metadata: { name: 'Second' } }, '/path/second.promps');
            manager.addToIndex({ metadata: { name: 'Third' } }, '/path/third.promps');

            manager.toggleFavorite('/path/first.promps');
            manager.toggleFavorite('/path/third.promps');
            manager.toggleFavorite('/path/second.promps');

            const favorites = manager.getFavoriteProjects();

            expect(favorites.length).toBe(3);
            expect(favorites[0].name).toBe('First');
            expect(favorites[1].name).toBe('Third');
            expect(favorites[2].name).toBe('Second');
        });

        test('returns copies of project objects (not references)', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            const favorites = manager.getFavoriteProjects();
            favorites[0].name = 'Modified';

            expect(manager.getProject('/path/test.promps').name).toBe('Test');
        });
    });

    describe('isFavorite', () => {
        test('returns false for non-favorited project', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');

            expect(manager.isFavorite('/path/test.promps')).toBe(false);
        });

        test('returns true for favorited project', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            expect(manager.isFavorite('/path/test.promps')).toBe(true);
        });

        test('returns false for non-existent project', () => {
            const manager = new ProjectIndexManager();

            expect(manager.isFavorite('/nonexistent/path.promps')).toBe(false);
        });
    });

    describe('reorderFavorite', () => {
        test('moves favorite to new position', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'A' } }, '/path/a.promps');
            manager.addToIndex({ metadata: { name: 'B' } }, '/path/b.promps');
            manager.addToIndex({ metadata: { name: 'C' } }, '/path/c.promps');
            manager.toggleFavorite('/path/a.promps');
            manager.toggleFavorite('/path/b.promps');
            manager.toggleFavorite('/path/c.promps');

            // Move C (index 2) to position 0
            manager.reorderFavorite('/path/c.promps', 0);

            expect(manager.index.favoriteOrder[0]).toBe('/path/c.promps');
            expect(manager.index.favoriteOrder[1]).toBe('/path/a.promps');
            expect(manager.index.favoriteOrder[2]).toBe('/path/b.promps');
        });

        test('does nothing for non-favorited project', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'A' } }, '/path/a.promps');
            manager.addToIndex({ metadata: { name: 'B' } }, '/path/b.promps');
            manager.toggleFavorite('/path/a.promps');

            manager.reorderFavorite('/path/b.promps', 0);

            expect(manager.index.favoriteOrder.length).toBe(1);
            expect(manager.index.favoriteOrder[0]).toBe('/path/a.promps');
        });

        test('persists reorder to storage', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'A' } }, '/path/a.promps');
            manager.addToIndex({ metadata: { name: 'B' } }, '/path/b.promps');
            manager.toggleFavorite('/path/a.promps');
            manager.toggleFavorite('/path/b.promps');
            manager.reorderFavorite('/path/b.promps', 0);

            // Load from storage
            const manager2 = new ProjectIndexManager();
            expect(manager2.index.favoriteOrder[0]).toBe('/path/b.promps');
        });
    });

    describe('addToIndex - preserves favorite status', () => {
        test('preserves isFavorite when updating project', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            // Re-add the same project with updated metadata
            manager.addToIndex({ metadata: { name: 'Updated Test' } }, '/path/test.promps');

            expect(manager.isFavorite('/path/test.promps')).toBe(true);
        });

        test('new project is not favorited by default', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');

            expect(manager.isFavorite('/path/test.promps')).toBe(false);
        });
    });

    describe('removeFromIndex - updates favorites', () => {
        test('removes from favoriteOrder when project is removed', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            manager.removeFromIndex('/path/test.promps');

            expect(manager.index.favoriteOrder).not.toContain('/path/test.promps');
        });
    });

    describe('clearIndex - clears favorites', () => {
        test('clears favoriteOrder', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');
            manager.toggleFavorite('/path/test.promps');

            manager.clearIndex();

            expect(manager.index.favoriteOrder).toEqual([]);
        });
    });

    describe('getStats - includes favorites count', () => {
        test('returns correct favoriteCount', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'A' } }, '/path/a.promps');
            manager.addToIndex({ metadata: { name: 'B' } }, '/path/b.promps');
            manager.addToIndex({ metadata: { name: 'C' } }, '/path/c.promps');
            manager.toggleFavorite('/path/a.promps');
            manager.toggleFavorite('/path/c.promps');

            const stats = manager.getStats();

            expect(stats.favoriteCount).toBe(2);
        });
    });

    describe('loadIndex - loads favorites from storage', () => {
        test('loads favoriteOrder from storage', () => {
            // Set up storage with favorites
            memoryStorage['promps-project-index'] = JSON.stringify({
                projects: {
                    '/path/test.promps': {
                        path: '/path/test.promps',
                        name: 'Test',
                        isFavorite: true
                    }
                },
                recentOrder: ['/path/test.promps'],
                allTags: [],
                favoriteOrder: ['/path/test.promps']
            });

            const manager = new ProjectIndexManager();

            expect(manager.index.favoriteOrder).toContain('/path/test.promps');
            expect(manager.isFavorite('/path/test.promps')).toBe(true);
        });

        test('initializes empty favoriteOrder if not present in storage', () => {
            // Set up storage without favoriteOrder
            memoryStorage['promps-project-index'] = JSON.stringify({
                projects: {},
                recentOrder: [],
                allTags: []
            });

            const manager = new ProjectIndexManager();

            expect(manager.index.favoriteOrder).toEqual([]);
        });
    });
});
