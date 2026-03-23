/**
 * Promps Ent - API Key Management
 *
 * Provides UI and logic for managing AI service API keys.
 */

/**
 * API Key Manager class
 */
class ApiKeyManager {
    constructor() {
        this.modal = null;
        this.isInitialized = false;
        this.invoke = null;
    }

    /**
     * Initialize the API Key Manager
     */
    async init() {
        if (this.isInitialized) return;

        // Get Tauri invoke function
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            this.invoke = window.__TAURI__.invoke;
        } else {
            console.warn('Tauri API not available');
        }

        this.createModal();
        this.bindEvents();
        this.isInitialized = true;
    }

    /**
     * Create the settings modal HTML
     */
    createModal() {
        const title = window.t ? window.t('pro.apiKey.title') : 'API Key Settings';
        const description = window.t ? window.t('pro.apiKey.description') : 'Configure your AI service API keys. Keys are securely stored on your system.';
        const closeText = window.t ? window.t('pro.apiKey.close') : 'Close';

        const modalHtml = `
            <div id="apiKeyModal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 data-i18n="pro.apiKey.title">${title}</h2>
                        <button class="modal-close" id="closeApiKeyModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-description" data-i18n="pro.apiKey.description">
                            ${description}
                        </p>
                        <div id="apiKeyList" class="api-key-list">
                            <!-- API key entries will be dynamically inserted here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="closeApiKeyModalBtn" class="btn-secondary" data-i18n="pro.apiKey.close">${closeText}</button>
                    </div>
                </div>
            </div>
        `;

        // Append modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('apiKeyModal');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button (X)
        document.getElementById('closeApiKeyModal').addEventListener('click', () => {
            this.hideModal();
        });

        // Close button (footer)
        document.getElementById('closeApiKeyModalBtn').addEventListener('click', () => {
            this.hideModal();
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    /**
     * Show the modal and load API key list (Ent feature)
     */
    async showModal() {
        // Show modal first
        this.modal.style.display = 'flex';

        // Then load API keys (with error handling)
        try {
            await this.loadApiKeys();
        } catch (error) {
            console.error('Failed to load API keys:', error);
            const listContainer = document.getElementById('apiKeyList');
            if (listContainer) {
                const errorMsg = window.t ? window.t('pro.apiKey.loadFailed') : 'Failed to load API keys. Please check if the backend is running.';
                listContainer.innerHTML = `<p class="error-message">${errorMsg}</p>`;
            }
        }
    }

    /**
     * Hide the modal
     */
    hideModal() {
        this.modal.style.display = 'none';
    }

    /**
     * Load and display API key list
     */
    async loadApiKeys() {
        const listContainer = document.getElementById('apiKeyList');

        try {
            const keys = await this.invoke('list_api_keys');
            listContainer.innerHTML = '';

            for (const entry of keys) {
                const itemHtml = this.createApiKeyItem(entry);
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            }

            // Bind events for the new items
            this.bindApiKeyItemEvents();
        } catch (error) {
            console.error('Failed to load API keys:', error);
            const errorPrefix = window.t ? window.t('pro.apiKey.loadError') : 'Failed to load API keys: ';
            listContainer.innerHTML = `<p class="error-message">${errorPrefix}${error}</p>`;
        }
    }

    /**
     * Create HTML for an API key item
     */
    createApiKeyItem(entry) {
        const providerName = this.getProviderDisplayName(entry.provider);
        const statusClass = entry.is_set ? 'status-set' : 'status-not-set';
        const statusTextSet = window.t ? window.t('pro.apiKey.status.set') : 'Set';
        const statusTextNotSet = window.t ? window.t('pro.apiKey.status.notSet') : 'Not Set';
        const statusText = entry.is_set ? statusTextSet : statusTextNotSet;
        const maskedKey = entry.masked_key || '••••••••';
        const providerKey = this.getProviderKey(entry.provider);

        const editText = window.t ? window.t('pro.apiKey.edit') : 'Edit';
        const saveText = window.t ? window.t('pro.apiKey.save') : 'Save';
        const cancelText = window.t ? window.t('pro.apiKey.cancel') : 'Cancel';
        const deleteText = window.t ? window.t('pro.apiKey.delete') : 'Delete';
        const placeholder = window.t ? window.t('pro.apiKey.placeholder') : 'Enter API key...';

        return `
            <div class="api-key-item" data-provider="${providerKey}">
                <div class="api-key-info">
                    <span class="api-key-provider">${providerName}</span>
                    <span class="api-key-status ${statusClass}">${statusText}</span>
                    ${entry.is_set ? `<span class="api-key-masked">${maskedKey}</span>` : ''}
                </div>
                <div class="api-key-actions">
                    <input type="password" class="api-key-input" placeholder="${placeholder}" style="display: none;">
                    <button class="btn-edit-key" title="${editText}">${editText}</button>
                    <button class="btn-save-key" title="${saveText}" style="display: none;">${saveText}</button>
                    <button class="btn-cancel-key" title="${cancelText}" style="display: none;">${cancelText}</button>
                    ${entry.is_set ? `<button class="btn-delete-key" title="${deleteText}">${deleteText}</button>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get provider display name from provider object
     */
    getProviderDisplayName(provider) {
        if (typeof provider === 'string') {
            return provider;
        }
        if (provider.Custom) {
            return provider.Custom;
        }
        return provider;
    }

    /**
     * Get provider key string from provider object
     */
    getProviderKey(provider) {
        if (typeof provider === 'string') {
            return provider.toLowerCase();
        }
        if (provider.Custom) {
            return provider.Custom.toLowerCase();
        }
        return provider.toLowerCase();
    }

    /**
     * Bind events for API key items
     */
    bindApiKeyItemEvents() {
        // Edit buttons
        document.querySelectorAll('.btn-edit-key').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.api-key-item');
                this.showEditMode(item);
            });
        });

        // Save buttons
        document.querySelectorAll('.btn-save-key').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.target.closest('.api-key-item');
                await this.saveApiKey(item);
            });
        });

        // Cancel buttons
        document.querySelectorAll('.btn-cancel-key').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.api-key-item');
                this.hideEditMode(item);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete-key').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.target.closest('.api-key-item');
                await this.deleteApiKey(item);
            });
        });

        // Enter key to save, Escape to cancel
        document.querySelectorAll('.api-key-input').forEach(input => {
            input.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    const item = e.target.closest('.api-key-item');
                    await this.saveApiKey(item);
                } else if (e.key === 'Escape') {
                    const item = e.target.closest('.api-key-item');
                    this.hideEditMode(item);
                }
            });
        });
    }

    /**
     * Show edit mode for an API key item
     */
    showEditMode(item) {
        const input = item.querySelector('.api-key-input');
        const editBtn = item.querySelector('.btn-edit-key');
        const saveBtn = item.querySelector('.btn-save-key');
        const cancelBtn = item.querySelector('.btn-cancel-key');
        const deleteBtn = item.querySelector('.btn-delete-key');

        input.style.display = 'block';
        input.value = '';
        input.focus();

        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    /**
     * Hide edit mode for an API key item
     */
    hideEditMode(item) {
        const input = item.querySelector('.api-key-input');
        const editBtn = item.querySelector('.btn-edit-key');
        const saveBtn = item.querySelector('.btn-save-key');
        const cancelBtn = item.querySelector('.btn-cancel-key');
        const deleteBtn = item.querySelector('.btn-delete-key');

        input.style.display = 'none';
        input.value = '';

        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    }

    /**
     * Save API key for an item
     */
    async saveApiKey(item) {
        const provider = item.dataset.provider;
        const input = item.querySelector('.api-key-input');
        const apiKey = input.value.trim();

        if (!apiKey) {
            alert(window.t ? window.t('pro.apiKey.enterKey') : 'Please enter an API key.');
            return;
        }

        try {
            const result = await this.invoke('save_api_key', { provider, apiKey });

            // Handle both object and direct boolean result
            const isSuccess = result === true || result?.success === true;

            if (isSuccess) {
                await this.loadApiKeys(); // Reload the list
            } else {
                const message = result?.message || 'Unknown error';
                const prefix = window.t ? window.t('pro.apiKey.saveFailed') : 'Failed to save API key: ';
                alert(prefix + message);
            }
        } catch (error) {
            console.error('Failed to save API key:', error);
            const prefix = window.t ? window.t('pro.apiKey.saveFailed') : 'Failed to save API key: ';
            alert(prefix + error);
        }
    }

    /**
     * Delete API key for an item
     */
    async deleteApiKey(item) {
        const provider = item.dataset.provider;
        const providerName = item.querySelector('.api-key-provider').textContent;

        const confirmMsg = window.t ? window.t('pro.apiKey.confirmDelete').replace('{provider}', providerName) : `Are you sure you want to delete the API key for ${providerName}?`;
        // Tauri's confirm() returns a Promise
        if (!await confirm(confirmMsg)) {
            return;
        }

        try {
            const result = await this.invoke('delete_api_key', { provider });

            if (result.success) {
                await this.loadApiKeys(); // Reload the list
            } else {
                const prefix = window.t ? window.t('pro.apiKey.deleteFailed') : 'Failed to delete API key: ';
                alert(prefix + result.message);
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
            const prefix = window.t ? window.t('pro.apiKey.deleteFailed') : 'Failed to delete API key: ';
            alert(prefix + error);
        }
    }
}

// Create and export the API Key Manager instance
window.apiKeyManager = new ApiKeyManager();
