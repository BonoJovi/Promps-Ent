/**
 * Promps Ent - Color Theme Tests
 *
 * Tests for color theme functionality:
 * - Load/save color data
 * - Get/set colors for light/dark modes
 * - Apply theme to CSS variables
 * - Reset to defaults
 * - Import/export themes
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// In-memory storage for testing
let memoryStorage = {};

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
 * Mock documentElement for testing
 */
const mockRoot = {
    style: {
        properties: {},
        setProperty(name, value) {
            this.properties[name] = value;
        },
        getPropertyValue(name) {
            return this.properties[name] || '';
        }
    },
    getAttribute() {
        return 'light';
    }
};

/**
 * ColorThemeManager class implementation for testing
 */
class ColorThemeManager {
    static STORAGE_KEY = 'promps-ent-color-theme';

    constructor() {
        this.data = this.loadData();
        this.pendingChanges = null;
        this.currentEditMode = 'light';
        this.lastSelectedEditMode = null; // Remember user's tab selection
        this._mockMode = 'light'; // For testing
    }

    loadData() {
        try {
            const stored = memoryStorage[ColorThemeManager.STORAGE_KEY];
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    version: parsed.version || 1,
                    light: { ...DEFAULT_COLORS.light, ...parsed.light },
                    dark: { ...DEFAULT_COLORS.dark, ...parsed.dark }
                };
            }
        } catch (error) {
            // Ignore
        }
        return {
            version: 1,
            light: { ...DEFAULT_COLORS.light },
            dark: { ...DEFAULT_COLORS.dark }
        };
    }

    saveData() {
        memoryStorage[ColorThemeManager.STORAGE_KEY] = JSON.stringify(this.data);
    }

    getColor(variable, mode = null) {
        const targetMode = mode || this.getCurrentMode();
        return this.data[targetMode][variable] || DEFAULT_COLORS[targetMode][variable];
    }

    setColor(variable, value, mode = null) {
        const targetMode = mode || this.getCurrentMode();
        if (this.data[targetMode]) {
            this.data[targetMode][variable] = value;
        }
    }

    getCurrentMode() {
        return this._mockMode;
    }

    setMockMode(mode) {
        this._mockMode = mode;
    }

    applyTheme(root = mockRoot) {
        const mode = this.getCurrentMode();
        const colors = this.data[mode];

        Object.entries(colors).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
        });
    }

    resetToDefaults(mode = null) {
        if (mode) {
            this.data[mode] = { ...DEFAULT_COLORS[mode] };
        } else {
            this.data.light = { ...DEFAULT_COLORS.light };
            this.data.dark = { ...DEFAULT_COLORS.dark };
        }
        this.saveData();
    }

    exportTheme() {
        return JSON.stringify(this.data, null, 2);
    }

    importTheme(jsonString) {
        try {
            const imported = JSON.parse(jsonString);

            if (!imported.light || !imported.dark) {
                throw new Error('Invalid theme structure');
            }

            this.data = {
                version: imported.version || 1,
                light: { ...DEFAULT_COLORS.light, ...imported.light },
                dark: { ...DEFAULT_COLORS.dark, ...imported.dark }
            };

            this.saveData();
            return true;
        } catch (error) {
            return false;
        }
    }

    getAllColors(mode) {
        return { ...this.data[mode] };
    }

    getColorCount() {
        return Object.keys(DEFAULT_COLORS.light).length;
    }

    /**
     * Switch edit mode tab (simulates user clicking tab)
     */
    switchEditMode(mode) {
        this.currentEditMode = mode;
        this.lastSelectedEditMode = mode;
    }

    /**
     * Simulate opening modal
     */
    simulateShowModal() {
        this.pendingChanges = {
            light: { ...this.data.light },
            dark: { ...this.data.dark }
        };
        // Use last selected or current mode
        this.currentEditMode = this.lastSelectedEditMode || this.getCurrentMode();
    }

    /**
     * Simulate closing modal
     * @param {boolean} revert - Whether changes were canceled
     */
    simulateHideModal(revert = true) {
        if (revert) {
            this.lastSelectedEditMode = null;
        }
        this.pendingChanges = null;
    }

    /**
     * Simulate applying changes
     */
    simulateApplyChanges() {
        if (!this.pendingChanges) return;
        this.data.light = { ...this.pendingChanges.light };
        this.data.dark = { ...this.pendingChanges.dark };
        this.saveData();
        // Close without reverting (changes applied)
        this.simulateHideModal(false);
    }

    /**
     * Simulate reset current mode (now saves immediately)
     */
    simulateResetCurrentMode() {
        if (!this.pendingChanges) return;

        // Reset both pendingChanges and actual data
        this.pendingChanges[this.currentEditMode] = { ...DEFAULT_COLORS[this.currentEditMode] };
        this.data[this.currentEditMode] = { ...DEFAULT_COLORS[this.currentEditMode] };

        // Save to localStorage
        this.saveData();
    }
}

beforeEach(() => {
    // Clear storage and reset mock root before each test
    memoryStorage = {};
    mockRoot.style.properties = {};
});

// ============================================================================
// Color Theme Manager Tests
// ============================================================================

describe('ColorThemeManager', () => {
    describe('constructor', () => {
        test('initializes with default colors for both modes', () => {
            const manager = new ColorThemeManager();

            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');
            expect(manager.data.dark['--bg-primary']).toBe('#1a1a2e');
        });

        test('loads existing data from storage', () => {
            memoryStorage['promps-ent-color-theme'] = JSON.stringify({
                version: 1,
                light: { '--bg-primary': '#ff0000' },
                dark: { '--bg-primary': '#00ff00' }
            });

            const manager = new ColorThemeManager();

            expect(manager.data.light['--bg-primary']).toBe('#ff0000');
            expect(manager.data.dark['--bg-primary']).toBe('#00ff00');
        });

        test('merges saved data with defaults', () => {
            memoryStorage['promps-ent-color-theme'] = JSON.stringify({
                version: 1,
                light: { '--bg-primary': '#ff0000' },
                dark: {}
            });

            const manager = new ColorThemeManager();

            // Custom color is preserved
            expect(manager.data.light['--bg-primary']).toBe('#ff0000');
            // Missing colors get defaults
            expect(manager.data.light['--bg-surface']).toBe('#ffffff');
            expect(manager.data.dark['--bg-primary']).toBe('#1a1a2e');
        });
    });

    describe('getColor', () => {
        test('returns color for current mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            expect(manager.getColor('--bg-primary')).toBe('#f5f5f5');

            manager.setMockMode('dark');
            expect(manager.getColor('--bg-primary')).toBe('#1a1a2e');
        });

        test('returns color for specified mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            expect(manager.getColor('--bg-primary', 'dark')).toBe('#1a1a2e');
            expect(manager.getColor('--bg-primary', 'light')).toBe('#f5f5f5');
        });

        test('returns default if color not set', () => {
            const manager = new ColorThemeManager();
            delete manager.data.light['--bg-primary'];

            expect(manager.getColor('--bg-primary', 'light')).toBe('#f5f5f5');
        });
    });

    describe('setColor', () => {
        test('sets color for current mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            manager.setColor('--bg-primary', '#ff0000');

            expect(manager.data.light['--bg-primary']).toBe('#ff0000');
        });

        test('sets color for specified mode', () => {
            const manager = new ColorThemeManager();

            manager.setColor('--bg-primary', '#ff0000', 'dark');

            expect(manager.data.dark['--bg-primary']).toBe('#ff0000');
            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5'); // unchanged
        });
    });

    describe('applyTheme', () => {
        test('applies all colors to CSS variables', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            manager.applyTheme(mockRoot);

            expect(mockRoot.style.properties['--bg-primary']).toBe('#f5f5f5');
            expect(mockRoot.style.properties['--bg-surface']).toBe('#ffffff');
            expect(mockRoot.style.properties['--accent-primary']).toBe('#2874a6');
        });

        test('applies dark mode colors when in dark mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('dark');

            manager.applyTheme(mockRoot);

            expect(mockRoot.style.properties['--bg-primary']).toBe('#1a1a2e');
            expect(mockRoot.style.properties['--bg-surface']).toBe('#16213e');
        });

        test('applies custom colors', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');
            manager.setColor('--bg-primary', '#custom1');
            manager.setColor('--accent-primary', '#custom2');

            manager.applyTheme(mockRoot);

            expect(mockRoot.style.properties['--bg-primary']).toBe('#custom1');
            expect(mockRoot.style.properties['--accent-primary']).toBe('#custom2');
        });
    });

    describe('resetToDefaults', () => {
        test('resets specific mode to defaults', () => {
            const manager = new ColorThemeManager();
            manager.setColor('--bg-primary', '#custom', 'light');
            manager.setColor('--bg-primary', '#custom2', 'dark');

            manager.resetToDefaults('light');

            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');
            expect(manager.data.dark['--bg-primary']).toBe('#custom2'); // unchanged
        });

        test('resets both modes when no mode specified', () => {
            const manager = new ColorThemeManager();
            manager.setColor('--bg-primary', '#custom', 'light');
            manager.setColor('--bg-primary', '#custom2', 'dark');

            manager.resetToDefaults();

            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');
            expect(manager.data.dark['--bg-primary']).toBe('#1a1a2e');
        });

        test('persists reset to storage', () => {
            const manager = new ColorThemeManager();
            manager.setColor('--bg-primary', '#custom', 'light');
            manager.saveData();
            manager.resetToDefaults('light');

            const manager2 = new ColorThemeManager();
            expect(manager2.data.light['--bg-primary']).toBe('#f5f5f5');
        });
    });

    describe('persistence', () => {
        test('saveData persists to storage', () => {
            const manager = new ColorThemeManager();
            manager.setColor('--bg-primary', '#persisted', 'light');
            manager.saveData();

            const stored = JSON.parse(memoryStorage['promps-ent-color-theme']);
            expect(stored.light['--bg-primary']).toBe('#persisted');
        });

        test('loadData recovers persisted data', () => {
            const manager1 = new ColorThemeManager();
            manager1.setColor('--bg-primary', '#persisted', 'light');
            manager1.saveData();

            const manager2 = new ColorThemeManager();
            expect(manager2.data.light['--bg-primary']).toBe('#persisted');
        });
    });

    describe('exportTheme', () => {
        test('exports theme as JSON string', () => {
            const manager = new ColorThemeManager();
            manager.setColor('--bg-primary', '#exported', 'light');

            const exported = manager.exportTheme();
            const parsed = JSON.parse(exported);

            expect(parsed.light['--bg-primary']).toBe('#exported');
            expect(parsed.dark['--bg-primary']).toBe('#1a1a2e');
        });

        test('exported JSON is valid and re-importable', () => {
            const manager1 = new ColorThemeManager();
            manager1.setColor('--bg-primary', '#roundtrip', 'light');
            const exported = manager1.exportTheme();

            const manager2 = new ColorThemeManager();
            const result = manager2.importTheme(exported);

            expect(result).toBe(true);
            expect(manager2.data.light['--bg-primary']).toBe('#roundtrip');
        });
    });

    describe('importTheme', () => {
        test('imports valid theme JSON', () => {
            const manager = new ColorThemeManager();
            const json = JSON.stringify({
                version: 1,
                light: { '--bg-primary': '#imported' },
                dark: { '--bg-primary': '#imported-dark' }
            });

            const result = manager.importTheme(json);

            expect(result).toBe(true);
            expect(manager.data.light['--bg-primary']).toBe('#imported');
            expect(manager.data.dark['--bg-primary']).toBe('#imported-dark');
        });

        test('returns false for invalid JSON', () => {
            const manager = new ColorThemeManager();

            const result = manager.importTheme('invalid json');

            expect(result).toBe(false);
        });

        test('returns false for missing required fields', () => {
            const manager = new ColorThemeManager();
            const json = JSON.stringify({ light: {} }); // missing dark

            const result = manager.importTheme(json);

            expect(result).toBe(false);
        });

        test('merges imported with defaults', () => {
            const manager = new ColorThemeManager();
            const json = JSON.stringify({
                version: 1,
                light: { '--bg-primary': '#partial' },
                dark: {}
            });

            manager.importTheme(json);

            expect(manager.data.light['--bg-primary']).toBe('#partial');
            expect(manager.data.light['--bg-surface']).toBe('#ffffff'); // default
            expect(manager.data.dark['--bg-primary']).toBe('#1a1a2e'); // default
        });

        test('persists imported theme to storage', () => {
            const manager = new ColorThemeManager();
            const json = JSON.stringify({
                version: 1,
                light: { '--bg-primary': '#persisted-import' },
                dark: {}
            });

            manager.importTheme(json);

            const manager2 = new ColorThemeManager();
            expect(manager2.data.light['--bg-primary']).toBe('#persisted-import');
        });
    });

    describe('getAllColors', () => {
        test('returns all colors for specified mode', () => {
            const manager = new ColorThemeManager();

            const lightColors = manager.getAllColors('light');
            const darkColors = manager.getAllColors('dark');

            expect(lightColors['--bg-primary']).toBe('#f5f5f5');
            expect(darkColors['--bg-primary']).toBe('#1a1a2e');
        });

        test('returns a copy not a reference', () => {
            const manager = new ColorThemeManager();

            const colors = manager.getAllColors('light');
            colors['--bg-primary'] = '#modified';

            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');
        });
    });

    describe('getColorCount', () => {
        test('returns correct number of color variables', () => {
            const manager = new ColorThemeManager();

            expect(manager.getColorCount()).toBe(11);
        });
    });

    describe('default colors', () => {
        test('light mode has correct defaults', () => {
            expect(DEFAULT_COLORS.light['--bg-primary']).toBe('#f5f5f5');
            expect(DEFAULT_COLORS.light['--bg-surface']).toBe('#ffffff');
            expect(DEFAULT_COLORS.light['--bg-header']).toBe('#2c3e50');
            expect(DEFAULT_COLORS.light['--text-primary']).toBe('#333333');
            expect(DEFAULT_COLORS.light['--accent-primary']).toBe('#2874a6');
            expect(DEFAULT_COLORS.light['--blockly-workspace-bg']).toBe('#ffffff');
            expect(DEFAULT_COLORS.light['--blockly-toolbox-bg']).toBe('#f8f9fa');
            expect(DEFAULT_COLORS.light['--blockly-flyout-bg']).toBe('#f5f5f5');
            expect(DEFAULT_COLORS.light['--accent-success']).toBe('#28a745');
            expect(DEFAULT_COLORS.light['--accent-error']).toBe('#dc3545');
            expect(DEFAULT_COLORS.light['--accent-warning']).toBe('#ffc107');
        });

        test('dark mode has correct defaults', () => {
            expect(DEFAULT_COLORS.dark['--bg-primary']).toBe('#1a1a2e');
            expect(DEFAULT_COLORS.dark['--bg-surface']).toBe('#16213e');
            expect(DEFAULT_COLORS.dark['--bg-header']).toBe('#0f0f23');
            expect(DEFAULT_COLORS.dark['--text-primary']).toBe('#e0e0e0');
            expect(DEFAULT_COLORS.dark['--accent-primary']).toBe('#5dade2');
            expect(DEFAULT_COLORS.dark['--blockly-workspace-bg']).toBe('#1a1a2e');
            expect(DEFAULT_COLORS.dark['--blockly-toolbox-bg']).toBe('#16213e');
            expect(DEFAULT_COLORS.dark['--blockly-flyout-bg']).toBe('#0f0f1a');
            expect(DEFAULT_COLORS.dark['--accent-success']).toBe('#58d68d');
            expect(DEFAULT_COLORS.dark['--accent-error']).toBe('#ec7063');
            expect(DEFAULT_COLORS.dark['--accent-warning']).toBe('#f7dc6f');
        });
    });

    describe('tab selection memory', () => {
        test('remembers tab selection after apply', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light'); // System is in light mode

            // Open modal - should start on light tab (matching system)
            manager.simulateShowModal();
            expect(manager.currentEditMode).toBe('light');

            // Switch to dark tab
            manager.switchEditMode('dark');
            expect(manager.currentEditMode).toBe('dark');
            expect(manager.lastSelectedEditMode).toBe('dark');

            // Apply changes (modal closes)
            manager.simulateApplyChanges();

            // Reopen modal - should be on dark tab (remembered)
            manager.simulateShowModal();
            expect(manager.currentEditMode).toBe('dark');
        });

        test('resets tab selection on cancel', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light'); // System is in light mode

            // Open modal
            manager.simulateShowModal();
            expect(manager.currentEditMode).toBe('light');

            // Switch to dark tab
            manager.switchEditMode('dark');
            expect(manager.currentEditMode).toBe('dark');

            // Cancel (revert = true)
            manager.simulateHideModal(true);

            // Reopen modal - should be on light tab (reset to system mode)
            manager.simulateShowModal();
            expect(manager.currentEditMode).toBe('light');
        });

        test('defaults to system mode on first open', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('dark'); // System is in dark mode

            // Open modal for the first time
            manager.simulateShowModal();

            // Should match system mode since no previous selection
            expect(manager.currentEditMode).toBe('dark');
        });

        test('switchEditMode updates both currentEditMode and lastSelectedEditMode', () => {
            const manager = new ColorThemeManager();

            manager.switchEditMode('dark');

            expect(manager.currentEditMode).toBe('dark');
            expect(manager.lastSelectedEditMode).toBe('dark');

            manager.switchEditMode('light');

            expect(manager.currentEditMode).toBe('light');
            expect(manager.lastSelectedEditMode).toBe('light');
        });
    });

    describe('reset to defaults (immediate save)', () => {
        test('reset saves defaults to data and storage immediately', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            // Set custom color
            manager.setColor('--bg-primary', '#custom', 'light');
            manager.saveData();

            // Open modal
            manager.simulateShowModal();
            expect(manager.pendingChanges.light['--bg-primary']).toBe('#custom');

            // Reset current mode
            manager.simulateResetCurrentMode();

            // Both pendingChanges and data should be defaults
            expect(manager.pendingChanges.light['--bg-primary']).toBe('#f5f5f5');
            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');

            // Should be persisted to storage
            const manager2 = new ColorThemeManager();
            expect(manager2.data.light['--bg-primary']).toBe('#f5f5f5');
        });

        test('reset only affects current mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('light');

            // Set custom colors for both modes
            manager.setColor('--bg-primary', '#custom-light', 'light');
            manager.setColor('--bg-primary', '#custom-dark', 'dark');
            manager.saveData();

            // Open modal in light mode
            manager.simulateShowModal();
            expect(manager.currentEditMode).toBe('light');

            // Reset current mode (light)
            manager.simulateResetCurrentMode();

            // Light should be reset
            expect(manager.data.light['--bg-primary']).toBe('#f5f5f5');
            // Dark should be unchanged
            expect(manager.data.dark['--bg-primary']).toBe('#custom-dark');
        });

        test('reset in dark mode only affects dark mode', () => {
            const manager = new ColorThemeManager();
            manager.setMockMode('dark');

            // Set custom colors for both modes
            manager.setColor('--bg-primary', '#custom-light', 'light');
            manager.setColor('--bg-primary', '#custom-dark', 'dark');
            manager.saveData();

            // Open modal in dark mode
            manager.simulateShowModal();
            manager.switchEditMode('dark');

            // Reset current mode (dark)
            manager.simulateResetCurrentMode();

            // Dark should be reset
            expect(manager.data.dark['--bg-primary']).toBe('#1a1a2e');
            // Light should be unchanged
            expect(manager.data.light['--bg-primary']).toBe('#custom-light');
        });
    });
});
