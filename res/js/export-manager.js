/**
 * Promps Pro - Export Manager
 *
 * Handles exporting prompts and projects in various formats.
 * Ent feature for enhanced export capabilities.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function et(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

// Initialize exportManager namespace
window.exportManager = window.exportManager || {};

/**
 * Export Manager class
 */
class ExportManager {
    constructor() {
        this.modal = null;
        this.currentExportType = 'prompt'; // 'prompt' or 'project'
        this.currentFormat = 'txt'; // 'txt', 'md', 'json'
    }

    /**
     * Initialize the export manager
     */
    async init() {
        this.modal = document.getElementById('exportModal');
        if (!this.modal) {
            console.warn('Export modal not found');
            return;
        }

        this.bindEvents();
        console.log('Export Manager initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('btnCloseExportModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('btnCancelExport');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Export button
        const exportBtn = document.getElementById('btnConfirmExport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.executeExport());
        }

        // Export type radio buttons
        document.querySelectorAll('input[name="exportType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentExportType = e.target.value;
                this.updateFormatOptions();
                this.updatePreview();
            });
        });

        // Export format radio buttons
        document.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentFormat = e.target.value;
                this.updatePreview();
            });
        });

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    /**
     * Show export modal
     */
    showModal() {
        if (this.modal) {
            // Reset to default selection
            this.currentExportType = 'prompt';
            this.currentFormat = 'txt';

            // Reset radio buttons
            const promptRadio = document.getElementById('exportTypePrompt');
            const txtRadio = document.getElementById('exportFormatTxt');
            if (promptRadio) promptRadio.checked = true;
            if (txtRadio) txtRadio.checked = true;

            this.updateFormatOptions();
            this.updatePreview();

            this.modal.classList.add('modal-visible');
        }
    }

    /**
     * Hide export modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('modal-visible');
        }
    }

    /**
     * Update format options based on export type
     */
    updateFormatOptions() {
        const txtOption = document.getElementById('formatOptionTxt');
        const mdOption = document.getElementById('formatOptionMd');
        const jsonOption = document.getElementById('formatOptionJson');

        if (this.currentExportType === 'project') {
            // Project export only supports JSON
            if (txtOption) txtOption.style.display = 'none';
            if (mdOption) mdOption.style.display = 'none';
            if (jsonOption) jsonOption.style.display = 'block';

            // Force JSON selection
            this.currentFormat = 'json';
            const jsonRadio = document.getElementById('exportFormatJson');
            if (jsonRadio) jsonRadio.checked = true;
        } else {
            // Prompt export supports all formats
            if (txtOption) txtOption.style.display = 'block';
            if (mdOption) mdOption.style.display = 'block';
            if (jsonOption) jsonOption.style.display = 'block';
        }
    }

    /**
     * Update preview based on current selection
     */
    updatePreview() {
        const previewArea = document.getElementById('exportPreviewContent');
        if (!previewArea) return;

        const promptContent = this.getCurrentPrompt();

        if (!promptContent) {
            previewArea.textContent = et('export.noContent', 'No prompt to export. Create a prompt first.');
            return;
        }

        let preview = '';

        if (this.currentExportType === 'prompt') {
            switch (this.currentFormat) {
                case 'txt':
                    preview = promptContent;
                    break;
                case 'md':
                    preview = this.generateMarkdown(promptContent);
                    break;
                case 'json':
                    preview = this.generatePromptJson(promptContent);
                    break;
            }
        } else {
            // Project export
            preview = this.generateProjectJsonPreview(promptContent);
        }

        previewArea.textContent = preview;
    }

    /**
     * Get current prompt content
     * @returns {string} Current prompt content
     */
    getCurrentPrompt() {
        const previewDiv = document.getElementById('promptPreview');
        if (!previewDiv) return '';

        // Check if it's a placeholder
        const placeholder = previewDiv.querySelector('.placeholder');
        if (placeholder) return '';

        return previewDiv.textContent || '';
    }

    /**
     * Generate markdown format
     * @param {string} content - Prompt content
     * @returns {string} Markdown formatted content
     */
    generateMarkdown(content) {
        return `# Generated Prompt\n\n${content}\n`;
    }

    /**
     * Generate JSON format for prompt
     * @param {string} content - Prompt content
     * @returns {string} JSON formatted content
     */
    generatePromptJson(content) {
        const data = {
            type: 'prompt',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            content: content
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generate JSON preview for project export
     * @param {string} promptContent - Prompt content
     * @returns {string} JSON preview
     */
    generateProjectJsonPreview(promptContent) {
        const project = window.projectManager?.getCurrentProject() || {
            metadata: { name: 'Untitled' }
        };

        const preview = {
            type: 'project_export',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            project: {
                metadata: project.metadata,
                workspace: '... (workspace data)',
                settings: '... (settings data)'
            },
            generatedPrompt: promptContent
        };

        return JSON.stringify(preview, null, 2);
    }

    /**
     * Generate default file name
     * @returns {string} Default file name
     */
    generateDefaultFileName() {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '-')
            .slice(0, 19);

        if (this.currentExportType === 'project') {
            const projectName = window.projectManager?.getCurrentProject()?.metadata?.name || 'project';
            return `${projectName}-export`;
        } else {
            return `prompt-${timestamp}`;
        }
    }

    /**
     * Execute the export
     */
    async executeExport() {
        const promptContent = this.getCurrentPrompt();

        if (!promptContent && this.currentExportType === 'prompt') {
            alert(et('export.noContent', 'No prompt to export. Create a prompt first.'));
            return;
        }

        const defaultName = this.generateDefaultFileName();

        try {
            // Show save dialog
            const filePath = await invoke('show_export_dialog', {
                defaultName,
                format: this.currentFormat
            });

            if (!filePath) {
                console.log('Export cancelled');
                return;
            }

            let result;

            if (this.currentExportType === 'prompt') {
                // Export prompt
                result = await invoke('export_prompt', {
                    path: filePath,
                    content: promptContent,
                    format: this.currentFormat
                });
            } else {
                // Export project
                const project = window.projectManager?.getCurrentProject();
                if (!project) {
                    alert(et('export.noProject', 'No project to export.'));
                    return;
                }

                // Update workspace state before export
                project.workspace = window.projectManager.getWorkspaceState();
                project.metadata.modifiedAt = new Date().toISOString();

                result = await invoke('export_project', {
                    path: filePath,
                    project: project,
                    prompt: promptContent
                });
            }

            if (result.success) {
                this.hideModal();
                // Optional: show success message
                console.log('Export successful:', result.path);
            } else {
                alert(et('export.failed', 'Export failed') + ': ' + result.message);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert(et('export.failed', 'Export failed') + ': ' + error);
        }
    }
}

// Create and export instance
const exportManagerInstance = new ExportManager();

window.exportManager.init = () => exportManagerInstance.init();
window.exportManager.showModal = () => exportManagerInstance.showModal();
window.exportManager.hideModal = () => exportManagerInstance.hideModal();
window.exportManager.generateMarkdown = (content) => exportManagerInstance.generateMarkdown(content);
window.exportManager.generatePromptJson = (content) => exportManagerInstance.generatePromptJson(content);
window.exportManager.getCurrentPrompt = () => exportManagerInstance.getCurrentPrompt();

console.log('Export Manager module loaded');
