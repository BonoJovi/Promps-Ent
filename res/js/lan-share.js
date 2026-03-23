/**
 * Promps Ent - LAN P2P Share Manager (v2.0.0)
 *
 * Manages LAN peer discovery and file transfer for sharing prompts.
 * Uses Tauri commands for backend mDNS discovery and TCP transfer.
 */
class LanShareManager {
    constructor() {
        this.invoke = null;
        this.isSharing = false;
        this.pollInterval = null;
        this.peerPollInterval = null;
    }

    /**
     * Initialize the LAN share manager
     */
    async init() {
        if (window.__TAURI_INTERNALS__) {
            this.invoke = window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__) {
            this.invoke = window.__TAURI__.invoke;
        }

        if (!this.invoke) {
            console.error('LanShareManager: Tauri API not available');
            return;
        }

        this.setupEventListeners();
        console.log('LanShareManager initialized');
    }

    /**
     * Setup event listeners for LAN modal
     */
    setupEventListeners() {
        // Open LAN modal button
        const btnLanShare = document.getElementById('btnLanShare');
        if (btnLanShare) {
            btnLanShare.addEventListener('click', () => this.showModal());
        }

        // Close modal
        const btnClose = document.getElementById('btnCloseLanModal');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.hideModal());
        }

        // Start/Stop sharing toggle
        const btnToggleSharing = document.getElementById('btnToggleSharing');
        if (btnToggleSharing) {
            btnToggleSharing.addEventListener('click', () => this.toggleSharing());
        }

        // Refresh peers button
        const btnRefreshPeers = document.getElementById('btnRefreshPeers');
        if (btnRefreshPeers) {
            btnRefreshPeers.addEventListener('click', () => this.refreshPeers());
        }

        // Close on backdrop click
        const modal = document.getElementById('lanShareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }
    }

    /**
     * Show the LAN share modal
     */
    showModal() {
        const modal = document.getElementById('lanShareModal');
        if (modal) {
            modal.classList.add('modal-visible');
            this.updateSharingUI();
            if (this.isSharing) {
                this.startPeerPolling();
                this.startTransferPolling();
            }
        }
    }

    /**
     * Hide the LAN share modal
     */
    hideModal() {
        const modal = document.getElementById('lanShareModal');
        if (modal) {
            modal.classList.remove('modal-visible');
        }
        this.stopPeerPolling();
        this.stopTransferPolling();
    }

    /**
     * Toggle LAN sharing on/off
     */
    async toggleSharing() {
        if (this.isSharing) {
            await this.stopSharing();
        } else {
            await this.startSharing();
        }
    }

    /**
     * Start LAN sharing (mDNS + TCP listener)
     */
    async startSharing() {
        if (!this.invoke) return;

        try {
            const result = await this.invoke('start_lan_sharing');
            if (result.success) {
                this.isSharing = true;
                this.updateSharingUI();
                this.startPeerPolling();
                this.startTransferPolling();
                this.showLanMessage(t('lan.started'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.startFailed'), 'error');
            }
        } catch (error) {
            console.error('LAN sharing start failed:', error);
            this.showLanMessage(String(error), 'error');
        }
    }

    /**
     * Stop LAN sharing
     */
    async stopSharing() {
        if (!this.invoke) return;

        try {
            const result = await this.invoke('stop_lan_sharing');
            if (result.success) {
                this.isSharing = false;
                this.updateSharingUI();
                this.stopPeerPolling();
                this.stopTransferPolling();
                this.showLanMessage(t('lan.stopped'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.stopFailed'), 'error');
            }
        } catch (error) {
            console.error('LAN sharing stop failed:', error);
            this.showLanMessage(String(error), 'error');
        }
    }

    /**
     * Update sharing UI state
     */
    updateSharingUI() {
        const btnToggle = document.getElementById('btnToggleSharing');
        const statusText = document.getElementById('lanSharingStatus');
        const statusIndicator = document.getElementById('lanStatusIndicator');

        if (btnToggle) {
            btnToggle.textContent = this.isSharing ? t('lan.stop') : t('lan.start');
            btnToggle.className = this.isSharing
                ? 'btn-secondary lan-btn-stop'
                : 'btn-primary lan-btn-start';
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

    /**
     * Start polling for discovered peers
     */
    startPeerPolling() {
        this.stopPeerPolling();
        this.refreshPeers();
        this.peerPollInterval = setInterval(() => this.refreshPeers(), 3000);
    }

    /**
     * Stop polling for peers
     */
    stopPeerPolling() {
        if (this.peerPollInterval) {
            clearInterval(this.peerPollInterval);
            this.peerPollInterval = null;
        }
    }

    /**
     * Refresh the peer list
     */
    async refreshPeers() {
        if (!this.invoke || !this.isSharing) return;

        try {
            const result = await this.invoke('get_lan_peers');
            this.renderPeerList(result.peers || []);
        } catch (error) {
            console.error('Failed to get peers:', error);
        }
    }

    /**
     * Render the peer list UI
     */
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

        // Add click listeners to send buttons
        container.querySelectorAll('.lan-send-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const peerId = btn.dataset.peerId;
                const address = btn.dataset.peerAddress;
                const port = parseInt(btn.dataset.peerPort);
                this.sendToPeer(peerId, address, port);
            });
        });
    }

    /**
     * Send current project to a peer
     */
    async sendToPeer(peerId, address, port) {
        if (!this.invoke) return;

        const dsl = this.getCurrentDsl();
        if (!dsl || dsl.trim() === '') {
            this.showLanMessage(t('lan.noDsl'), 'error');
            return;
        }

        // Send workspace state (JSON) for proper block reconstruction
        const workspaceState = this.getWorkspaceState();
        const name = this.getProjectName();

        try {
            const result = await this.invoke('send_project_to_peer', {
                peerAddress: address,
                peerPort: port,
                projectName: name,
                projectData: workspaceState
            });

            if (result.success) {
                this.showLanMessage(t('lan.sent'), 'success');
            } else {
                this.showLanMessage(result.error || t('lan.sendFailed'), 'error');
            }
        } catch (error) {
            console.error('Send to peer failed:', error);
            this.showLanMessage(String(error), 'error');
        }
    }

    /**
     * Start polling for pending transfer offers
     */
    startTransferPolling() {
        this.stopTransferPolling();
        this.pollInterval = setInterval(() => this.checkPendingTransfers(), 2000);
    }

    /**
     * Stop polling for transfers
     */
    stopTransferPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Check for pending transfer offers
     */
    async checkPendingTransfers() {
        if (!this.invoke || !this.isSharing) return;

        try {
            const result = await this.invoke('get_pending_transfers');
            const offers = result.offers || [];
            this.renderPendingOffers(offers);
        } catch (error) {
            console.error('Failed to check pending transfers:', error);
        }
    }

    /**
     * Render pending transfer offers
     */
    renderPendingOffers(offers) {
        const container = document.getElementById('lanPendingTransfers');
        if (!container) return;

        if (offers.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <h4>${t('lan.pendingTransfers')}</h4>
            ${offers.map(offer => `
                <div class="lan-transfer-item" data-offer-id="${this.escapeHtml(offer.id)}">
                    <div class="lan-transfer-info">
                        <span class="lan-transfer-name">${this.escapeHtml(offer.fileName)}</span>
                        <span class="lan-transfer-from">${t('lan.from')}: ${this.escapeHtml(offer.fromPeer)}</span>
                        <span class="lan-transfer-size">${this.formatSize(offer.fileSize)}</span>
                    </div>
                    <div class="lan-transfer-actions">
                        <button class="btn-primary btn-small lan-accept-btn" data-offer-id="${this.escapeHtml(offer.id)}">
                            ${t('lan.accept')}
                        </button>
                        <button class="btn-secondary btn-small lan-reject-btn" data-offer-id="${this.escapeHtml(offer.id)}">
                            ${t('lan.reject')}
                        </button>
                    </div>
                </div>
            `).join('')}
        `;

        // Add click listeners
        container.querySelectorAll('.lan-accept-btn').forEach(btn => {
            btn.addEventListener('click', () => this.acceptTransfer(btn.dataset.offerId));
        });
        container.querySelectorAll('.lan-reject-btn').forEach(btn => {
            btn.addEventListener('click', () => this.rejectTransfer(btn.dataset.offerId));
        });
    }

    /**
     * Accept a pending transfer
     */
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
            console.error('Accept transfer failed:', error);
            this.showLanMessage(String(error), 'error');
        }
    }

    /**
     * Reject a pending transfer
     */
    async rejectTransfer(offerId) {
        if (!this.invoke) return;

        try {
            await this.invoke('reject_transfer', { offerId });
            this.showLanMessage(t('lan.rejected'), 'success');
        } catch (error) {
            console.error('Reject transfer failed:', error);
        }
    }

    /**
     * Apply received data to workspace
     */
    applyReceivedData(data) {
        const raw = data.dsl || data;
        if (typeof workspace !== 'undefined' && typeof Blockly !== 'undefined') {
            try {
                const state = JSON.parse(raw);
                if (typeof loadWorkspaceState === 'function') {
                    loadWorkspaceState(state);
                } else {
                    workspace.clear();
                    Blockly.serialization.workspaces.load(state, workspace);
                }
            } catch (e) {
                console.error('Failed to parse received workspace data:', e);
            }
        }
        this.hideModal();
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
     * Get workspace serialization state as JSON string
     */
    getWorkspaceState() {
        if (typeof workspace !== 'undefined' && typeof Blockly !== 'undefined') {
            return JSON.stringify(Blockly.serialization.workspaces.save(workspace));
        }
        return '{}';
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
     * Format file size for display
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Show a message in the LAN modal
     */
    showLanMessage(message, type) {
        const msgEl = document.getElementById('lanMessage');
        if (!msgEl) return;

        msgEl.textContent = message;
        msgEl.className = `lan-message lan-message-${type}`;
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
window.lanShareManager = new LanShareManager();
