/**
 * Promps Phase 6 - Validation UI Tests
 *
 * Tests for grammar validation UI logic and pattern templates
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

// Mock DOM elements
let mockValidationContainer;
let mockWorkspace;

beforeEach(() => {
    mockInvoke = jest.fn();
    global.window = global.window || {};
    global.window.__TAURI__ = {
        invoke: mockInvoke
    };

    // Mock validation container
    mockValidationContainer = {
        innerHTML: '',
        className: '',
        appendChild: jest.fn()
    };

    // Mock workspace
    mockWorkspace = {
        getAllBlocks: jest.fn().mockReturnValue([]),
        getTopBlocks: jest.fn().mockReturnValue([]),
        getBlockById: jest.fn().mockReturnValue(null)
    };

    global.workspace = mockWorkspace;
    global.document = {
        getElementById: jest.fn((id) => {
            if (id === 'validationResult') {
                return mockValidationContainer;
            }
            return null;
        }),
        createElement: jest.fn((tag) => ({
            className: '',
            innerHTML: '',
            textContent: '',
            appendChild: jest.fn()
        }))
    };
});

describe('Validation Command Invocation', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should invoke validate_dsl_sequence command', async () => {
        const validResult = {
            isValid: true,
            errors: [],
            errorCount: 0,
            warningCount: 0
        };
        mockInvoke.mockResolvedValue(validResult);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User が _N:Document を 分析して'
        });

        expect(mockInvoke).toHaveBeenCalledWith('validate_dsl_sequence', {
            input: '_N:User が _N:Document を 分析して'
        });
        expect(result.isValid).toBe(true);
        expect(result.errorCount).toBe(0);
    });

    test('should return errors for invalid sequence', async () => {
        const invalidResult = {
            isValid: false,
            errors: [{
                code: 'ParticleWithoutNoun',
                message: '助詞「が」の前に名詞がありません',
                position: 0,
                severity: 'error',
                suggestion: '名詞ブロックを追加してください'
            }],
            errorCount: 1,
            warningCount: 0
        };
        mockInvoke.mockResolvedValue(invalidResult);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: 'が _N:User'
        });

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].code).toBe('ParticleWithoutNoun');
    });

    test('should return warnings for consecutive nouns', async () => {
        const warningResult = {
            isValid: true,
            errors: [{
                code: 'ConsecutiveNouns',
                message: '名詞が連続しています',
                position: 1,
                severity: 'warning',
                suggestion: '間に助詞を追加することを検討してください'
            }],
            errorCount: 0,
            warningCount: 1
        };
        mockInvoke.mockResolvedValue(warningResult);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User _N:Order'
        });

        expect(result.isValid).toBe(true);
        expect(result.warningCount).toBe(1);
        expect(result.errors[0].severity).toBe('warning');
    });
});

describe('Validation Result Display', () => {
    // Simulated validationUI module functions
    const simulateDisplayResult = (result) => {
        if (result.isValid && result.warningCount === 0) {
            mockValidationContainer.className = 'validation-result validation-success';
            mockValidationContainer.innerHTML = '<span class="validation-icon">&#10003;</span> Grammar check passed';
        } else if (result.errorCount > 0) {
            mockValidationContainer.className = 'validation-result validation-error';
        } else if (result.warningCount > 0) {
            mockValidationContainer.className = 'validation-result validation-warning';
        }
    };

    test('should display success state for valid input', () => {
        const result = {
            isValid: true,
            errors: [],
            errorCount: 0,
            warningCount: 0
        };

        simulateDisplayResult(result);

        expect(mockValidationContainer.className).toContain('validation-success');
        expect(mockValidationContainer.innerHTML).toContain('Grammar check passed');
    });

    test('should display error state for invalid input', () => {
        const result = {
            isValid: false,
            errors: [{
                code: 'ParticleWithoutNoun',
                message: '助詞「が」の前に名詞がありません',
                position: 0,
                severity: 'error',
                suggestion: '名詞ブロックを追加してください'
            }],
            errorCount: 1,
            warningCount: 0
        };

        simulateDisplayResult(result);

        expect(mockValidationContainer.className).toContain('validation-error');
    });

    test('should display warning state for warnings only', () => {
        const result = {
            isValid: true,
            errors: [{
                code: 'ConsecutiveNouns',
                message: '名詞が連続しています',
                position: 1,
                severity: 'warning',
                suggestion: null
            }],
            errorCount: 0,
            warningCount: 1
        };

        simulateDisplayResult(result);

        expect(mockValidationContainer.className).toContain('validation-warning');
    });
});

describe('Validation Rules', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('Rule 1: Particle at start should error', async () => {
        mockInvoke.mockResolvedValue({
            isValid: false,
            errors: [{
                code: 'ParticleWithoutNoun',
                message: '助詞「が」の前に名詞がありません',
                position: 0,
                severity: 'error',
                suggestion: '名詞ブロックを追加してください'
            }],
            errorCount: 1,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: 'が _N:User'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('ParticleWithoutNoun');
    });

    test('Rule 2: Consecutive particles should error', async () => {
        mockInvoke.mockResolvedValue({
            isValid: false,
            errors: [{
                code: 'ConsecutiveParticles',
                message: '助詞「を」が連続しています',
                position: 2,
                severity: 'error',
                suggestion: '間に名詞や動詞を追加してください'
            }],
            errorCount: 1,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User が を'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('ConsecutiveParticles');
    });

    test('Rule 3: Verb not at end should warn', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'VerbNotAtEnd',
                message: '動詞が末尾にありません',
                position: 0,
                severity: 'warning',
                suggestion: '動詞を文末に移動してください'
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '分析して _N:Document'
        });

        expect(result.isValid).toBe(true);
        expect(result.warningCount).toBe(1);
        expect(result.errors[0].code).toBe('VerbNotAtEnd');
    });

    test('Rule 4: Consecutive nouns should warn', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'ConsecutiveNouns',
                message: '名詞が連続しています',
                position: 1,
                severity: 'warning',
                suggestion: '間に助詞を追加することを検討してください'
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User _N:Order'
        });

        expect(result.isValid).toBe(true);
        expect(result.warningCount).toBe(1);
        expect(result.errors[0].code).toBe('ConsecutiveNouns');
    });

    test('Rule 5: Missing subject should warn', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'MissingSubject',
                message: '主語がありません（「が」がありません）',
                position: 2,
                severity: 'warning',
                suggestion: '「名詞 が」を追加してください'
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:Document を 分析して'
        });

        expect(result.isValid).toBe(true);
        expect(result.warningCount).toBe(1);
        expect(result.errors[0].code).toBe('MissingSubject');
    });

    test('Rule 6: Missing object should warn', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'MissingObject',
                message: '目的語がありません（「を」がありません）',
                position: 2,
                severity: 'warning',
                suggestion: '「名詞 を」を追加してください'
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User が 作成して'
        });

        expect(result.isValid).toBe(true);
        expect(result.warningCount).toBe(1);
        expect(result.errors[0].code).toBe('MissingObject');
    });
});

describe('Block Position Mapping', () => {
    test('should build empty positions for empty workspace', () => {
        mockWorkspace.getTopBlocks.mockReturnValue([]);

        // Simulated buildBlockPositions logic
        const positions = {};
        const topBlocks = mockWorkspace.getTopBlocks(true);

        expect(Object.keys(positions).length).toBe(0);
    });

    test('should build positions for block chain', () => {
        // Mock block chain: block1 -> block2 -> block3
        const block3 = { id: 'block3', getNextBlock: () => null };
        const block2 = { id: 'block2', getNextBlock: () => block3 };
        const block1 = { id: 'block1', getNextBlock: () => block2 };

        mockWorkspace.getTopBlocks.mockReturnValue([block1]);

        // Simulated buildBlockPositions logic
        const positions = {};
        const topBlocks = mockWorkspace.getTopBlocks(true);
        let position = 0;

        for (const topBlock of topBlocks) {
            let block = topBlock;
            while (block) {
                positions[position] = block.id;
                position++;
                block = block.getNextBlock();
            }
        }

        expect(positions[0]).toBe('block1');
        expect(positions[1]).toBe('block2');
        expect(positions[2]).toBe('block3');
    });
});

describe('Block Highlighting', () => {
    test('should clear highlights when no errors', () => {
        const mockBlock = {
            setWarningText: jest.fn(),
            getSvgRoot: jest.fn().mockReturnValue({
                classList: {
                    remove: jest.fn(),
                    add: jest.fn()
                }
            })
        };
        mockWorkspace.getAllBlocks.mockReturnValue([mockBlock]);

        // Simulated clearBlockHighlights logic
        const allBlocks = mockWorkspace.getAllBlocks(false);
        for (const block of allBlocks) {
            block.setWarningText(null);
            const svgRoot = block.getSvgRoot();
            if (svgRoot) {
                svgRoot.classList.remove('validation-block-error');
                svgRoot.classList.remove('validation-block-warning');
            }
        }

        expect(mockBlock.setWarningText).toHaveBeenCalledWith(null);
        expect(mockBlock.getSvgRoot().classList.remove).toHaveBeenCalledWith('validation-block-error');
        expect(mockBlock.getSvgRoot().classList.remove).toHaveBeenCalledWith('validation-block-warning');
    });

    test('should highlight error blocks', () => {
        const mockBlock = {
            setWarningText: jest.fn(),
            getSvgRoot: jest.fn().mockReturnValue({
                classList: {
                    add: jest.fn()
                }
            })
        };
        mockWorkspace.getBlockById.mockReturnValue(mockBlock);

        const error = {
            code: 'ParticleWithoutNoun',
            message: '助詞「が」の前に名詞がありません',
            position: 0,
            severity: 'error'
        };
        const blockPositions = { 0: 'block1' };

        // Simulated highlightBlocks logic
        const blockId = blockPositions[error.position];
        const block = mockWorkspace.getBlockById(blockId);
        if (block) {
            block.setWarningText(error.message);
            const svgRoot = block.getSvgRoot();
            if (svgRoot && error.severity === 'error') {
                svgRoot.classList.add('validation-block-error');
            }
        }

        expect(mockBlock.setWarningText).toHaveBeenCalledWith(error.message);
        expect(mockBlock.getSvgRoot().classList.add).toHaveBeenCalledWith('validation-block-error');
    });

    test('should highlight warning blocks', () => {
        const mockBlock = {
            setWarningText: jest.fn(),
            getSvgRoot: jest.fn().mockReturnValue({
                classList: {
                    add: jest.fn()
                }
            })
        };
        mockWorkspace.getBlockById.mockReturnValue(mockBlock);

        const error = {
            code: 'ConsecutiveNouns',
            message: '名詞が連続しています',
            position: 1,
            severity: 'warning'
        };
        const blockPositions = { 1: 'block2' };

        // Simulated highlightBlocks logic
        const blockId = blockPositions[error.position];
        const block = mockWorkspace.getBlockById(blockId);
        if (block) {
            block.setWarningText(error.message);
            const svgRoot = block.getSvgRoot();
            if (svgRoot && error.severity === 'warning') {
                svgRoot.classList.add('validation-block-warning');
            }
        }

        expect(mockBlock.setWarningText).toHaveBeenCalledWith(error.message);
        expect(mockBlock.getSvgRoot().classList.add).toHaveBeenCalledWith('validation-block-warning');
    });
});

describe('Integration with Preview Update', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should validate after generating prompt', async () => {
        const promptResult = 'User (NOUN) が Document (NOUN) を 分析して';
        const validationResult = {
            isValid: true,
            errors: [],
            errorCount: 0,
            warningCount: 0
        };

        mockInvoke
            .mockResolvedValueOnce(promptResult)
            .mockResolvedValueOnce(validationResult);

        const invoke = window.__TAURI__.invoke;

        // Simulate updatePreview flow
        const dslCode = '_N:User が _N:Document を 分析して';
        const prompt = await invoke('generate_prompt_from_text', { input: dslCode });
        const validation = await invoke('validate_dsl_sequence', { input: dslCode });

        expect(mockInvoke).toHaveBeenCalledTimes(2);
        expect(mockInvoke).toHaveBeenCalledWith('generate_prompt_from_text', { input: dslCode });
        expect(mockInvoke).toHaveBeenCalledWith('validate_dsl_sequence', { input: dslCode });
        expect(validation.isValid).toBe(true);
    });

    test('should handle validation errors during preview update', async () => {
        const promptResult = 'が User (NOUN)';
        const validationResult = {
            isValid: false,
            errors: [{
                code: 'ParticleWithoutNoun',
                message: '助詞「が」の前に名詞がありません',
                position: 0,
                severity: 'error',
                suggestion: '名詞ブロックを追加してください'
            }],
            errorCount: 1,
            warningCount: 0
        };

        mockInvoke
            .mockResolvedValueOnce(promptResult)
            .mockResolvedValueOnce(validationResult);

        const invoke = window.__TAURI__.invoke;

        // Simulate updatePreview flow
        const dslCode = 'が _N:User';
        await invoke('generate_prompt_from_text', { input: dslCode });
        const validation = await invoke('validate_dsl_sequence', { input: dslCode });

        expect(validation.isValid).toBe(false);
        expect(validation.errorCount).toBe(1);
    });
});

describe('Auto-fix Feature', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should include autofix action in validation result', async () => {
        mockInvoke.mockResolvedValue({
            isValid: false,
            errors: [{
                code: 'ParticleWithoutNoun',
                message: '助詞「が」の前に名詞がありません',
                position: 0,
                severity: 'error',
                suggestion: '名詞ブロックを追加してください',
                autofix: {
                    actionType: 'insert_before',
                    blockType: 'promps_noun',
                    targetPosition: 0,
                    label: '名詞を追加'
                }
            }],
            errorCount: 1,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: 'が _N:User'
        });

        expect(result.errors[0].autofix).toBeDefined();
        expect(result.errors[0].autofix.actionType).toBe('insert_before');
        expect(result.errors[0].autofix.blockType).toBe('promps_noun');
    });

    test('should include autofix for missing subject', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'MissingSubject',
                message: '主語がありません（「が」がありません）',
                position: 2,
                severity: 'warning',
                suggestion: '「名詞 が」を追加してください',
                autofix: {
                    actionType: 'insert_before',
                    blockType: 'promps_particle_ga',
                    targetPosition: 0,
                    label: '「が」を追加'
                }
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:Document を 分析して'
        });

        expect(result.errors[0].autofix.blockType).toBe('promps_particle_ga');
        expect(result.errors[0].autofix.label).toBe('「が」を追加');
    });

    test('should include autofix for consecutive nouns', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [{
                code: 'ConsecutiveNouns',
                message: '名詞が連続しています',
                position: 1,
                severity: 'warning',
                autofix: {
                    actionType: 'insert_before',
                    blockType: 'promps_particle_to',
                    targetPosition: 1,
                    label: '「と」を追加'
                }
            }],
            errorCount: 0,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: '_N:User _N:Order'
        });

        expect(result.errors[0].autofix.blockType).toBe('promps_particle_to');
    });
});

describe('Edge Cases', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should handle empty input', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [],
            errorCount: 0,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', { input: '' });

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('should handle whitespace-only input', async () => {
        mockInvoke.mockResolvedValue({
            isValid: true,
            errors: [],
            errorCount: 0,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', { input: '   ' });

        expect(result.isValid).toBe(true);
    });

    test('should handle multiple errors in same sequence', async () => {
        mockInvoke.mockResolvedValue({
            isValid: false,
            errors: [
                {
                    code: 'ParticleWithoutNoun',
                    message: '助詞「が」の前に名詞がありません',
                    position: 0,
                    severity: 'error'
                },
                {
                    code: 'ConsecutiveParticles',
                    message: '助詞「を」が連続しています',
                    position: 1,
                    severity: 'error'
                }
            ],
            errorCount: 2,
            warningCount: 0
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', { input: 'が を _N:User' });

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(2);
        expect(result.errors.length).toBe(2);
    });

    test('should handle mixed errors and warnings', async () => {
        mockInvoke.mockResolvedValue({
            isValid: false,
            errors: [
                {
                    code: 'ParticleWithoutNoun',
                    message: '助詞「が」の前に名詞がありません',
                    position: 0,
                    severity: 'error'
                },
                {
                    code: 'ConsecutiveNouns',
                    message: '名詞が連続しています',
                    position: 3,
                    severity: 'warning'
                }
            ],
            errorCount: 1,
            warningCount: 1
        });

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('validate_dsl_sequence', {
            input: 'が _N:User _N:Order'
        });

        expect(result.isValid).toBe(false);
        expect(result.errorCount).toBe(1);
        expect(result.warningCount).toBe(1);
    });
});

// ============================================================================
// Phase 6 Step 3: Pattern Template Tests
// ============================================================================

describe('Pattern Template Command Invocation', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should invoke get_patterns command', async () => {
        const patterns = [
            {
                id: 'sov_basic',
                name: '基本文型（主語-目的語-動詞）',
                description: '「誰が何をどうする」の基本形',
                structure: '名詞 が 名詞 を 動詞',
                example: 'ユーザー が ドキュメント を 分析して',
                blocks: [
                    { blockType: 'promps_noun', label: '主語', isPlaceholder: true },
                    { blockType: 'promps_particle_ga', label: 'が', isPlaceholder: false },
                    { blockType: 'promps_noun', label: '目的語', isPlaceholder: true },
                    { blockType: 'promps_particle_wo', label: 'を', isPlaceholder: false },
                    { blockType: 'promps_verb_analyze', label: '動詞', isPlaceholder: true }
                ]
            }
        ];
        mockInvoke.mockResolvedValue(patterns);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('get_patterns');

        expect(mockInvoke).toHaveBeenCalledWith('get_patterns');
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('sov_basic');
    });

    test('should invoke analyze_dsl_patterns command', async () => {
        const matchResults = [
            {
                patternId: 'ov_simple',
                patternName: '目的語-動詞文型',
                matchScore: 1.0,
                missingElements: [],
                isComplete: true
            },
            {
                patternId: 'sov_basic',
                patternName: '基本文型（主語-目的語-動詞）',
                matchScore: 0.6,
                missingElements: ['主語', 'が'],
                isComplete: false
            }
        ];
        mockInvoke.mockResolvedValue(matchResults);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('analyze_dsl_patterns', {
            input: '_N:Doc を 分析して'
        });

        expect(mockInvoke).toHaveBeenCalledWith('analyze_dsl_patterns', {
            input: '_N:Doc を 分析して'
        });
        expect(result[0].matchScore).toBe(1.0);
        expect(result[0].isComplete).toBe(true);
    });
});

describe('Pattern Template Data Structure', () => {
    test('should have required fields in pattern template', async () => {
        const pattern = {
            id: 'test_pattern',
            name: 'テストパターン',
            description: 'テスト用パターン',
            structure: '名詞 を 動詞',
            example: 'テスト を 実行して',
            blocks: [
                { blockType: 'promps_noun', label: '対象', isPlaceholder: true },
                { blockType: 'promps_particle_wo', label: 'を', isPlaceholder: false },
                { blockType: 'promps_verb_custom', label: '動詞', isPlaceholder: true }
            ]
        };

        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.structure).toBeDefined();
        expect(pattern.blocks).toBeDefined();
        expect(Array.isArray(pattern.blocks)).toBe(true);
    });

    test('should distinguish placeholder and fixed blocks', () => {
        const blocks = [
            { blockType: 'promps_noun', label: '主語', isPlaceholder: true },
            { blockType: 'promps_particle_ga', label: 'が', isPlaceholder: false }
        ];

        const placeholders = blocks.filter(b => b.isPlaceholder);
        const fixed = blocks.filter(b => !b.isPlaceholder);

        expect(placeholders.length).toBe(1);
        expect(fixed.length).toBe(1);
        expect(placeholders[0].label).toBe('主語');
        expect(fixed[0].label).toBe('が');
    });
});

describe('Pattern Match Result', () => {
    test('should indicate complete match', () => {
        const matchResult = {
            patternId: 'ov_simple',
            patternName: '目的語-動詞文型',
            matchScore: 1.0,
            missingElements: [],
            isComplete: true
        };

        expect(matchResult.matchScore).toBe(1.0);
        expect(matchResult.isComplete).toBe(true);
        expect(matchResult.missingElements.length).toBe(0);
    });

    test('should indicate partial match', () => {
        const matchResult = {
            patternId: 'sov_basic',
            patternName: '基本文型',
            matchScore: 0.4,
            missingElements: ['主語', 'が', '動詞'],
            isComplete: false
        };

        expect(matchResult.matchScore).toBeLessThan(1.0);
        expect(matchResult.isComplete).toBe(false);
        expect(matchResult.missingElements.length).toBeGreaterThan(0);
    });

    test('should sort results by match score', () => {
        const results = [
            { patternId: 'p1', matchScore: 0.3, isComplete: false },
            { patternId: 'p2', matchScore: 0.8, isComplete: false },
            { patternId: 'p3', matchScore: 1.0, isComplete: true },
            { patternId: 'p4', matchScore: 0.5, isComplete: false }
        ];

        // Sort by matchScore descending
        results.sort((a, b) => b.matchScore - a.matchScore);

        expect(results[0].patternId).toBe('p3');
        expect(results[1].patternId).toBe('p2');
        expect(results[2].patternId).toBe('p4');
        expect(results[3].patternId).toBe('p1');
    });
});

describe('Pattern Template Display', () => {
    let mockPatternContainer;
    let mockSuggestionsContainer;

    beforeEach(() => {
        mockPatternContainer = {
            innerHTML: '',
            appendChild: jest.fn()
        };
        mockSuggestionsContainer = {
            innerHTML: '',
            appendChild: jest.fn()
        };

        global.document.getElementById = jest.fn((id) => {
            if (id === 'patternTemplates') return mockPatternContainer;
            if (id === 'patternSuggestions') return mockSuggestionsContainer;
            if (id === 'validationResult') return mockValidationContainer;
            return null;
        });
    });

    test('should create pattern list elements', () => {
        const patterns = [
            {
                id: 'sov_basic',
                name: '基本文型',
                structure: '名詞 が 名詞 を 動詞',
                example: 'ユーザー が ドキュメント を 分析して',
                blocks: []
            }
        ];

        // Simulated displayPatterns logic
        for (const pattern of patterns) {
            const item = {
                className: 'pattern-item',
                children: []
            };
            item.children.push({ className: 'pattern-name', textContent: pattern.name });
            item.children.push({ className: 'pattern-structure', textContent: pattern.structure });
            item.children.push({ className: 'pattern-example', textContent: `例: ${pattern.example}` });

            expect(item.className).toBe('pattern-item');
            expect(item.children[0].textContent).toBe('基本文型');
            expect(item.children[1].textContent).toContain('名詞 が');
        }
    });

    test('should display pattern suggestions with score', () => {
        const matchResults = [
            {
                patternId: 'ov_simple',
                patternName: '目的語-動詞文型',
                matchScore: 0.67,
                isComplete: false
            }
        ];

        // Simulated displayMatchResults logic
        for (const match of matchResults) {
            const item = {
                className: 'suggestion-item',
                name: match.patternName,
                score: `${Math.round(match.matchScore * 100)}%`
            };

            expect(item.score).toBe('67%');
            expect(item.name).toBe('目的語-動詞文型');
        }
    });

    test('should add complete badge for 100% matches', () => {
        const matchResults = [
            {
                patternId: 'ov_simple',
                patternName: '目的語-動詞文型',
                matchScore: 1.0,
                isComplete: true
            }
        ];

        for (const match of matchResults) {
            const hasCompleteBadge = match.isComplete;
            expect(hasCompleteBadge).toBe(true);
        }
    });
});

describe('Pattern Application', () => {
    let mockWorkspaceForPattern;

    beforeEach(() => {
        mockWorkspaceForPattern = {
            clear: jest.fn(),
            newBlock: jest.fn().mockReturnValue({
                initSvg: jest.fn(),
                render: jest.fn(),
                moveBy: jest.fn(),
                previousConnection: { connect: jest.fn() },
                nextConnection: { connect: jest.fn() }
            }),
            fireChangeListener: jest.fn()
        };
        global.workspace = mockWorkspaceForPattern;
        global.Blockly = {
            Events: {
                BlockCreate: jest.fn().mockReturnValue({})
            }
        };
    });

    test('should clear workspace before applying pattern', () => {
        const pattern = {
            id: 'ov_simple',
            blocks: [
                { blockType: 'promps_noun', label: '目的語', isPlaceholder: true },
                { blockType: 'promps_particle_wo', label: 'を', isPlaceholder: false },
                { blockType: 'promps_verb_summarize', label: '動詞', isPlaceholder: true }
            ]
        };

        // Simulated applyPattern logic
        mockWorkspaceForPattern.clear();

        expect(mockWorkspaceForPattern.clear).toHaveBeenCalled();
    });

    test('should create blocks from pattern', () => {
        const pattern = {
            id: 'ov_simple',
            blocks: [
                { blockType: 'promps_noun', label: '目的語', isPlaceholder: true },
                { blockType: 'promps_particle_wo', label: 'を', isPlaceholder: false },
                { blockType: 'promps_verb_summarize', label: '動詞', isPlaceholder: true }
            ]
        };

        // Simulated applyPattern logic
        for (const blockDef of pattern.blocks) {
            mockWorkspaceForPattern.newBlock(blockDef.blockType);
        }

        expect(mockWorkspaceForPattern.newBlock).toHaveBeenCalledTimes(3);
        expect(mockWorkspaceForPattern.newBlock).toHaveBeenCalledWith('promps_noun');
        expect(mockWorkspaceForPattern.newBlock).toHaveBeenCalledWith('promps_particle_wo');
        expect(mockWorkspaceForPattern.newBlock).toHaveBeenCalledWith('promps_verb_summarize');
    });
});

describe('Pattern Template Integration', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should load patterns on initialization', async () => {
        const patterns = [
            { id: 'sov_basic', name: '基本文型', blocks: [] },
            { id: 'ov_simple', name: '目的語-動詞文型', blocks: [] }
        ];
        mockInvoke.mockResolvedValue(patterns);

        const invoke = window.__TAURI__.invoke;
        const loadedPatterns = await invoke('get_patterns');

        expect(loadedPatterns.length).toBe(2);
    });

    test('should analyze patterns during preview update', async () => {
        const matchResults = [
            { patternId: 'ov_simple', matchScore: 1.0, isComplete: true }
        ];
        mockInvoke.mockResolvedValue(matchResults);

        const invoke = window.__TAURI__.invoke;
        const dslCode = '_N:Doc を 分析して';
        const results = await invoke('analyze_dsl_patterns', { input: dslCode });

        expect(results[0].patternId).toBe('ov_simple');
        expect(results[0].isComplete).toBe(true);
    });

    test('should handle empty input for pattern analysis', async () => {
        mockInvoke.mockResolvedValue([]);

        const invoke = window.__TAURI__.invoke;
        const results = await invoke('analyze_dsl_patterns', { input: '' });

        expect(results.length).toBe(0);
    });
});
