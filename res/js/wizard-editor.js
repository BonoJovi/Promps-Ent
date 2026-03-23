/**
 * Promps Ent - Wizard Editor
 *
 * Allows users to create, edit, and delete custom wizard templates.
 * Ent exclusive feature.
 */

// Initialize wizardEditor namespace
window.wizardEditor = window.wizardEditor || {};

/**
 * Helper function to get translation with fallback
 */
function wet(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

/**
 * Block type categories for two-level selection.
 * Category select (max 5 items) → Sub-item select (max 9 items).
 * Article category is excluded for Japanese locale.
 */
const BLOCK_CATEGORIES = [
    {
        id: 'noun',
        labels: { ja: '名詞', en: 'Noun', fr: 'Nom' },
        items: [
            { value: 'promps_noun', hasDefault: true, labels: { ja: '名詞', en: 'Noun', fr: 'Nom' } },
        ]
    },
    {
        id: 'particle',
        jaOnly: true,
        labels: { ja: '助詞', en: 'Particle', fr: 'Particule' },
        items: [
            { value: 'promps_particle_ga', labels: { ja: 'が (ga)', en: 'が (ga)', fr: 'が (ga)' } },
            { value: 'promps_particle_wo', labels: { ja: 'を (wo)', en: 'を (wo)', fr: 'を (wo)' } },
            { value: 'promps_particle_ni', labels: { ja: 'に (ni)', en: 'に (ni)', fr: 'に (ni)' } },
            { value: 'promps_particle_de', labels: { ja: 'で (de)', en: 'で (de)', fr: 'で (de)' } },
            { value: 'promps_particle_to', labels: { ja: 'と (to)', en: 'と (to)', fr: 'と (to)' } },
            { value: 'promps_particle_he', labels: { ja: 'へ (he)', en: 'へ (he)', fr: 'へ (he)' } },
            { value: 'promps_particle_kara', labels: { ja: 'から (kara)', en: 'から (kara)', fr: 'から (kara)' } },
            { value: 'promps_particle_made', labels: { ja: 'まで (made)', en: 'まで (made)', fr: 'まで (made)' } },
            { value: 'promps_particle_yori', labels: { ja: 'より (yori)', en: 'より (yori)', fr: 'より (yori)' } },
        ]
    },
    {
        id: 'verb',
        labels: { ja: '動詞', en: 'Verb', fr: 'Verbe' },
        items: [
            { value: 'promps_verb_analyze', labels: { ja: '分析して', en: 'analyze', fr: 'analyser' } },
            { value: 'promps_verb_summarize', labels: { ja: '要約して', en: 'summarize', fr: 'résumer' } },
            { value: 'promps_verb_translate', labels: { ja: '翻訳して', en: 'translate', fr: 'traduire' } },
            { value: 'promps_verb_create', labels: { ja: '作成して', en: 'create', fr: 'créer' } },
            { value: 'promps_verb_custom', hasDefault: true, labels: { ja: 'カスタム動詞', en: 'Custom Verb', fr: 'Verbe perso.' } },
        ]
    },
    {
        id: 'other',
        labels: { ja: 'その他', en: 'Other', fr: 'Autre' },
        items: [
            { value: 'promps_other', hasDefault: true, labels: { ja: 'その他', en: 'Other', fr: 'Autre' } },
        ]
    },
    {
        id: 'article',
        articleOnly: true,
        labels: { ja: 'Articles', en: 'Articles', fr: 'Articles' },
        items: [
            { value: 'promps_article_a', labels: { ja: 'a', en: 'a', fr: 'un' } },
            { value: 'promps_article_an', labels: { ja: 'an', en: 'an', fr: 'une' } },
            { value: 'promps_article_the', labels: { ja: 'the', en: 'the', fr: 'le' } },
            { value: 'promps_article_this', labels: { ja: 'this', en: 'this', fr: 'ce' } },
            { value: 'promps_article_that', labels: { ja: 'that', en: 'that', fr: 'cette' } },
            { value: 'promps_article_please', labels: { ja: 'please', en: 'please', fr: 'veuillez' } },
        ]
    },
];

/**
 * Get flat block types list for lookup/validation.
 */
function getBlockTypes() {
    const locale = (window.currentLocale || document.documentElement.lang || 'ja').substring(0, 2);
    const result = [];
    for (const cat of BLOCK_CATEGORIES) {
        if (cat.articleOnly && locale === 'ja') continue;
        if (cat.jaOnly && locale !== 'ja') continue;
        for (const item of cat.items) {
            result.push({
                value: item.value,
                label: item.labels[locale] || item.labels['en'],
                hasDefault: item.hasDefault || false
            });
        }
    }
    return result;
}

/**
 * Get available categories for the current locale.
 */
function getCategories() {
    const locale = (window.currentLocale || document.documentElement.lang || 'ja').substring(0, 2);
    return BLOCK_CATEGORIES
        .filter(cat => !(cat.articleOnly && locale === 'ja') && !(cat.jaOnly && locale !== 'ja'))
        .map(cat => ({
            id: cat.id,
            label: cat.labels[locale] || cat.labels['en'],
            items: cat.items.map(item => ({
                value: item.value,
                label: item.labels[locale] || item.labels['en'],
                hasDefault: item.hasDefault || false
            }))
        }));
}

/**
 * Find which category a block_type value belongs to.
 */
function findCategoryForValue(value) {
    for (const cat of BLOCK_CATEGORIES) {
        if (cat.items.some(item => item.value === value)) return cat.id;
    }
    return 'noun';
}

/**
 * Wizard Editor class
 */
class WizardEditor {
    constructor() {
        this.modal = null;
        this.editingWizard = null; // null = creating new, object = editing existing
        this.steps = [];
        this.blockRules = [];
        this.fallbackBlocks = [];
        this.selectedIcon = '\uD83E\uDDD9';
    }

    /**
     * Initialize the editor
     */
    init() {
        this.modal = document.getElementById('wizardEditorModal');
        if (!this.modal) {
            console.warn('Wizard editor modal not found');
            return;
        }

        this.bindEvents();
        console.log('Wizard Editor initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const closeBtn = document.getElementById('btnCloseWizardEditor');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideEditor());
        }

        const cancelBtn = document.getElementById('btnWizardEditorCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideEditor());
        }

        const saveBtn = document.getElementById('btnWizardEditorSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveWizard());
        }

        const addStepBtn = document.getElementById('btnAddWizardStep');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => this.addStep());
        }

        const addRuleBtn = document.getElementById('btnAddBlockRule');
        if (addRuleBtn) {
            addRuleBtn.addEventListener('click', () => this.addBlockRule());
        }

        const addFallbackBtn = document.getElementById('btnAddFallbackBlock');
        if (addFallbackBtn) {
            addFallbackBtn.addEventListener('click', () => this.addFallbackBlock());
        }

        // Icon picker
        const iconPicker = document.getElementById('wizardEditorIconPicker');
        if (iconPicker) {
            iconPicker.addEventListener('click', (e) => {
                const option = e.target.closest('.wizard-icon-option');
                if (option) {
                    iconPicker.querySelectorAll('.wizard-icon-option').forEach(el => el.classList.remove('selected'));
                    option.classList.add('selected');
                    this.selectedIcon = option.dataset.icon;
                }
            });
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideEditor();
            }
        });
    }

    /**
     * Show the editor (new or edit mode)
     */
    showEditor(existingWizard) {
        if (!this.modal) return;

        this.editingWizard = existingWizard || null;

        if (existingWizard) {
            // Edit mode - populate fields
            this.populateFromWizard(existingWizard);
        } else {
            // Create mode - reset
            this.resetEditor();
        }

        this.modal.classList.add('modal-visible');
    }

    /**
     * Hide the editor and return to wizard modal
     */
    hideEditor() {
        if (this.modal) {
            this.modal.classList.remove('modal-visible');
        }
        if (window.wizardManager && typeof window.wizardManager.showModal === 'function') {
            window.wizardManager.showModal();
        }
    }

    /**
     * Reset editor to empty state
     */
    resetEditor() {
        const nameInput = document.getElementById('wizardEditorName');
        const descInput = document.getElementById('wizardEditorDescription');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';

        this.selectedIcon = '\uD83E\uDDD9';
        const iconPicker = document.getElementById('wizardEditorIconPicker');
        if (iconPicker) {
            iconPicker.querySelectorAll('.wizard-icon-option').forEach(el => {
                el.classList.toggle('selected', el.dataset.icon === this.selectedIcon);
            });
        }

        this.steps = [];
        this.blockRules = [];
        this.fallbackBlocks = [];
        this.renderSteps();
        this.renderBlockRules();
        this.renderFallbackBlocks();
    }

    /**
     * Populate editor from existing wizard
     */
    populateFromWizard(wizard) {
        const nameInput = document.getElementById('wizardEditorName');
        const descInput = document.getElementById('wizardEditorDescription');
        if (nameInput) nameInput.value = wizard.name || '';
        if (descInput) descInput.value = wizard.description || '';

        this.selectedIcon = wizard.icon || '\uD83E\uDDD9';
        const iconPicker = document.getElementById('wizardEditorIconPicker');
        if (iconPicker) {
            iconPicker.querySelectorAll('.wizard-icon-option').forEach(el => {
                el.classList.toggle('selected', el.dataset.icon === this.selectedIcon);
            });
        }

        // Deep clone steps
        this.steps = JSON.parse(JSON.stringify(wizard.steps || []));
        this.blockRules = JSON.parse(JSON.stringify(wizard.block_rules || []));
        this.fallbackBlocks = JSON.parse(JSON.stringify(wizard.fallback_blocks || []));

        this.renderSteps();
        this.renderBlockRules();
        this.renderFallbackBlocks();
    }

    /**
     * Add a new step
     */
    addStep() {
        this.steps.push({
            id: 'step_' + Date.now(),
            title: '',
            description: '',
            input_type: 'radio',
            options: [
                { value: '', label: '' }
            ],
            required: true
        });
        this.renderSteps();
    }

    /**
     * Remove a step
     */
    removeStep(index) {
        this.steps.splice(index, 1);
        this.renderSteps();
    }

    /**
     * Add option to a step
     */
    addOption(stepIndex) {
        this.steps[stepIndex].options.push({ value: '', label: '' });
        this.renderSteps();
    }

    /**
     * Remove option from a step
     */
    removeOption(stepIndex, optIndex) {
        this.steps[stepIndex].options.splice(optIndex, 1);
        this.renderSteps();
    }

    /**
     * Render all steps in the editor
     */
    renderSteps() {
        const container = document.getElementById('wizardEditorSteps');
        if (!container) return;

        container.innerHTML = '';

        this.steps.forEach((step, stepIdx) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'wizard-editor-step';

            let optionsHtml = '';
            step.options.forEach((opt, optIdx) => {
                optionsHtml += `
                    <div class="wizard-editor-option">
                        <input type="text" placeholder="${wet('wizard.editor.optionValue', 'Value')}"
                               value="${this.escapeHtml(opt.value)}" data-step="${stepIdx}" data-opt="${optIdx}" data-field="value" />
                        <input type="text" placeholder="${wet('wizard.editor.optionLabel', 'Label')}"
                               value="${this.escapeHtml(opt.label)}" data-step="${stepIdx}" data-opt="${optIdx}" data-field="label" />
                        <button class="btn-delete" data-step="${stepIdx}" data-opt="${optIdx}" data-action="removeOption">${wet('wizard.editor.deleteOption', 'Delete')}</button>
                    </div>
                `;
            });

            stepDiv.innerHTML = `
                <div class="wizard-editor-step-header">
                    <span class="wizard-editor-step-number">${wet('wizard.editor.steps', 'Step')} ${stepIdx + 1}</span>
                    <button class="btn-delete" data-step="${stepIdx}" data-action="removeStep">${wet('wizard.editor.deleteStep', 'Delete')}</button>
                </div>
                <input type="text" placeholder="${wet('wizard.editor.stepTitle', 'Step Title')}"
                       value="${this.escapeHtml(step.title)}" data-step="${stepIdx}" data-field="title" />
                <input type="text" placeholder="${wet('wizard.editor.stepDescription', 'Step Description')}"
                       value="${this.escapeHtml(step.description)}" data-step="${stepIdx}" data-field="description" />
                <div class="wizard-editor-options">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${wet('wizard.editor.options', 'Options')}</span>
                        <button class="btn-small btn-secondary" data-step="${stepIdx}" data-action="addOption">${wet('wizard.editor.addOption', 'Add')}</button>
                    </div>
                    ${optionsHtml}
                </div>
            `;

            // Bind events
            stepDiv.addEventListener('input', (e) => {
                const input = e.target;
                const si = parseInt(input.dataset.step);
                const field = input.dataset.field;
                const oi = input.dataset.opt !== undefined ? parseInt(input.dataset.opt) : null;

                if (oi !== null && field) {
                    this.steps[si].options[oi][field] = input.value;
                } else if (field) {
                    this.steps[si][field] = input.value;
                }
            });

            stepDiv.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;

                const action = btn.dataset.action;
                const si = parseInt(btn.dataset.step);

                if (action === 'removeStep') {
                    this.removeStep(si);
                } else if (action === 'addOption') {
                    this.addOption(si);
                } else if (action === 'removeOption') {
                    const oi = parseInt(btn.dataset.opt);
                    this.removeOption(si, oi);
                }
            });

            container.appendChild(stepDiv);
        });
    }

    /**
     * Add a new block rule
     */
    addBlockRule() {
        this.blockRules.push({
            conditions: {},
            blocks: [
                { block_type: 'promps_noun', default_value: '' }
            ]
        });
        this.renderBlockRules();
    }

    /**
     * Remove a block rule
     */
    removeBlockRule(index) {
        this.blockRules.splice(index, 1);
        this.renderBlockRules();
    }

    /**
     * Add block to a rule
     */
    addBlockToRule(ruleIndex) {
        this.blockRules[ruleIndex].blocks.push({
            block_type: 'promps_noun',
            default_value: ''
        });
        this.renderBlockRules();
    }

    /**
     * Remove block from a rule
     */
    removeBlockFromRule(ruleIndex, blockIndex) {
        this.blockRules[ruleIndex].blocks.splice(blockIndex, 1);
        this.renderBlockRules();
    }

    /**
     * Render block rules
     */
    renderBlockRules() {
        const container = document.getElementById('wizardEditorBlockRules');
        if (!container) return;

        container.innerHTML = '';

        this.blockRules.forEach((rule, ruleIdx) => {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'wizard-editor-rule';

            // Conditions UI
            let conditionsHtml = '<div class="wizard-editor-conditions">';
            conditionsHtml += `<span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${wet('wizard.editor.conditions', 'Conditions')}</span>`;

            this.steps.forEach((step, stepIdx) => {
                const currentVal = rule.conditions[step.id] || '';
                let optionsSelectHtml = `<option value="">--</option>`;
                step.options.forEach((opt) => {
                    const sel = currentVal === opt.value ? 'selected' : '';
                    optionsSelectHtml += `<option value="${this.escapeHtml(opt.value)}" ${sel}>${this.escapeHtml(opt.label || opt.value)}</option>`;
                });

                const stepLabel = step.title || `${wet('wizard.editor.steps', 'Step')} ${stepIdx + 1}`;
                conditionsHtml += `
                    <div class="wizard-editor-condition">
                        <span style="font-size: 0.8rem; min-width: 60px;">${this.escapeHtml(stepLabel)}</span>
                        <select data-rule="${ruleIdx}" data-step-id="${step.id}" data-field="condition">
                            ${optionsSelectHtml}
                        </select>
                    </div>
                `;
            });
            conditionsHtml += '</div>';

            // Blocks UI
            let blocksHtml = '<div class="wizard-editor-blocks">';
            blocksHtml += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${wet('wizard.editor.blocks', 'Blocks')}</span>
                <button class="btn-small btn-secondary" data-rule="${ruleIdx}" data-action="addBlockToRule">+</button>
            </div>`;

            rule.blocks.forEach((block, blockIdx) => {
                const blockType = getBlockTypes().find(bt => bt.value === block.block_type);
                const showDefault = blockType ? blockType.hasDefault : false;
                const categories = getCategories();
                const currentCatId = findCategoryForValue(block.block_type);
                const currentCat = categories.find(c => c.id === currentCatId);
                const showSub = currentCat && currentCat.items.length > 1;

                let catOptions = '';
                categories.forEach(cat => {
                    const sel = cat.id === currentCatId ? 'selected' : '';
                    catOptions += `<option value="${cat.id}" ${sel}>${cat.label}</option>`;
                });

                let subOptions = '';
                if (currentCat) {
                    currentCat.items.forEach(item => {
                        const sel = item.value === block.block_type ? 'selected' : '';
                        subOptions += `<option value="${item.value}" ${sel}>${item.label}</option>`;
                    });
                }

                blocksHtml += `
                    <div class="wizard-editor-block">
                        <select data-rule="${ruleIdx}" data-block="${blockIdx}" data-field="block_category">
                            ${catOptions}
                        </select>
                        <select data-rule="${ruleIdx}" data-block="${blockIdx}" data-field="block_type"
                                style="${showSub ? '' : 'display:none'}">
                            ${subOptions}
                        </select>
                        <input type="text" placeholder="${wet('wizard.editor.defaultValue', 'Default')}"
                               value="${this.escapeHtml(block.default_value || '')}"
                               data-rule="${ruleIdx}" data-block="${blockIdx}" data-field="default_value"
                               style="${showDefault ? '' : 'display:none'}" />
                        <button class="btn-delete" data-rule="${ruleIdx}" data-block="${blockIdx}" data-action="removeBlockFromRule">\u2715</button>
                    </div>
                `;
            });
            blocksHtml += '</div>';

            ruleDiv.innerHTML = `
                <div class="wizard-editor-rule-header">
                    <span style="font-weight: 600; font-size: 0.85rem;">${wet('wizard.editor.rule', 'Rule')} ${ruleIdx + 1}</span>
                    <button class="btn-delete" data-rule="${ruleIdx}" data-action="removeRule">${wet('wizard.editor.deleteRule', 'Delete')}</button>
                </div>
                ${conditionsHtml}
                ${blocksHtml}
            `;

            // Bind events
            ruleDiv.addEventListener('change', (e) => {
                const el = e.target;
                const ri = parseInt(el.dataset.rule);
                const field = el.dataset.field;

                if (field === 'condition') {
                    const stepId = el.dataset.stepId;
                    if (el.value) {
                        this.blockRules[ri].conditions[stepId] = el.value;
                    } else {
                        delete this.blockRules[ri].conditions[stepId];
                    }
                } else if (field === 'block_category') {
                    const bi = parseInt(el.dataset.block);
                    const categories = getCategories();
                    const cat = categories.find(c => c.id === el.value);
                    if (cat) {
                        // Set block_type to first item in category
                        this.blockRules[ri].blocks[bi].block_type = cat.items[0].value;
                        this.blockRules[ri].blocks[bi].default_value = null;
                        // Update sub-select
                        const subSelect = ruleDiv.querySelector(`select[data-rule="${ri}"][data-block="${bi}"][data-field="block_type"]`);
                        if (subSelect) {
                            subSelect.innerHTML = cat.items.map(item =>
                                `<option value="${item.value}">${item.label}</option>`
                            ).join('');
                            subSelect.style.display = cat.items.length > 1 ? '' : 'none';
                        }
                        // Show/hide default value input
                        const bt = cat.items[0];
                        const defaultInput = ruleDiv.querySelector(`input[data-rule="${ri}"][data-block="${bi}"][data-field="default_value"]`);
                        if (defaultInput) {
                            defaultInput.style.display = bt && bt.hasDefault ? '' : 'none';
                            defaultInput.value = '';
                        }
                    }
                } else if (field === 'block_type') {
                    const bi = parseInt(el.dataset.block);
                    this.blockRules[ri].blocks[bi].block_type = el.value;
                    // Show/hide default value input
                    const bt = getBlockTypes().find(b => b.value === el.value);
                    const defaultInput = ruleDiv.querySelector(`input[data-rule="${ri}"][data-block="${bi}"][data-field="default_value"]`);
                    if (defaultInput) {
                        defaultInput.style.display = bt && bt.hasDefault ? '' : 'none';
                        if (!bt || !bt.hasDefault) {
                            defaultInput.value = '';
                            this.blockRules[ri].blocks[bi].default_value = null;
                        }
                    }
                }
            });

            ruleDiv.addEventListener('input', (e) => {
                const el = e.target;
                if (el.dataset.field === 'default_value') {
                    const ri = parseInt(el.dataset.rule);
                    const bi = parseInt(el.dataset.block);
                    this.blockRules[ri].blocks[bi].default_value = el.value || null;
                }
            });

            ruleDiv.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;

                const action = btn.dataset.action;
                const ri = parseInt(btn.dataset.rule);

                if (action === 'removeRule') {
                    this.removeBlockRule(ri);
                } else if (action === 'addBlockToRule') {
                    this.addBlockToRule(ri);
                } else if (action === 'removeBlockFromRule') {
                    const bi = parseInt(btn.dataset.block);
                    this.removeBlockFromRule(ri, bi);
                }
            });

            container.appendChild(ruleDiv);
        });
    }

    /**
     * Add a fallback block
     */
    addFallbackBlock() {
        this.fallbackBlocks.push({
            block_type: 'promps_noun',
            default_value: ''
        });
        this.renderFallbackBlocks();
    }

    /**
     * Remove a fallback block
     */
    removeFallbackBlock(index) {
        this.fallbackBlocks.splice(index, 1);
        this.renderFallbackBlocks();
    }

    /**
     * Render fallback blocks
     */
    renderFallbackBlocks() {
        const container = document.getElementById('wizardEditorFallbackBlocks');
        if (!container) return;

        container.innerHTML = '';

        this.fallbackBlocks.forEach((block, blockIdx) => {
            const blockType = getBlockTypes().find(bt => bt.value === block.block_type);
            const showDefault = blockType ? blockType.hasDefault : false;
            const categories = getCategories();
            const currentCatId = findCategoryForValue(block.block_type);
            const currentCat = categories.find(c => c.id === currentCatId);
            const showSub = currentCat && currentCat.items.length > 1;

            let catOptions = '';
            categories.forEach(cat => {
                const sel = cat.id === currentCatId ? 'selected' : '';
                catOptions += `<option value="${cat.id}" ${sel}>${cat.label}</option>`;
            });

            let subOptions = '';
            if (currentCat) {
                currentCat.items.forEach(item => {
                    const sel = item.value === block.block_type ? 'selected' : '';
                    subOptions += `<option value="${item.value}" ${sel}>${item.label}</option>`;
                });
            }

            const blockDiv = document.createElement('div');
            blockDiv.className = 'wizard-editor-block';
            blockDiv.innerHTML = `
                <select data-fb="${blockIdx}" data-field="block_category">
                    ${catOptions}
                </select>
                <select data-fb="${blockIdx}" data-field="block_type"
                        style="${showSub ? '' : 'display:none'}">
                    ${subOptions}
                </select>
                <input type="text" placeholder="${wet('wizard.editor.defaultValue', 'Default')}"
                       value="${this.escapeHtml(block.default_value || '')}"
                       data-fb="${blockIdx}" data-field="default_value"
                       style="${showDefault ? '' : 'display:none'}" />
                <button class="btn-delete" data-fb="${blockIdx}" data-action="removeFallback">\u2715</button>
            `;

            // Auto-scroll modal to bottom when fallback block selects get focus
            blockDiv.addEventListener('focus', (e) => {
                if (e.target.tagName === 'SELECT') {
                    const modal = document.querySelector('.wizard-editor-modal');
                    if (modal) {
                        modal.scrollTop = modal.scrollHeight;
                    }
                }
            }, true);

            blockDiv.addEventListener('change', (e) => {
                const el = e.target;
                const fi = parseInt(el.dataset.fb);
                if (el.dataset.field === 'block_category') {
                    const cats = getCategories();
                    const cat = cats.find(c => c.id === el.value);
                    if (cat) {
                        this.fallbackBlocks[fi].block_type = cat.items[0].value;
                        this.fallbackBlocks[fi].default_value = null;
                        const subSelect = blockDiv.querySelector(`select[data-fb="${fi}"][data-field="block_type"]`);
                        if (subSelect) {
                            subSelect.innerHTML = cat.items.map(item =>
                                `<option value="${item.value}">${item.label}</option>`
                            ).join('');
                            subSelect.style.display = cat.items.length > 1 ? '' : 'none';
                        }
                        const bt = cat.items[0];
                        const defaultInput = blockDiv.querySelector(`input[data-fb="${fi}"][data-field="default_value"]`);
                        if (defaultInput) {
                            defaultInput.style.display = bt && bt.hasDefault ? '' : 'none';
                            defaultInput.value = '';
                        }
                    }
                } else if (el.dataset.field === 'block_type') {
                    this.fallbackBlocks[fi].block_type = el.value;
                    const bt = getBlockTypes().find(b => b.value === el.value);
                    const defaultInput = blockDiv.querySelector(`input[data-fb="${fi}"][data-field="default_value"]`);
                    if (defaultInput) {
                        defaultInput.style.display = bt && bt.hasDefault ? '' : 'none';
                        if (!bt || !bt.hasDefault) {
                            defaultInput.value = '';
                            this.fallbackBlocks[fi].default_value = null;
                        }
                    }
                }
            });

            blockDiv.addEventListener('input', (e) => {
                const el = e.target;
                if (el.dataset.field === 'default_value') {
                    const fi = parseInt(el.dataset.fb);
                    this.fallbackBlocks[fi].default_value = el.value || null;
                }
            });

            blockDiv.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="removeFallback"]');
                if (btn) {
                    const fi = parseInt(btn.dataset.fb);
                    this.removeFallbackBlock(fi);
                }
            });

            container.appendChild(blockDiv);
        });
    }

    /**
     * Validate and save the wizard
     */
    saveWizard() {
        const nameInput = document.getElementById('wizardEditorName');
        const descInput = document.getElementById('wizardEditorDescription');

        const name = nameInput ? nameInput.value.trim() : '';
        const description = descInput ? descInput.value.trim() : '';

        if (!name) {
            alert(wet('wizard.editor.nameRequired', 'Please enter a wizard name'));
            if (nameInput) nameInput.focus();
            return;
        }

        if (this.steps.length === 0) {
            alert(wet('wizard.editor.stepRequired', 'At least one step is required'));
            return;
        }

        // Build wizard object
        const wizard = {
            name: name,
            description: description,
            icon: this.selectedIcon,
            steps: this.steps.map(s => ({
                id: s.id,
                title: s.title,
                description: s.description,
                input_type: s.input_type || 'radio',
                options: s.options.filter(o => o.value || o.label),
                required: s.required !== false
            })),
            block_rules: this.blockRules.map(r => ({
                conditions: { ...r.conditions },
                blocks: r.blocks.map(b => ({
                    block_type: b.block_type,
                    default_value: b.default_value || null,
                    value_from_step: b.value_from_step || null
                }))
            })),
            fallback_blocks: this.fallbackBlocks.map(b => ({
                block_type: b.block_type,
                default_value: b.default_value || null,
                value_from_step: b.value_from_step || null
            }))
        };

        if (this.editingWizard && this.editingWizard.id) {
            // Update existing
            if (window.wizardManager) {
                window.wizardManager.updateCustomWizard(this.editingWizard.id, wizard);
            }
        } else {
            // Create new
            if (window.wizardManager) {
                window.wizardManager.addCustomWizard(wizard);
            }
        }

        this.hideEditor();

        // Show the wizard modal with updated list
        if (window.wizardManager) {
            window.wizardManager.showModal();
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Create and export instance
const wizardEditorInstance = new WizardEditor();

window.wizardEditor.init = () => wizardEditorInstance.init();
window.wizardEditor.showEditor = (wizard) => wizardEditorInstance.showEditor(wizard);
window.wizardEditor.hideEditor = () => wizardEditorInstance.hideEditor();

// Expose for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WizardEditor, BLOCK_CATEGORIES, getBlockTypes, getCategories, findCategoryForValue };
}

console.log('Wizard Editor module loaded');
