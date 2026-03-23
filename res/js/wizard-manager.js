/**
 * Promps Ent - Wizard Manager
 *
 * Provides step-by-step guided prompt building.
 * Users select a wizard, answer questions, and blocks are auto-generated.
 * Ent feature.
 */

/**
 * Helper function to get translation with fallback
 */
function tet(key, fallback) {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback;
}

// Initialize wizardManager namespace
window.wizardManager = window.wizardManager || {};

/**
 * Wizard Manager class
 */
class WizardManager {
    constructor() {
        this.modal = null;
        this.currentStep = -1; // -1 = wizard selection, 0+ = step index
        this.selections = {};
        this.wizardTemplates = [];
        this.activeWizard = null;
        this.invoke = null;
    }

    /**
     * Initialize the wizard manager
     */
    async init() {
        this.modal = document.getElementById('wizardModal');
        if (!this.modal) {
            console.warn('Wizard modal not found');
            return;
        }

        // Get invoke function
        this.invoke = this.getInvoke();

        this.bindEvents();
        await this.loadWizardTemplates();
        console.log('Wizard Manager initialized');
    }

    /**
     * Get Tauri invoke function
     */
    getInvoke() {
        if (window.__TAURI_INTERNALS__) {
            return window.__TAURI_INTERNALS__.invoke;
        } else if (window.__TAURI__ && window.__TAURI__.core) {
            return window.__TAURI__.core.invoke;
        } else if (window.__TAURI__) {
            return window.__TAURI__.invoke;
        }
        return null;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const closeBtn = document.getElementById('btnCloseWizardModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        const cancelBtn = document.getElementById('btnWizardCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        const backBtn = document.getElementById('btnWizardBack');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handlePrevious());
        }

        const nextBtn = document.getElementById('btnWizardNext');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNext());
        }

        const applyBtn = document.getElementById('btnWizardApply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyToWorkspace());
        }

        const exportBtn = document.getElementById('btnWizardExport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCustomWizardsToFile());
        }

        const importBtn = document.getElementById('btnWizardImport');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importCustomWizardsFromFile());
        }

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    /**
     * Load wizard templates from backend
     */
    async loadWizardTemplates() {
        if (!this.invoke) {
            console.warn('Tauri API not available for wizard templates');
            return;
        }

        try {
            const locale = window.i18n ? window.i18n.getLocale() : 'ja';
            const builtinTemplates = await this.invoke('get_wizard_templates', { locale });

            // Merge built-in + custom wizards
            const customWizards = this.loadCustomWizards();
            this.wizardTemplates = [...builtinTemplates, ...customWizards];

            console.log('Loaded wizard templates:', this.wizardTemplates.length,
                '(built-in:', builtinTemplates.length, '+ custom:', customWizards.length, ')');
        } catch (error) {
            console.error('Failed to load wizard templates:', error);
            this.wizardTemplates = this.loadCustomWizards();
        }
    }

    /**
     * Load custom wizards from localStorage.
     * Always ensures the sample wizard exists so new users can learn from it.
     */
    loadCustomWizards() {
        let wizards = [];
        try {
            const data = localStorage.getItem('promps-ent-custom-wizards');
            if (data) {
                wizards = JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load custom wizards:', e);
        }

        // Always ensure sample wizard exists, and keep it localized
        const sample = this.createSampleWizard();
        const idx = wizards.findIndex(w => w.id === 'sample_email_wizard');
        if (idx === -1) {
            wizards.unshift(sample);
            this.saveCustomWizards(wizards);
        } else {
            // Update sample text to current locale
            wizards[idx] = { ...wizards[idx], name: sample.name, description: sample.description,
                steps: sample.steps, block_rules: sample.block_rules, fallback_blocks: sample.fallback_blocks };
            this.saveCustomWizards(wizards);
        }

        return wizards;
    }

    /**
     * Create a sample custom wizard that demonstrates:
     * - Step option values and how they are referenced in conditions
     * - Block rule conditions matching step selections
     * - Default values for noun/verb blocks
     * - Fallback blocks as the catch-all pattern
     */
    createSampleWizard() {
        const locale = (window.currentLocale || document.documentElement.lang || 'ja').substring(0, 2);

        // Localized sample data
        const l = {
            ja: {
                name: 'メール作成アシスタント（サンプル）',
                description: 'ステップ→ブロックルール→既定ブロックの関係を理解するためのサンプルです',
                step1Title: '場面を選択',
                step1Desc: 'メールの場面を選んでください。この値がブロックルールの「条件」になります。',
                step1Opt1Label: 'ビジネス',
                step1Opt1Desc: '条件値 "business" → ルール1,2 で使用',
                step1Opt2Label: 'カジュアル',
                step1Opt2Desc: '条件値 "casual" → ルール3 で使用',
                step2Title: '目的を選択',
                step2Desc: '何のためのメールですか？ステップ1の値と組み合わせてルールが決まります。',
                step2Opt1Label: '依頼',
                step2Opt1Desc: '条件値 "request" → ルール1 で使用',
                step2Opt2Label: '報告',
                step2Opt2Desc: '条件値 "report" → ルール2 で使用',
                step2Opt3Label: 'お礼',
                step2Opt3Desc: '条件値 "thanks" → ルール3 で使用',
            },
            en: {
                name: 'Email Assistant (Sample)',
                description: 'A sample to understand the relationship between Steps → Block Rules → Default Blocks',
                step1Title: 'Select Scene',
                step1Desc: 'Choose the email context. This value becomes the "condition" in block rules.',
                step1Opt1Label: 'Business',
                step1Opt1Desc: 'Condition value "business" → used in Rule 1, 2',
                step1Opt2Label: 'Casual',
                step1Opt2Desc: 'Condition value "casual" → used in Rule 3',
                step2Title: 'Select Purpose',
                step2Desc: 'What is the email for? Combined with Step 1 to determine which rule applies.',
                step2Opt1Label: 'Request',
                step2Opt1Desc: 'Condition value "request" → used in Rule 1',
                step2Opt2Label: 'Report',
                step2Opt2Desc: 'Condition value "report" → used in Rule 2',
                step2Opt3Label: 'Thanks',
                step2Opt3Desc: 'Condition value "thanks" → used in Rule 3',
            },
            fr: {
                name: 'Assistant e-mail (Exemple)',
                description: 'Un exemple pour comprendre la relation entre Étapes → Règles de blocs → Blocs par défaut',
                step1Title: 'Choisir le contexte',
                step1Desc: 'Choisissez le contexte de l\'e-mail. Cette valeur devient la "condition" dans les règles.',
                step1Opt1Label: 'Professionnel',
                step1Opt1Desc: 'Valeur "business" → utilisée dans Règle 1, 2',
                step1Opt2Label: 'Décontracté',
                step1Opt2Desc: 'Valeur "casual" → utilisée dans Règle 3',
                step2Title: 'Choisir l\'objectif',
                step2Desc: 'Quel est le but de l\'e-mail ? Combiné avec l\'Étape 1 pour déterminer la règle.',
                step2Opt1Label: 'Demande',
                step2Opt1Desc: 'Valeur "request" → utilisée dans Règle 1',
                step2Opt2Label: 'Rapport',
                step2Opt2Desc: 'Valeur "report" → utilisée dans Règle 2',
                step2Opt3Label: 'Remerciement',
                step2Opt3Desc: 'Valeur "thanks" → utilisée dans Règle 3',
            }
        };
        const t = l[locale] || l['ja'];

        // Japanese locale uses particles; English/French use articles
        const isJa = locale === 'ja';

        return {
            id: 'sample_email_wizard',
            name: t.name,
            description: t.description,
            icon: '📧',
            tier: 'enterprise',
            isCustom: true,
            isSample: true,
            steps: [
                {
                    id: 'scene',
                    title: t.step1Title,
                    description: t.step1Desc,
                    input_type: 'radio',
                    options: [
                        { value: 'business', label: t.step1Opt1Label, description: t.step1Opt1Desc },
                        { value: 'casual', label: t.step1Opt2Label, description: t.step1Opt2Desc },
                    ],
                    required: true
                },
                {
                    id: 'purpose',
                    title: t.step2Title,
                    description: t.step2Desc,
                    input_type: 'radio',
                    options: [
                        { value: 'request', label: t.step2Opt1Label, description: t.step2Opt1Desc },
                        { value: 'report', label: t.step2Opt2Label, description: t.step2Opt2Desc },
                        { value: 'thanks', label: t.step2Opt3Label, description: t.step2Opt3Desc },
                    ],
                    required: true
                }
            ],
            // Block rules: conditions reference step option VALUES
            // Rule 1: scene=business AND purpose=request
            // Rule 2: scene=business AND purpose=report
            // Rule 3: scene=casual AND purpose=thanks
            block_rules: isJa ? [
                {
                    // Rule 1: ビジネス + 依頼 → 「ビジネスメール を 依頼内容 に 作成して」
                    conditions: { scene: 'business', purpose: 'request' },
                    blocks: [
                        { block_type: 'promps_noun', default_value: 'ビジネスメール', value_from_step: null },
                        { block_type: 'promps_particle_wo', default_value: null, value_from_step: null },
                        { block_type: 'promps_noun', default_value: '依頼内容', value_from_step: null },
                        { block_type: 'promps_particle_ni', default_value: null, value_from_step: null },
                        { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
                    ]
                },
                {
                    // Rule 2: ビジネス + 報告 → 「報告書 を 要約して」
                    conditions: { scene: 'business', purpose: 'report' },
                    blocks: [
                        { block_type: 'promps_noun', default_value: '報告書', value_from_step: null },
                        { block_type: 'promps_particle_wo', default_value: null, value_from_step: null },
                        { block_type: 'promps_verb_summarize', default_value: null, value_from_step: null },
                    ]
                },
                {
                    // Rule 3: カジュアル + お礼 → 「お礼メール を 作成して」
                    conditions: { scene: 'casual', purpose: 'thanks' },
                    blocks: [
                        { block_type: 'promps_noun', default_value: 'お礼メール', value_from_step: null },
                        { block_type: 'promps_particle_wo', default_value: null, value_from_step: null },
                        { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
                    ]
                }
            ] : [
                {
                    // Rule 1: Business + Request → "please create a business email"
                    conditions: { scene: 'business', purpose: 'request' },
                    blocks: [
                        { block_type: 'promps_article_please', default_value: null, value_from_step: null },
                        { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
                        { block_type: 'promps_article_a', default_value: null, value_from_step: null },
                        { block_type: 'promps_noun', default_value: 'business email', value_from_step: null },
                    ]
                },
                {
                    // Rule 2: Business + Report → "please summarize the report"
                    conditions: { scene: 'business', purpose: 'report' },
                    blocks: [
                        { block_type: 'promps_article_please', default_value: null, value_from_step: null },
                        { block_type: 'promps_verb_summarize', default_value: null, value_from_step: null },
                        { block_type: 'promps_article_the', default_value: null, value_from_step: null },
                        { block_type: 'promps_noun', default_value: 'report', value_from_step: null },
                    ]
                },
                {
                    // Rule 3: Casual + Thanks → "create a thank-you email"
                    conditions: { scene: 'casual', purpose: 'thanks' },
                    blocks: [
                        { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
                        { block_type: 'promps_article_a', default_value: null, value_from_step: null },
                        { block_type: 'promps_noun', default_value: 'thank-you email', value_from_step: null },
                    ]
                }
            ],
            // Fallback: used when no rule conditions match (e.g., casual+request, casual+report)
            fallback_blocks: isJa ? [
                { block_type: 'promps_noun', default_value: 'メール', value_from_step: null },
                { block_type: 'promps_particle_wo', default_value: null, value_from_step: null },
                { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
            ] : [
                { block_type: 'promps_verb_create', default_value: null, value_from_step: null },
                { block_type: 'promps_article_a', default_value: null, value_from_step: null },
                { block_type: 'promps_noun', default_value: 'email', value_from_step: null },
            ]
        };
    }

    /**
     * Save custom wizards to localStorage
     */
    saveCustomWizards(wizards) {
        try {
            localStorage.setItem('promps-ent-custom-wizards', JSON.stringify(wizards));
        } catch (e) {
            console.error('Failed to save custom wizards:', e);
        }
    }

    /**
     * Add a custom wizard
     */
    addCustomWizard(wizard) {
        const customs = this.loadCustomWizards();
        wizard.id = 'custom_' + Date.now();
        wizard.tier = 'enterprise';
        wizard.isCustom = true;
        customs.push(wizard);
        this.saveCustomWizards(customs);
        this.wizardTemplates = [...this.wizardTemplates.filter(t => !t.isCustom), ...customs];
    }

    /**
     * Update a custom wizard
     */
    updateCustomWizard(wizardId, updatedWizard) {
        const customs = this.loadCustomWizards();
        const idx = customs.findIndex(w => w.id === wizardId);
        if (idx >= 0) {
            updatedWizard.id = wizardId;
            updatedWizard.tier = 'enterprise';
            updatedWizard.isCustom = true;
            customs[idx] = updatedWizard;
            this.saveCustomWizards(customs);
            // Refresh templates: keep built-ins, replace customs
            const builtins = this.wizardTemplates.filter(t => !t.isCustom);
            this.wizardTemplates = [...builtins, ...customs];
        }
    }

    /**
     * Delete a custom wizard
     */
    deleteCustomWizard(wizardId) {
        const customs = this.loadCustomWizards();
        const filtered = customs.filter(w => w.id !== wizardId);
        this.saveCustomWizards(filtered);
        this.wizardTemplates = this.wizardTemplates.filter(t => t.id !== wizardId);
    }

    /**
     * Export custom wizards to JSON file via Tauri dialog
     */
    async exportCustomWizardsToFile() {
        const customs = this.loadCustomWizards();
        if (customs.length === 0) {
            alert(tet('wizard.custom.export.empty', 'No custom wizards to export'));
            return;
        }

        if (!this.invoke) {
            console.warn('Tauri invoke not available');
            return;
        }

        try {
            const path = await this.invoke('show_wizard_export_dialog', {
                defaultName: 'custom-wizards.json'
            });
            if (!path) return; // User cancelled

            const exportData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                wizards: customs
            };

            await this.invoke('export_custom_wizards', {
                path,
                data: JSON.stringify(exportData, null, 2)
            });

            alert(tet('wizard.custom.export.success', 'Custom wizards exported successfully'));
        } catch (error) {
            console.error('Failed to export wizards:', error);
            alert(tet('wizard.custom.import.error', 'Failed to read file'));
        }
    }

    /**
     * Import custom wizards from JSON file via Tauri dialog
     */
    async importCustomWizardsFromFile() {
        if (!this.invoke) {
            console.warn('Tauri invoke not available');
            return;
        }

        try {
            const path = await this.invoke('show_wizard_import_dialog');
            if (!path) return; // User cancelled

            const content = await this.invoke('import_custom_wizards', { path });
            let importData;
            try {
                importData = JSON.parse(content);
            } catch (e) {
                alert(tet('wizard.custom.import.invalid', 'Invalid wizard data format'));
                return;
            }

            // Support both wrapped format { version, wizards: [...] } and plain array [...]
            let wizards = Array.isArray(importData) ? importData : importData.wizards;
            if (!Array.isArray(wizards) || wizards.length === 0) {
                alert(tet('wizard.custom.import.empty', 'No wizards to import'));
                return;
            }

            // Ask user: merge or replace
            const mergeLabel = tet('wizard.custom.import.merge', 'Merge (keep existing)');
            const replaceLabel = tet('wizard.custom.import.replace', 'Replace (remove existing)');
            const modeMsg = tet('wizard.custom.import.mode', 'Choose import method');
            const choice = confirm(`${modeMsg}\n\nOK = ${mergeLabel}\nCancel = ${replaceLabel}`);

            // Ensure imported wizards have proper fields
            wizards = wizards.map(w => ({
                ...w,
                id: w.id || ('custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
                tier: 'enterprise',
                isCustom: true
            }));

            if (choice) {
                // Merge: add imported wizards to existing ones
                const existing = this.loadCustomWizards();
                const existingIds = new Set(existing.map(w => w.id));
                // Re-assign IDs for duplicates
                wizards.forEach(w => {
                    if (existingIds.has(w.id)) {
                        w.id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
                    }
                });
                const merged = [...existing, ...wizards];
                this.saveCustomWizards(merged);
            } else {
                // Replace: overwrite with imported wizards
                this.saveCustomWizards(wizards);
            }

            // Reload templates
            await this.loadWizardTemplates();
            this.renderWizardList();

            const countMsg = tet('wizard.custom.import.count', '{count} wizard(s) imported')
                .replace('{count}', wizards.length);
            alert(countMsg);
        } catch (error) {
            console.error('Failed to import wizards:', error);
            alert(tet('wizard.custom.import.error', 'Failed to read file'));
        }
    }

    /**
     * Show the wizard modal
     */
    showModal() {
        if (this.modal) {
            this.resetState();
            this.renderWizardList();
            this.modal.classList.add('modal-visible');
        }
    }

    /**
     * Hide the wizard modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('modal-visible');
            this.resetState();
        }
    }

    /**
     * Reset wizard state
     */
    resetState() {
        this.currentStep = -1;
        this.selections = {};
        this.activeWizard = null;
        this.showScreen('select');
        this.updateButtons();
    }

    /**
     * Show a specific screen
     */
    showScreen(screen) {
        const selectScreen = document.getElementById('wizardSelectScreen');
        const stepContent = document.getElementById('wizardStepContent');
        const previewScreen = document.getElementById('wizardPreviewScreen');
        const stepIndicator = document.getElementById('wizardStepIndicator');

        if (selectScreen) selectScreen.style.display = screen === 'select' ? '' : 'none';
        if (stepContent) stepContent.style.display = screen === 'step' ? '' : 'none';
        if (previewScreen) previewScreen.style.display = screen === 'preview' ? '' : 'none';
        if (stepIndicator) stepIndicator.style.display = screen === 'select' ? 'none' : '';
    }

    /**
     * Update footer button visibility
     */
    updateButtons() {
        const backBtn = document.getElementById('btnWizardBack');
        const cancelBtn = document.getElementById('btnWizardCancel');
        const nextBtn = document.getElementById('btnWizardNext');
        const applyBtn = document.getElementById('btnWizardApply');

        if (this.currentStep === -1) {
            // Wizard selection screen
            if (backBtn) backBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = '';
            if (nextBtn) nextBtn.style.display = 'none';
            if (applyBtn) applyBtn.style.display = 'none';
        } else if (this.activeWizard && this.currentStep >= this.activeWizard.steps.length) {
            // Preview screen
            if (backBtn) backBtn.style.display = '';
            if (cancelBtn) cancelBtn.style.display = '';
            if (nextBtn) nextBtn.style.display = 'none';
            if (applyBtn) applyBtn.style.display = '';
        } else {
            // Step screen
            if (backBtn) backBtn.style.display = '';
            if (cancelBtn) cancelBtn.style.display = '';
            if (nextBtn) nextBtn.style.display = '';
            if (applyBtn) applyBtn.style.display = 'none';
        }
    }

    /**
     * Render the wizard selection list
     */
    renderWizardList() {
        const container = document.getElementById('wizardCardList');
        if (!container) return;

        container.innerHTML = '';

        // "Create New Wizard" button
        const createCard = document.createElement('div');
        createCard.className = 'wizard-card wizard-card-create';
        createCard.innerHTML = `
            <span class="wizard-card-icon">+</span>
            <div class="wizard-card-info">
                <div class="wizard-card-name">${tet('wizard.custom.create', 'Create New Wizard')}</div>
                <div class="wizard-card-desc">${tet('wizard.custom.createDesc', 'Create your own custom wizard')}</div>
            </div>
        `;
        createCard.addEventListener('click', () => {
            if (window.wizardEditor) {
                this.hideModal();
                window.wizardEditor.showEditor();
            }
        });
        container.appendChild(createCard);

        for (const tmpl of this.wizardTemplates) {
            const card = document.createElement('div');
            card.className = 'wizard-card';
            let actionsHtml = '';
            if (tmpl.isCustom) {
                actionsHtml = `
                    <div class="wizard-card-actions">
                        <button class="wizard-card-edit" title="${tet('wizard.custom.edit', 'Edit')}">\u270E</button>
                        <button class="wizard-card-delete" title="${tet('wizard.custom.delete', 'Delete')}">\u2715</button>
                    </div>
                `;
            }
            card.innerHTML = `
                <span class="wizard-card-icon">${tmpl.icon}</span>
                <div class="wizard-card-info">
                    <div class="wizard-card-name">${tmpl.name}${tmpl.isSample ? ' <span class="wizard-custom-badge wizard-sample-badge">' + tet('wizard.sample', 'Sample') + '</span>' : tmpl.isCustom ? ' <span class="wizard-custom-badge">Custom</span>' : ''}</div>
                    <div class="wizard-card-desc">${tmpl.description}</div>
                </div>
                ${actionsHtml}
            `;

            // Click card to start wizard (but not on action buttons)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.wizard-card-actions')) {
                    this.startWizard(tmpl.id);
                }
            });

            // Edit button
            if (tmpl.isCustom) {
                const editBtn = card.querySelector('.wizard-card-edit');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window.wizardEditor) {
                            this.hideModal();
                            window.wizardEditor.showEditor(tmpl);
                        }
                    });
                }

                const deleteBtn = card.querySelector('.wizard-card-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm(tet('wizard.custom.deleteConfirm', 'Delete this wizard?'))) {
                            this.deleteCustomWizard(tmpl.id);
                            this.renderWizardList();
                        }
                    });
                }
            }

            container.appendChild(card);
        }
    }

    /**
     * Start a specific wizard
     */
    startWizard(wizardId) {
        this.activeWizard = this.wizardTemplates.find(t => t.id === wizardId);
        if (!this.activeWizard) {
            console.error('Wizard not found:', wizardId);
            return;
        }

        this.selections = {};
        this.currentStep = 0;
        this.renderStepIndicator();
        this.renderStep(0);
        this.showScreen('step');
        this.updateButtons();
    }

    /**
     * Render step indicator dots
     */
    renderStepIndicator() {
        const container = document.getElementById('wizardStepIndicator');
        if (!container || !this.activeWizard) return;

        container.innerHTML = '';
        const totalSteps = this.activeWizard.steps.length + 1; // +1 for preview

        for (let i = 0; i < totalSteps; i++) {
            if (i > 0) {
                const connector = document.createElement('div');
                connector.className = 'wizard-step-connector';
                if (i <= this.currentStep) connector.classList.add('completed');
                container.appendChild(connector);
            }

            const dot = document.createElement('div');
            dot.className = 'wizard-step-dot';
            if (i < this.currentStep) {
                dot.classList.add('completed');
                dot.textContent = '\u2713';
            } else if (i === this.currentStep) {
                dot.classList.add('active');
                dot.textContent = String(i + 1);
            } else {
                dot.textContent = String(i + 1);
            }
            container.appendChild(dot);
        }
    }

    /**
     * Render a specific step
     */
    renderStep(stepIndex) {
        if (!this.activeWizard || stepIndex >= this.activeWizard.steps.length) return;

        const step = this.activeWizard.steps[stepIndex];
        const titleEl = document.getElementById('wizardStepTitle');
        const descEl = document.getElementById('wizardStepDescription');
        const optionsEl = document.getElementById('wizardStepOptions');

        if (titleEl) titleEl.textContent = step.title;
        if (descEl) descEl.textContent = step.description;

        if (optionsEl) {
            optionsEl.innerHTML = '';
            const currentSelection = this.selections[step.id];

            for (const opt of step.options) {
                const optDiv = document.createElement('div');
                optDiv.className = 'wizard-option';
                if (currentSelection === opt.value) {
                    optDiv.classList.add('selected');
                }

                let html = '';
                if (opt.icon) {
                    html += `<span class="wizard-option-icon">${opt.icon}</span>`;
                }
                html += `<div class="wizard-option-info">
                    <div class="wizard-option-label">${opt.label}</div>`;
                if (opt.description) {
                    html += `<div class="wizard-option-desc">${opt.description}</div>`;
                }
                html += `</div>`;

                optDiv.innerHTML = html;
                optDiv.addEventListener('click', () => {
                    this.selections[step.id] = opt.value;
                    // Update selection visuals
                    optionsEl.querySelectorAll('.wizard-option').forEach(el => el.classList.remove('selected'));
                    optDiv.classList.add('selected');
                });
                optionsEl.appendChild(optDiv);
            }
        }

        this.renderStepIndicator();
    }

    /**
     * Handle Next button
     */
    handleNext() {
        if (!this.activeWizard) return;

        const step = this.activeWizard.steps[this.currentStep];
        if (step && step.required && !this.selections[step.id]) {
            // Flash the options to indicate selection needed
            const optionsEl = document.getElementById('wizardStepOptions');
            if (optionsEl) {
                optionsEl.style.outline = '2px solid var(--accent-error)';
                setTimeout(() => { optionsEl.style.outline = ''; }, 1000);
            }
            return;
        }

        this.currentStep++;

        if (this.currentStep >= this.activeWizard.steps.length) {
            // Show preview
            this.renderPreview();
            this.showScreen('preview');
        } else {
            this.renderStep(this.currentStep);
        }

        this.renderStepIndicator();
        this.updateButtons();
    }

    /**
     * Handle Back button
     */
    handlePrevious() {
        if (this.currentStep <= 0) {
            // Go back to wizard selection
            this.resetState();
            this.renderWizardList();
            return;
        }

        this.currentStep--;
        this.renderStep(this.currentStep);
        this.showScreen('step');
        this.renderStepIndicator();
        this.updateButtons();
    }

    /**
     * Resolve which blocks to generate based on selections
     */
    resolveBlocks() {
        if (!this.activeWizard) return [];

        for (const rule of this.activeWizard.block_rules) {
            const allMatch = Object.entries(rule.conditions).every(
                ([key, value]) => this.selections[key] === value
            );
            if (allMatch) {
                return rule.blocks;
            }
        }

        return this.activeWizard.fallback_blocks;
    }

    /**
     * Render the preview screen
     */
    renderPreview() {
        const container = document.getElementById('wizardPreviewBlocks');
        if (!container) return;

        const blocks = this.resolveBlocks();
        container.innerHTML = '';

        // Particle label map for preview display
        const particleLabels = {
            'promps_particle_ga': '\u304C',
            'promps_particle_wo': '\u3092',
            'promps_particle_ni': '\u306B',
            'promps_particle_de': '\u3067',
            'promps_particle_to': '\u3068',
            'promps_particle_he': '\u3078',
            'promps_particle_kara': '\u304B\u3089',
            'promps_particle_made': '\u307E\u3067',
            'promps_particle_yori': '\u3088\u308A',
        };

        // Verb label map for fixed verbs (no default_value)
        const verbLabels = {
            'promps_verb_analyze': '\u5206\u6790\u3057\u3066',
            'promps_verb_summarize': '\u8981\u7D04\u3057\u3066',
            'promps_verb_translate': '\u7FFB\u8A33\u3057\u3066',
            'promps_verb_create': '\u4F5C\u6210\u3057\u3066',
            'promps_verb_generate': '\u751F\u6210\u3057\u3066',
            'promps_verb_convert': '\u5909\u63DB\u3057\u3066',
            'promps_verb_delete': '\u524A\u9664\u3057\u3066',
            'promps_verb_update': '\u66F4\u65B0\u3057\u3066',
            'promps_verb_extract': '\u62BD\u51FA\u3057\u3066',
            'promps_verb_explain': '\u8AAC\u660E\u3057\u3066',
            'promps_verb_describe': '\u8A18\u8FF0\u3057\u3066',
            'promps_verb_teach': '\u6559\u3048\u3066',
        };

        // Article labels
        const articleLabels = {
            'promps_article_a': tet('blockly.article.a.label', 'a'),
            'promps_article_an': tet('blockly.article.an.label', 'an'),
            'promps_article_the': tet('blockly.article.the.label', 'the'),
            'promps_article_this': tet('blockly.article.this.label', 'this'),
            'promps_article_that': tet('blockly.article.that.label', 'that'),
            'promps_article_please': tet('blockly.article.please.label', 'please'),
        };

        for (const block of blocks) {
            const el = document.createElement('span');
            let blockClass = 'block-other';
            let label = block.default_value || block.block_type;

            if (block.block_type.includes('noun')) {
                blockClass = 'block-noun';
                label = block.default_value || 'Noun';
            } else if (block.block_type.includes('particle')) {
                blockClass = 'block-particle';
                label = particleLabels[block.block_type] || block.default_value || block.block_type;
            } else if (block.block_type.includes('verb')) {
                blockClass = 'block-verb';
                label = block.default_value || verbLabels[block.block_type] || 'Verb';
            } else if (block.block_type.includes('article')) {
                blockClass = 'block-other';
                label = articleLabels[block.block_type] || block.default_value || block.block_type;
            } else if (block.block_type === 'promps_other') {
                blockClass = 'block-other';
                label = block.default_value || 'other';
            }

            el.className = `wizard-preview-block ${blockClass}`;
            el.textContent = label;
            container.appendChild(el);
        }

        this.renderStepIndicator();
    }

    /**
     * Apply resolved blocks to the Blockly workspace
     */
    applyToWorkspace() {
        if (!window.workspace) {
            console.warn('Workspace not available');
            return;
        }

        const blocks = this.resolveBlocks();
        if (blocks.length === 0) {
            console.warn('No blocks to apply');
            return;
        }

        try {
            // Clear workspace
            window.workspace.clear();

            let previousBlock = null;
            const startX = 50;
            const startY = 50;

            for (const blockDef of blocks) {
                const newBlock = window.workspace.newBlock(blockDef.block_type);

                if (blockDef.default_value) {
                    const field = newBlock.getField('TEXT');
                    if (field) {
                        field.setValue(blockDef.default_value);
                    }
                }

                newBlock.initSvg();
                newBlock.render();

                if (previousBlock === null) {
                    newBlock.moveBy(startX, startY);
                } else {
                    if (previousBlock.nextConnection && newBlock.previousConnection) {
                        previousBlock.nextConnection.connect(newBlock.previousConnection);
                    }
                }

                previousBlock = newBlock;
            }

            // Trigger workspace change to update preview
            if (previousBlock && typeof Blockly !== 'undefined') {
                window.workspace.fireChangeListener(new Blockly.Events.BlockCreate(previousBlock));
            }

            this.hideModal();
            console.log('Wizard blocks applied to workspace');
        } catch (error) {
            console.error('Failed to apply wizard blocks:', error);
        }
    }
}

// Create and export instance
const wizardManagerInstance = new WizardManager();

window.wizardManager.init = () => wizardManagerInstance.init();
window.wizardManager.showModal = () => wizardManagerInstance.showModal();
window.wizardManager.hideModal = () => wizardManagerInstance.hideModal();
window.wizardManager.loadWizardTemplates = () => wizardManagerInstance.loadWizardTemplates();
window.wizardManager.addCustomWizard = (w) => wizardManagerInstance.addCustomWizard(w);
window.wizardManager.updateCustomWizard = (id, w) => wizardManagerInstance.updateCustomWizard(id, w);
window.wizardManager.deleteCustomWizard = (id) => wizardManagerInstance.deleteCustomWizard(id);

// Expose for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WizardManager };
}

console.log('Wizard Manager module loaded');
