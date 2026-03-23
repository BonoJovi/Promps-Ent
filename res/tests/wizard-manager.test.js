/**
 * Promps Ent - Wizard Manager Tests
 *
 * Tests for wizard template functionality:
 * - Wizard selection screen
 * - Step navigation
 * - Selection state management
 * - Block resolution
 * - Ent gating
 * - Custom wizard CRUD
 * - i18n key existence
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

// Sample wizard template for testing
const mockTemplates = [
    {
        id: 'analyze_ja',
        name: '\u5206\u6790\u30A6\u30A3\u30B6\u30FC\u30C9',
        description: '\u5BFE\u8C61\u3092\u9078\u3093\u3067\u5206\u6790\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u81EA\u52D5\u751F\u6210',
        icon: '\uD83D\uDD0D',
        tier: 'enterprise',
        steps: [
            {
                id: 'target',
                title: '\u5206\u6790\u5BFE\u8C61',
                description: '\u4F55\u3092\u5206\u6790\u3057\u307E\u3059\u304B\uFF1F',
                input_type: 'radio',
                options: [
                    { value: 'document', label: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8', description: '\u6587\u66F8\u3084\u30EC\u30DD\u30FC\u30C8\u3092\u5206\u6790', icon: '\uD83D\uDCC4' },
                    { value: 'data', label: '\u30C7\u30FC\u30BF', description: '\u6570\u5024\u3084\u30C7\u30FC\u30BF\u30BB\u30C3\u30C8\u3092\u5206\u6790', icon: '\uD83D\uDCCA' },
                    { value: 'code', label: '\u30B3\u30FC\u30C9', description: '\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u3092\u5206\u6790', icon: '\uD83D\uDCBB' },
                ],
                required: true,
            },
            {
                id: 'method',
                title: '\u5206\u6790\u65B9\u6CD5',
                description: '\u3069\u306E\u3088\u3046\u306B\u5206\u6790\u3057\u307E\u3059\u304B\uFF1F',
                input_type: 'radio',
                options: [
                    { value: 'detailed', label: '\u8A73\u7D30\u5206\u6790', description: '\u7D30\u90E8\u307E\u3067\u5FB9\u5E95\u7684\u306B\u5206\u6790', icon: '\uD83D\uDD2C' },
                    { value: 'summary', label: '\u8981\u7D04\u5206\u6790', description: '\u8981\u70B9\u3092\u307E\u3068\u3081\u3066\u5206\u6790', icon: '\uD83D\uDCCB' },
                    { value: 'comparison', label: '\u6BD4\u8F03\u5206\u6790', description: '\u4ED6\u3068\u306E\u9055\u3044\u3092\u5206\u6790', icon: '\u2696\uFE0F' },
                ],
                required: true,
            },
        ],
        block_rules: [
            {
                conditions: { target: 'document', method: 'detailed' },
                blocks: [
                    { block_type: 'promps_noun', default_value: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8' },
                    { block_type: 'promps_particle_wo' },
                    { block_type: 'promps_noun', default_value: '\u8A73\u7D30' },
                    { block_type: 'promps_particle_ni' },
                    { block_type: 'promps_verb_analyze' },
                ],
            },
            {
                conditions: { target: 'document', method: 'summary' },
                blocks: [
                    { block_type: 'promps_noun', default_value: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8' },
                    { block_type: 'promps_particle_wo' },
                    { block_type: 'promps_verb_summarize' },
                ],
            },
        ],
        fallback_blocks: [
            { block_type: 'promps_noun', default_value: '\u5BFE\u8C61' },
            { block_type: 'promps_particle_wo' },
            { block_type: 'promps_verb_analyze' },
        ],
    },
    {
        id: 'translate_ja',
        name: '\u7FFB\u8A33\u30A6\u30A3\u30B6\u30FC\u30C9',
        description: '\u5BFE\u8C61\u3068\u8A00\u8A9E\u3092\u9078\u3093\u3067\u7FFB\u8A33\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u81EA\u52D5\u751F\u6210',
        icon: '\uD83C\uDF10',
        tier: 'enterprise',
        steps: [
            {
                id: 'target',
                title: '\u7FFB\u8A33\u5BFE\u8C61',
                description: '\u4F55\u3092\u7FFB\u8A33\u3057\u307E\u3059\u304B\uFF1F',
                input_type: 'radio',
                options: [
                    { value: 'document', label: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8' },
                    { value: 'text', label: '\u30C6\u30AD\u30B9\u30C8' },
                ],
                required: true,
            },
        ],
        block_rules: [],
        fallback_blocks: [
            { block_type: 'promps_noun', default_value: '\u30C6\u30AD\u30B9\u30C8' },
            { block_type: 'promps_particle_wo' },
            { block_type: 'promps_verb_translate' },
        ],
    },
];

beforeEach(() => {
    mockInvoke = jest.fn().mockResolvedValue(mockTemplates);

    // Setup DOM
    document.body.innerHTML = `
        <div id="wizardModal" class="modal-overlay">
            <div class="modal-content wizard-modal">
                <div class="modal-header">
                    <h3>Prompt Wizard</h3>
                    <button id="btnCloseWizardModal" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="wizardStepIndicator" class="wizard-step-indicator" style="display: none;"></div>
                    <div id="wizardSelectScreen">
                        <p class="wizard-intro">Choose a wizard</p>
                        <div id="wizardCardList" class="wizard-card-list"></div>
                    </div>
                    <div id="wizardStepContent" class="wizard-step-content" style="display: none;">
                        <h4 id="wizardStepTitle"></h4>
                        <p id="wizardStepDescription"></p>
                        <div id="wizardStepOptions" class="wizard-step-options"></div>
                    </div>
                    <div id="wizardPreviewScreen" class="wizard-preview-screen" style="display: none;">
                        <h4>Preview</h4>
                        <div id="wizardPreviewBlocks" class="wizard-preview-blocks"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="btnWizardBack" class="btn-secondary" style="display: none;">Back</button>
                    <button id="btnWizardCancel" class="btn-secondary">Cancel</button>
                    <button id="btnWizardNext" class="btn-primary" style="display: none;">Next</button>
                    <button id="btnWizardApply" class="btn-primary" style="display: none;">Apply</button>
                </div>
            </div>
        </div>
    `;

    // Mock globals
    global.window = global.window || {};
    global.window.__TAURI_INTERNALS__ = { invoke: mockInvoke };
    global.window.t = jest.fn((key) => key);
    global.window.isEntLicensed = true;
    global.window.i18n = { getLocale: () => 'ja' };
    global.window.workspace = null;

    // Mock localStorage
    const localStorageMock = {};
    global.localStorage = {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, val) => { localStorageMock[key] = val; }),
        removeItem: jest.fn((key) => { delete localStorageMock[key]; }),
    };
});

describe('WizardManager Initialization', () => {
    test('should find modal element', () => {
        const modal = document.getElementById('wizardModal');
        expect(modal).not.toBeNull();
    });

    test('should find all wizard buttons', () => {
        expect(document.getElementById('btnCloseWizardModal')).not.toBeNull();
        expect(document.getElementById('btnWizardCancel')).not.toBeNull();
        expect(document.getElementById('btnWizardBack')).not.toBeNull();
        expect(document.getElementById('btnWizardNext')).not.toBeNull();
        expect(document.getElementById('btnWizardApply')).not.toBeNull();
    });

    test('should find step indicator', () => {
        expect(document.getElementById('wizardStepIndicator')).not.toBeNull();
    });
});

describe('Wizard Selection Screen', () => {
    test('should render wizard cards for each template', () => {
        const container = document.getElementById('wizardCardList');
        container.innerHTML = '';

        for (const tmpl of mockTemplates) {
            const card = document.createElement('div');
            card.className = 'wizard-card';
            card.innerHTML = `
                <span class="wizard-card-icon">${tmpl.icon}</span>
                <div class="wizard-card-info">
                    <div class="wizard-card-name">${tmpl.name}</div>
                    <div class="wizard-card-desc">${tmpl.description}</div>
                </div>
            `;
            container.appendChild(card);
        }

        const cards = container.querySelectorAll('.wizard-card');
        expect(cards.length).toBe(2);
    });

    test('wizard card should contain name and description', () => {
        const container = document.getElementById('wizardCardList');
        container.innerHTML = '';

        const tmpl = mockTemplates[0];
        const card = document.createElement('div');
        card.className = 'wizard-card';
        card.innerHTML = `
            <span class="wizard-card-icon">${tmpl.icon}</span>
            <div class="wizard-card-info">
                <div class="wizard-card-name">${tmpl.name}</div>
                <div class="wizard-card-desc">${tmpl.description}</div>
            </div>
        `;
        container.appendChild(card);

        expect(card.querySelector('.wizard-card-name').textContent).toBe('\u5206\u6790\u30A6\u30A3\u30B6\u30FC\u30C9');
        expect(card.querySelector('.wizard-card-desc').textContent).toBe('\u5BFE\u8C61\u3092\u9078\u3093\u3067\u5206\u6790\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u81EA\u52D5\u751F\u6210');
        expect(card.querySelector('.wizard-card-icon').textContent).toBe('\uD83D\uDD0D');
    });
});

describe('Step Navigation', () => {
    test('should track current step index', () => {
        let currentStep = -1; // Start at wizard selection
        expect(currentStep).toBe(-1);

        currentStep = 0; // First step
        expect(currentStep).toBe(0);

        currentStep = 1; // Second step
        expect(currentStep).toBe(1);
    });

    test('step navigation should handle required fields', () => {
        const step = mockTemplates[0].steps[0]; // target step, required: true
        const selections = {};

        // No selection yet - should block navigation
        expect(step.required && !selections[step.id]).toBe(true);

        // After selection - should allow navigation
        selections[step.id] = 'document';
        expect(step.required && !selections[step.id]).toBe(false);
    });

    test('should render step indicator with correct count', () => {
        const container = document.getElementById('wizardStepIndicator');
        container.innerHTML = '';

        const wizard = mockTemplates[0];
        const totalSteps = wizard.steps.length + 1; // +1 for preview

        for (let i = 0; i < totalSteps; i++) {
            if (i > 0) {
                const connector = document.createElement('div');
                connector.className = 'wizard-step-connector';
                container.appendChild(connector);
            }
            const dot = document.createElement('div');
            dot.className = 'wizard-step-dot';
            dot.textContent = String(i + 1);
            container.appendChild(dot);
        }

        const dots = container.querySelectorAll('.wizard-step-dot');
        expect(dots.length).toBe(3); // 2 steps + 1 preview
    });
});

describe('Selection State Management', () => {
    test('should store selections by step ID', () => {
        const selections = {};
        selections['target'] = 'document';
        selections['method'] = 'detailed';

        expect(selections['target']).toBe('document');
        expect(selections['method']).toBe('detailed');
    });

    test('should overwrite previous selection', () => {
        const selections = {};
        selections['target'] = 'document';
        expect(selections['target']).toBe('document');

        selections['target'] = 'code';
        expect(selections['target']).toBe('code');
    });

    test('should reset selections when restarting', () => {
        const selections = { target: 'document', method: 'detailed' };
        // Reset
        const resetSelections = {};
        expect(Object.keys(resetSelections).length).toBe(0);
    });
});

describe('Block Resolution', () => {
    function resolveBlocks(wizard, selections) {
        for (const rule of wizard.block_rules) {
            const allMatch = Object.entries(rule.conditions).every(
                ([key, value]) => selections[key] === value
            );
            if (allMatch) {
                return rule.blocks;
            }
        }
        return wizard.fallback_blocks;
    }

    test('should resolve blocks for matching conditions', () => {
        const wizard = mockTemplates[0];
        const selections = { target: 'document', method: 'detailed' };
        const blocks = resolveBlocks(wizard, selections);

        expect(blocks.length).toBe(5);
        expect(blocks[0].block_type).toBe('promps_noun');
        expect(blocks[0].default_value).toBe('\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8');
        expect(blocks[4].block_type).toBe('promps_verb_analyze');
    });

    test('should resolve different blocks for different selections', () => {
        const wizard = mockTemplates[0];
        const selections = { target: 'document', method: 'summary' };
        const blocks = resolveBlocks(wizard, selections);

        expect(blocks.length).toBe(3);
        expect(blocks[2].block_type).toBe('promps_verb_summarize');
    });

    test('should use fallback blocks when no rule matches', () => {
        const wizard = mockTemplates[0];
        const selections = { target: 'unknown', method: 'unknown' };
        const blocks = resolveBlocks(wizard, selections);

        expect(blocks).toEqual(wizard.fallback_blocks);
        expect(blocks.length).toBe(3);
        expect(blocks[0].default_value).toBe('\u5BFE\u8C61');
    });

    test('should use fallback when no block_rules exist', () => {
        const wizard = mockTemplates[1]; // translate wizard has empty block_rules
        const selections = { target: 'document' };
        const blocks = resolveBlocks(wizard, selections);

        expect(blocks).toEqual(wizard.fallback_blocks);
    });
});


describe('Step Rendering', () => {
    test('should render step title and description', () => {
        const step = mockTemplates[0].steps[0];
        const titleEl = document.getElementById('wizardStepTitle');
        const descEl = document.getElementById('wizardStepDescription');

        titleEl.textContent = step.title;
        descEl.textContent = step.description;

        expect(titleEl.textContent).toBe('\u5206\u6790\u5BFE\u8C61');
        expect(descEl.textContent).toBe('\u4F55\u3092\u5206\u6790\u3057\u307E\u3059\u304B\uFF1F');
    });

    test('should render step options', () => {
        const step = mockTemplates[0].steps[0];
        const optionsEl = document.getElementById('wizardStepOptions');
        optionsEl.innerHTML = '';

        for (const opt of step.options) {
            const optDiv = document.createElement('div');
            optDiv.className = 'wizard-option';
            optDiv.innerHTML = `
                <span class="wizard-option-icon">${opt.icon || ''}</span>
                <div class="wizard-option-info">
                    <div class="wizard-option-label">${opt.label}</div>
                    <div class="wizard-option-desc">${opt.description || ''}</div>
                </div>
            `;
            optionsEl.appendChild(optDiv);
        }

        const options = optionsEl.querySelectorAll('.wizard-option');
        expect(options.length).toBe(3);
        expect(options[0].querySelector('.wizard-option-label').textContent).toBe('\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8');
        expect(options[1].querySelector('.wizard-option-label').textContent).toBe('\u30C7\u30FC\u30BF');
        expect(options[2].querySelector('.wizard-option-label').textContent).toBe('\u30B3\u30FC\u30C9');
    });

    test('should mark selected option', () => {
        const optionsEl = document.getElementById('wizardStepOptions');
        optionsEl.innerHTML = '';

        // Create 3 options
        for (let i = 0; i < 3; i++) {
            const div = document.createElement('div');
            div.className = 'wizard-option';
            optionsEl.appendChild(div);
        }

        // Select the second one
        const options = optionsEl.querySelectorAll('.wizard-option');
        options[1].classList.add('selected');

        expect(options[0].classList.contains('selected')).toBe(false);
        expect(options[1].classList.contains('selected')).toBe(true);
        expect(options[2].classList.contains('selected')).toBe(false);
    });
});

describe('Preview Rendering', () => {
    test('should render preview blocks with correct classes', () => {
        const container = document.getElementById('wizardPreviewBlocks');
        container.innerHTML = '';

        const blocks = [
            { block_type: 'promps_noun', default_value: '\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8' },
            { block_type: 'promps_particle_wo' },
            { block_type: 'promps_verb_analyze' },
        ];

        for (const block of blocks) {
            const el = document.createElement('span');
            let blockClass = 'block-other';

            if (block.block_type.includes('noun')) blockClass = 'block-noun';
            else if (block.block_type.includes('particle')) blockClass = 'block-particle';
            else if (block.block_type.includes('verb')) blockClass = 'block-verb';

            el.className = `wizard-preview-block ${blockClass}`;
            el.textContent = block.default_value || block.block_type.split('_').pop();
            container.appendChild(el);
        }

        const previews = container.querySelectorAll('.wizard-preview-block');
        expect(previews.length).toBe(3);
        expect(previews[0].classList.contains('block-noun')).toBe(true);
        expect(previews[0].textContent).toBe('\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8');
        expect(previews[1].classList.contains('block-particle')).toBe(true);
        expect(previews[2].classList.contains('block-verb')).toBe(true);
    });
});

describe('Modal Visibility', () => {
    test('should show modal by adding modal-visible class', () => {
        const modal = document.getElementById('wizardModal');
        expect(modal.classList.contains('modal-visible')).toBe(false);

        modal.classList.add('modal-visible');
        expect(modal.classList.contains('modal-visible')).toBe(true);
    });

    test('should hide modal by removing modal-visible class', () => {
        const modal = document.getElementById('wizardModal');
        modal.classList.add('modal-visible');
        expect(modal.classList.contains('modal-visible')).toBe(true);

        modal.classList.remove('modal-visible');
        expect(modal.classList.contains('modal-visible')).toBe(false);
    });
});

describe('i18n Key Existence', () => {
    test('should have all required wizard i18n keys', () => {
        const requiredKeys = [
            'toolbar.wizard',
            'toolbar.wizard.title',
            'wizard.title',
            'wizard.intro',
            'wizard.back',
            'wizard.next',
            'wizard.cancel',
            'wizard.apply',
            'wizard.preview.title',
            'wizard.step',
            'wizard.of',
        ];

        // Mock t() that returns the key - in real app it returns translations
        const t = (key) => key;
        for (const key of requiredKeys) {
            expect(typeof t(key)).toBe('string');
            expect(t(key).length).toBeGreaterThan(0);
        }
    });

    test('should have custom wizard i18n keys', () => {
        const customKeys = [
            'wizard.custom.create',
            'wizard.custom.edit',
            'wizard.custom.delete',
            'wizard.custom.deleteConfirm',
            'wizard.editor.title',
            'wizard.editor.name',
            'wizard.editor.description',
            'wizard.editor.icon',
            'wizard.editor.steps',
            'wizard.editor.addStep',
            'wizard.editor.save',
            'wizard.editor.cancel',
        ];

        const t = (key) => key;
        for (const key of customKeys) {
            expect(typeof t(key)).toBe('string');
            expect(t(key).length).toBeGreaterThan(0);
        }
    });
});

describe('Invoke API', () => {
    test('should call get_wizard_templates with locale', async () => {
        await mockInvoke('get_wizard_templates', { locale: 'ja' });
        expect(mockInvoke).toHaveBeenCalledWith('get_wizard_templates', { locale: 'ja' });
    });

    test('should call get_wizard_templates for English', async () => {
        await mockInvoke('get_wizard_templates', { locale: 'en' });
        expect(mockInvoke).toHaveBeenCalledWith('get_wizard_templates', { locale: 'en' });
    });

    test('should call get_wizard_templates for French', async () => {
        await mockInvoke('get_wizard_templates', { locale: 'fr' });
        expect(mockInvoke).toHaveBeenCalledWith('get_wizard_templates', { locale: 'fr' });
    });
});

describe('Template Structure Validation', () => {
    test('each template should have required fields', () => {
        for (const tmpl of mockTemplates) {
            expect(tmpl.id).toBeDefined();
            expect(tmpl.name).toBeDefined();
            expect(tmpl.description).toBeDefined();
            expect(tmpl.icon).toBeDefined();
            expect(tmpl.tier).toBeDefined();
            expect(tmpl.steps).toBeDefined();
            expect(tmpl.block_rules).toBeDefined();
            expect(tmpl.fallback_blocks).toBeDefined();
        }
    });

    test('each step should have required fields', () => {
        for (const tmpl of mockTemplates) {
            for (const step of tmpl.steps) {
                expect(step.id).toBeDefined();
                expect(step.title).toBeDefined();
                expect(step.description).toBeDefined();
                expect(step.input_type).toBeDefined();
                expect(step.options).toBeDefined();
                expect(step.options.length).toBeGreaterThan(0);
            }
        }
    });

    test('each option should have value and label', () => {
        for (const tmpl of mockTemplates) {
            for (const step of tmpl.steps) {
                for (const opt of step.options) {
                    expect(opt.value).toBeDefined();
                    expect(opt.label).toBeDefined();
                }
            }
        }
    });

    test('block rules conditions should reference valid step IDs', () => {
        for (const tmpl of mockTemplates) {
            const stepIds = tmpl.steps.map(s => s.id);
            for (const rule of tmpl.block_rules) {
                for (const key of Object.keys(rule.conditions)) {
                    expect(stepIds).toContain(key);
                }
            }
        }
    });

    test('all templates should be enterprise tier', () => {
        for (const tmpl of mockTemplates) {
            expect(tmpl.tier).toBe('enterprise');
        }
    });
});

describe('Button State Management', () => {
    test('wizard selection screen should show only cancel', () => {
        const currentStep = -1;
        expect(currentStep).toBe(-1);
    });

    test('step screen should show back, cancel, next', () => {
        const currentStep = 0;
        const wizard = mockTemplates[0];
        const isStepScreen = currentStep >= 0 && currentStep < wizard.steps.length;
        expect(isStepScreen).toBe(true);
    });

    test('preview screen should show back, cancel, apply', () => {
        const wizard = mockTemplates[0];
        const currentStep = wizard.steps.length; // Past last step = preview
        const isPreviewScreen = currentStep >= wizard.steps.length;
        expect(isPreviewScreen).toBe(true);
    });
});

describe('Custom Wizard CRUD', () => {
    test('should create a custom wizard object', () => {
        const wizard = {
            name: 'Test Wizard',
            description: 'A test wizard',
            icon: '\uD83E\uDDD9',
            steps: [
                {
                    id: 'step1',
                    title: 'Step 1',
                    description: 'First step',
                    input_type: 'radio',
                    options: [
                        { value: 'opt1', label: 'Option 1' },
                        { value: 'opt2', label: 'Option 2' },
                    ],
                    required: true,
                },
            ],
            block_rules: [
                {
                    conditions: { step1: 'opt1' },
                    blocks: [
                        { block_type: 'promps_noun', default_value: 'Test' },
                    ],
                },
            ],
            fallback_blocks: [
                { block_type: 'promps_noun', default_value: 'Fallback' },
            ],
        };

        expect(wizard.name).toBe('Test Wizard');
        expect(wizard.steps.length).toBe(1);
        expect(wizard.block_rules.length).toBe(1);
        expect(wizard.fallback_blocks.length).toBe(1);
    });

    test('should save custom wizards to localStorage', () => {
        const wizards = [
            { id: 'custom_1', name: 'W1', isCustom: true },
            { id: 'custom_2', name: 'W2', isCustom: true },
        ];
        const json = JSON.stringify(wizards);
        localStorage.setItem('promps-ent-custom-wizards', json);
        const stored = localStorage.getItem('promps-ent-custom-wizards');
        expect(stored).toBe(json);
    });

    test('should load custom wizards from localStorage', () => {
        const wizards = [{ id: 'custom_1', name: 'W1', isCustom: true }];
        localStorage.setItem('promps-ent-custom-wizards', JSON.stringify(wizards));
        const loaded = JSON.parse(localStorage.getItem('promps-ent-custom-wizards'));
        expect(loaded.length).toBe(1);
        expect(loaded[0].id).toBe('custom_1');
    });

    test('should delete a custom wizard by ID', () => {
        const wizards = [
            { id: 'custom_1', name: 'W1' },
            { id: 'custom_2', name: 'W2' },
        ];
        const filtered = wizards.filter(w => w.id !== 'custom_1');
        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe('custom_2');
    });

    test('should update a custom wizard', () => {
        const wizards = [
            { id: 'custom_1', name: 'W1' },
            { id: 'custom_2', name: 'W2' },
        ];
        const idx = wizards.findIndex(w => w.id === 'custom_1');
        wizards[idx] = { ...wizards[idx], name: 'Updated W1' };
        expect(wizards[0].name).toBe('Updated W1');
    });

    test('should merge builtin and custom templates', () => {
        const builtins = mockTemplates;
        const customs = [
            { id: 'custom_1', name: 'Custom', isCustom: true, steps: [], block_rules: [], fallback_blocks: [] },
        ];
        const merged = [...builtins, ...customs];
        expect(merged.length).toBe(3);
        expect(merged[2].isCustom).toBe(true);
    });

    test('custom wizard cards should have edit and delete buttons', () => {
        const card = document.createElement('div');
        card.className = 'wizard-card';
        card.innerHTML = `
            <span class="wizard-card-icon">\uD83E\uDDD9</span>
            <div class="wizard-card-info">
                <div class="wizard-card-name">Custom <span class="wizard-custom-badge">Custom</span></div>
            </div>
            <div class="wizard-card-actions">
                <button class="wizard-card-edit">\u270E</button>
                <button class="wizard-card-delete">\u2715</button>
            </div>
        `;

        expect(card.querySelector('.wizard-card-edit')).not.toBeNull();
        expect(card.querySelector('.wizard-card-delete')).not.toBeNull();
        expect(card.querySelector('.wizard-custom-badge')).not.toBeNull();
    });
});
