/**
 * Promps Pro - Project Sidebar
 *
 * Left sidebar UI component for project search, tag filtering,
 * recent projects, and folder scanning.
 */

/**
 * Helper function to get translation with fallback
 */
function sidebarT(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * ProjectSidebar - Sidebar UI component
 */
class ProjectSidebar {
    constructor() {
        this.isOpen = localStorage.getItem('promps-sidebar-open') !== 'false';
        this.searchQuery = '';
        this.selectedTags = [];
        this.editingProject = null;

        // DOM elements (initialized in init())
        this.sidebar = null;
        this.searchInput = null;
        this.tagContainer = null;
        this.projectList = null;
        this.favoritesList = null;
    }

    /**
     * Initialize the sidebar
     */
    init() {
        this.sidebar = document.getElementById('projectSidebar');
        this.searchInput = document.getElementById('projectSearch');
        this.tagContainer = document.getElementById('tagFilterContainer');
        this.projectList = document.getElementById('recentProjectsList');
        this.favoritesList = document.getElementById('favoriteProjectsList');

        if (!this.sidebar) {
            console.log('Project sidebar element not found');
            return;
        }

        // Set initial state
        if (!this.isOpen) {
            this.sidebar.classList.add('collapsed');
        }

        // Check Pro license
        this.updateProLockState();

        // Bind events
        this.bindEvents();

        // Initial render
        this.render();

        console.log('Project Sidebar initialized');
    }

    /**
     * Update Ent feature lock state
     */
    updateProLockState() {
        if (!this.sidebar) return;

        // No license check needed
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.onSearch(e.target.value);
            });
        }

        // Toggle button
        const toggleBtn = document.getElementById('btnToggleSidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Scan folder button
        const scanBtn = document.getElementById('btnScanFolder');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.scanFolder());
        }

        // Tag editor modal close
        const closeTagEditor = document.getElementById('btnCloseTagEditor');
        if (closeTagEditor) {
            closeTagEditor.addEventListener('click', () => this.hideTagEditor());
        }

        // Tag editor add button
        const addTagBtn = document.getElementById('btnAddTag');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => this.addNewTag());
        }

        // Tag editor input enter key
        const newTagInput = document.getElementById('newTagInput');
        if (newTagInput) {
            newTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addNewTag();
                }
            });
        }

        // Tag editor save button
        const saveTagsBtn = document.getElementById('btnSaveTagsEdit');
        if (saveTagsBtn) {
            saveTagsBtn.addEventListener('click', () => this.saveTagEdits());
        }

        // Listen for license change
        window.addEventListener('licensechange', () => {
            this.updateProLockState();
            this.render();
        });

        // Listen for locale change
        window.addEventListener('localechange', () => {
            this.render();
        });
    }

    /**
     * Toggle sidebar open/closed
     */
    toggle() {
        this.isOpen = !this.isOpen;
        localStorage.setItem('promps-sidebar-open', this.isOpen);

        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed', !this.isOpen);
        }

        // Update toggle button text
        const toggleBtn = document.getElementById('btnToggleSidebar');
        if (toggleBtn) {
            toggleBtn.textContent = this.isOpen ? '\u25C0' : '\u25B6';
        }

        // Trigger Blockly resize
        if (typeof Blockly !== 'undefined' && window.workspace) {
            setTimeout(() => Blockly.svgResize(window.workspace), 300);
        }
    }

    /**
     * Handle search input
     * @param {string} query - Search query
     */
    onSearch(query) {
        this.searchQuery = query;
        this.renderProjectList();
    }

    /**
     * Handle tag filter click
     * @param {string} tag - Tag to toggle
     */
    onTagFilter(tag) {
        const index = this.selectedTags.indexOf(tag);
        if (index === -1) {
            this.selectedTags.push(tag);
        } else {
            this.selectedTags.splice(index, 1);
        }
        this.renderTags();
        this.renderProjectList();
    }

    /**
     * Clear all tag filters
     */
    clearTagFilters() {
        this.selectedTags = [];
        this.renderTags();
        this.renderProjectList();
    }

    /**
     * Render the entire sidebar
     */
    render() {
        this.renderFavorites();
        this.renderTags();
        this.renderProjectList();
    }

    /**
     * Render locked state for non-Pro users
     */
    renderLockedState() {
        if (this.tagContainer) {
            this.tagContainer.innerHTML = '';
        }

        if (this.favoritesList) {
            this.favoritesList.innerHTML = '';
        }

        // Hide favorites section when locked
        const favoritesSection = document.getElementById('favoritesSidebarSection');
        if (favoritesSection) {
            favoritesSection.style.display = 'none';
        }

        if (this.projectList) {
            this.projectList.innerHTML = `
                <li class="sidebar-locked-message">
                    <span class="ent-badge-inline">Ent</span>
                    <span>${sidebarT('sidebar.entRequired', 'Ent feature')}</span>
                </li>
            `;
        }
    }

    /**
     * Render favorites section
     */
    renderFavorites() {
        const favoritesSection = document.getElementById('favoritesSidebarSection');
        if (!this.favoritesList || !window.projectIndex) {
            if (favoritesSection) favoritesSection.style.display = 'none';
            return;
        }

        const favorites = window.projectIndex.getFavoriteProjects();

        if (favorites.length === 0) {
            if (favoritesSection) favoritesSection.style.display = 'none';
            return;
        }

        // Show favorites section
        if (favoritesSection) favoritesSection.style.display = 'block';

        let html = '';
        for (const project of favorites) {
            const tags = (project.tags || []).map(tag =>
                `<span class="project-tag">${this.escapeHtml(tag)}</span>`
            ).join('');

            html += `
                <li class="project-item project-item-favorite" onclick="window.projectSidebar.openProject('${this.escapeHtml(project.path)}')">
                    <div class="project-item-header">
                        <span class="project-item-name">${this.escapeHtml(project.name)}</span>
                        <div class="project-item-actions">
                            <button class="project-item-fav-btn favorite-active" onclick="event.stopPropagation(); window.projectSidebar.toggleFavorite('${this.escapeHtml(project.path)}')" title="${sidebarT('favorites.remove', 'Remove from favorites')}">
                                ★
                            </button>
                            <button class="project-item-tags-btn" onclick="event.stopPropagation(); window.projectSidebar.showTagEditor('${this.escapeHtml(project.path)}')" title="${sidebarT('tags.edit', 'Edit Tags')}">
                                &#128204;
                            </button>
                        </div>
                    </div>
                    ${project.description ? `<div class="project-item-desc">${this.escapeHtml(project.description)}</div>` : ''}
                    ${tags ? `<div class="project-item-tags">${tags}</div>` : ''}
                </li>
            `;
        }

        this.favoritesList.innerHTML = html;
    }

    /**
     * Toggle favorite status of a project
     * @param {string} path - Project path
     */
    toggleFavorite(path) {
        if (!window.projectIndex) return;

        window.projectIndex.toggleFavorite(path);
        this.render();
    }

    /**
     * Render tag filter chips
     */
    renderTags() {
        if (!this.tagContainer || !window.projectIndex) return;

        const allTags = window.projectIndex.getAllTags();

        if (allTags.length === 0) {
            this.tagContainer.innerHTML = '';
            return;
        }

        let html = '<div class="tag-filter-header">';
        html += `<span>${sidebarT('sidebar.tags', 'Tags')}</span>`;
        if (this.selectedTags.length > 0) {
            html += `<button class="tag-clear-btn" onclick="window.projectSidebar.clearTagFilters()">${sidebarT('sidebar.clearFilters', 'Clear')}</button>`;
        }
        html += '</div>';

        html += '<div class="tag-chips">';
        for (const tag of allTags) {
            const isActive = this.selectedTags.includes(tag);
            html += `<button class="tag-chip ${isActive ? 'active' : ''}"
                            onclick="window.projectSidebar.onTagFilter('${this.escapeHtml(tag)}')">${this.escapeHtml(tag)}</button>`;
        }
        html += '</div>';

        this.tagContainer.innerHTML = html;
    }

    /**
     * Render project list
     */
    renderProjectList() {
        if (!this.projectList || !window.projectIndex) return;

        let projects;

        if (this.searchQuery || this.selectedTags.length > 0) {
            // Search mode
            projects = window.projectIndex.search(this.searchQuery, this.selectedTags);
        } else {
            // Recent projects mode
            projects = window.projectIndex.getRecentProjects(10);
        }

        if (projects.length === 0) {
            const message = this.searchQuery || this.selectedTags.length > 0
                ? sidebarT('sidebar.noResults', 'No matching projects')
                : sidebarT('sidebar.noProjects', 'No recent projects');

            this.projectList.innerHTML = `<li class="sidebar-empty">${message}</li>`;
            return;
        }

        let html = '';
        for (const project of projects) {
            const tags = (project.tags || []).map(tag =>
                `<span class="project-tag">${this.escapeHtml(tag)}</span>`
            ).join('');

            const isFavorite = window.projectIndex.isFavorite(project.path);
            const favClass = isFavorite ? 'favorite-active' : '';
            const favTitle = isFavorite
                ? sidebarT('favorites.remove', 'Remove from favorites')
                : sidebarT('favorites.add', 'Add to favorites');

            html += `
                <li class="project-item" onclick="window.projectSidebar.openProject('${this.escapeHtml(project.path)}')">
                    <div class="project-item-header">
                        <span class="project-item-name">${this.escapeHtml(project.name)}</span>
                        <div class="project-item-actions">
                            <button class="project-item-fav-btn ${favClass}" onclick="event.stopPropagation(); window.projectSidebar.toggleFavorite('${this.escapeHtml(project.path)}')" title="${favTitle}">
                                ${isFavorite ? '★' : '☆'}
                            </button>
                            <button class="project-item-tags-btn" onclick="event.stopPropagation(); window.projectSidebar.showTagEditor('${this.escapeHtml(project.path)}')" title="${sidebarT('tags.edit', 'Edit Tags')}">
                                &#128204;
                            </button>
                        </div>
                    </div>
                    ${project.description ? `<div class="project-item-desc">${this.escapeHtml(project.description)}</div>` : ''}
                    ${tags ? `<div class="project-item-tags">${tags}</div>` : ''}
                </li>
            `;
        }

        this.projectList.innerHTML = html;
    }

    /**
     * Open a project by path
     * @param {string} path - File path
     */
    async openProject(path) {
        try {
            // Check for unsaved changes
            if (window.projectManager && window.projectManager.hasUnsavedChanges()) {
                const confirmed = await invoke('show_confirm_dialog', {
                    title: sidebarT('project.unsaved.title', 'Unsaved Changes'),
                    message: sidebarT('project.unsaved.message', 'You have unsaved changes. Do you want to discard them?')
                });
                if (!confirmed) return;
            }

            // Load the project
            const project = await invoke('load_project', { path });

            // Update project manager state
            if (window.projectManager) {
                window.projectManager.loadWorkspaceState(project.workspace);

                // Store current project info
                window.projectManager._currentProject = project;
                window.projectManager._currentFilePath = path;
                window.projectManager._isDirty = false;
                window.projectManager.updateWindowTitle();
            }

            // Update project index (mark as recently opened)
            window.projectIndex.addToIndex(project, path);

            // Re-render sidebar
            this.render();

            console.log('Opened project from sidebar:', path);
        } catch (error) {
            console.error('Failed to open project:', error);
            alert(sidebarT('project.load.failed', 'Failed to load project') + ': ' + error);
        }
    }

    /**
     * Scan a folder for projects
     */
    async scanFolder() {
        try {
            // Show folder picker
            const folderPath = await invoke('show_folder_dialog', {});

            if (!folderPath) {
                console.log('Folder selection cancelled');
                return;
            }

            // Scan the folder
            const projects = await invoke('scan_projects_folder', { folderPath });

            if (projects.length === 0) {
                alert(sidebarT('scan.noProjects', 'No projects found'));
                return;
            }

            // Merge into index
            window.projectIndex.mergeScannedProjects(projects);

            // Re-render
            this.render();

            // Show count
            const message = sidebarT('scan.found', 'Found {count} projects').replace('{count}', projects.length);
            console.log(message);
        } catch (error) {
            console.error('Folder scan error:', error);
            alert(sidebarT('scan.error', 'Scan failed') + ': ' + error);
        }
    }

    /**
     * Show tag editor modal for a project
     * @param {string} path - Project path
     */
    showTagEditor(path) {
        const project = window.projectIndex.getProject(path);
        if (!project) return;

        this.editingProject = path;

        // Populate current tags
        const currentTagsList = document.getElementById('currentTagsList');
        if (currentTagsList) {
            const tags = project.tags || [];
            if (tags.length === 0) {
                currentTagsList.innerHTML = `<span class="no-tags">${sidebarT('tags.noTags', 'No tags')}</span>`;
            } else {
                currentTagsList.innerHTML = tags.map(tag => `
                    <span class="tag-removable">
                        ${this.escapeHtml(tag)}
                        <button class="tag-remove-btn" onclick="window.projectSidebar.removeEditingTag('${this.escapeHtml(tag)}')">&times;</button>
                    </span>
                `).join('');
            }
        }

        // Populate suggested tags
        const suggestedTagsList = document.getElementById('suggestedTagsList');
        if (suggestedTagsList) {
            const allTags = window.projectIndex.getAllTags();
            const currentTags = project.tags || [];
            const suggested = allTags.filter(tag => !currentTags.includes(tag));

            if (suggested.length === 0) {
                suggestedTagsList.innerHTML = '';
            } else {
                suggestedTagsList.innerHTML = `
                    <div class="suggested-header">${sidebarT('tags.suggested', 'Existing tags')}:</div>
                    <div class="suggested-chips">
                        ${suggested.map(tag => `
                            <button class="tag-chip suggested" onclick="window.projectSidebar.addEditingTag('${this.escapeHtml(tag)}')">${this.escapeHtml(tag)}</button>
                        `).join('')}
                    </div>
                `;
            }
        }

        // Clear input
        const newTagInput = document.getElementById('newTagInput');
        if (newTagInput) {
            newTagInput.value = '';
        }

        // Show modal
        const modal = document.getElementById('tagEditorModal');
        if (modal) {
            modal.classList.add('modal-visible');
        }
    }

    /**
     * Hide tag editor modal
     */
    hideTagEditor() {
        const modal = document.getElementById('tagEditorModal');
        if (modal) {
            modal.classList.remove('modal-visible');
        }
        this.editingProject = null;
    }

    /**
     * Add a new tag in the editor
     */
    addNewTag() {
        const input = document.getElementById('newTagInput');
        if (!input) return;

        const tag = input.value.trim();
        if (!tag) return;

        this.addEditingTag(tag);
        input.value = '';
    }

    /**
     * Add a tag to the editing project
     * @param {string} tag - Tag to add
     */
    addEditingTag(tag) {
        if (!this.editingProject) return;

        const project = window.projectIndex.getProject(this.editingProject);
        if (!project) return;

        const tags = project.tags || [];
        if (!tags.includes(tag)) {
            tags.push(tag);
            window.projectIndex.updateTags(this.editingProject, tags);
            this.showTagEditor(this.editingProject); // Refresh
        }
    }

    /**
     * Remove a tag from the editing project
     * @param {string} tag - Tag to remove
     */
    removeEditingTag(tag) {
        if (!this.editingProject) return;

        const project = window.projectIndex.getProject(this.editingProject);
        if (!project) return;

        const tags = (project.tags || []).filter(t => t !== tag);
        window.projectIndex.updateTags(this.editingProject, tags);
        this.showTagEditor(this.editingProject); // Refresh
    }

    /**
     * Save tag edits and close modal
     */
    saveTagEdits() {
        // Tags are already saved incrementally, just close
        this.hideTagEditor();
        this.render();
    }

    /**
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Create singleton instance
window.projectSidebar = new ProjectSidebar();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectSidebar };
}

console.log('Project Sidebar module loaded');
