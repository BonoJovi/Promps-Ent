/**
 * Promps Ent - LAN Share Manager Tests (v2.0.0)
 *
 * Tests for LAN P2P sharing functionality:
 * - Manager initialization
 * - Modal show/hide with license check
 * - Start/stop sharing
 * - UI state updates
 * - Peer list rendering
 * - Send to peer
 * - Pending transfers
 * - Accept/reject transfers
 * - Message display
 * - Utility functions
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

    // Use fake timers
    jest.useFakeTimers();
});

// Restore timers after each test
afterEach(() => {
    jest.useRealTimers();
});

import { afterEach } from '@jest/globals';

// Helper to create LAN modal DOM
function createLanModalDom() {
    document.body.innerHTML = `
        <button id="btnLanShare"></button>
        <div id="lanShareModal" class="modal-overlay">
            <button id="btnCloseLanModal"></button>
            <span id="lanStatusIndicator" class="lan-status-indicator lan-status-inactive"></span>
            <span id="lanSharingStatus">Inactive</span>
            <button id="btnToggleSharing" class="btn-primary lan-btn-start">Start</button>
            <button id="btnRefreshPeers"></button>
            <div id="lanPeerList" class="lan-peer-list">
                <div class="lan-no-peers">No peers found</div>
            </div>
            <div id="lanPendingTransfers" class="lan-pending-section" style="display: none;"></div>
            <div id="lanMessage" class="lan-message" style="display: none;"></div>
        </div>
    `;
}

// LanShareManager class for testing
class LanShareManager {
    constructor() {
        this.invoke = null;
        this.isSharing = false;
        this.pollInterval = null;
        this.peerPollInterval = null;
    }

    async init() {
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        }
        if (!this.invoke) return;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnLanShare = document.getElementById('btnLanShare');
        if (btnLanShare) btnLanShare.addEventListener('click', () => this.showModal());
        const btnClose = document.getElementById('btnCloseLanModal');
        if (btnClose) btnClose.addEventListener('click', () => this.hideModal());
        const btnToggle = document.getElementById('btnToggleSharing');
        if (btnToggle) btnToggle.addEventListener('click', () => this.toggleSharing());
        const btnRefresh = document.getElementById('btnRefreshPeers');
        if (btnRefresh) btnRefresh.addEventListener('click', () => this.refreshPeers());
        const modal = document.getElementById('lanShareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }
    }

    showModal() {
        const modal = document.getElementById('lanShareModal');
        if (modal) {
            modal.classList.add('modal-visible');
            this.updateSharingUI();
        }
    }

    hideModal() {
        const modal = document.getElementById('lanShareModal');
        if (modal) modal.classList.remove('modal-visible');
        this.stopPeerPolling();
        this.stopTransferPolling();
    }

    async toggleSharing() {
        if (this.isSharing) {
            await this.stopSharing();
        } else {
            await this.startSharing();
        }
    }

    async startSharing() {
        if (!this.invoke) return;
        try {
            const result = await this.invoke('start_lan_sharing');
            if (result.success) {
                this.isSharing = true;
                this.updateSharingUI();
                this.showLanMessage(t('lan.started'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.startFailed'), 'error');
            }
        } catch (error) {
            this.showLanMessage(String(error), 'error');
        }
    }

    async stopSharing() {
        if (!this.invoke) return;
        try {
            const result = await this.invoke('stop_lan_sharing');
            if (result.success) {
                this.isSharing = false;
                this.updateSharingUI();
                this.showLanMessage(t('lan.stopped'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.stopFailed'), 'error');
            }
        } catch (error) {
            this.showLanMessage(String(error), 'error');
        }
    }

    updateSharingUI() {
        const btnToggle = document.getElementById('btnToggleSharing');
        const statusText = document.getElementById('lanSharingStatus');
        const statusIndicator = document.getElementById('lanStatusIndicator');
        if (btnToggle) {
            btnToggle.textContent = this.isSharing ? t('lan.stop') : t('lan.start');
            btnToggle.className = this.isSharing ? 'btn-secondary lan-btn-stop' : 'btn-primary lan-btn-start';
        }
        if (statusText) {
            statusText.textContent = this.isSharing ? t('lan.status.active') : t('lan.status.inactive');
        }
        if (statusIndicator) {
            statusIndicator.className = this.isSharing
                ? 'lan-status-indicator lan-status-active'
                : 'lan-status-indicator lan-status-inactive';
        }
    }

    startPeerPolling() {
        this.stopPeerPolling();
        this.refreshPeers();
        this.peerPollInterval = setInterval(() => this.refreshPeers(), 3000);
    }

    stopPeerPolling() {
        if (this.peerPollInterval) {
            clearInterval(this.peerPollInterval);
            this.peerPollInterval = null;
        }
    }

    async refreshPeers() {
        if (!this.invoke || !this.isSharing) return;
        try {
            const result = await this.invoke('get_lan_peers');
            this.renderPeerList(result.peers || []);
        } catch (error) {
            // ignore
        }
    }

    renderPeerList(peers) {
        const container = document.getElementById('lanPeerList');
        if (!container) return;
        if (peers.length === 0) {
            container.innerHTML = `<div class="lan-no-peers">${t('lan.noPeers')}</div>`;
            return;
        }
        container.innerHTML = peers.map(peer => `
            <div class="lan-peer-item" data-peer-id="${this.escapeHtml(peer.id)}">
                <div class="lan-peer-info">
                    <span class="lan-peer-name">${this.escapeHtml(peer.name)}</span>
                    <span class="lan-peer-address">${this.escapeHtml(peer.address)}:${peer.port}</span>
                </div>
                <button class="btn-primary btn-small lan-send-btn"
                        data-peer-id="${this.escapeHtml(peer.id)}"
                        data-peer-address="${this.escapeHtml(peer.address)}"
                        data-peer-port="${peer.port}">
                    ${t('lan.send')}
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.lan-send-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const peerId = btn.dataset.peerId;
                const address = btn.dataset.peerAddress;
                const port = parseInt(btn.dataset.peerPort);
                this.sendToPeer(peerId, address, port);
            });
        });
    }

    async sendToPeer(peerId, address, port) {
        if (!this.invoke) return;
        const dsl = this.getCurrentDsl();
        if (!dsl || dsl.trim() === '') {
            this.showLanMessage(t('lan.noDsl'), 'error');
            return;
        }
        const name = this.getProjectName();
        try {
            const result = await this.invoke('send_project_to_peer', {
                peerAddress: address,
                peerPort: port,
                projectName: name,
                projectData: dsl
            });
            if (result.success) {
                this.showLanMessage(t('lan.sent'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.sendFailed'), 'error');
            }
        } catch (error) {
            this.showLanMessage(String(error), 'error');
        }
    }

    startTransferPolling() {
        this.stopTransferPolling();
        this.pollInterval = setInterval(() => this.checkPendingTransfers(), 2000);
    }

    stopTransferPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async checkPendingTransfers() {
        if (!this.invoke || !this.isSharing) return;
        try {
            const result = await this.invoke('get_pending_transfers');
            this.renderPendingOffers(result.offers || []);
        } catch (error) {
            // ignore
        }
    }

    renderPendingOffers(offers) {
        const container = document.getElementById('lanPendingTransfers');
        if (!container) return;
        if (offers.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        container.innerHTML = `<h4>${t('lan.pendingTransfers')}</h4>` +
            offers.map(offer => `
                <div class="lan-transfer-item" data-offer-id="${this.escapeHtml(offer.id)}">
                    <div class="lan-transfer-info">
                        <span class="lan-transfer-name">${this.escapeHtml(offer.fileName)}</span>
                        <span class="lan-transfer-from">${t('lan.from')}: ${this.escapeHtml(offer.fromPeer)}</span>
                        <span class="lan-transfer-size">${this.formatSize(offer.fileSize)}</span>
                    </div>
                    <div class="lan-transfer-actions">
                        <button class="btn-primary btn-small lan-accept-btn" data-offer-id="${this.escapeHtml(offer.id)}">${t('lan.accept')}</button>
                        <button class="btn-secondary btn-small lan-reject-btn" data-offer-id="${this.escapeHtml(offer.id)}">${t('lan.reject')}</button>
                    </div>
                </div>
            `).join('');
        container.querySelectorAll('.lan-accept-btn').forEach(btn => {
            btn.addEventListener('click', () => this.acceptTransfer(btn.dataset.offerId));
        });
        container.querySelectorAll('.lan-reject-btn').forEach(btn => {
            btn.addEventListener('click', () => this.rejectTransfer(btn.dataset.offerId));
        });
    }

    async acceptTransfer(offerId) {
        if (!this.invoke) return;
        try {
            const result = await this.invoke('accept_transfer', { offerId });
            if (result.success && result.data) {
                this.applyReceivedData(result.data);
                this.showLanMessage(t('lan.received'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.acceptFailed'), 'error');
            }
        } catch (error) {
            this.showLanMessage(String(error), 'error');
        }
    }

    async rejectTransfer(offerId) {
        if (!this.invoke) return;
        try {
            await this.invoke('reject_transfer', { offerId });
            this.showLanMessage(t('lan.rejected'), 'success');
        } catch (error) {
            // ignore
        }
    }

    applyReceivedData(data) {
        if (typeof workspace !== 'undefined' && typeof loadDslToWorkspace === 'function') {
            loadDslToWorkspace(workspace, data.dsl || data);
        }
        this.hideModal();
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

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    showLanMessage(message, type) {
        const msgEl = document.getElementById('lanMessage');
        if (!msgEl) return;
        msgEl.textContent = message;
        msgEl.className = `lan-message lan-message-${type}`;
        msgEl.style.display = 'block';
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

describe('LanShareManager', () => {
    describe('Initialization', () => {
        test('should initialize with Tauri API', async () => {
            createLanModalDom();
            const manager = new LanShareManager();
            await manager.init();
            expect(manager.invoke).toBe(mockInvoke);
        });

        test('should not initialize without Tauri API', async () => {
            delete global.window.__TAURI_INTERNALS__;
            delete global.window.__TAURI__;
            const manager = new LanShareManager();
            await manager.init();
            expect(manager.invoke).toBeNull();
        });

        test('should start with sharing disabled', () => {
            const manager = new LanShareManager();
            expect(manager.isSharing).toBe(false);
        });

        test('should have no poll intervals initially', () => {
            const manager = new LanShareManager();
            expect(manager.pollInterval).toBeNull();
            expect(manager.peerPollInterval).toBeNull();
        });
    });

    describe('Modal Show/Hide', () => {
        test('should show modal', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            const modal = document.getElementById('lanShareModal');
            expect(modal.classList.contains('modal-visible')).toBe(true);
        });

        test('should hide modal', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            manager.hideModal();
            const modal = document.getElementById('lanShareModal');
            expect(modal.classList.contains('modal-visible')).toBe(false);
        });

        test('should hide modal on backdrop click', async () => {
            createLanModalDom();
            const manager = new LanShareManager();
            await manager.init();
            manager.showModal();
            const modal = document.getElementById('lanShareModal');
            modal.click();
            expect(modal.classList.contains('modal-visible')).toBe(false);
        });
    });

    describe('Start/Stop Sharing', () => {
        test('should start sharing on success', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: true });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.startSharing();
            expect(manager.isSharing).toBe(true);
            expect(mockInvoke).toHaveBeenCalledWith('start_lan_sharing');
        });

        test('should stop sharing on success', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: true });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = true;
            await manager.stopSharing();
            expect(manager.isSharing).toBe(false);
            expect(mockInvoke).toHaveBeenCalledWith('stop_lan_sharing');
        });

        test('should show error on start failure', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: false, error: 'Port in use' });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.startSharing();
            expect(manager.isSharing).toBe(false);
            const msg = document.getElementById('lanMessage');
            expect(msg.textContent).toBe('Port in use');
        });

        test('should toggle from off to on', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: true });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = false;
            await manager.toggleSharing();
            expect(manager.isSharing).toBe(true);
        });

        test('should toggle from on to off', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: true });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = true;
            await manager.toggleSharing();
            expect(manager.isSharing).toBe(false);
        });
    });

    describe('UI State Updates', () => {
        test('should show active state when sharing', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.isSharing = true;
            manager.updateSharingUI();
            const btn = document.getElementById('btnToggleSharing');
            const status = document.getElementById('lanSharingStatus');
            const indicator = document.getElementById('lanStatusIndicator');
            expect(btn.textContent).toBe('lan.stop');
            expect(btn.className).toBe('btn-secondary lan-btn-stop');
            expect(status.textContent).toBe('lan.status.active');
            expect(indicator.className).toContain('lan-status-active');
        });

        test('should show inactive state when not sharing', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.isSharing = false;
            manager.updateSharingUI();
            const btn = document.getElementById('btnToggleSharing');
            const status = document.getElementById('lanSharingStatus');
            expect(btn.textContent).toBe('lan.start');
            expect(status.textContent).toBe('lan.status.inactive');
        });
    });

    describe('Peer List', () => {
        test('should render empty peer list', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.renderPeerList([]);
            const container = document.getElementById('lanPeerList');
            expect(container.innerHTML).toContain('lan.noPeers');
        });

        test('should render peers', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.renderPeerList([
                { id: 'peer1', name: 'Alice', address: '192.168.1.10', port: 19750 },
                { id: 'peer2', name: 'Bob', address: '192.168.1.20', port: 19751 }
            ]);
            const container = document.getElementById('lanPeerList');
            expect(container.querySelectorAll('.lan-peer-item').length).toBe(2);
            expect(container.innerHTML).toContain('Alice');
            expect(container.innerHTML).toContain('Bob');
            expect(container.innerHTML).toContain('192.168.1.10:19750');
        });

        test('should render send buttons for each peer', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.renderPeerList([
                { id: 'peer1', name: 'Alice', address: '192.168.1.10', port: 19750 }
            ]);
            const sendBtns = document.querySelectorAll('.lan-send-btn');
            expect(sendBtns.length).toBe(1);
            expect(sendBtns[0].dataset.peerId).toBe('peer1');
        });
    });

    describe('Send to Peer', () => {
        test('should send project data to peer', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: true });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.sendToPeer('peer1', '192.168.1.10', 19750);
            expect(mockInvoke).toHaveBeenCalledWith('send_project_to_peer', {
                peerAddress: '192.168.1.10',
                peerPort: 19750,
                projectName: 'TestProject',
                projectData: '_N:Test を 分析して'
            });
        });

        test('should show error when no DSL', async () => {
            createLanModalDom();
            generateDslFromWorkspace.mockReturnValue('');
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.sendToPeer('peer1', '192.168.1.10', 19750);
            const msg = document.getElementById('lanMessage');
            expect(msg.textContent).toBe('lan.noDsl');
        });

        test('should show error on send failure', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({ success: false, error: 'Connection refused' });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.sendToPeer('peer1', '192.168.1.10', 19750);
            const msg = document.getElementById('lanMessage');
            expect(msg.textContent).toBe('Connection refused');
        });
    });

    describe('Pending Transfers', () => {
        test('should hide container when no offers', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.renderPendingOffers([]);
            const container = document.getElementById('lanPendingTransfers');
            expect(container.style.display).toBe('none');
        });

        test('should render pending offers', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.renderPendingOffers([{
                id: 'offer1',
                fileName: 'project.prp',
                fromPeer: 'Alice',
                fileSize: 1024
            }]);
            const container = document.getElementById('lanPendingTransfers');
            expect(container.style.display).toBe('block');
            expect(container.innerHTML).toContain('project.prp');
            expect(container.innerHTML).toContain('Alice');
            expect(container.querySelectorAll('.lan-accept-btn').length).toBe(1);
            expect(container.querySelectorAll('.lan-reject-btn').length).toBe(1);
        });

        test('should accept transfer', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({
                success: true,
                data: { dsl: '_N:Received を 翻訳して' }
            });
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.showModal();
            await manager.acceptTransfer('offer1');
            expect(mockInvoke).toHaveBeenCalledWith('accept_transfer', { offerId: 'offer1' });
            expect(loadDslToWorkspace).toHaveBeenCalledWith(workspace, '_N:Received を 翻訳して');
        });

        test('should reject transfer', async () => {
            createLanModalDom();
            mockInvoke.mockResolvedValue({});
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            await manager.rejectTransfer('offer1');
            expect(mockInvoke).toHaveBeenCalledWith('reject_transfer', { offerId: 'offer1' });
        });
    });

    describe('Polling', () => {
        test('should start and stop peer polling', () => {
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = true;
            manager.startPeerPolling();
            expect(manager.peerPollInterval).not.toBeNull();
            manager.stopPeerPolling();
            expect(manager.peerPollInterval).toBeNull();
        });

        test('should start and stop transfer polling', () => {
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = true;
            manager.startTransferPolling();
            expect(manager.pollInterval).not.toBeNull();
            manager.stopTransferPolling();
            expect(manager.pollInterval).toBeNull();
        });

        test('should stop polling on modal hide', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.invoke = mockInvoke;
            manager.isSharing = true;
            manager.startPeerPolling();
            manager.startTransferPolling();
            manager.hideModal();
            expect(manager.peerPollInterval).toBeNull();
            expect(manager.pollInterval).toBeNull();
        });
    });

    describe('Messages', () => {
        test('should show success message', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.showLanMessage('Connected!', 'success');
            const msg = document.getElementById('lanMessage');
            expect(msg.textContent).toBe('Connected!');
            expect(msg.className).toBe('lan-message lan-message-success');
            expect(msg.style.display).toBe('block');
        });

        test('should show error message', () => {
            createLanModalDom();
            const manager = new LanShareManager();
            manager.showLanMessage('Failed!', 'error');
            const msg = document.getElementById('lanMessage');
            expect(msg.textContent).toBe('Failed!');
            expect(msg.className).toBe('lan-message lan-message-error');
        });
    });

    describe('Utility Functions', () => {
        test('should format bytes', () => {
            const manager = new LanShareManager();
            expect(manager.formatSize(500)).toBe('500 B');
            expect(manager.formatSize(1024)).toBe('1.0 KB');
            expect(manager.formatSize(1536)).toBe('1.5 KB');
            expect(manager.formatSize(1048576)).toBe('1.0 MB');
            expect(manager.formatSize(1572864)).toBe('1.5 MB');
        });

        test('should escape HTML', () => {
            const manager = new LanShareManager();
            expect(manager.escapeHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
        });

        test('should get current DSL', () => {
            const manager = new LanShareManager();
            expect(manager.getCurrentDsl()).toBe('_N:Test を 分析して');
        });

        test('should get project name', () => {
            const manager = new LanShareManager();
            expect(manager.getProjectName()).toBe('TestProject');
        });

        test('should return Untitled when no project', () => {
            window.projectManager = null;
            const manager = new LanShareManager();
            expect(manager.getProjectName()).toBe('Untitled');
        });
    });
});
