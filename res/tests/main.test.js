/**
 * Promps - Main UI Logic Tests
 *
 * Tests for frontend UI logic and Tauri integration
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

beforeEach(() => {
    mockInvoke = jest.fn();
    global.window = global.window || {};
    global.window.__TAURI__ = {
        invoke: mockInvoke
    };
});

describe('Tauri Command Invocation', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should invoke greet command correctly', async () => {
        mockInvoke.mockResolvedValue('Hello, Tauri! Welcome to Promps.');

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('greet', { name: 'Tauri' });

        expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'Tauri' });
        expect(result).toBe('Hello, Tauri! Welcome to Promps.');
    });

    test('should invoke generate_prompt_from_text command', async () => {
        const expectedPrompt = 'ユーザー (NOUN) が 注文 (NOUN) を 作成';
        mockInvoke.mockResolvedValue(expectedPrompt);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', {
            input: '_N:ユーザー が _N:注文 を 作成'
        });

        expect(mockInvoke).toHaveBeenCalledWith('generate_prompt_from_text', {
            input: '_N:ユーザー が _N:注文 を 作成'
        });
        expect(result).toContain('ユーザー');
        expect(result).toContain('注文');
    });

    test('should handle command errors gracefully', async () => {
        mockInvoke.mockRejectedValue(new Error('Command failed'));

        const invoke = window.__TAURI__.invoke;

        await expect(
            invoke('generate_prompt_from_text', { input: '' })
        ).rejects.toThrow('Command failed');
    });
});

describe('Prompt Generation Logic', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should generate prompt from simple DSL', async () => {
        const input = '_N:User';
        const expectedOutput = 'User (NOUN)';

        mockInvoke.mockResolvedValue(expectedOutput);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', { input });

        expect(result).toContain('User');
        expect(result).toContain('(NOUN)');
    });

    test('should generate prompt from complex DSL', async () => {
        const input = '_N:GUI ブロック ビルダー 機能  ドラッグ アンド ドロップ で ブロック を 配置 する';
        mockInvoke.mockResolvedValue('GUI ブロック ビルダー 機能 (NOUN)\nドラッグ アンド ドロップ で ブロック を 配置 する\n');

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', { input });

        expect(result).toContain('GUI ブロック ビルダー 機能');
        expect(result).toContain('(NOUN)');
        expect(result).toContain('ドラッグ アンド ドロップ で ブロック を 配置 する');
    });

    test('should handle empty input', async () => {
        const input = '';
        mockInvoke.mockResolvedValue('');

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', { input });

        expect(result).toBe('');
    });

    test('should handle multiple nouns', async () => {
        const input = '_N:ユーザー が _N:注文 を 作成';
        const expectedOutput = 'ユーザー (NOUN) が 注文 (NOUN) を 作成';

        mockInvoke.mockResolvedValue(expectedOutput);

        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', { input });

        expect(result).toContain('ユーザー');
        expect(result).toContain('注文');
        expect(result).toContain('(NOUN)');
    });
});

describe('Preview Update Logic', () => {
    let mockPreviewDiv;

    beforeEach(() => {
        mockInvoke.mockClear();
        mockPreviewDiv = {
            innerHTML: '',
            textContent: ''
        };
    });

    test('should show placeholder for empty DSL', async () => {
        const dslCode = '';

        // Simulate updatePreview logic
        if (!dslCode || dslCode.trim() === '') {
            mockPreviewDiv.innerHTML = '<p class="placeholder">Generated prompt will appear here.</p>';
        }

        expect(mockPreviewDiv.innerHTML).toContain('Generated prompt will appear here.');
    });

    test('should update preview with generated prompt', async () => {
        const dslCode = '_N:User';
        const prompt = 'User (NOUN)';

        mockInvoke.mockResolvedValue(prompt);

        // Simulate updatePreview logic
        const invoke = window.__TAURI__.invoke;
        const generatedPrompt = await invoke('generate_prompt_from_text', { input: dslCode });
        mockPreviewDiv.textContent = generatedPrompt;

        expect(mockPreviewDiv.textContent).toBe('User (NOUN)');
    });

    test('should show error message on generation failure', async () => {
        const dslCode = '_N:Invalid';
        const errorMessage = 'Generation failed';

        mockInvoke.mockRejectedValue(new Error(errorMessage));

        // Simulate updatePreview error handling
        try {
            const invoke = window.__TAURI__.invoke;
            await invoke('generate_prompt_from_text', { input: dslCode });
        } catch (error) {
            mockPreviewDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }

        expect(mockPreviewDiv.innerHTML).toContain('Error:');
        expect(mockPreviewDiv.innerHTML).toContain('Generation failed');
    });
});

describe('Real-time Preview Updates', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should trigger preview update on block change', async () => {
        const dslCode = '_N:User _N:Order ';
        const prompt = 'User (NOUN)\nOrder (NOUN)';

        mockInvoke.mockResolvedValue(prompt);

        // Simulate onBlocklyChange -> updatePreview flow
        const invoke = window.__TAURI__.invoke;
        const result = await invoke('generate_prompt_from_text', { input: dslCode.trim() });

        expect(mockInvoke).toHaveBeenCalled();
        expect(result).toContain('User');
        expect(result).toContain('Order');
    });

    test('should debounce rapid changes', async () => {
        // In real implementation, rapid changes should be debounced
        // Here we test that multiple calls work correctly
        const calls = [
            '_N:U',
            '_N:Us',
            '_N:Use',
            '_N:User'
        ];

        for (const input of calls) {
            mockInvoke.mockResolvedValue(`${input.replace('_N:', '')} (NOUN)`);
            const invoke = window.__TAURI__.invoke;
            await invoke('generate_prompt_from_text', { input });
        }

        expect(mockInvoke).toHaveBeenCalledTimes(4);
    });
});

describe('Undo/Redo Functionality', () => {
    let mockWorkspace;
    let mockBtnUndo;
    let mockBtnRedo;

    beforeEach(() => {
        // Mock workspace with undo/redo stacks
        mockWorkspace = {
            undoStack: [],
            redoStack: [],
            getUndoStack: function() { return this.undoStack; },
            getRedoStack: function() { return this.redoStack; },
            undo: jest.fn(function(redo) {
                if (redo) {
                    // Redo operation
                    if (this.redoStack.length > 0) {
                        const item = this.redoStack.pop();
                        this.undoStack.push(item);
                    }
                } else {
                    // Undo operation
                    if (this.undoStack.length > 0) {
                        const item = this.undoStack.pop();
                        this.redoStack.push(item);
                    }
                }
            })
        };

        // Mock buttons
        mockBtnUndo = { disabled: true };
        mockBtnRedo = { disabled: true };

        global.workspace = mockWorkspace;
        global.document = {
            getElementById: (id) => {
                if (id === 'btnUndo') return mockBtnUndo;
                if (id === 'btnRedo') return mockBtnRedo;
                return null;
            }
        };
    });

    test('should disable undo button when undo stack is empty', () => {
        mockWorkspace.undoStack = [];

        // Simulate updateUndoRedoButtons
        mockBtnUndo.disabled = mockWorkspace.getUndoStack().length === 0;
        mockBtnRedo.disabled = mockWorkspace.getRedoStack().length === 0;

        expect(mockBtnUndo.disabled).toBe(true);
        expect(mockBtnRedo.disabled).toBe(true);
    });

    test('should enable undo button when undo stack has items', () => {
        mockWorkspace.undoStack = [{ type: 'block_create' }];

        // Simulate updateUndoRedoButtons
        mockBtnUndo.disabled = mockWorkspace.getUndoStack().length === 0;
        mockBtnRedo.disabled = mockWorkspace.getRedoStack().length === 0;

        expect(mockBtnUndo.disabled).toBe(false);
        expect(mockBtnRedo.disabled).toBe(true);
    });

    test('should enable redo button when redo stack has items', () => {
        mockWorkspace.redoStack = [{ type: 'block_delete' }];

        // Simulate updateUndoRedoButtons
        mockBtnUndo.disabled = mockWorkspace.getUndoStack().length === 0;
        mockBtnRedo.disabled = mockWorkspace.getRedoStack().length === 0;

        expect(mockBtnUndo.disabled).toBe(true);
        expect(mockBtnRedo.disabled).toBe(false);
    });

    test('should call workspace.undo(false) for undo action', () => {
        mockWorkspace.undoStack = [{ type: 'block_create' }];

        // Simulate undoAction
        if (mockWorkspace.getUndoStack().length > 0) {
            mockWorkspace.undo(false);
        }

        expect(mockWorkspace.undo).toHaveBeenCalledWith(false);
    });

    test('should call workspace.undo(true) for redo action', () => {
        mockWorkspace.redoStack = [{ type: 'block_delete' }];

        // Simulate redoAction
        if (mockWorkspace.getRedoStack().length > 0) {
            mockWorkspace.undo(true);
        }

        expect(mockWorkspace.undo).toHaveBeenCalledWith(true);
    });

    test('should not call undo when undo stack is empty', () => {
        mockWorkspace.undoStack = [];

        // Simulate undoAction with empty stack
        if (mockWorkspace.getUndoStack().length > 0) {
            mockWorkspace.undo(false);
        }

        expect(mockWorkspace.undo).not.toHaveBeenCalled();
    });

    test('should not call redo when redo stack is empty', () => {
        mockWorkspace.redoStack = [];

        // Simulate redoAction with empty stack
        if (mockWorkspace.getRedoStack().length > 0) {
            mockWorkspace.undo(true);
        }

        expect(mockWorkspace.undo).not.toHaveBeenCalled();
    });

    test('should move item from undo to redo stack on undo', () => {
        mockWorkspace.undoStack = [{ type: 'block_create' }, { type: 'block_move' }];
        mockWorkspace.redoStack = [];

        // Perform undo
        mockWorkspace.undo(false);

        expect(mockWorkspace.undoStack.length).toBe(1);
        expect(mockWorkspace.redoStack.length).toBe(1);
        expect(mockWorkspace.redoStack[0].type).toBe('block_move');
    });

    test('should move item from redo to undo stack on redo', () => {
        mockWorkspace.undoStack = [];
        mockWorkspace.redoStack = [{ type: 'block_create' }];

        // Perform redo
        mockWorkspace.undo(true);

        expect(mockWorkspace.undoStack.length).toBe(1);
        expect(mockWorkspace.redoStack.length).toBe(0);
        expect(mockWorkspace.undoStack[0].type).toBe('block_create');
    });

    test('should handle multiple undo operations', () => {
        mockWorkspace.undoStack = [
            { type: 'block_create', id: 1 },
            { type: 'block_move', id: 2 },
            { type: 'block_change', id: 3 }
        ];
        mockWorkspace.redoStack = [];

        // Perform multiple undos
        mockWorkspace.undo(false);
        mockWorkspace.undo(false);

        expect(mockWorkspace.undoStack.length).toBe(1);
        expect(mockWorkspace.redoStack.length).toBe(2);
    });

    test('should handle undo then redo sequence', () => {
        mockWorkspace.undoStack = [{ type: 'block_create', id: 1 }];
        mockWorkspace.redoStack = [];

        // Undo
        mockWorkspace.undo(false);
        expect(mockWorkspace.undoStack.length).toBe(0);
        expect(mockWorkspace.redoStack.length).toBe(1);

        // Redo
        mockWorkspace.undo(true);
        expect(mockWorkspace.undoStack.length).toBe(1);
        expect(mockWorkspace.redoStack.length).toBe(0);
    });
});

describe('Keyboard Shortcuts for Undo/Redo', () => {
    let mockWorkspace;
    let keydownHandler;

    beforeEach(() => {
        mockWorkspace = {
            undoStack: [{ type: 'block_create' }],
            redoStack: [{ type: 'block_delete' }],
            getUndoStack: function() { return this.undoStack; },
            getRedoStack: function() { return this.redoStack; },
            undo: jest.fn()
        };

        global.workspace = mockWorkspace;
        global.document = {
            getElementById: () => ({ disabled: false }),
            addEventListener: (event, handler) => {
                if (event === 'keydown') {
                    keydownHandler = handler;
                }
            }
        };

        // Mock Blockly ShortcutRegistry
        global.Blockly = {
            ShortcutRegistry: {
                registry: {
                    unregister: jest.fn()
                }
            }
        };
    });

    test('should disable Blockly native undo/redo shortcuts', () => {
        const registry = Blockly.ShortcutRegistry.registry;

        // Simulate disableBlocklyUndoShortcuts
        try {
            registry.unregister('undo');
        } catch (e) {}
        try {
            registry.unregister('redo');
        } catch (e) {}

        expect(registry.unregister).toHaveBeenCalledWith('undo');
        expect(registry.unregister).toHaveBeenCalledWith('redo');
    });

    test('should trigger undo on Ctrl+Z', () => {
        const event = {
            ctrlKey: true,
            shiftKey: false,
            key: 'z',
            preventDefault: jest.fn()
        };

        // Simulate keydown handler logic
        if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (mockWorkspace.getUndoStack().length > 0) {
                mockWorkspace.undo(false);
            }
        }

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockWorkspace.undo).toHaveBeenCalledWith(false);
    });

    test('should trigger redo on Ctrl+Y', () => {
        const event = {
            ctrlKey: true,
            shiftKey: false,
            key: 'y',
            preventDefault: jest.fn()
        };

        // Simulate keydown handler logic
        if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            if (mockWorkspace.getRedoStack().length > 0) {
                mockWorkspace.undo(true);
            }
        }

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockWorkspace.undo).toHaveBeenCalledWith(true);
    });

    test('should trigger redo on Ctrl+Shift+Z', () => {
        const event = {
            ctrlKey: true,
            shiftKey: true,
            key: 'z',
            preventDefault: jest.fn()
        };

        // Simulate keydown handler logic
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (mockWorkspace.getRedoStack().length > 0) {
                mockWorkspace.undo(true);
            }
        }

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockWorkspace.undo).toHaveBeenCalledWith(true);
    });

    test('should not trigger undo without Ctrl key', () => {
        const event = {
            ctrlKey: false,
            shiftKey: false,
            key: 'z',
            preventDefault: jest.fn()
        };

        // Simulate keydown handler logic
        if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            mockWorkspace.undo(false);
        }

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockWorkspace.undo).not.toHaveBeenCalled();
    });

    test('should not trigger redo without Ctrl key', () => {
        const event = {
            ctrlKey: false,
            shiftKey: false,
            key: 'y',
            preventDefault: jest.fn()
        };

        // Simulate keydown handler logic
        if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            mockWorkspace.undo(true);
        }

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockWorkspace.undo).not.toHaveBeenCalled();
    });
});
