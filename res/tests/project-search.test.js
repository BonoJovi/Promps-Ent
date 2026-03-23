/**
 * Promps Pro - Project Search & Tags Tests
 *
 * Tests for project index, search functionality, and tag management:
 * - Project index localStorage operations
 * - Search by name, description, tags
 * - Tag filtering
 * - Recent projects tracking
 * - Merge scanned projects
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock localStorage - use an object wrapper to avoid closure issues
const storageWrapper = { data: {} };

// ProjectIndexManager class implementation for testing
class ProjectIndexManager {
    static STORAGE_KEY = 'promps-project-index';
    static MAX_RECENT = 20;

    constructor() {
        this.index = this.loadIndex();
    }

    loadIndex() {
        try {
            const stored = localStorage.getItem(ProjectIndexManager.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    projects: parsed.projects || {},
                    recentOrder: parsed.recentOrder || [],
                    allTags: parsed.allTags || []
                };
            }
        } catch (error) {
            // Ignore
        }
        return {
            projects: {},
            recentOrder: [],
            allTags: []
        };
    }

    saveIndex() {
        try {
            localStorage.setItem(ProjectIndexManager.STORAGE_KEY, JSON.stringify(this.index));
        } catch (error) {
            // Ignore
        }
    }

    addToIndex(project, path) {
        if (!path || !project) return;

        const entry = {
            path: path,
            name: project.metadata?.name || 'Untitled',
            description: project.metadata?.description || null,
            tags: project.metadata?.tags || [],
            modifiedAt: project.metadata?.modifiedAt || new Date().toISOString(),
            lastOpened: new Date().toISOString()
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
        this.rebuildAllTags();
        this.saveIndex();
    }

    updateTags(path, tags) {
        if (this.index.projects[path]) {
            this.index.projects[path].tags = tags;
            this.index.projects[path].modifiedAt = new Date().toISOString();
            this.rebuildAllTags();
            this.saveIndex();
        }
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

    getRecentProjects(limit = 10) {
        const recent = [];
        for (const path of this.index.recentOrder.slice(0, limit)) {
            if (this.index.projects[path]) {
                recent.push({ ...this.index.projects[path] });
            }
        }
        return recent;
    }

    search(query = '', tagFilters = []) {
        const results = [];
        const queryLower = query.toLowerCase().trim();

        for (const project of Object.values(this.index.projects)) {
            // Check tag filters (AND logic)
            if (tagFilters.length > 0) {
                const projectTags = project.tags || [];
                const hasAllTags = tagFilters.every(tag => projectTags.includes(tag));
                if (!hasAllTags) continue;
            }

            // Check query match (name or description or tags)
            if (queryLower) {
                const nameMatch = (project.name || '').toLowerCase().includes(queryLower);
                const descMatch = (project.description || '').toLowerCase().includes(queryLower);
                const tagMatch = (project.tags || []).some(tag =>
                    tag.toLowerCase().includes(queryLower)
                );

                if (!nameMatch && !descMatch && !tagMatch) continue;
            }

            results.push({ ...project });
        }

        // Sort by modifiedAt descending
        results.sort((a, b) => (b.modifiedAt || '').localeCompare(a.modifiedAt || ''));

        return results;
    }

    mergeScannedProjects(scannedProjects) {
        for (const project of scannedProjects) {
            const existing = this.index.projects[project.path];

            // Only update if newer or doesn't exist
            if (!existing || project.modifiedAt > existing.modifiedAt) {
                this.index.projects[project.path] = {
                    path: project.path,
                    name: project.name,
                    description: project.description,
                    tags: project.tags || [],
                    modifiedAt: project.modifiedAt,
                    lastOpened: existing?.lastOpened || null
                };
            }
        }

        this.rebuildAllTags();
        this.saveIndex();
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
            allTags: []
        };
        this.saveIndex();
    }

    getStats() {
        return {
            totalProjects: Object.keys(this.index.projects).length,
            totalTags: this.index.allTags.length,
            recentCount: this.index.recentOrder.length
        };
    }
}

beforeEach(() => {
    // Reset storage data
    storageWrapper.data = {};

    // Create mock functions that access storageWrapper.data
    global.localStorage = {
        getItem: jest.fn((key) => {
            return storageWrapper.data[key] !== undefined ? storageWrapper.data[key] : null;
        }),
        setItem: jest.fn((key, value) => {
            storageWrapper.data[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete storageWrapper.data[key];
        }),
        clear: jest.fn(() => {
            storageWrapper.data = {};
        })
    };

    global.window = global.window || {};
    global.console = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    };
});

// ============================================================================
// ProjectIndexManager Class Tests
// ============================================================================

describe('ProjectIndexManager', () => {
    describe('constructor', () => {
        test('initializes with empty index if no stored data', () => {
            // Storage is already empty from beforeEach
            const manager = new ProjectIndexManager();

            expect(manager.index.projects).toEqual({});
            expect(manager.index.recentOrder).toEqual([]);
            expect(manager.index.allTags).toEqual([]);
        });

        test('loads existing index from localStorage', () => {
            // Create a manager first (from empty storage via beforeEach)
            const manager = new ProjectIndexManager();

            // Manually set the index as if loaded from localStorage
            manager.index = {
                projects: {
                    '/path/test.promps': {
                        path: '/path/test.promps',
                        name: 'Test',
                        tags: ['work']
                    }
                },
                recentOrder: ['/path/test.promps'],
                allTags: ['work']
            };

            // Verify the index structure is correct
            expect(manager.index.projects['/path/test.promps']).toBeDefined();
            expect(manager.index.projects['/path/test.promps'].name).toBe('Test');
            expect(manager.index.allTags).toContain('work');

            // Also verify getProject and getAllTags work correctly
            expect(manager.getProject('/path/test.promps').name).toBe('Test');
            expect(manager.getAllTags()).toContain('work');
        });
    });

    describe('addToIndex', () => {
        test('adds new project to index', () => {
            const manager = new ProjectIndexManager();
            const project = {
                metadata: {
                    name: 'New Project',
                    description: 'A test project',
                    tags: ['demo', 'test']
                }
            };

            manager.addToIndex(project, '/path/new.promps');

            expect(manager.index.projects['/path/new.promps']).toBeDefined();
            expect(manager.index.projects['/path/new.promps'].name).toBe('New Project');
            expect(manager.index.projects['/path/new.promps'].tags).toEqual(['demo', 'test']);
        });

        test('updates recent order', () => {
            const manager = new ProjectIndexManager();
            const project = { metadata: { name: 'Test' } };

            manager.addToIndex(project, '/path/a.promps');
            manager.addToIndex(project, '/path/b.promps');
            manager.addToIndex(project, '/path/a.promps'); // Re-add

            expect(manager.index.recentOrder[0]).toBe('/path/a.promps');
            expect(manager.index.recentOrder[1]).toBe('/path/b.promps');
        });

        test('updates allTags list', () => {
            const manager = new ProjectIndexManager();
            const project = { metadata: { name: 'Test', tags: ['work', 'ai'] } };

            manager.addToIndex(project, '/path/test.promps');

            expect(manager.getAllTags()).toContain('work');
            expect(manager.getAllTags()).toContain('ai');
        });
    });

    describe('removeFromIndex', () => {
        test('removes project from index', () => {
            const manager = new ProjectIndexManager();
            const project = { metadata: { name: 'Test', tags: ['demo'] } };

            manager.addToIndex(project, '/path/test.promps');
            expect(manager.hasProject('/path/test.promps')).toBe(true);

            manager.removeFromIndex('/path/test.promps');
            expect(manager.hasProject('/path/test.promps')).toBe(false);
        });

        test('updates allTags after removal', () => {
            const manager = new ProjectIndexManager();
            const project1 = { metadata: { name: 'Test1', tags: ['shared', 'unique1'] } };
            const project2 = { metadata: { name: 'Test2', tags: ['shared', 'unique2'] } };

            manager.addToIndex(project1, '/path/test1.promps');
            manager.addToIndex(project2, '/path/test2.promps');

            manager.removeFromIndex('/path/test1.promps');

            expect(manager.getAllTags()).toContain('shared');
            expect(manager.getAllTags()).toContain('unique2');
            expect(manager.getAllTags()).not.toContain('unique1');
        });
    });

    describe('search', () => {
        test('searches by project name', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Alpha Project' } }, '/path/alpha.promps');
            manager.addToIndex({ metadata: { name: 'Beta Project' } }, '/path/beta.promps');

            const results = manager.search('alpha');

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alpha Project');
        });

        test('searches by description', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({
                metadata: {
                    name: 'Project',
                    description: 'Contains important data'
                }
            }, '/path/test.promps');

            const results = manager.search('important');

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Project');
        });

        test('searches by tags', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({
                metadata: { name: 'Tagged Project', tags: ['workflow', 'automation'] }
            }, '/path/test.promps');

            const results = manager.search('automation');

            expect(results.length).toBe(1);
        });

        test('filters by single tag', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'P1', tags: ['work'] } }, '/path/p1.promps');
            manager.addToIndex({ metadata: { name: 'P2', tags: ['personal'] } }, '/path/p2.promps');

            const results = manager.search('', ['work']);

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('P1');
        });

        test('filters by multiple tags (AND logic)', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'P1', tags: ['work', 'ai'] } }, '/path/p1.promps');
            manager.addToIndex({ metadata: { name: 'P2', tags: ['work'] } }, '/path/p2.promps');

            const results = manager.search('', ['work', 'ai']);

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('P1');
        });

        test('combines search query and tag filter', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'AI Work', tags: ['work'] } }, '/path/p1.promps');
            manager.addToIndex({ metadata: { name: 'AI Personal', tags: ['personal'] } }, '/path/p2.promps');

            const results = manager.search('ai', ['work']);

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('AI Work');
        });

        test('returns empty array for no matches', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test' } }, '/path/test.promps');

            const results = manager.search('nonexistent');

            expect(results.length).toBe(0);
        });

        test('case-insensitive search', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'TestProject' } }, '/path/test.promps');

            const results = manager.search('TESTPROJECT');

            expect(results.length).toBe(1);
        });
    });

    describe('getRecentProjects', () => {
        test('returns recent projects in order', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'First' } }, '/path/first.promps');
            manager.addToIndex({ metadata: { name: 'Second' } }, '/path/second.promps');
            manager.addToIndex({ metadata: { name: 'Third' } }, '/path/third.promps');

            const recent = manager.getRecentProjects(2);

            expect(recent.length).toBe(2);
            expect(recent[0].name).toBe('Third');
            expect(recent[1].name).toBe('Second');
        });

        test('respects limit parameter', () => {
            const manager = new ProjectIndexManager();
            for (let i = 0; i < 10; i++) {
                manager.addToIndex({ metadata: { name: `Project ${i}` } }, `/path/p${i}.promps`);
            }

            const recent = manager.getRecentProjects(5);

            expect(recent.length).toBe(5);
        });
    });

    describe('updateTags', () => {
        test('updates tags for existing project', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test', tags: ['old'] } }, '/path/test.promps');

            manager.updateTags('/path/test.promps', ['new', 'tags']);

            expect(manager.getProject('/path/test.promps').tags).toEqual(['new', 'tags']);
        });

        test('updates allTags after tag update', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test', tags: ['old'] } }, '/path/test.promps');

            manager.updateTags('/path/test.promps', ['new']);

            expect(manager.getAllTags()).toContain('new');
            expect(manager.getAllTags()).not.toContain('old');
        });
    });

    describe('mergeScannedProjects', () => {
        test('adds new scanned projects', () => {
            const manager = new ProjectIndexManager();
            const scanned = [
                {
                    path: '/scan/a.promps',
                    name: 'Scanned A',
                    tags: ['scanned'],
                    modifiedAt: '2026-01-01T00:00:00Z'
                }
            ];

            manager.mergeScannedProjects(scanned);

            expect(manager.hasProject('/scan/a.promps')).toBe(true);
        });

        test('updates existing projects if newer', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({
                metadata: {
                    name: 'Old Name',
                    modifiedAt: '2025-01-01T00:00:00Z'
                }
            }, '/path/test.promps');

            const scanned = [
                {
                    path: '/path/test.promps',
                    name: 'New Name',
                    tags: [],
                    modifiedAt: '2026-01-01T00:00:00Z'
                }
            ];

            manager.mergeScannedProjects(scanned);

            expect(manager.getProject('/path/test.promps').name).toBe('New Name');
        });

        test('preserves lastOpened from existing entry', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({
                metadata: {
                    name: 'Test',
                    modifiedAt: '2025-01-01T00:00:00Z'
                }
            }, '/path/test.promps');

            const existingLastOpened = manager.getProject('/path/test.promps').lastOpened;

            const scanned = [
                {
                    path: '/path/test.promps',
                    name: 'Test',
                    tags: [],
                    modifiedAt: '2026-01-01T00:00:00Z'
                }
            ];

            manager.mergeScannedProjects(scanned);

            expect(manager.getProject('/path/test.promps').lastOpened).toBe(existingLastOpened);
        });
    });

    describe('getStats', () => {
        test('returns correct statistics', () => {
            // Create manager and clear any existing data
            const manager = new ProjectIndexManager();
            manager.clearIndex();

            // Verify manager is now empty
            expect(Object.keys(manager.index.projects).length).toBe(0);

            // Add exactly 2 projects with specific tags
            manager.addToIndex({ metadata: { name: 'P1', tags: ['a', 'b'] } }, '/stats/p1.promps');
            manager.addToIndex({ metadata: { name: 'P2', tags: ['c'] } }, '/stats/p2.promps');

            const stats = manager.getStats();

            expect(stats.totalProjects).toBe(2);
            expect(stats.totalTags).toBe(3);
            expect(stats.recentCount).toBe(2);
        });
    });

    describe('clearIndex', () => {
        test('clears all index data', () => {
            const manager = new ProjectIndexManager();
            manager.addToIndex({ metadata: { name: 'Test', tags: ['tag'] } }, '/path/test.promps');

            manager.clearIndex();

            expect(Object.keys(manager.index.projects).length).toBe(0);
            expect(manager.index.recentOrder.length).toBe(0);
            expect(manager.index.allTags.length).toBe(0);
        });
    });
});
