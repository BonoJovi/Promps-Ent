/**
 * Promps v1.2.0 - Category Editor
 *
 * Handles the category management modal for editing and deleting categories.
 */

/**
 * Helper function to get translation with fallback
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if t() not available
 * @returns {string} Translated text
 */
function tce(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Category Editor class
 */
class CategoryEditor {
    constructor() {
        this.modal = null;
    }

    /**
     * Initialize the category editor
     */
    init() {
        this.modal = document.getElementById('categoryEditorModal');
        if (!this.modal) {
            console.warn('Category editor modal not found');
            return;
        }

        this.bindEvents();
        console.log('Category Editor initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button (X)
        const closeBtn = document.getElementById('btnCloseCategoryEditor');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        // Close button (footer)
        const closeFooterBtn = document.getElementById('btnCloseCategoryEditorFooter');
        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.hideModal());
        }

        // Add category button
        const addBtn = document.getElementById('btnAddCategory');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCategory());
        }

        // Enter key in input
        const input = document.getElementById('newCategoryName');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCategory();
                }
            });
        }

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    /**
     * Render the category list
     */
    renderCategoryList() {
        const container = document.getElementById('categoryList');
        if (!container) return;

        container.innerHTML = '';

        const categories = window.categoryManager?.getCategories() || [];

        categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-list-item';

            const isSystem = category.id === 'default' || category.isSystem;
            const displayName = window.categoryManager?.getCategoryDisplayName(category) || category.name;

            item.innerHTML = `
                <span class="category-color-dot" style="background-color: hsl(${category.color || 330}, 65%, 50%)"></span>
                <span class="category-name">${displayName}</span>
                ${isSystem ? `<span class="category-system-badge">${tce('category.system', 'System')}</span>` : `
                    <div class="category-actions">
                        <button class="btn-icon btn-edit-category" data-id="${category.id}" title="${tce('category.edit', 'Edit')}">✏️</button>
                        <button class="btn-icon btn-delete-category" data-id="${category.id}" title="${tce('category.delete', 'Delete')}">🗑️</button>
                    </div>
                `}
            `;

            container.appendChild(item);
        });

        // Bind edit/delete buttons
        container.querySelectorAll('.btn-edit-category').forEach(btn => {
            btn.addEventListener('click', () => this.editCategory(btn.dataset.id));
        });

        container.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', () => this.deleteCategory(btn.dataset.id));
        });
    }

    /**
     * Show the category editor modal
     */
    showModal() {
        if (!this.modal) return;

        this.renderCategoryList();

        // Clear input
        const input = document.getElementById('newCategoryName');
        if (input) {
            input.value = '';
        }

        this.modal.classList.add('modal-visible');
    }

    /**
     * Hide the category editor modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('modal-visible');
        }
    }

    /**
     * Add a new category
     */
    addCategory() {
        const input = document.getElementById('newCategoryName');
        const name = input?.value?.trim();

        if (!name) {
            input?.focus();
            return;
        }

        const category = window.categoryManager?.createCategory(name);
        if (category) {
            input.value = '';
            this.renderCategoryList();
            // Refresh toolbox to show new category
            window.templateManager?.refreshToolbox();
        }
    }

    /**
     * Edit a category
     * @param {string} id - Category ID
     */
    editCategory(id) {
        const category = window.categoryManager?.getCategoryById(id);
        if (!category) return;

        const currentName = category.name.startsWith('category.')
            ? window.categoryManager?.getCategoryDisplayName(category)
            : category.name;

        const newName = prompt(tce('category.enterName', 'Enter category name:'), currentName);
        if (!newName || !newName.trim() || newName.trim() === currentName) return;

        const updated = window.categoryManager?.updateCategory(id, { name: newName.trim() });
        if (updated) {
            this.renderCategoryList();
            window.templateManager?.refreshToolbox();
        }
    }

    /**
     * Delete a category
     * @param {string} id - Category ID
     */
    async deleteCategory(id) {
        const category = window.categoryManager?.getCategoryById(id);
        if (!category) return;

        const displayName = window.categoryManager?.getCategoryDisplayName(category) || category.name;
        const confirmMsg = tce('category.deleteConfirm', 'Delete this category?');

        if (await confirm(`${confirmMsg}\n${displayName}`)) {
            const deleted = window.categoryManager?.deleteCategory(id);
            if (deleted) {
                this.renderCategoryList();
                window.templateManager?.refreshToolbox();
            }
        }
    }
}

// Create and export instance
const categoryEditorInstance = new CategoryEditor();

window.categoryEditor = {
    init: () => categoryEditorInstance.init(),
    showModal: () => categoryEditorInstance.showModal(),
    hideModal: () => categoryEditorInstance.hideModal()
};

console.log('Category Editor module loaded');
