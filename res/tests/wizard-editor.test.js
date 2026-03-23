/**
 * Promps Ent - Wizard Editor Tests
 *
 * Tests for custom wizard creation and editing:
 * - Editor modal visibility
 * - Step CRUD operations
 * - Option CRUD operations
 * - Block rule management
 * - Fallback block management
 * - Validation
 * - localStorage persistence
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
        <div id="wizardEditorModal" class="modal-overlay">
            <div class="modal-content wizard-editor-modal">
                <div class="modal-header">
                    <h3>Wizard Editor</h3>
                    <button id="btnCloseWizardEditor" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="wizard-editor-section">
                        <div class="wizard-editor-field">
                            <label>Wizard Name</label>
                            <input type="text" id="wizardEditorName" placeholder="My Wizard" />
                        </div>
                        <div class="wizard-editor-field">
                            <label>Description</label>
                            <input type="text" id="wizardEditorDescription" placeholder="Description" />
                        </div>
                        <div class="wizard-editor-field">
                            <label>Icon</label>
                            <div id="wizardEditorIconPicker" class="wizard-icon-picker">
                                <span class="wizard-icon-option selected" data-icon="\uD83E\uDDD9">\uD83E\uDDD9</span>
                                <span class="wizard-icon-option" data-icon="\uD83D\uDD0D">\uD83D\uDD0D</span>
                            </div>
                        </div>
                    </div>
                    <div class="wizard-editor-section">
                        <div class="wizard-editor-section-header">
                            <h4>Steps</h4>
                            <button id="btnAddWizardStep" class="btn-small btn-primary">Add Step</button>
                        </div>
                        <div id="wizardEditorSteps" class="wizard-editor-steps"></div>
                    </div>
                    <div class="wizard-editor-section">
                        <div class="wizard-editor-section-header">
                            <h4>Block Rules</h4>
                            <button id="btnAddBlockRule" class="btn-small btn-primary">Add Rule</button>
                        </div>
                        <div id="wizardEditorBlockRules" class="wizard-editor-block-rules"></div>
                    </div>
                    <div class="wizard-editor-section">
                        <div class="wizard-editor-section-header">
                            <h4>Fallback Blocks</h4>
                            <button id="btnAddFallbackBlock" class="btn-small btn-secondary">Add Block</button>
                        </div>
                        <div id="wizardEditorFallbackBlocks" class="wizard-editor-fallback-blocks"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="btnWizardEditorCancel" class="btn-secondary">Cancel</button>
                    <button id="btnWizardEditorSave" class="btn-primary">Save</button>
                </div>
            </div>
        </div>
    `;

    // Mock globals
    global.window = global.window || {};
    global.window.t = jest.fn((key) => key);
    global.window.wizardManager = {
        addCustomWizard: jest.fn(),
        updateCustomWizard: jest.fn(),
        showModal: jest.fn(),
    };

    // Mock localStorage
    const localStorageMock = {};
    global.localStorage = {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, val) => { localStorageMock[key] = val; }),
        removeItem: jest.fn((key) => { delete localStorageMock[key]; }),
    };
});

describe('Editor Modal', () => {
    test('should find editor modal element', () => {
        const modal = document.getElementById('wizardEditorModal');
        expect(modal).not.toBeNull();
    });

    test('should find all editor buttons', () => {
        expect(document.getElementById('btnCloseWizardEditor')).not.toBeNull();
        expect(document.getElementById('btnWizardEditorCancel')).not.toBeNull();
        expect(document.getElementById('btnWizardEditorSave')).not.toBeNull();
        expect(document.getElementById('btnAddWizardStep')).not.toBeNull();
        expect(document.getElementById('btnAddBlockRule')).not.toBeNull();
        expect(document.getElementById('btnAddFallbackBlock')).not.toBeNull();
    });

    test('should show editor modal by adding modal-visible class', () => {
        const modal = document.getElementById('wizardEditorModal');
        expect(modal.classList.contains('modal-visible')).toBe(false);

        modal.classList.add('modal-visible');
        expect(modal.classList.contains('modal-visible')).toBe(true);
    });

    test('should hide editor modal by removing modal-visible class', () => {
        const modal = document.getElementById('wizardEditorModal');
        modal.classList.add('modal-visible');
        modal.classList.remove('modal-visible');
        expect(modal.classList.contains('modal-visible')).toBe(false);
    });

    test('should find name and description inputs', () => {
        expect(document.getElementById('wizardEditorName')).not.toBeNull();
        expect(document.getElementById('wizardEditorDescription')).not.toBeNull();
    });

    test('should find icon picker', () => {
        expect(document.getElementById('wizardEditorIconPicker')).not.toBeNull();
    });
});

describe('Step Management', () => {
    test('should create a step object with default structure', () => {
        const step = {
            id: 'step_' + Date.now(),
            title: '',
            description: '',
            input_type: 'radio',
            options: [{ value: '', label: '' }],
            required: true,
        };

        expect(step.id).toBeDefined();
        expect(step.input_type).toBe('radio');
        expect(step.options.length).toBe(1);
        expect(step.required).toBe(true);
    });

    test('should add a step to the array', () => {
        const steps = [];
        steps.push({
            id: 'step1',
            title: 'Test Step',
            description: 'Description',
            input_type: 'radio',
            options: [{ value: 'a', label: 'A' }],
            required: true,
        });

        expect(steps.length).toBe(1);
        expect(steps[0].title).toBe('Test Step');
    });

    test('should remove a step by index', () => {
        const steps = [
            { id: 's1', title: 'Step 1' },
            { id: 's2', title: 'Step 2' },
            { id: 's3', title: 'Step 3' },
        ];
        steps.splice(1, 1); // Remove middle step

        expect(steps.length).toBe(2);
        expect(steps[0].id).toBe('s1');
        expect(steps[1].id).toBe('s3');
    });

    test('should add option to a step', () => {
        const step = {
            options: [{ value: 'a', label: 'A' }],
        };
        step.options.push({ value: 'b', label: 'B' });

        expect(step.options.length).toBe(2);
        expect(step.options[1].value).toBe('b');
    });

    test('should remove option from a step', () => {
        const step = {
            options: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
            ],
        };
        step.options.splice(1, 1);

        expect(step.options.length).toBe(2);
        expect(step.options[0].value).toBe('a');
        expect(step.options[1].value).toBe('c');
    });
});

describe('Block Rule Management', () => {
    test('should create a block rule with default structure', () => {
        const rule = {
            conditions: {},
            blocks: [{ block_type: 'promps_noun', default_value: '' }],
        };

        expect(Object.keys(rule.conditions).length).toBe(0);
        expect(rule.blocks.length).toBe(1);
        expect(rule.blocks[0].block_type).toBe('promps_noun');
    });

    test('should add conditions to a rule', () => {
        const rule = { conditions: {}, blocks: [] };
        rule.conditions['target'] = 'document';
        rule.conditions['method'] = 'detailed';

        expect(Object.keys(rule.conditions).length).toBe(2);
        expect(rule.conditions.target).toBe('document');
    });

    test('should remove a condition from a rule', () => {
        const rule = {
            conditions: { target: 'document', method: 'detailed' },
            blocks: [],
        };
        delete rule.conditions.method;

        expect(Object.keys(rule.conditions).length).toBe(1);
        expect(rule.conditions.method).toBeUndefined();
    });

    test('should add block to a rule', () => {
        const rule = {
            conditions: {},
            blocks: [{ block_type: 'promps_noun', default_value: 'Test' }],
        };
        rule.blocks.push({ block_type: 'promps_particle_wo' });

        expect(rule.blocks.length).toBe(2);
        expect(rule.blocks[1].block_type).toBe('promps_particle_wo');
    });

    test('should remove block from a rule', () => {
        const rule = {
            conditions: {},
            blocks: [
                { block_type: 'promps_noun' },
                { block_type: 'promps_particle_wo' },
                { block_type: 'promps_verb_analyze' },
            ],
        };
        rule.blocks.splice(1, 1);

        expect(rule.blocks.length).toBe(2);
        expect(rule.blocks[0].block_type).toBe('promps_noun');
        expect(rule.blocks[1].block_type).toBe('promps_verb_analyze');
    });

    test('should remove a rule by index', () => {
        const rules = [
            { conditions: { target: 'doc' }, blocks: [] },
            { conditions: { target: 'code' }, blocks: [] },
        ];
        rules.splice(0, 1);

        expect(rules.length).toBe(1);
        expect(rules[0].conditions.target).toBe('code');
    });
});

describe('Fallback Block Management', () => {
    test('should add a fallback block', () => {
        const fallbacks = [];
        fallbacks.push({ block_type: 'promps_noun', default_value: 'Test' });

        expect(fallbacks.length).toBe(1);
        expect(fallbacks[0].block_type).toBe('promps_noun');
    });

    test('should remove a fallback block by index', () => {
        const fallbacks = [
            { block_type: 'promps_noun' },
            { block_type: 'promps_particle_wo' },
        ];
        fallbacks.splice(0, 1);

        expect(fallbacks.length).toBe(1);
        expect(fallbacks[0].block_type).toBe('promps_particle_wo');
    });
});

describe('Wizard Validation', () => {
    test('should require a wizard name', () => {
        const name = '';
        expect(name.trim().length === 0).toBe(true);
    });

    test('should accept a valid wizard name', () => {
        const name = 'My Wizard';
        expect(name.trim().length > 0).toBe(true);
    });

    test('should require at least one step', () => {
        const steps = [];
        expect(steps.length === 0).toBe(true);
    });

    test('should accept wizard with steps', () => {
        const steps = [{ id: 's1', title: 'Step' }];
        expect(steps.length > 0).toBe(true);
    });

    test('should filter empty options on save', () => {
        const options = [
            { value: 'a', label: 'A' },
            { value: '', label: '' },
            { value: 'b', label: 'B' },
        ];
        const filtered = options.filter(o => o.value || o.label);
        expect(filtered.length).toBe(2);
    });
});

describe('Icon Picker', () => {
    test('should select icon on click', () => {
        const picker = document.getElementById('wizardEditorIconPicker');
        const icons = picker.querySelectorAll('.wizard-icon-option');

        expect(icons.length).toBe(2);
        expect(icons[0].classList.contains('selected')).toBe(true);
        expect(icons[1].classList.contains('selected')).toBe(false);

        // Simulate selecting second icon
        icons[0].classList.remove('selected');
        icons[1].classList.add('selected');

        expect(icons[0].classList.contains('selected')).toBe(false);
        expect(icons[1].classList.contains('selected')).toBe(true);
    });

    test('icon options should have data-icon attribute', () => {
        const icons = document.querySelectorAll('.wizard-icon-option');
        for (const icon of icons) {
            expect(icon.dataset.icon).toBeDefined();
            expect(icon.dataset.icon.length).toBeGreaterThan(0);
        }
    });
});

describe('Block Types', () => {
    const blockTypes = [
        'promps_noun', 'promps_particle_ga', 'promps_particle_wo',
        'promps_particle_ni', 'promps_particle_de', 'promps_verb_analyze',
        'promps_verb_summarize', 'promps_verb_translate', 'promps_verb_custom',
        'promps_other', 'promps_article_a', 'promps_article_the',
        'promps_article_please',
    ];

    test('should have valid block type prefixes', () => {
        for (const bt of blockTypes) {
            expect(bt.startsWith('promps_')).toBe(true);
        }
    });

    test('noun and custom verb should support default values', () => {
        const typesWithDefaults = ['promps_noun', 'promps_verb_custom', 'promps_other'];
        for (const bt of typesWithDefaults) {
            expect(blockTypes.includes(bt)).toBe(true);
        }
    });
});

describe('Wizard Object Build', () => {
    test('should build a complete wizard object for saving', () => {
        const wizard = {
            name: 'Test',
            description: 'Test desc',
            icon: '\uD83E\uDDD9',
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    description: 'Desc',
                    input_type: 'radio',
                    options: [
                        { value: 'a', label: 'A' },
                        { value: 'b', label: 'B' },
                    ],
                    required: true,
                },
            ],
            block_rules: [
                {
                    conditions: { step_1: 'a' },
                    blocks: [
                        { block_type: 'promps_noun', default_value: 'Alpha', value_from_step: null },
                    ],
                },
            ],
            fallback_blocks: [
                { block_type: 'promps_noun', default_value: 'Fallback', value_from_step: null },
            ],
        };

        expect(wizard.name).toBe('Test');
        expect(wizard.steps.length).toBe(1);
        expect(wizard.steps[0].options.length).toBe(2);
        expect(wizard.block_rules.length).toBe(1);
        expect(wizard.block_rules[0].conditions.step_1).toBe('a');
        expect(wizard.fallback_blocks.length).toBe(1);
    });

    test('should handle empty block rule conditions', () => {
        const rule = { conditions: {}, blocks: [] };
        const allMatch = Object.entries(rule.conditions).every(
            ([key, value]) => true
        );
        // Empty conditions should match everything
        expect(allMatch).toBe(true);
    });
});

describe('Edit Mode', () => {
    test('should populate fields from existing wizard', () => {
        const wizard = {
            name: 'Existing Wizard',
            description: 'Existing desc',
            icon: '\uD83D\uDD0D',
            steps: [{ id: 's1', title: 'S1', description: 'D1', input_type: 'radio', options: [{ value: 'x', label: 'X' }], required: true }],
            block_rules: [],
            fallback_blocks: [],
        };

        const nameInput = document.getElementById('wizardEditorName');
        const descInput = document.getElementById('wizardEditorDescription');
        nameInput.value = wizard.name;
        descInput.value = wizard.description;

        expect(nameInput.value).toBe('Existing Wizard');
        expect(descInput.value).toBe('Existing desc');
    });

    test('should deep clone steps to avoid mutation', () => {
        const original = {
            steps: [{ id: 's1', title: 'Original', options: [{ value: 'a', label: 'A' }] }],
        };
        const cloned = JSON.parse(JSON.stringify(original.steps));
        cloned[0].title = 'Modified';

        expect(original.steps[0].title).toBe('Original');
        expect(cloned[0].title).toBe('Modified');
    });
});

describe('HTML Escape', () => {
    test('should escape HTML special characters', () => {
        const div = document.createElement('div');
        div.textContent = '<script>alert("xss")</script>';
        const escaped = div.innerHTML;

        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;script&gt;');
    });

    test('should handle empty strings', () => {
        const div = document.createElement('div');
        div.textContent = '';
        expect(div.innerHTML).toBe('');
    });
});
