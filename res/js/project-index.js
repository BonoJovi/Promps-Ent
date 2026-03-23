/**
 * Promps Pro - Project Index Manager
 *
 * Manages project index stored in localStorage for search and recent projects.
 * Includes tag management and folder scanning integration.
 */

/**
 * ProjectIndexManager - Singleton class for managing project index
 */
class ProjectIndexManager {
    static STORAGE_KEY = 'promps-project-index';
    static MAX_RECENT = 20;

    constructor() {
        this.index = this.loadIndex();
    }

    /**
     * Load index from localStorage
     * @returns {Object} Project index
     */
    loadIndex() {
        try {
            const stored = localStorage.getItem(ProjectIndexManager.STORAGE_KEY);
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
            console.error('Failed to load project index:', error);
        }
        return {
            projects: {},
            recentOrder: [],
            allTags: [],
            favoriteOrder: []
        };
    }

    /**
     * Save index to localStorage
     */
    saveIndex() {
        try {
            localStorage.setItem(ProjectIndexManager.STORAGE_KEY, JSON.stringify(this.index));
        } catch (error) {
            console.error('Failed to save project index:', error);
        }
    }

    /**
     * Add or update a project in the index
     * @param {Object} project - Project metadata
     * @param {string} path - File path
     */
    addToIndex(project, path) {
        if (!path || !project) return;

        // Preserve existing favorite status if project exists
        const existing = this.index.projects[path];
        const isFavorite = existing?.isFavorite || false;

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

    /**
     * Remove a project from the index
     * @param {string} path - File path
     */
    removeFromIndex(path) {
        delete this.index.projects[path];
        this.index.recentOrder = this.index.recentOrder.filter(p => p !== path);
        this.rebuildAllTags();
        this.saveIndex();
    }

    /**
     * Update tags for a project
     * @param {string} path - File path
     * @param {Array<string>} tags - New tags array
     */
    updateTags(path, tags) {
        if (this.index.projects[path]) {
            this.index.projects[path].tags = tags;
            this.index.projects[path].modifiedAt = new Date().toISOString();
            this.rebuildAllTags();
            this.saveIndex();
        }
    }

    /**
     * Rebuild the all tags list from indexed projects
     */
    rebuildAllTags() {
        const tagSet = new Set();
        for (const project of Object.values(this.index.projects)) {
            if (project.tags) {
                project.tags.forEach(tag => tagSet.add(tag));
            }
        }
        this.index.allTags = Array.from(tagSet).sort();
    }

    /**
     * Get all unique tags from indexed projects
     * @returns {Array<string>} Sorted array of unique tags
     */
    getAllTags() {
        return this.index.allTags || [];
    }

    /**
     * Get recent projects
     * @param {number} limit - Maximum number of projects to return
     * @returns {Array<Object>} Recent project entries
     */
    getRecentProjects(limit = 10) {
        const recent = [];
        for (const path of this.index.recentOrder.slice(0, limit)) {
            if (this.index.projects[path]) {
                recent.push({ ...this.index.projects[path] });
            }
        }
        return recent;
    }

    /**
     * Search projects by query and tag filters
     * @param {string} query - Search query (searches name and description)
     * @param {Array<string>} tagFilters - Tags to filter by (AND logic)
     * @returns {Array<Object>} Matching project entries
     */
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

            // Check query match (name or description)
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

    /**
     * Merge scanned projects into the index
     * @param {Array<Object>} scannedProjects - Projects from folder scan
     */
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

    /**
     * Get a project entry by path
     * @param {string} path - File path
     * @returns {Object|null} Project entry or null
     */
    getProject(path) {
        return this.index.projects[path] || null;
    }

    /**
     * Check if a project is in the index
     * @param {string} path - File path
     * @returns {boolean} True if project is indexed
     */
    hasProject(path) {
        return !!this.index.projects[path];
    }

    /**
     * Clear the entire index
     */
    clearIndex() {
        this.index = {
            projects: {},
            recentOrder: [],
            allTags: [],
            favoriteOrder: []
        };
        this.saveIndex();
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
        return project?.isFavorite || false;
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

    /**
     * Get statistics about the index
     * @returns {Object} Index statistics
     */
    getStats() {
        return {
            totalProjects: Object.keys(this.index.projects).length,
            totalTags: this.index.allTags.length,
            recentCount: this.index.recentOrder.length,
            favoriteCount: this.index.favoriteOrder.length
        };
    }
}

// Create singleton instance
window.projectIndex = new ProjectIndexManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectIndexManager };
}

console.log('Project Index Manager loaded');
