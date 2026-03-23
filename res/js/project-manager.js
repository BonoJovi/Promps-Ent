/**
 * Promps Phase 4 - Project Manager
 *
 * Handles project persistence: save, load, new project operations
 * Uses Blockly JSON Serialization and Tauri v2 commands
 * Includes i18n support for translated messages.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function pt(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

// Initialize projectManager namespace immediately
window.projectManager = window.projectManager || {};

// Project state
let currentProject = null;
let currentFilePath = null;
let isDirty = false;

/**
 * Initialize project manager
 */
async function initProjectManager() {
    try {
        // Create initial empty project
        await newProject(false);

        console.log('Project Manager initialized');
    } catch (error) {
        console.error('Failed to initialize Project Manager:', error);
    }
}

/**
 * Get current workspace state using Blockly JSON Serialization
 * @returns {Object} Serialized workspace state
 */
function getWorkspaceState() {
    if (!workspace) {
        return {};
    }

    // Use Blockly's modern JSON serialization API
    const state = Blockly.serialization.workspaces.save(workspace);
    return state;
}

/**
 * Load workspace state from serialized JSON
 * @param {Object} state - Serialized workspace state
 */
function loadWorkspaceState(state) {
    if (!workspace) {
        console.error('Workspace not initialized');
        return;
    }

    // Clear current workspace and undo stack (v1.1.0)
    workspace.clear();
    workspace.clearUndo();

    // Load state using Blockly's modern JSON serialization API
    if (state && Object.keys(state).length > 0) {
        Blockly.serialization.workspaces.load(state, workspace);
    }

    // Update Undo/Redo buttons (v1.1.0)
    if (typeof updateUndoRedoButtons === 'function') {
        updateUndoRedoButtons();
    }

    // Trigger preview update
    if (typeof updatePreview === 'function') {
        const code = getWorkspaceCode();
        updatePreview(code);
    }
}

/**
 * Get current workspace settings (zoom, scroll position)
 * @returns {Object} Workspace settings
 */
function getWorkspaceSettings() {
    if (!workspace) {
        return { zoom: 1.0, scrollX: 0, scrollY: 0 };
    }

    const metrics = workspace.getMetrics();
    return {
        zoom: workspace.scale || 1.0,
        scrollX: metrics.viewLeft || 0,
        scrollY: metrics.viewTop || 0
    };
}

/**
 * Apply workspace settings (zoom, scroll position)
 * @param {Object} settings - Workspace settings
 */
function applyWorkspaceSettings(settings) {
    if (!workspace || !settings) {
        return;
    }

    // Apply zoom
    if (settings.zoom && settings.zoom !== workspace.scale) {
        workspace.setScale(settings.zoom);
    }

    // Apply scroll position
    if (settings.scrollX !== undefined && settings.scrollY !== undefined) {
        workspace.scroll(settings.scrollX, settings.scrollY);
    }
}

/**
 * Create a new project
 * @param {boolean} confirmDiscard - Whether to confirm discarding unsaved changes
 */
async function newProject(confirmDiscard = true) {
    // Check for unsaved changes
    if (confirmDiscard && isDirty) {
        const confirmed = await confirmDiscardChanges();
        if (!confirmed) {
            return false;
        }
    }

    // Create new project via Tauri command
    try {
        const project = await invoke('create_new_project', { name: 'Untitled' });
        currentProject = project;
        currentFilePath = null;
        isDirty = false;

        // Clear workspace and undo stack (v1.1.0)
        if (workspace) {
            workspace.clear();
            workspace.clearUndo();
        }

        // Update Undo/Redo buttons (v1.1.0)
        if (typeof updateUndoRedoButtons === 'function') {
            updateUndoRedoButtons();
        }

        // Update title
        updateWindowTitle();

        console.log('New project created');
        return true;
    } catch (error) {
        console.error('Failed to create new project:', error);

        // Fallback: create project locally
        currentProject = createLocalProject('Untitled');
        currentFilePath = null;
        isDirty = false;

        // Clear workspace and undo stack (v1.1.0)
        if (workspace) {
            workspace.clear();
            workspace.clearUndo();
        }

        // Update Undo/Redo buttons (v1.1.0)
        if (typeof updateUndoRedoButtons === 'function') {
            updateUndoRedoButtons();
        }

        updateWindowTitle();
        return true;
    }
}

/**
 * Create project locally (fallback when Tauri not available)
 * @param {string} name - Project name
 * @returns {Object} Project object
 */
function createLocalProject(name) {
    const now = new Date().toISOString();
    return {
        version: '1.0.0',
        metadata: {
            name: name,
            description: null,
            createdAt: now,
            modifiedAt: now,
            author: null,
            tags: []
        },
        workspace: {},
        settings: {
            zoom: 1.0,
            scrollX: 0,
            scrollY: 0
        }
    };
}

/**
 * Save project to file
 * @param {boolean} saveAs - Force save as new file
 */
async function saveProject(saveAs = false) {
    if (!currentProject) {
        await newProject(false);
    }

    // Update project with current workspace state
    currentProject.workspace = getWorkspaceState();
    currentProject.settings = getWorkspaceSettings();
    currentProject.metadata.modifiedAt = new Date().toISOString();

    // Determine file path
    let filePath = currentFilePath;

    if (!filePath || saveAs) {
        // Show save dialog via Rust command
        try {
            const defaultName = currentProject.metadata.name + '.promps';
            filePath = await invoke('show_save_dialog', { defaultName });

            if (!filePath) {
                console.log('Save cancelled');
                return false;
            }
        } catch (error) {
            console.error('Save dialog error:', error);
            return false;
        }
    }

    // Save via Tauri command
    try {
        await invoke('save_project', {
            path: filePath,
            project: currentProject
        });

        currentFilePath = filePath;
        isDirty = false;

        // Update project name from file name
        const fileName = filePath.split(/[\\/]/).pop().replace('.promps', '');
        currentProject.metadata.name = fileName;

        updateWindowTitle();

        // Update project index (Ent feature)
        if (window.projectIndex) {
            window.projectIndex.addToIndex(currentProject, filePath);
            // Update sidebar if available
            if (window.projectSidebar) {
                window.projectSidebar.render();
            }
        }

        console.log('Project saved:', filePath);
        return true;
    } catch (error) {
        console.error('Failed to save project:', error);
        alert(pt('project.save.failed', 'Failed to save project') + ': ' + error);
        return false;
    }
}

/**
 * Load project from file
 */
async function loadProject() {
    // Check for unsaved changes
    if (isDirty) {
        const confirmed = await confirmDiscardChanges();
        if (!confirmed) {
            return false;
        }
    }

    // Show open dialog via Rust command
    let filePath;
    try {
        filePath = await invoke('show_open_dialog', {});

        if (!filePath) {
            console.log('Open cancelled');
            return false;
        }
    } catch (error) {
        console.error('Open dialog error:', error);
        return false;
    }

    // Load via Tauri command
    try {
        const project = await invoke('load_project', { path: filePath });

        currentProject = project;
        currentFilePath = filePath;
        isDirty = false;

        // Restore workspace state
        loadWorkspaceState(project.workspace);
        applyWorkspaceSettings(project.settings);

        // Update block counter after loading project (v1.1.0)
        if (typeof window.updateBlockCounter === 'function') {
            window.updateBlockCounter();
        }

        updateWindowTitle();

        // Update project index (Ent feature)
        if (window.projectIndex) {
            window.projectIndex.addToIndex(project, filePath);
            // Update sidebar if available
            if (window.projectSidebar) {
                window.projectSidebar.render();
            }
        }

        console.log('Project loaded:', filePath);
        return true;
    } catch (error) {
        console.error('Failed to load project:', error);
        alert(pt('project.load.failed', 'Failed to load project') + ': ' + error);
        return false;
    }
}

/**
 * Confirm discarding unsaved changes
 * @returns {boolean} True if user confirms discard
 */
async function confirmDiscardChanges() {
    try {
        return await invoke('show_confirm_dialog', {
            title: pt('project.unsaved.title', 'Unsaved Changes'),
            message: pt('project.unsaved.message', 'You have unsaved changes. Do you want to discard them?')
        });
    } catch (error) {
        console.error('Confirm dialog error:', error);
        // Tauri's confirm() returns a Promise
        return await confirm(pt('project.unsaved.message', 'You have unsaved changes. Do you want to discard them?'));
    }
}

/**
 * Update window title to reflect current project state
 */
async function updateWindowTitle() {
    const projectName = currentProject?.metadata?.name || 'Untitled';
    const dirtyMarker = isDirty ? ' *' : '';
    const title = `${projectName}${dirtyMarker} - Promps`;

    // Update HTML title
    document.title = title;

    // Update Tauri window title
    try {
        await invoke('set_window_title', { title });
    } catch (error) {
        console.error('Failed to set window title:', error);
    }
}

/**
 * Mark project as dirty (has unsaved changes)
 */
function markDirty() {
    if (!isDirty) {
        isDirty = true;
        updateWindowTitle();
    }
}

/**
 * Reset dirty state (used when workspace is programmatically cleared, e.g., language change)
 */
function resetDirtyState() {
    isDirty = false;
    updateWindowTitle();
}

/**
 * Check if project has unsaved changes
 * @returns {boolean} True if project has unsaved changes
 */
function hasUnsavedChanges() {
    return isDirty;
}

/**
 * Get current project
 * @returns {Object} Current project
 */
function getCurrentProject() {
    return currentProject;
}

/**
 * Get current file path
 * @returns {string|null} Current file path
 */
function getCurrentFilePath() {
    return currentFilePath;
}

// Export functions for use in other modules
window.projectManager.init = initProjectManager;
window.projectManager.newProject = newProject;
window.projectManager.saveProject = saveProject;
window.projectManager.loadProject = loadProject;
window.projectManager.getWorkspaceState = getWorkspaceState;
window.projectManager.loadWorkspaceState = loadWorkspaceState;
window.projectManager.markDirty = markDirty;
window.projectManager.resetDirtyState = resetDirtyState;
window.projectManager.hasUnsavedChanges = hasUnsavedChanges;
window.projectManager.getCurrentProject = getCurrentProject;
window.projectManager.getCurrentFilePath = getCurrentFilePath;
window.projectManager.updateWindowTitle = updateWindowTitle;

console.log('Project Manager module loaded');
