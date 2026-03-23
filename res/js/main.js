/**
 * Promps - Main JavaScript
 *
 * This file handles frontend logic and Tauri command invocation.
 * Includes i18n (internationalization) support and dark mode.
 */

// Tauri API will be available after window loads
let invoke;

// All features are always available
window.isEntLicensed = true;
window.isProLicensed = true;

/* ============================================================================
   Theme Management
   ============================================================================ */

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('promps-theme');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateThemeButton();
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('promps-theme', newTheme);
    updateThemeButton();

    // Sync ColorThemeManager's inline CSS variables before Blockly reads them
    // (inline vars on <html> override stylesheet [data-theme] vars)
    if (window.colorThemeManager && typeof window.colorThemeManager.applyTheme === 'function') {
        window.colorThemeManager.applyTheme();
    }

    // Update Blockly theme
    if (typeof updateBlocklyTheme === 'function') {
        updateBlocklyTheme();
    }

    console.log('Theme switched to:', newTheme);
}

/**
 * Update theme button icon based on current theme
 */
function updateThemeButton() {
    const btn = document.getElementById('btnTheme');
    if (!btn) return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const icon = btn.querySelector('.toolbar-icon');

    if (icon) {
        // Show current theme icon: moon for dark mode, sun for light mode
        icon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    }

    // Update tooltip to show target mode
    const titleKey = currentTheme === 'dark'
        ? 'toolbar.theme.title.toLight'
        : 'toolbar.theme.title.toDark';
    btn.title = typeof t === 'function' ? t(titleKey) : btn.title;
}
// Expose to global scope for color-theme-manager
window.updateThemeButton = updateThemeButton;

/**
 * Generate prompt from DSL text
 */
async function generatePrompt(input) {
    try {
        const result = await invoke('generate_prompt_from_text', { input });
        console.log('Generated prompt:', result);
        return result;
    } catch (error) {
        console.error('Failed to generate prompt:', error);
        throw error;
    }
}

/**
 * Validate DSL sequence for grammar errors
 */
async function validateDsl(input) {
    try {
        // Get current locale for language-specific validation
        const locale = window.i18n ? window.i18n.getLocale() : 'ja';
        const result = await invoke('validate_dsl_sequence', { input, locale });
        console.log('Validation result:', result);
        return result;
    } catch (error) {
        console.error('Failed to validate DSL:', error);
        throw error;
    }
}

/**
 * Update preview pane with generated prompt
 */
async function updatePreview(dslCode) {
    const previewDiv = document.getElementById('promptPreview');

    if (!dslCode || dslCode.trim() === '') {
        const placeholderText = window.t ? window.t('preview.placeholder') : 'Generated prompt will appear here.';
        previewDiv.innerHTML = `<p class="placeholder" data-i18n="preview.placeholder">${placeholderText}</p>`;
        // Clear validation display
        if (window.validationUI) {
            window.validationUI.clear();
        }
        // Disable AI send button
        if (window.aiSendManager) {
            window.aiSendManager.updateSendButton();
        }
        if (window.aiCompareManager) {
            window.aiCompareManager.updateCompareButton();
        }
        return;
    }

    try {
        // Generate prompt from DSL code
        const prompt = await generatePrompt(dslCode);

        // Update preview
        previewDiv.textContent = prompt;

        // Validate DSL sequence
        const validationResult = await validateDsl(dslCode);

        // Display validation result
        if (window.validationUI) {
            window.validationUI.displayResult(validationResult);

            // Build block positions and highlight errors
            const blockPositions = window.validationUI.buildBlockPositions();
            window.validationUI.highlightBlocks(validationResult, blockPositions);
        }

        // Analyze patterns and show suggestions (Phase 6 Step 3)
        if (window.patternUI) {
            await window.patternUI.analyzeCurrent(dslCode);
        }

        // Update AI send button state (Pro)
        if (window.aiSendManager) {
            window.aiSendManager.updateSendButton();
        }
        if (window.aiCompareManager) {
            window.aiCompareManager.updateCompareButton();
        }
    } catch (error) {
        previewDiv.innerHTML = `<p style="color: var(--accent-error);">Error: ${error}</p>`;
    }
}

/**
 * Undo last action in Blockly workspace
 */
function undoAction() {
    if (workspace && workspace.getUndoStack().length > 0) {
        workspace.undo(false);
        updateUndoRedoButtons();
    }
}

/**
 * Redo last undone action in Blockly workspace
 */
function redoAction() {
    if (workspace && workspace.getRedoStack().length > 0) {
        workspace.undo(true);
        updateUndoRedoButtons();
    }
}

/**
 * Update Undo/Redo button states based on stack availability
 */
function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');

    if (btnUndo && workspace) {
        btnUndo.disabled = workspace.getUndoStack().length === 0;
    }
    if (btnRedo && workspace) {
        btnRedo.disabled = workspace.getRedoStack().length === 0;
    }
}

/**
 * Disable Blockly's native keyboard shortcuts for Undo/Redo
 * This ensures consistent behavior between keyboard and button
 */
function disableBlocklyUndoShortcuts() {
    if (typeof Blockly !== 'undefined' && Blockly.ShortcutRegistry) {
        const registry = Blockly.ShortcutRegistry.registry;

        // Unregister Blockly's default undo/redo shortcuts
        try {
            registry.unregister('undo');
            console.log('Disabled Blockly native undo shortcut');
        } catch (e) {
            console.log('Blockly undo shortcut not found or already disabled');
        }

        try {
            registry.unregister('redo');
            console.log('Disabled Blockly native redo shortcut');
        } catch (e) {
            console.log('Blockly redo shortcut not found or already disabled');
        }
    }
}

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
        // Ctrl+Z: Undo
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undoAction();
        }

        // Ctrl+Y or Ctrl+Shift+Z: Redo
        if ((e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'y') ||
            (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
            e.preventDefault();
            redoAction();
        }

        // Ctrl+N: New Project
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            if (window.projectManager) {
                await window.projectManager.newProject();
            }
        }

        // Ctrl+O: Open Project
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            if (window.projectManager) {
                await window.projectManager.loadProject();
            }
        }

        // Ctrl+S: Save Project
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (window.projectManager) {
                await window.projectManager.saveProject(false);
            }
        }

        // Ctrl+Shift+S: Save As
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (window.projectManager) {
                await window.projectManager.saveProject(true);
            }
        }

        // Ctrl+E: Export
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            if (window.exportManager) {
                window.exportManager.showModal();
            }
        }

        // Ctrl+P: Toggle Project Sidebar
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (window.projectSidebar) {
                window.projectSidebar.toggle();
            }
        }
    });

    console.log('Keyboard shortcuts initialized');
}

/**
 * Initialize toolbar button event listeners
 */
function initToolbarButtons() {
    // New button
    const btnNew = document.getElementById('btnNew');
    if (btnNew) {
        btnNew.addEventListener('click', async () => {
            if (window.projectManager) {
                await window.projectManager.newProject();
            }
        });
    }

    // Open button
    const btnOpen = document.getElementById('btnOpen');
    if (btnOpen) {
        btnOpen.addEventListener('click', async () => {
            if (window.projectManager) {
                await window.projectManager.loadProject();
            }
        });
    }

    // Save button
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            if (window.projectManager) {
                await window.projectManager.saveProject(false);
            }
        });
    }

    // Save As button
    const btnSaveAs = document.getElementById('btnSaveAs');
    if (btnSaveAs) {
        btnSaveAs.addEventListener('click', async () => {
            if (window.projectManager) {
                await window.projectManager.saveProject(true);
            }
        });
    }

    // Undo button
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            undoAction();
        });
    }

    // Redo button
    const btnRedo = document.getElementById('btnRedo');
    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            redoAction();
        });
    }

    // Theme toggle button
    const btnTheme = document.getElementById('btnTheme');
    if (btnTheme) {
        btnTheme.addEventListener('click', toggleTheme);
    }

    // Settings button (API Key Management)
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', async () => {
            if (window.apiKeyManager) {
                await window.apiKeyManager.showModal();
            }
        });
    }

    // Export button
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (window.exportManager) {
                window.exportManager.showModal();
            }
        });
    }

    // Block favorites button
    const btnBlockFavorites = document.getElementById('btnBlockFavorites');
    if (btnBlockFavorites) {
        btnBlockFavorites.addEventListener('click', () => {
            if (window.floatingPaletteInstance) {
                window.floatingPaletteInstance.toggle();
            }
        });
    }

    // Color Theme button (Ent Feature)
    const btnColorTheme = document.getElementById('btnColorTheme');
    if (btnColorTheme) {
        btnColorTheme.addEventListener('click', () => {
            if (window.colorThemeManager) {
                window.colorThemeManager.showModal();
            }
        });
    }

    // Wizard button (Ent Feature)
    const btnWizard = document.getElementById('btnWizard');
    if (btnWizard) {
        btnWizard.addEventListener('click', () => {
            if (window.wizardManager) {
                window.wizardManager.showModal();
            }
        });
    }

    // Language toggle button
    const btnLang = document.getElementById('btnLang');
    if (btnLang) {
        btnLang.addEventListener('click', () => {
            if (window.i18n && typeof window.i18n.toggleLocale === 'function') {
                window.i18n.toggleLocale();
            }
        });
    }

    console.log('Toolbar buttons initialized');
}

/**
 * Initialize locale change listener
 * Reinitializes Blockly when language changes
 */
function initLocaleChangeListener() {
    window.addEventListener('localechange', (event) => {
        console.log('Locale changed to:', event.detail.locale);

        // Reinitialize Blockly with new translations
        if (typeof reinitializeBlockly === 'function') {
            reinitializeBlockly();
        }

        // Clear pattern suggestions (since workspace is now empty)
        if (window.patternUI && typeof window.patternUI.clearSuggestions === 'function') {
            window.patternUI.clearSuggestions();
        }

        // Reload pattern templates with new language
        if (window.patternUI && typeof window.patternUI.loadPatterns === 'function') {
            window.patternUI.loadPatterns();
        }

        // Update theme button tooltip with new language
        updateThemeButton();

        // Reload wizard templates with new language (v2.1.0)
        if (window.wizardManager && typeof window.wizardManager.loadWizardTemplates === 'function') {
            window.wizardManager.loadWizardTemplates();
        }
    });

    console.log('Locale change listener initialized');
}

/**
 * Initialize global Escape key handler for modals
 * Closes the topmost visible modal on Escape key press,
 * but only when IME composition is not in progress.
 */
function initEscapeKeyHandler() {
    let isComposing = false;

    document.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    document.addEventListener('compositionend', () => {
        isComposing = false;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || isComposing) return;

        // Find the topmost visible modal (last in DOM order = highest z-index)
        const visibleModals = document.querySelectorAll('.modal-overlay.modal-visible');
        if (visibleModals.length === 0) return;

        e.preventDefault();

        const topModal = visibleModals[visibleModals.length - 1];
        const modalId = topModal.id;

        // Dispatch to the appropriate manager's hide method
        const handlers = {
            'wizardEditorModal': () => window.wizardEditor && window.wizardEditor.hideEditor(),
            'wizardModal': () => window.wizardManager && window.wizardManager.hideModal(),
            'colorThemeModal': () => window.colorThemeManager && window.colorThemeManager.hideModal(),
            'exportModal': () => window.exportManager && window.exportManager.hideModal(),
            'templateEditorModal': () => window.templateEditor && window.templateEditor.hideModal(),
            'categoryEditorModal': () => window.categoryEditor && window.categoryEditor.hideModal(),
            'qrShareModal': () => window.qrShareManager && window.qrShareManager.hideModal(),
            'lanShareModal': () => window.lanShareManager && window.lanShareManager.hideModal(),
            'aiCompareModal': () => {
                const modal = document.getElementById('aiCompareModal');
                if (modal) modal.classList.remove('modal-visible');
            },
            'licenseModal': () => {
                const modal = document.getElementById('licenseModal');
                if (modal) modal.classList.remove('modal-visible');
            },
            'tagEditorModal': () => {
                const modal = document.getElementById('tagEditorModal');
                if (modal) modal.classList.remove('modal-visible');
            },
            'templateNameModal': () => {
                const modal = document.getElementById('templateNameModal');
                if (modal) modal.classList.remove('modal-visible');
            },
        };

        const handler = handlers[modalId];
        if (handler) {
            handler();
        } else {
            // Fallback: just remove modal-visible
            topModal.classList.remove('modal-visible');
        }
    });

    console.log('Escape key handler initialized');
}

/**
 * Initialize Color Theme Modal event listeners
 */
function initColorThemeModal() {
    const manager = window.colorThemeManager;
    if (!manager) return;

    // Close button
    const btnClose = document.getElementById('btnCloseColorThemeModal');
    if (btnClose) {
        btnClose.addEventListener('click', () => manager.hideModal());
    }

    // Cancel button
    const btnCancel = document.getElementById('btnCancelColorTheme');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => manager.hideModal());
    }

    // Apply button
    const btnApply = document.getElementById('btnApplyColorTheme');
    if (btnApply) {
        btnApply.addEventListener('click', () => manager.applyChanges());
    }

    // Reset button
    const btnReset = document.getElementById('btnResetColorTheme');
    if (btnReset) {
        btnReset.addEventListener('click', () => manager.resetCurrentMode());
    }

    // Reset confirmation dialog buttons
    const btnResetConfirmOK = document.getElementById('btnResetConfirmOK');
    const btnResetConfirmCancel = document.getElementById('btnResetConfirmCancel');
    const resetConfirmDialog = document.getElementById('colorThemeResetConfirmDialog');

    if (btnResetConfirmOK) {
        btnResetConfirmOK.addEventListener('click', () => manager.executeReset());
    }
    if (btnResetConfirmCancel) {
        btnResetConfirmCancel.addEventListener('click', () => manager.hideResetConfirmDialog());
    }
    // Close dialog on backdrop click
    if (resetConfirmDialog) {
        resetConfirmDialog.addEventListener('click', (e) => {
            if (e.target === resetConfirmDialog) {
                manager.hideResetConfirmDialog();
            }
        });
    }

    // Mode tabs
    const tabLight = document.getElementById('colorThemeTabLight');
    const tabDark = document.getElementById('colorThemeTabDark');

    if (tabLight) {
        tabLight.addEventListener('click', () => manager.switchEditMode('light'));
    }
    if (tabDark) {
        tabDark.addEventListener('click', () => manager.switchEditMode('dark'));
    }

    // Color picker inputs
    const colorInputs = [
        { id: 'colorInputbg_primary', variable: '--bg-primary' },
        { id: 'colorInputbg_surface', variable: '--bg-surface' },
        { id: 'colorInputbg_header', variable: '--bg-header' },
        { id: 'colorInputtext_primary', variable: '--text-primary' },
        { id: 'colorInputaccent_primary', variable: '--accent-primary' },
        { id: 'colorInputblockly_workspace_bg', variable: '--blockly-workspace-bg' },
        { id: 'colorInputblockly_toolbox_bg', variable: '--blockly-toolbox-bg' },
        { id: 'colorInputblockly_flyout_bg', variable: '--blockly-flyout-bg' },
        { id: 'colorInputaccent_success', variable: '--accent-success' },
        { id: 'colorInputaccent_error', variable: '--accent-error' },
        { id: 'colorInputaccent_warning', variable: '--accent-warning' }
    ];

    colorInputs.forEach(({ id, variable }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                manager.handleColorChange(variable, value);

                // Update the value display
                const valueDisplay = document.getElementById(id.replace('colorInput', 'colorValue'));
                if (valueDisplay) {
                    valueDisplay.textContent = value.toUpperCase();
                }
            });
        }
    });

    // Close modal on backdrop click
    const modal = document.getElementById('colorThemeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                manager.hideModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('colorThemeModal');
            if (modal && modal.classList.contains('modal-visible')) {
                manager.hideModal();
            }
        }
    });

    console.log('Color Theme modal event listeners initialized');
}

/**
 * Handle beforeunload event (warn about unsaved changes)
 */
function initBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        if (window.projectManager && window.projectManager.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

/**
 * Initialize Undo/Redo change listener
 */
function initUndoRedoListener() {
    if (workspace) {
        workspace.addChangeListener((event) => {
            // Update button states on any workspace change
            if (!event.isUiEvent) {
                updateUndoRedoButtons();
            }
        });
        // Initial state update
        updateUndoRedoButtons();
        console.log('Undo/Redo listener initialized');
    }
}

/**
 * Initialize application
 */
async function init() {
    console.log('Promps Ent initialized');

    // Initialize theme (must be early to avoid flash of wrong theme)
    initTheme();

    // Initialize Tauri API (v2 compatible)
    if (window.__TAURI_INTERNALS__) {
        // Tauri v2
        invoke = window.__TAURI_INTERNALS__.invoke;
        console.log('Tauri API v2 loaded successfully');
    } else if (window.__TAURI__) {
        // Tauri v1 (fallback)
        invoke = window.__TAURI__.invoke;
        console.log('Tauri API v1 loaded successfully');
    } else {
        console.error('Tauri API not available');
        console.log('Available globals:', Object.keys(window).filter(k => k.includes('TAURI')));
        // Continue anyway to initialize Blockly
    }

    // Initialize Blockly.js workspace
    if (typeof initBlockly === 'function') {
        initBlockly();
        console.log('Blockly workspace initialized');

        // Disable Blockly's native undo/redo shortcuts (use our own handlers)
        disableBlocklyUndoShortcuts();

        // Initialize Undo/Redo listener after Blockly
        initUndoRedoListener();
    } else {
        console.error('initBlockly function not found');
    }

    // Initialize Project Manager
    if (window.projectManager && typeof window.projectManager.init === 'function') {
        await window.projectManager.init();
    }

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Initialize toolbar buttons
    initToolbarButtons();

    // Initialize locale change listener
    initLocaleChangeListener();

    // Initialize Escape key handler for modals
    initEscapeKeyHandler();

    // Initialize beforeunload handler
    initBeforeUnload();

    // Load pattern templates (Phase 6 Step 3)
    if (window.patternUI && typeof window.patternUI.loadPatterns === 'function') {
        await window.patternUI.loadPatterns();
        console.log('Pattern templates loaded');
    }

    // Initialize API Key Manager (Pro)
    if (window.apiKeyManager && typeof window.apiKeyManager.init === 'function') {
        await window.apiKeyManager.init();
    }

    // Initialize AI Send Manager (Pro)
    if (window.aiSendManager && typeof window.aiSendManager.init === 'function') {
        await window.aiSendManager.init();
    }

    // Initialize AI Compare Manager (Ent)
    if (window.aiCompareManager && typeof window.aiCompareManager.init === 'function') {
        try {
            await window.aiCompareManager.init();
        } catch (e) {
            console.error('AiCompareManager init failed:', e);
        }
    }

    // Initialize AI Import Manager (Ent)
    if (window.aiImportManager && typeof window.aiImportManager.init === 'function') {
        window.aiImportManager.init();
        console.log('AI Import manager initialized');
    }

// Initialize Export Manager (Pro)
    if (window.exportManager && typeof window.exportManager.init === 'function') {
        await window.exportManager.init();
        console.log('Export manager initialized');
    }

    // Initialize Project Sidebar (Pro)
    if (window.projectSidebar && typeof window.projectSidebar.init === 'function') {
        window.projectSidebar.init();
        console.log('Project sidebar initialized');
    }

    // Initialize Color Theme Manager (Ent)
    if (window.colorThemeManager && typeof window.colorThemeManager.init === 'function') {
        window.colorThemeManager.init();
        initColorThemeModal();
        console.log('Color Theme manager initialized');
    }

    // Initialize Template Editor (v1.2.0)
    if (window.templateEditor && typeof window.templateEditor.init === 'function') {
        window.templateEditor.init();
        console.log('Template editor initialized');
    }

    // Initialize Template Export Manager (v1.2.0)
    if (window.templateExportManager && typeof window.templateExportManager.init === 'function') {
        window.templateExportManager.init();
        console.log('Template export manager initialized');
    }

    // Initialize Category Editor (v1.2.0)
    if (window.categoryEditor && typeof window.categoryEditor.init === 'function') {
        window.categoryEditor.init();
        console.log('Category editor initialized');
    }

    // Initialize QR Share Manager (v2.0.0)
    if (window.qrShareManager && typeof window.qrShareManager.init === 'function') {
        await window.qrShareManager.init();
        console.log('QR Share manager initialized');
    }

    // Initialize LAN Share Manager (v2.0.0)
    if (window.lanShareManager && typeof window.lanShareManager.init === 'function') {
        await window.lanShareManager.init();
        console.log('LAN Share manager initialized');
    }

    // Initialize Wizard Manager (v2.1.0)
    if (window.wizardManager && typeof window.wizardManager.init === 'function') {
        await window.wizardManager.init();
        console.log('Wizard manager initialized');
    }

    // Initialize Wizard Editor (v2.1.0)
    if (window.wizardEditor && typeof window.wizardEditor.init === 'function') {
        window.wizardEditor.init();
        console.log('Wizard editor initialized');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
