/**
 * Promps v1.2.0 - Template Export/Import Manager
 *
 * Handles exporting and importing templates as .promps-template files.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function text(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Template Export Manager class
 */
class TemplateExportManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the template export manager
     */
    init() {
        if (this.initialized) return;

        // Add context menu items for export/import
        this.registerContextMenuItems();

        this.initialized = true;
        console.log('Template Export Manager initialized');
    }

    /**
     * Register context menu items for template export/import
     */
    registerContextMenuItems() {
        // This will be called from the template manager button callbacks
        // We'll register the callbacks when the toolbox is refreshed
    }

    /**
     * Export a template to a file
     * @param {string} templateId - Template ID to export
     */
    async exportTemplate(templateId) {
        const template = window.templateManager?.getTemplateById(templateId);
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }

        // Generate export data
        const exportData = window.templateManager.exportTemplate(templateId);
        if (!exportData) {
            console.error('Failed to generate export data');
            return;
        }

        try {
            // Show save dialog
            const defaultName = this.sanitizeFileName(template.name);
            const filePath = await invoke('show_template_export_dialog', { defaultName });

            if (!filePath) {
                console.log('Export cancelled');
                return;
            }

            // Export to file
            const result = await invoke('export_template', {
                path: filePath,
                template: exportData
            });

            if (result.success) {
                console.log('Template exported successfully:', result.path);
                // Optionally show success notification
                if (window.validationUI && typeof window.validationUI.showSuccess === 'function') {
                    window.validationUI.showSuccess(text('template.export.success', 'Template exported successfully'));
                }
            } else {
                console.error('Export failed:', result.message);
                alert(text('template.export.failed', 'Export failed') + ': ' + result.message);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert(text('template.export.failed', 'Export failed') + ': ' + error);
        }
    }

    /**
     * Import a template from a file
     */
    async importTemplate() {
        try {
            // Show open dialog
            const filePath = await invoke('show_template_import_dialog');

            if (!filePath) {
                console.log('Import cancelled');
                return;
            }

            // Import from file
            const importedData = await invoke('import_template', { path: filePath });

            // Add to template manager
            const newTemplate = window.templateManager?.importTemplate(importedData);

            if (newTemplate) {
                console.log('Template imported successfully:', newTemplate);
                // Optionally show success notification
                if (window.validationUI && typeof window.validationUI.showSuccess === 'function') {
                    window.validationUI.showSuccess(
                        text('template.import.success', 'Template imported') + ': ' + newTemplate.name
                    );
                }
            } else {
                console.error('Failed to import template');
                alert(text('template.import.failed', 'Import failed: Invalid template format'));
            }
        } catch (error) {
            console.error('Import error:', error);
            alert(text('template.import.failed', 'Import failed') + ': ' + error);
        }
    }

    /**
     * Sanitize a file name for export
     * @param {string} name - Original name
     * @returns {string} Sanitized name
     */
    sanitizeFileName(name) {
        // Remove or replace invalid characters
        return name
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 50)
            .trim();
    }
}

// Create and export instance
const templateExportManagerInstance = new TemplateExportManager();

window.templateExportManager = {
    init: () => templateExportManagerInstance.init(),
    exportTemplate: (id) => templateExportManagerInstance.exportTemplate(id),
    importTemplate: () => templateExportManagerInstance.importTemplate()
};

console.log('Template Export Manager module loaded');
