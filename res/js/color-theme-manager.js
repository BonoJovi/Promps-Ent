/**
 * Promps Ent - Color Theme Manager
 *
 * Manages custom color themes for the application.
 * Ent feature - requires license.
 */

/**
 * Helper function to get translation with fallback
 */
function colorThemeT(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Default color values for light and dark modes
 */
const DEFAULT_COLORS = {
    light: {
        '--bg-primary': '#f5f5f5',
        '--bg-surface': '#ffffff',
        '--bg-header': '#2c3e50',
        '--text-primary': '#333333',
        '--accent-primary': '#2874a6',
        '--blockly-workspace-bg': '#ffffff',
        '--blockly-toolbox-bg': '#f8f9fa',
        '--blockly-flyout-bg': '#f5f5f5',
        '--accent-success': '#28a745',
        '--accent-error': '#dc3545',
        '--accent-warning': '#ffc107'
    },
    dark: {
        '--bg-primary': '#1a1a2e',
        '--bg-surface': '#16213e',
        '--bg-header': '#0f0f23',
        '--text-primary': '#e0e0e0',
        '--accent-primary': '#5dade2',
        '--blockly-workspace-bg': '#1a1a2e',
        '--blockly-toolbox-bg': '#16213e',
        '--blockly-flyout-bg': '#0f0f1a',
        '--accent-success': '#58d68d',
        '--accent-error': '#ec7063',
        '--accent-warning': '#f7dc6f'
    }
};

/**
 * Color variable metadata for UI display
 */
const COLOR_METADATA = {
    '--bg-primary': { group: 'primary', labelKey: 'colorTheme.bgPrimary', label: 'Background Primary' },
    '--bg-surface': { group: 'primary', labelKey: 'colorTheme.bgSurface', label: 'Background Surface' },
    '--bg-header': { group: 'primary', labelKey: 'colorTheme.bgHeader', label: 'Header Background' },
    '--text-primary': { group: 'primary', labelKey: 'colorTheme.textPrimary', label: 'Text Primary' },
    '--accent-primary': { group: 'primary', labelKey: 'colorTheme.accentPrimary', label: 'Accent Primary' },
    '--blockly-workspace-bg': { group: 'blockly', labelKey: 'colorTheme.blocklyWorkspace', label: 'Workspace Background' },
    '--blockly-toolbox-bg': { group: 'blockly', labelKey: 'colorTheme.blocklyToolbox', label: 'Toolbox Background' },
    '--blockly-flyout-bg': { group: 'blockly', labelKey: 'colorTheme.blocklyFlyout', label: 'Flyout Background' },
    '--accent-success': { group: 'accent', labelKey: 'colorTheme.accentSuccess', label: 'Success Color' },
    '--accent-error': { group: 'accent', labelKey: 'colorTheme.accentError', label: 'Error Color' },
    '--accent-warning': { group: 'accent', labelKey: 'colorTheme.accentWarning', label: 'Warning Color' }
};

/**
 * ColorThemeManager - Manages custom color themes
 */
class ColorThemeManager {
    static STORAGE_KEY = 'promps-ent-color-theme';

    constructor() {
        this.data = this.loadData();
        this.pendingChanges = null;
        this.modalElement = null;
        this.currentEditMode = 'light'; // 'light' or 'dark'
        this.lastSelectedEditMode = null; // Remember user's tab selection
    }

    /**
     * Load data from localStorage
     * @returns {Object} Color theme data
     */
    loadData() {
        try {
            const stored = localStorage.getItem(ColorThemeManager.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate and merge with defaults to ensure all keys exist
                return {
                    version: parsed.version || 1,
                    light: { ...DEFAULT_COLORS.light, ...parsed.light },
                    dark: { ...DEFAULT_COLORS.dark, ...parsed.dark }
                };
            }
        } catch (error) {
            console.error('Failed to load color theme:', error);
        }
        return {
            version: 1,
            light: { ...DEFAULT_COLORS.light },
            dark: { ...DEFAULT_COLORS.dark }
        };
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(ColorThemeManager.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save color theme:', error);
        }
    }

    /**
     * Get color value for a specific variable in current or specified mode
     * @param {string} variable - CSS variable name (e.g., '--bg-primary')
     * @param {string} mode - 'light' or 'dark' (optional, defaults to current theme)
     * @returns {string} Color value
     */
    getColor(variable, mode = null) {
        const targetMode = mode || this.getCurrentMode();
        return this.data[targetMode][variable] || DEFAULT_COLORS[targetMode][variable];
    }

    /**
     * Set color value for a specific variable
     * @param {string} variable - CSS variable name
     * @param {string} value - Color value (hex format)
     * @param {string} mode - 'light' or 'dark' (optional, defaults to current theme)
     */
    setColor(variable, value, mode = null) {
        const targetMode = mode || this.getCurrentMode();
        if (this.data[targetMode]) {
            this.data[targetMode][variable] = value;
        }
    }

    /**
     * Get current theme mode from document
     * @returns {string} 'light' or 'dark'
     */
    getCurrentMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    /**
     * Apply current theme colors to CSS variables
     */
    applyTheme() {
        const mode = this.getCurrentMode();
        const colors = this.data[mode];
        const root = document.documentElement;

        // Apply all colors to CSS variables
        Object.entries(colors).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
        });

        // Update Blockly theme if workspace exists
        this.updateBlocklyTheme();

        console.log(`Color theme applied for ${mode} mode`);
    }

    /**
     * Apply colors temporarily for preview (doesn't save)
     * @param {Object} colors - Colors object to apply
     * @param {string} mode - 'light' or 'dark'
     */
    applyPreview(colors, mode) {
        const currentMode = this.getCurrentMode();

        // Only apply preview if we're viewing the same mode
        if (currentMode === mode) {
            const root = document.documentElement;
            Object.entries(colors).forEach(([variable, value]) => {
                root.style.setProperty(variable, value);
            });
            this.updateBlocklyTheme();
        }
    }

    /**
     * Reset colors to defaults for specified mode
     * @param {string} mode - 'light' or 'dark' (optional, resets both if not specified)
     */
    resetToDefaults(mode = null) {
        if (mode) {
            this.data[mode] = { ...DEFAULT_COLORS[mode] };
        } else {
            this.data.light = { ...DEFAULT_COLORS.light };
            this.data.dark = { ...DEFAULT_COLORS.dark };
        }
        this.saveData();
        this.applyTheme();

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('colorthemechange', {
            detail: { action: 'reset', mode }
        }));
    }

    /**
     * Update Blockly workspace theme with custom colors
     */
    updateBlocklyTheme() {
        if (!window.workspace) return;

        const mode = this.getCurrentMode();
        const colors = this.data[mode];

        try {
            // Create custom theme with current colors
            const theme = Blockly.Theme.defineTheme('custom-' + mode + '-' + Date.now(), {
                'base': Blockly.Themes.Classic,
                'componentStyles': {
                    'workspaceBackgroundColour': colors['--blockly-workspace-bg'],
                    'toolboxBackgroundColour': colors['--blockly-toolbox-bg'],
                    'toolboxForegroundColour': mode === 'dark' ? '#e0e0e0' : '#333333',
                    'flyoutBackgroundColour': colors['--blockly-flyout-bg'],
                    'flyoutForegroundColour': mode === 'dark' ? '#e0e0e0' : '#333333',
                    'flyoutOpacity': 1,
                    'scrollbarColour': mode === 'dark' ? '#404060' : '#888888',
                    'scrollbarOpacity': 0.8,
                    'insertionMarkerColour': '#fff',
                    'insertionMarkerOpacity': 0.3,
                    'cursorColour': mode === 'dark' ? '#d0d0d0' : '#333333'
                },
                'fontStyle': {
                    'family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    'weight': 'normal',
                    'size': 12
                }
            });

            window.workspace.setTheme(theme);
        } catch (error) {
            console.error('Failed to update Blockly theme:', error);
        }
    }

    /**
     * Initialize the manager and apply saved theme
     */
    init() {
        // Apply saved theme on initialization
        this.applyTheme();

        // Listen for theme mode changes (light/dark toggle)
        this.setupThemeChangeListener();

        console.log('ColorThemeManager initialized');
    }

    /**
     * Setup listener for system theme mode changes
     */
    setupThemeChangeListener() {
        // Create a MutationObserver to watch for data-theme attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.applyTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Show the color theme settings modal
     */
    showModal() {
        const modal = document.getElementById('colorThemeModal');
        if (modal) {
            // Initialize pending changes with current data
            this.pendingChanges = {
                light: { ...this.data.light },
                dark: { ...this.data.dark }
            };

            // Set edit mode to last selected or current theme mode
            this.currentEditMode = this.lastSelectedEditMode || this.getCurrentMode();

            // Update UI
            this.updateModalUI();

            modal.classList.add('modal-visible');
        }
    }

    /**
     * Hide the color theme settings modal
     * @param {boolean} revert - Whether to revert to saved colors (default: true)
     */
    hideModal(revert = true) {
        const modal = document.getElementById('colorThemeModal');
        if (modal) {
            modal.classList.remove('modal-visible');

            // Revert to saved colors if changes weren't applied
            if (revert) {
                this.applyTheme();
                // Reset tab selection on cancel
                this.lastSelectedEditMode = null;
            }
            this.pendingChanges = null;
        }
    }

    /**
     * Update modal UI with current values
     */
    updateModalUI() {
        // Update mode tabs
        const lightTab = document.getElementById('colorThemeTabLight');
        const darkTab = document.getElementById('colorThemeTabDark');

        if (lightTab && darkTab) {
            lightTab.classList.toggle('active', this.currentEditMode === 'light');
            darkTab.classList.toggle('active', this.currentEditMode === 'dark');
        }

        // Update color pickers
        const colors = this.pendingChanges[this.currentEditMode];
        Object.entries(colors).forEach(([variable, value]) => {
            const input = document.getElementById(`colorInput${variable.replace(/--/g, '').replace(/-/g, '_')}`);
            if (input) {
                input.value = value;
            }
        });
    }

    /**
     * Handle color input change
     * @param {string} variable - CSS variable name
     * @param {string} value - New color value
     */
    handleColorChange(variable, value) {
        if (!this.pendingChanges) return;

        this.pendingChanges[this.currentEditMode][variable] = value;

        // Apply preview immediately
        this.applyPreview(this.pendingChanges[this.currentEditMode], this.currentEditMode);
    }

    /**
     * Switch edit mode tab
     * @param {string} mode - 'light' or 'dark'
     */
    switchEditMode(mode) {
        this.currentEditMode = mode;
        this.lastSelectedEditMode = mode; // Remember user's selection
        this.updateModalUI();
    }

    /**
     * Apply pending changes and save
     */
    applyChanges() {
        if (!this.pendingChanges) return;

        this.data.light = { ...this.pendingChanges.light };
        this.data.dark = { ...this.pendingChanges.dark };
        this.saveData();

        // Switch system theme to match the currently selected edit mode
        this.switchSystemTheme(this.currentEditMode);

        // Apply the theme colors
        this.applyTheme();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('colorthemechange', {
            detail: { action: 'apply' }
        }));

        // Close without reverting (changes already applied)
        this.hideModal(false);
    }

    /**
     * Switch the system theme (light/dark mode)
     * @param {string} mode - 'light' or 'dark'
     */
    switchSystemTheme(mode) {
        const currentMode = this.getCurrentMode();
        if (currentMode === mode) return; // Already in the correct mode

        // Set the theme attribute
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('promps-theme', mode);

        // Update theme button icon
        if (typeof window.updateThemeButton === 'function') {
            window.updateThemeButton();
        }

        console.log('System theme switched to:', mode);
    }

    /**
     * Reset current mode to defaults in modal
     * Shows custom confirmation dialog
     */
    resetCurrentMode() {
        if (!this.pendingChanges) return;

        // Show custom confirmation dialog
        this.showResetConfirmDialog();
    }

    /**
     * Show custom reset confirmation dialog
     */
    showResetConfirmDialog() {
        const dialog = document.getElementById('colorThemeResetConfirmDialog');
        const messageEl = document.getElementById('colorThemeResetConfirmMessage');

        if (!dialog) return;

        // Update message with mode name
        const modeName = this.currentEditMode === 'light'
            ? colorThemeT('colorTheme.lightMode', 'Light Mode')
            : colorThemeT('colorTheme.darkMode', 'Dark Mode');
        const confirmTemplate = colorThemeT('colorTheme.resetConfirm', 'Reset {mode} colors to defaults?');
        const confirmMsg = confirmTemplate.replace('{mode}', modeName);

        if (messageEl) {
            messageEl.textContent = confirmMsg;
        }

        // Show dialog
        dialog.classList.add('visible');
    }

    /**
     * Hide reset confirmation dialog
     */
    hideResetConfirmDialog() {
        const dialog = document.getElementById('colorThemeResetConfirmDialog');
        if (dialog) {
            dialog.classList.remove('visible');
        }
    }

    /**
     * Execute the actual reset (called when user confirms)
     */
    executeReset() {
        if (!this.pendingChanges) return;

        // Reset both pendingChanges and actual data
        this.pendingChanges[this.currentEditMode] = { ...DEFAULT_COLORS[this.currentEditMode] };
        this.data[this.currentEditMode] = { ...DEFAULT_COLORS[this.currentEditMode] };

        // Save to localStorage
        this.saveData();

        // Update UI and apply theme
        this.updateModalUI();
        this.applyTheme();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('colorthemechange', {
            detail: { action: 'reset', mode: this.currentEditMode }
        }));

        // Hide the confirmation dialog
        this.hideResetConfirmDialog();
    }

    /**
     * Get all color variables with metadata
     * @returns {Array} Array of color variable info objects
     */
    getColorVariables() {
        return Object.entries(COLOR_METADATA).map(([variable, meta]) => ({
            variable,
            ...meta,
            lightDefault: DEFAULT_COLORS.light[variable],
            darkDefault: DEFAULT_COLORS.dark[variable]
        }));
    }

    /**
     * Get color variables by group
     * @param {string} group - Group name ('primary', 'blockly', 'accent')
     * @returns {Array} Array of color variable info objects
     */
    getColorsByGroup(group) {
        return this.getColorVariables().filter(c => c.group === group);
    }

    /**
     * Export current theme as JSON
     * @returns {string} JSON string
     */
    exportTheme() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Import theme from JSON
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} True if import successful
     */
    importTheme(jsonString) {
        try {
            const imported = JSON.parse(jsonString);

            // Validate structure
            if (!imported.light || !imported.dark) {
                throw new Error('Invalid theme structure');
            }

            // Merge with defaults to ensure all keys exist
            this.data = {
                version: imported.version || 1,
                light: { ...DEFAULT_COLORS.light, ...imported.light },
                dark: { ...DEFAULT_COLORS.dark, ...imported.dark }
            };

            this.saveData();
            this.applyTheme();

            window.dispatchEvent(new CustomEvent('colorthemechange', {
                detail: { action: 'import' }
            }));

            return true;
        } catch (error) {
            console.error('Failed to import theme:', error);
            return false;
        }
    }
}

// Create singleton instance
window.colorThemeManager = new ColorThemeManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColorThemeManager, DEFAULT_COLORS, COLOR_METADATA };
}
