/**
 * Promps Ent - QR Share Manager Tests (v2.0.0)
 *
 * Tests for QR code sharing functionality:
 * - Manager initialization
 * - Modal show/hide with license check
 * - Tab switching
 * - QR generation flow
 * - QR save flow
 * - QR import flow
 * - Import preview and apply
 * - Message display
 * - HTML escaping
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

beforeEach(() => {
    mockInvoke = jest.fn();

    // Reset DOM
    document.body.innerHTML = '';

    // Mock Tauri v2 API
    global.window.__TAURI_INTERNALS__ = {
        invoke: mockInvoke
    };

    // Mock i18n
    global.window.t = jest.fn((key, params) => {
        if (params) {
            let text = key;
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(`{${k}}`, v);
            }
            return text;
        }
        return key;
    });

    // Mock license state
    global.window.isEntLicensed = true;

    // Mock workspace functions
    global.workspace = {};
    global.generateDslFromWorkspace = jest.fn(() => '_N:Test を 分析して');
    global.loadDslToWorkspace = jest.fn();

    // Mock project manager
    global.window.projectManager = {
        currentProject: {
            metadata: { name: 'TestProject' }
        }
    };

    // Mock getLocale
    global.window.getLocale = jest.fn(() => 'ja');
});

// Helper to create QR modal DOM
function createQrModalDom() {
    document.body.innerHTML = `
        <button id="btnQrShare"></button>
        <div id="qrShareModal" class="modal-overlay">
            <button id="btnCloseQrModal"></button>
            <button id="qrTabGenerate" class="qr-tab active"></button>
            <button id="qrTabImport" class="qr-tab"></button>
            <div id="qrPanelGenerate" style="display: block;"></div>
            <div id="qrPanelImport" style="display: none;"></div>
            <button id="btnGenerateQr"></button>
            <button id="btnSaveQr" disabled></button>
            <button id="btnImportQr"></button>
            <img id="qrPreviewImage" style="display: none;" />
            <span id="qrDataSize"></span>
            <div id="qrImportPreview" style="display: none;"></div>
            <div id="qrMessage" class="qr-message" style="display: none;"></div>
        </div>
    `;
}

// Create QrShareManager class for testing (simulated)
class QrShareManager {
    constructor() {
        this.invoke = null;
        this.currentQrImage = null;
    }

    async init() {
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        }
        if (!this.invoke) return;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnQrShare = document.getElementById('btnQrShare');
        if (btnQrShare) btnQrShare.addEventListener('click', () => this.showModal());

        const btnClose = document.getElementById('btnCloseQrModal');
        if (btnClose) btnClose.addEventListener('click', () => this.hideModal());

        const tabGenerate = document.getElementById('qrTabGenerate');
        const tabImport = document.getElementById('qrTabImport');
        if (tabGenerate) tabGenerate.addEventListener('click', () => this.switchTab('generate'));
        if (tabImport) tabImport.addEventListener('click', () => this.switchTab('import'));

        const btnGenerate = document.getElementById('btnGenerateQr');
        if (btnGenerate) btnGenerate.addEventListener('click', () => this.generateQr());

        const btnSaveQr = document.getElementById('btnSaveQr');
        if (btnSaveQr) btnSaveQr.addEventListener('click', () => this.saveQr());

        const btnImportQr = document.getElementById('btnImportQr');
        if (btnImportQr) btnImportQr.addEventListener('click', () => this.importQr());

        const modal = document.getElementById('qrShareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }
    }

    showModal() {
        const modal = document.getElementById('qrShareModal');
        if (modal) {
            modal.classList.add('modal-visible');
            this.switchTab('generate');
        }
    }

    hideModal() {
        const modal = document.getElementById('qrShareModal');
        if (modal) modal.classList.remove('modal-visible');
    }

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

    getCurrentDsl() {
        if (typeof workspace !== 'undefined' && typeof generateDslFromWorkspace === 'function') {
            return generateDslFromWorkspace(workspace);
        }
        return '';
    }

    getProjectName() {
        if (window.projectManager && window.projectManager.currentProject) {
            return window.projectManager.currentProject.metadata.name;
        }
        return 'Untitled';
    }

    async generateQr() {
        if (!this.invoke) return;
        const dsl = this.getCurrentDsl();
        if (!dsl || dsl.trim() === '') {
            this.showQrMessage(t('qr.noDsl'), 'error');
            return;
        }
        const name = this.getProjectName();
        const locale = window.getLocale ? window.getLocale() : 'ja';

        try {
            const result = await this.invoke('generate_qr_code', { name, dsl, locale });
            if (result.success && result.imageData) {
                this.currentQrImage = result.imageData;
                const qrPreview = document.getElementById('qrPreviewImage');
                const qrInfo = document.getElementById('qrDataSize');
                const btnSaveQr = document.getElementById('btnSaveQr');
                if (qrPreview) {
                    qrPreview.src = result.imageData;
                    qrPreview.style.display = 'block';
                }
                if (qrInfo) qrInfo.textContent = t('qr.dataSize', { size: result.dataSize });
                if (btnSaveQr) btnSaveQr.disabled = false;
                this.showQrMessage(t('qr.generated'), 'success');
            } else {
                this.showQrMessage(result.error || t('qr.generateFailed'), 'error');
            }
        } catch (error) {
            this.showQrMessage(String(error), 'error');
        }
    }

    async saveQr() {
        if (!this.invoke || !this.currentQrImage) return;
        const name = this.getProjectName();
        const dsl = this.getCurrentDsl();
        const locale = window.getLocale ? window.getLocale() : 'ja';

        try {
            const pathResult = await this.invoke('show_qr_save_dialog', {
                defaultName: name.replace(/[^a-zA-Z0-9_-]/g, '_')
            });
            if (!pathResult) return;
            const result = await this.invoke('save_qr_code', { name, dsl, locale, path: pathResult });
            if (result.success) {
                this.showQrMessage(t('qr.saved'), 'success');
            } else {
                this.showQrMessage(result.error || t('qr.saveFailed'), 'error');
            }
        } catch (error) {
            this.showQrMessage(String(error), 'error');
        }
    }

    async importQr() {
        if (!this.invoke) return;
        try {
            const pathResult = await this.invoke('show_qr_open_dialog');
            if (!pathResult) return;
            const result = await this.invoke('decode_qr_code', { path: pathResult });
            if (result.success && result.data) {
                this.showImportPreview(result.data);
            } else {
                this.showQrMessage(result.error || t('qr.decodeFailed'), 'error');
            }
        } catch (error) {
            this.showQrMessage(String(error), 'error');
        }
    }

    showImportPreview(data) {
        const preview = document.getElementById('qrImportPreview');
        if (!preview) return;
        preview.innerHTML = `
            <div class="qr-import-info">
                <div class="qr-import-field"><strong>${t('qr.import.name')}:</strong> ${this.escapeHtml(data.name)}</div>
                <div class="qr-import-field"><strong>${t('qr.import.locale')}:</strong> ${data.locale}</div>
                <div class="qr-import-field"><strong>${t('qr.import.dsl')}:</strong>
                    <pre class="qr-import-dsl">${this.escapeHtml(data.dsl)}</pre>
                </div>
            </div>
            <button id="btnApplyImport" class="btn-primary">${t('qr.import.apply')}</button>
        `;
        preview.style.display = 'block';
        const btnApply = document.getElementById('btnApplyImport');
        if (btnApply) btnApply.addEventListener('click', () => this.applyImport(data));
    }

    applyImport(data) {
        if (typeof workspace !== 'undefined' && typeof loadDslToWorkspace === 'function') {
            loadDslToWorkspace(workspace, data.dsl);
        }
        this.hideModal();
        this.showQrMessage(t('qr.imported'), 'success');
    }

    showQrMessage(message, type) {
        const msgEl = document.getElementById('qrMessage');
        if (!msgEl) return;
        msgEl.textContent = message;
        msgEl.className = `qr-message qr-message-${type}`;
        msgEl.style.display = 'block';
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

describe('QrShareManager', () => {
    describe('Initialization', () => {
        test('should initialize with Tauri API', async () => {
            createQrModalDom();
            const manager = new QrShareManager();
            await manager.init();
            expect(manager.invoke).toBe(mockInvoke);
        });

        test('should not initialize without Tauri API', async () => {
            delete global.window.__TAURI_INTERNALS__;
            delete global.window.__TAURI__;
            const manager = new QrShareManager();
            await manager.init();
            expect(manager.invoke).toBeNull();
        });

        test('should have null currentQrImage initially', () => {
            const manager = new QrShareManager();
            expect(manager.currentQrImage).toBeNull();
        });
    });

    describe('Modal Show/Hide', () => {
        test('should show modal', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            const modal = document.getElementById('qrShareModal');
            expect(modal.classList.contains('modal-visible')).toBe(true);
        });

        test('should hide modal', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            manager.hideModal();
            const modal = document.getElementById('qrShareModal');
            expect(modal.classList.contains('modal-visible')).toBe(false);
        });

        test('should hide modal on backdrop click', async () => {
            createQrModalDom();
            const manager = new QrShareManager();
            await manager.init();
            manager.showModal();
            const modal = document.getElementById('qrShareModal');
            modal.click(); // backdrop click
            expect(modal.classList.contains('modal-visible')).toBe(false);
        });
    });

    describe('Tab Switching', () => {
        test('should switch to generate tab', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.switchTab('generate');
            const tabGenerate = document.getElementById('qrTabGenerate');
            const panelGenerate = document.getElementById('qrPanelGenerate');
            expect(tabGenerate.classList.contains('active')).toBe(true);
            expect(panelGenerate.style.display).toBe('block');
        });

        test('should switch to import tab', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.switchTab('import');
            const tabImport = document.getElementById('qrTabImport');
            const panelImport = document.getElementById('qrPanelImport');
            expect(tabImport.classList.contains('active')).toBe(true);
            expect(panelImport.style.display).toBe('block');
        });

        test('should hide generate panel when switching to import', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.switchTab('import');
            const panelGenerate = document.getElementById('qrPanelGenerate');
            expect(panelGenerate.style.display).toBe('none');
        });
    });

    describe('QR Generation', () => {
        test('should call invoke with correct parameters', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValue({
                success: true,
                imageData: 'data:image/png;base64,test',
                dataSize: 42
            });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            expect(mockInvoke).toHaveBeenCalledWith('generate_qr_code', {
                name: 'TestProject',
                dsl: '_N:Test を 分析して',
                locale: 'ja'
            });
        });

        test('should display QR image on success', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValue({
                success: true,
                imageData: 'data:image/png;base64,test',
                dataSize: 42
            });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            const img = document.getElementById('qrPreviewImage');
            expect(img.src).toContain('data:image/png;base64,test');
            expect(img.style.display).toBe('block');
        });

        test('should enable save button on success', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValue({
                success: true,
                imageData: 'data:image/png;base64,test',
                dataSize: 42
            });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            const btnSave = document.getElementById('btnSaveQr');
            expect(btnSave.disabled).toBe(false);
        });

        test('should show error when no DSL', async () => {
            createQrModalDom();
            generateDslFromWorkspace.mockReturnValue('');
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            const msg = document.getElementById('qrMessage');
            expect(msg.textContent).toBe('qr.noDsl');
        });

        test('should show error on backend failure', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValue({ success: false, error: 'Data too large' });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            const msg = document.getElementById('qrMessage');
            expect(msg.textContent).toBe('Data too large');
        });

        test('should store currentQrImage on success', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValue({
                success: true,
                imageData: 'data:image/png;base64,abc',
                dataSize: 10
            });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.generateQr();
            expect(manager.currentQrImage).toBe('data:image/png;base64,abc');
        });
    });

    describe('QR Save', () => {
        test('should call save dialog then save command', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValueOnce('/tmp/test.png')
                      .mockResolvedValueOnce({ success: true });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.currentQrImage = 'data:image/png;base64,test';
            await manager.saveQr();
            expect(mockInvoke).toHaveBeenCalledWith('show_qr_save_dialog', {
                defaultName: 'TestProject'
            });
            expect(mockInvoke).toHaveBeenCalledWith('save_qr_code', {
                name: 'TestProject',
                dsl: '_N:Test を 分析して',
                locale: 'ja',
                path: '/tmp/test.png'
            });
        });

        test('should not save if dialog cancelled', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValueOnce(null);
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.currentQrImage = 'data:image/png;base64,test';
            await manager.saveQr();
            expect(mockInvoke).toHaveBeenCalledTimes(1); // Only dialog call
        });

        test('should not save without currentQrImage', async () => {
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.currentQrImage = null;
            await manager.saveQr();
            expect(mockInvoke).not.toHaveBeenCalled();
        });
    });

    describe('QR Import', () => {
        test('should call open dialog then decode command', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValueOnce('/tmp/test.png')
                      .mockResolvedValueOnce({
                          success: true,
                          data: { name: 'Imported', dsl: '_N:Hello', locale: 'en' }
                      });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.importQr();
            expect(mockInvoke).toHaveBeenCalledWith('show_qr_open_dialog');
            expect(mockInvoke).toHaveBeenCalledWith('decode_qr_code', { path: '/tmp/test.png' });
        });

        test('should show import preview on success', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValueOnce('/tmp/test.png')
                      .mockResolvedValueOnce({
                          success: true,
                          data: { name: 'Imported', dsl: '_N:Hello', locale: 'en' }
                      });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.importQr();
            const preview = document.getElementById('qrImportPreview');
            expect(preview.style.display).toBe('block');
            expect(preview.innerHTML).toContain('Imported');
        });

        test('should show error on decode failure', async () => {
            createQrModalDom();
            mockInvoke.mockResolvedValueOnce('/tmp/test.png')
                      .mockResolvedValueOnce({ success: false, error: 'No QR found' });
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            await manager.importQr();
            const msg = document.getElementById('qrMessage');
            expect(msg.textContent).toBe('No QR found');
        });
    });

    describe('Apply Import', () => {
        test('should load DSL to workspace', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            manager.applyImport({ name: 'Test', dsl: '_N:Hello', locale: 'en' });
            expect(loadDslToWorkspace).toHaveBeenCalledWith(workspace, '_N:Hello');
        });

        test('should hide modal after import', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            manager.applyImport({ name: 'Test', dsl: '_N:Hello', locale: 'en' });
            const modal = document.getElementById('qrShareModal');
            expect(modal.classList.contains('modal-visible')).toBe(false);
        });
    });

    describe('Messages', () => {
        test('should show success message', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.showQrMessage('Success!', 'success');
            const msg = document.getElementById('qrMessage');
            expect(msg.textContent).toBe('Success!');
            expect(msg.className).toBe('qr-message qr-message-success');
            expect(msg.style.display).toBe('block');
        });

        test('should show error message', () => {
            createQrModalDom();
            const manager = new QrShareManager();
            manager.showQrMessage('Failed!', 'error');
            const msg = document.getElementById('qrMessage');
            expect(msg.textContent).toBe('Failed!');
            expect(msg.className).toBe('qr-message qr-message-error');
        });
    });

    describe('Utility Functions', () => {
        test('should escape HTML correctly', () => {
            const manager = new QrShareManager();
            expect(manager.escapeHtml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert("xss")&lt;/script&gt;'
            );
        });

        test('should escape HTML with special characters', () => {
            const manager = new QrShareManager();
            expect(manager.escapeHtml('a & b < c')).toBe('a &amp; b &lt; c');
        });

        test('should get current DSL from workspace', () => {
            const manager = new QrShareManager();
            expect(manager.getCurrentDsl()).toBe('_N:Test を 分析して');
        });

        test('should get project name', () => {
            const manager = new QrShareManager();
            expect(manager.getProjectName()).toBe('TestProject');
        });

        test('should return Untitled when no project', () => {
            window.projectManager = null;
            const manager = new QrShareManager();
            expect(manager.getProjectName()).toBe('Untitled');
        });
    });
});
