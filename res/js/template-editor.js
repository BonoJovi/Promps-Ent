/**
 * Promps v1.2.0 - Template Editor
 *
 * Handles the template editor modal for customizing templates
 * with icons, colors, categories, and descriptions.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function tet(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Template Editor class
 */
class TemplateEditor {
    constructor() {
        this.modal = null;
        this.currentTemplate = null;
        this.selectedIcon = 'custom';
        this.selectedColor = 330;
    }

    /**
     * Initialize the template editor
     */
    init() {
        this.modal = document.getElementById('templateEditorModal');
        if (!this.modal) {
            console.warn('Template editor modal not found');
            return;
        }

        this.bindEvents();
        this.renderIconSelector();
        this.renderColorSelector();

        // Listen for show template editor event
        window.addEventListener('showTemplateEditor', (e) => {
            if (e.detail && e.detail.template) {
                this.showModal(e.detail.template);
            }
        });

        console.log('Template Editor initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('btnCloseTemplateEditor');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('btnCancelTemplateEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Save button
        const saveBtn = document.getElementById('btnSaveTemplateEdit');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTemplate());
        }

        // New category button
        const newCatBtn = document.getElementById('btnNewCategory');
        if (newCatBtn) {
            newCatBtn.addEventListener('click', () => this.createNewCategory());
        }

        // Name input - update preview on change
        const nameInput = document.getElementById('templateName');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.updatePreview());
        }

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    /**
     * Render icon selector options
     */
    renderIconSelector() {
        const container = document.getElementById('templateIconSelector');
        if (!container) return;

        container.innerHTML = '';

        const icons = window.TEMPLATE_ICONS || {};
        Object.entries(icons).forEach(([key, emoji]) => {
            const option = document.createElement('div');
            option.className = 'icon-option';
            option.dataset.icon = key;
            option.textContent = emoji;
            option.title = key;

            option.addEventListener('click', () => {
                this.selectIcon(key);
            });

            container.appendChild(option);
        });
    }

    /**
     * Render color selector options
     */
    renderColorSelector() {
        const container = document.getElementById('templateColorSelector');
        if (!container) return;

        container.innerHTML = '';

        const colors = window.TEMPLATE_COLORS || {};
        Object.entries(colors).forEach(([name, hue]) => {
            const option = document.createElement('div');
            option.className = 'color-option';
            option.dataset.color = hue;
            option.dataset.colorName = name;
            option.title = name;
            option.style.backgroundColor = `hsl(${hue}, 65%, 50%)`;

            option.addEventListener('click', () => {
                this.selectColor(hue);
            });

            container.appendChild(option);
        });
    }

    /**
     * Render category selector options
     */
    renderCategorySelector() {
        const select = document.getElementById('templateCategory');
        if (!select) return;

        select.innerHTML = '';

        const categories = window.categoryManager?.getSortedCategories() || [];
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = window.categoryManager?.getCategoryDisplayName(category) || category.name;
            select.appendChild(option);
        });

        // Select current template's category
        if (this.currentTemplate) {
            select.value = this.currentTemplate.category || 'default';
        }
    }

    /**
     * Select an icon
     * @param {string} iconKey - Icon key
     */
    selectIcon(iconKey) {
        this.selectedIcon = iconKey;

        // Update visual selection
        const container = document.getElementById('templateIconSelector');
        if (container) {
            container.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.icon === iconKey);
            });
        }

        this.updatePreview();
    }

    /**
     * Select a color
     * @param {number} hue - HSV hue value
     */
    selectColor(hue) {
        this.selectedColor = parseInt(hue);

        // Update visual selection
        const container = document.getElementById('templateColorSelector');
        if (container) {
            container.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.toggle('selected', parseInt(opt.dataset.color) === this.selectedColor);
            });
        }

        this.updatePreview();
    }

    /**
     * Update the preview display
     */
    updatePreview() {
        const nameInput = document.getElementById('templateName');
        const previewIcon = document.getElementById('templatePreviewIcon');
        const previewName = document.getElementById('templatePreviewName');
        const previewBlocks = document.getElementById('templatePreviewBlocks');
        const previewText = document.getElementById('templatePreviewText');
        const previewBox = document.querySelector('.template-preview-box');

        const icons = window.TEMPLATE_ICONS || {};
        const icon = icons[this.selectedIcon] || icons.custom || '📦';

        if (previewIcon) {
            previewIcon.textContent = icon;
        }

        if (previewName && nameInput) {
            previewName.textContent = nameInput.value || 'Template Name';
        }

        if (previewBlocks && this.currentTemplate) {
            previewBlocks.textContent = `(${this.currentTemplate.blockCount || 0} ${tet('blocks.counter.label', 'blocks')})`;
        }

        if (previewText && this.currentTemplate) {
            previewText.textContent = this.currentTemplate.previewText || '';
        }

        if (previewBox) {
            previewBox.style.borderLeftColor = `hsl(${this.selectedColor}, 65%, 50%)`;
        }
    }

    /**
     * Show the template editor modal
     * @param {Object} template - Template to edit
     */
    showModal(template) {
        if (!this.modal || !template) return;

        this.currentTemplate = template;

        // Populate form fields
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');

        if (nameInput) nameInput.value = template.name || '';
        if (descInput) descInput.value = template.description || '';

        // Select icon and color
        this.selectedIcon = template.icon || 'custom';
        this.selectedColor = template.color || 330;

        // Update icon selection
        const iconContainer = document.getElementById('templateIconSelector');
        if (iconContainer) {
            iconContainer.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.icon === this.selectedIcon);
            });
        }

        // Update color selection
        const colorContainer = document.getElementById('templateColorSelector');
        if (colorContainer) {
            colorContainer.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.toggle('selected', parseInt(opt.dataset.color) === this.selectedColor);
            });
        }

        // Render and select category
        this.renderCategorySelector();

        // Update preview
        this.updatePreview();

        // Show modal
        this.modal.classList.add('modal-visible');
    }

    /**
     * Hide the template editor modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('modal-visible');
        }
        this.currentTemplate = null;
    }

    /**
     * Save the template changes
     */
    saveTemplate() {
        if (!this.currentTemplate) return;

        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        const categorySelect = document.getElementById('templateCategory');

        const name = nameInput?.value?.trim();
        if (!name) {
            alert(tet('template.editor.nameRequired', 'Please enter a template name.'));
            nameInput?.focus();
            return;
        }

        const updates = {
            name: name,
            description: descInput?.value?.trim() || '',
            icon: this.selectedIcon,
            color: this.selectedColor,
            category: categorySelect?.value || 'default'
        };

        // Update template
        const updated = window.templateManager?.updateTemplate(this.currentTemplate.id, updates);

        if (updated) {
            console.log('Template updated:', updated);
            this.hideModal();
        } else {
            alert(tet('template.editor.saveFailed', 'Failed to save template.'));
        }
    }

    /**
     * Create a new category
     */
    createNewCategory() {
        const name = prompt(tet('category.enterName', 'Enter category name:'));
        if (!name || !name.trim()) return;

        const category = window.categoryManager?.createCategory(name.trim(), this.selectedColor);
        if (category) {
            // Refresh category selector and select new category
            this.renderCategorySelector();
            const select = document.getElementById('templateCategory');
            if (select) {
                select.value = category.id;
            }
        }
    }
}

// Create and export instance
const templateEditorInstance = new TemplateEditor();

window.templateEditor = {
    init: () => templateEditorInstance.init(),
    showModal: (template) => templateEditorInstance.showModal(template),
    hideModal: () => templateEditorInstance.hideModal()
};

console.log('Template Editor module loaded');
