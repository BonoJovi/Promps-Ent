/**
 * Promps Ent - QR Code Share Manager (v2.0.0)
 *
 * Manages QR code generation and decoding for sharing prompts.
 * Uses Tauri commands for backend QR processing.
 */
class QrShareManager {
    constructor() {
        this.invoke = null;
        this.currentQrImage = null;
    }

    /**
     * Initialize the QR share manager
     */
    async init() {
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            this.invoke = window.__TAURI__.invoke;
        }

        if (!this.invoke) {
            console.error('QrShareManager: Tauri API not available');
            return;
        }

        this.setupEventListeners();
        console.log('QrShareManager initialized');
    }

    /**
     * Setup event listeners for QR modal
     */
    setupEventListeners() {
        // Open QR modal button
        const btnQrShare = document.getElementById('btnQrShare');
        if (btnQrShare) {
            btnQrShare.addEventListener('click', () => this.showModal());
        }

        // Close modal
        const btnClose = document.getElementById('btnCloseQrModal');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.hideModal());
        }

        // Tab switching
        const tabGenerate = document.getElementById('qrTabGenerate');
        const tabImport = document.getElementById('qrTabImport');
        if (tabGenerate) {
            tabGenerate.addEventListener('click', () => this.switchTab('generate'));
        }
        if (tabImport) {
            tabImport.addEventListener('click', () => this.switchTab('import'));
        }

        // Generate button
        const btnGenerate = document.getElementById('btnGenerateQr');
        if (btnGenerate) {
            btnGenerate.addEventListener('click', () => this.generateQr());
        }

        // Save QR button
        const btnSaveQr = document.getElementById('btnSaveQr');
        if (btnSaveQr) {
            btnSaveQr.addEventListener('click', () => this.saveQr());
        }

        // Import button
        const btnImportQr = document.getElementById('btnImportQr');
        if (btnImportQr) {
            btnImportQr.addEventListener('click', () => this.importQr());
        }

        // Close on backdrop click
        const modal = document.getElementById('qrShareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }
    }

    /**
     * Show the QR share modal
     */
    showModal() {
        const modal = document.getElementById('qrShareModal');
        if (modal) {
            modal.classList.add('modal-visible');
            this.switchTab('generate');
        }
    }

    /**
     * Hide the QR share modal
     */
    hideModal() {
        const modal = document.getElementById('qrShareModal');
        if (modal) {
            modal.classList.remove('modal-visible');
        }
    }

    /**
     * Switch between generate and import tabs
     */
    switchTab(tab) {
        const tabGenerate = document.getElementById('qrTabGenerate');
        const tabImport = document.getElementById('qrTabImport');
        const panelGenerate = document.getElementById('qrPanelGenerate');
        const panelImport = document.getElementById('qrPanelImport');

        if (tab === 'generate') {
            tabGenerate?.classList.add('active');
            tabImport?.classList.remove('active');
            if (panelGenerate) panelGenerate.style.display = 'block';
            if (panelImport) panelImport.style.display = 'none';
        } else {
            tabGenerate?.classList.remove('active');
            tabImport?.classList.add('active');
            if (panelGenerate) panelGenerate.style.display = 'none';
            if (panelImport) panelImport.style.display = 'block';
        }
    }

    /**
     * Get current DSL text from workspace
     */
    getCurrentDsl() {
        if (typeof getWorkspaceCode === 'function') {
            return getWorkspaceCode();
        }
        return '';
    }

    /**
     * Get current project name
     */
    getProjectName() {
        if (window.projectManager && window.projectManager.currentProject) {
            return window.projectManager.currentProject.metadata.name;
        }
        return 'Untitled';
    }

    /**
     * Get workspace serialization state as JSON string
     */
    getWorkspaceState() {
        if (typeof workspace !== 'undefined' && typeof Blockly !== 'undefined') {
            return JSON.stringify(Blockly.serialization.workspaces.save(workspace));
        }
        return '{}';
    }

    /**
     * Generate QR code from current workspace
     */
    async generateQr() {
        if (!this.invoke) return;

        const dsl = this.getCurrentDsl();
        if (!dsl || dsl.trim() === '') {
            this.showQrMessage(t('qr.noDsl'), 'error');
            return;
        }

        const name = this.getProjectName();
        const locale = window.getLocale ? window.getLocale() : 'ja';
        const workspaceState = this.getWorkspaceState();

        const qrPreview = document.getElementById('qrPreviewImage');
        const qrInfo = document.getElementById('qrDataSize');
        const btnSaveQr = document.getElementById('btnSaveQr');

        try {
            const result = await this.invoke('generate_qr_code', { name, workspaceState, locale });

            if (result.success && result.imageData) {
                this.currentQrImage = result.imageData;

                if (qrPreview) {
                    qrPreview.src = result.imageData;
                    qrPreview.style.display = 'block';
                }
                if (qrInfo) {
                    qrInfo.textContent = t('qr.dataSize', { size: result.dataSize });
                }
                if (btnSaveQr) {
                    btnSaveQr.disabled = false;
                }
                this.showQrMessage(t('qr.generated'), 'success');
            } else {
                this.showQrMessage(result.error || t('qr.generateFailed'), 'error');
            }
        } catch (error) {
            console.error('QR generation failed:', error);
            this.showQrMessage(String(error), 'error');
        }
    }

    /**
     * Save QR code to file
     */
    async saveQr() {
        if (!this.invoke || !this.currentQrImage) return;

        const name = this.getProjectName();
        const workspaceState = this.getWorkspaceState();
        const locale = window.getLocale ? window.getLocale() : 'ja';

        try {
            const pathResult = await this.invoke('show_qr_save_dialog', {
                defaultName: name.replace(/[^a-zA-Z0-9_-]/g, '_')
            });

            if (!pathResult) return;

            const result = await this.invoke('save_qr_code', {
                name, workspaceState, locale, path: pathResult
            });

            if (result.success) {
                this.showQrMessage(t('qr.saved'), 'success');
            } else {
                this.showQrMessage(result.error || t('qr.saveFailed'), 'error');
            }
        } catch (error) {
            console.error('QR save failed:', error);
            this.showQrMessage(String(error), 'error');
        }
    }

    /**
     * Import QR code from file
     */
    async importQr() {
        if (!this.invoke) return;

        try {
            const pathResult = await this.invoke('show_qr_open_dialog');
            if (!pathResult) return;

            const result = await this.invoke('decode_qr_code', { path: pathResult });

            if (result.success && result.data) {
                const data = result.data;
                this.showImportPreview(data);
            } else {
                this.showQrMessage(result.error || t('qr.decodeFailed'), 'error');
            }
        } catch (error) {
            console.error('QR import failed:', error);
            this.showQrMessage(String(error), 'error');
        }
    }

    /**
     * Show import preview with decoded data
     */
    showImportPreview(data) {
        const preview = document.getElementById('qrImportPreview');
        if (!preview) return;

        // v1 (legacy DSL) cannot reconstruct blocks
        const isV2 = data.v === 2 && data.ws;

        preview.innerHTML = `
            <div class="qr-import-info">
                <div class="qr-import-field">
                    <strong>${t('qr.import.name')}:</strong> ${this.escapeHtml(data.name)}
                </div>
                <div class="qr-import-field">
                    <strong>${t('qr.import.locale')}:</strong> ${data.locale}
                </div>
                ${!isV2 && data.dsl ? `
                <div class="qr-import-field">
                    <strong>${t('qr.import.dsl')}:</strong>
                    <pre class="qr-import-dsl">${this.escapeHtml(data.dsl)}</pre>
                </div>` : ''}
            </div>
            ${isV2
                ? `<button id="btnApplyImport" class="btn-primary">${t('qr.import.apply')}</button>`
                : `<div class="qr-message qr-message-error">${t('qr.import.legacyFormat')}</div>`
            }
        `;

        preview.style.display = 'block';

        if (isV2) {
            const btnApply = document.getElementById('btnApplyImport');
            if (btnApply) {
                btnApply.addEventListener('click', () => this.applyImport(data));
            }
        }
    }

    /**
     * Apply imported QR data to workspace
     */
    applyImport(data) {
        if (data.locale && window.i18n && data.locale !== window.i18n.getLocale()) {
            window.i18n.setLocale(data.locale);
        }

        if (data.ws && typeof workspace !== 'undefined' && typeof Blockly !== 'undefined') {
            try {
                const state = JSON.parse(data.ws);
                if (typeof loadWorkspaceState === 'function') {
                    loadWorkspaceState(state);
                } else {
                    workspace.clear();
                    Blockly.serialization.workspaces.load(state, workspace);
                }
            } catch (e) {
                console.error('Failed to parse QR workspace data:', e);
                this.showQrMessage(String(e), 'error');
                return;
            }
        }

        this.hideModal();
        this.showQrMessage(t('qr.imported'), 'success');
    }

    /**
     * Show a message in the QR modal
     */
    showQrMessage(message, type) {
        const msgEl = document.getElementById('qrMessage');
        if (!msgEl) return;

        msgEl.textContent = message;
        msgEl.className = `qr-message qr-message-${type}`;
        msgEl.style.display = 'block';

        setTimeout(() => {
            msgEl.style.display = 'none';
        }, 5000);
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Create global instance
window.qrShareManager = new QrShareManager();
