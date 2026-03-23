/**
 * Promps Pro - Floating Palette
 *
 * Floating palette UI for favorite blocks.
 * Supports drag to move, minimize, and block insertion.
 * Pro feature - requires license.
 */

/**
 * Helper function to get translation with fallback
 */
function paletteT(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * FloatingPalette - Manages the floating favorites palette UI
 */
class FloatingPalette {
    constructor() {
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.blocksContainer = null;
        this.isDragging = false;
        this.isBlockDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragPreview = null;
        this.currentDragFavorite = null;

        this.init();
        this.bindEvents();
    }

    /**
     * Initialize the palette element
     */
    init() {
        this.element = document.getElementById('floatingPalette');
        if (!this.element) {
            console.warn('Floating palette element not found');
            return;
        }

        this.headerElement = this.element.querySelector('.floating-palette-header');
        this.contentElement = this.element.querySelector('.floating-palette-content');
        this.blocksContainer = this.element.querySelector('.floating-palette-blocks');

        // Restore state from manager
        if (window.blockFavoritesManager) {
            const state = window.blockFavoritesManager.getPaletteState();
            this.applyState(state);
        }

        // Initial render
        this.render();
    }

    /**
     * Apply saved palette state
     * @param {Object} state - Saved state
     */
    applyState(state) {
        if (!this.element) return;

        // Apply minimized state first
        if (state.isMinimized) {
            this.element.classList.add('minimized');
        }

        // Apply visibility
        if (state.isVisible) {
            this.element.style.display = 'flex';
        } else {
            this.element.style.display = 'none';
        }

        // Apply position - convert CSS bottom/right to left/top for dragging to work
        // Must be done AFTER showing the element so getBoundingClientRect works
        if (state.position && state.position.x !== null && state.position.y !== null) {
            // Use saved position
            this.element.style.left = `${state.position.x}px`;
            this.element.style.top = `${state.position.y}px`;
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
        } else if (state.isVisible) {
            // Convert CSS bottom/right positioning to left/top
            // This is needed for dragging to work properly
            const rect = this.element.getBoundingClientRect();
            this.element.style.left = `${rect.left}px`;
            this.element.style.top = `${rect.top}px`;
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!this.element) return;

        // Header drag to move palette
        if (this.headerElement) {
            this.headerElement.addEventListener('mousedown', this.onHeaderMouseDown.bind(this));
        }

        // Minimize button
        const minimizeBtn = this.element.querySelector('.palette-btn-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', this.toggleMinimize.bind(this));
        }

        // Close button
        const closeBtn = this.element.querySelector('.palette-btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hide.bind(this));
        }

        // Document events for dragging
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Listen for favorite changes
        window.addEventListener('blockfavoritechange', this.onFavoriteChange.bind(this));

        // Listen for locale changes to re-render
        window.addEventListener('localechange', this.onLocaleChange.bind(this));

        // Keyboard shortcut (Ctrl+B)
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * Handle header mousedown for palette dragging
     * @param {MouseEvent} e
     */
    onHeaderMouseDown(e) {
        // Don't start drag if clicking on buttons
        if (e.target.closest('.palette-btn')) return;

        this.isDragging = true;
        const rect = this.element.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.element.classList.add('dragging');
        e.preventDefault();
    }

    /**
     * Handle mouse move for dragging
     * @param {MouseEvent} e
     */
    onMouseMove(e) {
        // Palette dragging
        if (this.isDragging) {
            let newX = e.clientX - this.dragOffset.x;
            let newY = e.clientY - this.dragOffset.y;

            // Constrain to viewport
            const rect = this.element.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
        }

        // Block dragging
        if (this.isBlockDragging && this.dragPreview) {
            this.dragPreview.style.left = `${e.clientX - 30}px`;
            this.dragPreview.style.top = `${e.clientY - 15}px`;
        }
    }

    /**
     * Handle mouse up to end dragging
     * @param {MouseEvent} e
     */
    onMouseUp(e) {
        // End palette dragging
        if (this.isDragging) {
            this.isDragging = false;
            this.element.classList.remove('dragging');

            // Save position
            if (window.blockFavoritesManager) {
                const rect = this.element.getBoundingClientRect();
                window.blockFavoritesManager.updatePaletteState({
                    position: { x: rect.left, y: rect.top }
                });
            }
        }

        // End block dragging
        if (this.isBlockDragging) {
            this.endBlockDrag(e);
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e
     */
    onKeyDown(e) {
        // Ctrl+B to toggle palette
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            this.toggle();
        }
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        if (!this.element) return;

        this.element.classList.toggle('minimized');
        const isMinimized = this.element.classList.contains('minimized');

        // Save state
        if (window.blockFavoritesManager) {
            window.blockFavoritesManager.updatePaletteState({ isMinimized });
        }
    }

    /**
     * Show the palette
     */
    show() {
        if (!this.element) return;

        this.element.style.display = 'flex';

        // Save state
        if (window.blockFavoritesManager) {
            window.blockFavoritesManager.updatePaletteState({ isVisible: true });
        }
    }

    /**
     * Hide the palette
     */
    hide() {
        if (!this.element) return;

        this.element.style.display = 'none';

        // Save state
        if (window.blockFavoritesManager) {
            window.blockFavoritesManager.updatePaletteState({ isVisible: false });
        }
    }

    /**
     * Toggle palette visibility
     */
    toggle() {
        if (!this.element) return;

        if (this.element.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Check if palette is visible
     * @returns {boolean}
     */
    isVisible() {
        if (!this.element) return false;
        return this.element.style.display !== 'none';
    }

    /**
     * Handle favorite changes
     */
    onFavoriteChange() {
        this.render();
    }

    /**
     * Handle locale changes
     */
    onLocaleChange() {
        // Update title
        if (this.element) {
            const titleElement = this.element.querySelector('.palette-title');
            if (titleElement) {
                titleElement.textContent = paletteT('blockFavorites.palette.title', 'Favorites');
            }
        }
        // Re-render content
        this.render();
    }

    /**
     * Render the palette content
     */
    render() {
        if (!this.blocksContainer || !window.blockFavoritesManager) return;

        const favorites = window.blockFavoritesManager.getFavorites();

        if (favorites.length === 0) {
            this.blocksContainer.innerHTML = `
                <div class="palette-empty">
                    <p>${paletteT('blockFavorites.palette.empty', 'No favorites yet')}</p>
                    <small>${paletteT('blockFavorites.palette.hint', 'Right-click a block to add')}</small>
                </div>
            `;
            return;
        }

        this.blocksContainer.innerHTML = favorites.map(fav => `
            <div class="palette-block" data-favorite-id="${fav.id}" title="${fav.name}">
                <span class="palette-block-icon">${this.getBlockIcon(fav.blockType)}</span>
                <span class="palette-block-name">${this.truncateName(fav.name)}</span>
                <button class="palette-block-remove" data-favorite-id="${fav.id}" title="${paletteT('blockFavorites.remove', 'Remove')}">×</button>
            </div>
        `).join('');

        // Bind block events
        this.bindBlockEvents();
    }

    /**
     * Bind events to palette blocks
     */
    bindBlockEvents() {
        if (!this.blocksContainer) return;

        // Block drag start
        this.blocksContainer.querySelectorAll('.palette-block').forEach(block => {
            block.addEventListener('mousedown', this.onBlockMouseDown.bind(this));
        });

        // Remove buttons
        this.blocksContainer.querySelectorAll('.palette-block-remove').forEach(btn => {
            btn.addEventListener('click', this.onRemoveClick.bind(this));
        });
    }

    /**
     * Handle block mousedown for dragging
     * @param {MouseEvent} e
     */
    onBlockMouseDown(e) {
        // Don't start drag if clicking on remove button
        if (e.target.closest('.palette-block-remove')) return;

        const block = e.target.closest('.palette-block');
        if (!block) return;

        const favoriteId = block.dataset.favoriteId;
        if (!favoriteId || !window.blockFavoritesManager) return;

        const favorite = window.blockFavoritesManager.getFavorites().find(f => f.id === favoriteId);
        if (!favorite) return;

        this.isBlockDragging = true;
        this.currentDragFavorite = favorite;

        // Create drag preview
        this.dragPreview = document.createElement('div');
        this.dragPreview.className = 'palette-drag-preview';
        this.dragPreview.textContent = favorite.name;
        this.dragPreview.style.left = `${e.clientX - 30}px`;
        this.dragPreview.style.top = `${e.clientY - 15}px`;
        document.body.appendChild(this.dragPreview);

        e.preventDefault();
    }

    /**
     * End block drag and potentially insert into workspace
     * @param {MouseEvent} e
     */
    endBlockDrag(e) {
        if (!this.isBlockDragging) return;

        this.isBlockDragging = false;

        // Remove drag preview
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }

        if (!this.currentDragFavorite) return;

        // Check if dropped on workspace
        const blocklyDiv = document.getElementById('blocklyDiv');
        if (blocklyDiv && window.workspace) {
            const rect = blocklyDiv.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {

                // Convert screen coordinates to workspace coordinates
                const wsPoint = Blockly.utils.svgMath.screenToWsCoordinates(
                    window.workspace,
                    new Blockly.utils.Coordinate(e.clientX, e.clientY)
                );

                // Insert the block
                window.blockFavoritesManager.insertFavorite(
                    this.currentDragFavorite.id,
                    wsPoint.x,
                    wsPoint.y
                );
            }
        }

        this.currentDragFavorite = null;
    }

    /**
     * Handle remove button click
     * @param {MouseEvent} e
     */
    onRemoveClick(e) {
        e.stopPropagation();
        const favoriteId = e.target.dataset.favoriteId;
        if (favoriteId && window.blockFavoritesManager) {
            window.blockFavoritesManager.removeFavorite(favoriteId);
        }
    }

    /**
     * Get icon for block type
     * @param {string} blockType - Block type
     * @returns {string} Icon character
     */
    getBlockIcon(blockType) {
        if (blockType.includes('noun')) return '📝';
        if (blockType.includes('verb')) return '⚡';
        if (blockType.includes('particle')) return '🔗';
        if (blockType.includes('article')) return '📎';
        if (blockType.includes('other')) return '📌';
        return '🧩';
    }

    /**
     * Truncate name for display
     * @param {string} name - Name to truncate
     * @returns {string} Truncated name
     */
    truncateName(name) {
        const maxLen = 15;
        if (name.length <= maxLen) return name;
        return name.substring(0, maxLen - 2) + '…';
    }

    /**
     * Check if Ent license is active
     * @returns {boolean}
     */
    isEntLicensed() {
        return true;
    }
}

// Export class to global scope for license.js to use
window.FloatingPalette = FloatingPalette;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FloatingPalette };
}
