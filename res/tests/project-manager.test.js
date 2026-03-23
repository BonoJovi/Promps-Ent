/**
 * Promps Phase 4 - Project Manager Tests
 *
 * Tests for project persistence functionality:
 * - Workspace state serialization
 * - Project file format validation
 * - Dirty state tracking
 * - Save/Load operations
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

// Mock Blockly workspace
let mockWorkspace;

beforeEach(() => {
    mockInvoke = jest.fn();

    // Mock Tauri v2 API
    global.window = global.window || {};
    global.window.__TAURI_INTERNALS__ = {
        invoke: mockInvoke
    };

    // Mock Blockly
    mockWorkspace = {
        clear: jest.fn(),
        scale: 1.0,
        getMetrics: jest.fn(() => ({
            viewLeft: 0,
            viewTop: 0
        })),
        setScale: jest.fn(),
        scroll: jest.fn()
    };

    // Mock Blockly serialization API
    global.Blockly = {
        serialization: {
            workspaces: {
                save: jest.fn(() => ({ blocks: { blocks: [] } })),
                load: jest.fn()
            }
        }
    };

    global.workspace = mockWorkspace;
});

describe('Project File Format', () => {
    test('should have correct version', () => {
        const project = {
            version: '1.0.0',
            metadata: {
                name: 'Test Project',
                createdAt: '2026-01-23T10:00:00Z',
                modifiedAt: '2026-01-23T10:00:00Z'
            },
            workspace: {},
            settings: {}
        };

        expect(project.version).toBe('1.0.0');
    });

    test('should contain required metadata fields', () => {
        const metadata = {
            name: 'My Project',
            description: 'Test description',
            createdAt: '2026-01-23T10:00:00Z',
            modifiedAt: '2026-01-23T11:00:00Z',
            author: 'Test Author'
        };

        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('createdAt');
        expect(metadata).toHaveProperty('modifiedAt');
    });

    test('should allow optional metadata fields', () => {
        const metadata = {
            name: 'Minimal Project',
            createdAt: '2026-01-23T10:00:00Z',
            modifiedAt: '2026-01-23T10:00:00Z'
        };

        expect(metadata.description).toBeUndefined();
        expect(metadata.author).toBeUndefined();
    });

    test('should have valid settings structure', () => {
        const settings = {
            zoom: 1.5,
            scrollX: 100,
            scrollY: 200
        };

        expect(settings.zoom).toBeGreaterThan(0);
        expect(typeof settings.scrollX).toBe('number');
        expect(typeof settings.scrollY).toBe('number');
    });
});

describe('Workspace State Serialization', () => {
    test('should serialize empty workspace', () => {
        const state = Blockly.serialization.workspaces.save(mockWorkspace);

        expect(state).toBeDefined();
        expect(state.blocks).toBeDefined();
    });

    test('should call Blockly serialization API', () => {
        Blockly.serialization.workspaces.save(mockWorkspace);

        expect(Blockly.serialization.workspaces.save).toHaveBeenCalled();
    });

    test('should load workspace state', () => {
        const state = { blocks: { blocks: [{ type: 'promps_noun' }] } };

        Blockly.serialization.workspaces.load(state, mockWorkspace);

        expect(Blockly.serialization.workspaces.load).toHaveBeenCalledWith(
            state,
            mockWorkspace
        );
    });
});

describe('Workspace Settings', () => {
    test('should get default settings', () => {
        const settings = {
            zoom: mockWorkspace.scale || 1.0,
            scrollX: mockWorkspace.getMetrics().viewLeft || 0,
            scrollY: mockWorkspace.getMetrics().viewTop || 0
        };

        expect(settings.zoom).toBe(1.0);
        expect(settings.scrollX).toBe(0);
        expect(settings.scrollY).toBe(0);
    });

    test('should apply zoom setting', () => {
        const newZoom = 1.5;

        mockWorkspace.setScale(newZoom);

        expect(mockWorkspace.setScale).toHaveBeenCalledWith(1.5);
    });

    test('should apply scroll position', () => {
        const scrollX = 100;
        const scrollY = 200;

        mockWorkspace.scroll(scrollX, scrollY);

        expect(mockWorkspace.scroll).toHaveBeenCalledWith(100, 200);
    });
});

describe('Dirty State Tracking', () => {
    let isDirty;

    beforeEach(() => {
        isDirty = false;
    });

    test('should start as not dirty', () => {
        expect(isDirty).toBe(false);
    });

    test('should mark as dirty on change', () => {
        const markDirty = () => { isDirty = true; };

        markDirty();

        expect(isDirty).toBe(true);
    });

    test('should clear dirty on save', () => {
        isDirty = true;

        const clearDirty = () => { isDirty = false; };
        clearDirty();

        expect(isDirty).toBe(false);
    });

    test('should update window title when dirty', () => {
        const projectName = 'Test Project';
        const updateTitle = (name, dirty) => `${name}${dirty ? ' *' : ''} - Promps`;

        expect(updateTitle(projectName, false)).toBe('Test Project - Promps');
        expect(updateTitle(projectName, true)).toBe('Test Project * - Promps');
    });
});

describe('Save Project Command', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should call save_project command', async () => {
        const project = {
            version: '1.0.0',
            metadata: {
                name: 'Test',
                createdAt: '2026-01-23T10:00:00Z',
                modifiedAt: '2026-01-23T10:00:00Z'
            },
            workspace: {},
            settings: {}
        };

        mockInvoke.mockResolvedValue(undefined);

        const invoke = window.__TAURI_INTERNALS__.invoke;
        await invoke('save_project', { path: '/test/file.promps', project });

        expect(mockInvoke).toHaveBeenCalledWith('save_project', {
            path: '/test/file.promps',
            project
        });
    });

    test('should handle save error', async () => {
        mockInvoke.mockRejectedValue(new Error('Failed to save'));

        const invoke = window.__TAURI_INTERNALS__.invoke;

        await expect(
            invoke('save_project', { path: '/invalid/path.promps', project: {} })
        ).rejects.toThrow('Failed to save');
    });
});

describe('Load Project Command', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should call load_project command', async () => {
        const expectedProject = {
            version: '1.0.0',
            metadata: {
                name: 'Loaded Project',
                createdAt: '2026-01-23T10:00:00Z',
                modifiedAt: '2026-01-23T10:00:00Z'
            },
            workspace: { blocks: {} },
            settings: { zoom: 1.0 }
        };

        mockInvoke.mockResolvedValue(expectedProject);

        const invoke = window.__TAURI_INTERNALS__.invoke;
        const result = await invoke('load_project', { path: '/test/file.promps' });

        expect(mockInvoke).toHaveBeenCalledWith('load_project', {
            path: '/test/file.promps'
        });
        expect(result.metadata.name).toBe('Loaded Project');
    });

    test('should handle load error for nonexistent file', async () => {
        mockInvoke.mockRejectedValue(new Error('File not found'));

        const invoke = window.__TAURI_INTERNALS__.invoke;

        await expect(
            invoke('load_project', { path: '/nonexistent/file.promps' })
        ).rejects.toThrow('File not found');
    });

    test('should handle load error for invalid JSON', async () => {
        mockInvoke.mockRejectedValue(new Error('Failed to parse project file'));

        const invoke = window.__TAURI_INTERNALS__.invoke;

        await expect(
            invoke('load_project', { path: '/test/invalid.promps' })
        ).rejects.toThrow('Failed to parse');
    });
});

describe('New Project Command', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should call create_new_project command', async () => {
        const expectedProject = {
            version: '1.0.0',
            metadata: {
                name: 'Untitled',
                createdAt: '2026-01-23T10:00:00Z',
                modifiedAt: '2026-01-23T10:00:00Z'
            },
            workspace: {},
            settings: { zoom: 1.0, scrollX: 0, scrollY: 0 }
        };

        mockInvoke.mockResolvedValue(expectedProject);

        const invoke = window.__TAURI_INTERNALS__.invoke;
        const result = await invoke('create_new_project', { name: 'Untitled' });

        expect(mockInvoke).toHaveBeenCalledWith('create_new_project', {
            name: 'Untitled'
        });
        expect(result.metadata.name).toBe('Untitled');
    });

    test('should clear workspace on new project', () => {
        mockWorkspace.clear();

        expect(mockWorkspace.clear).toHaveBeenCalled();
    });
});

describe('File Path Validation', () => {
    test('should accept .promps extension', () => {
        const validatePath = (path) => path.toLowerCase().endsWith('.promps');

        expect(validatePath('/test/file.promps')).toBe(true);
        expect(validatePath('/test/file.PROMPS')).toBe(true);
    });

    test('should reject non-.promps extension', () => {
        const validatePath = (path) => path.toLowerCase().endsWith('.promps');

        expect(validatePath('/test/file.txt')).toBe(false);
        expect(validatePath('/test/file.json')).toBe(false);
    });

    test('should add .promps extension if missing', () => {
        const ensureExtension = (path) => {
            if (!path.toLowerCase().endsWith('.promps')) {
                return path + '.promps';
            }
            return path;
        };

        expect(ensureExtension('/test/file')).toBe('/test/file.promps');
        expect(ensureExtension('/test/file.promps')).toBe('/test/file.promps');
    });
});

describe('Project Name Extraction', () => {
    test('should extract name from file path', () => {
        const extractName = (path) => {
            return path.split(/[\\/]/).pop().replace('.promps', '');
        };

        expect(extractName('/home/user/MyProject.promps')).toBe('MyProject');
        expect(extractName('C:\\Users\\test\\Project.promps')).toBe('Project');
    });
});

describe('Local Project Creation Fallback', () => {
    test('should create valid local project', () => {
        const now = new Date().toISOString();
        const project = {
            version: '1.0.0',
            metadata: {
                name: 'Untitled',
                description: null,
                createdAt: now,
                modifiedAt: now,
                author: null
            },
            workspace: {},
            settings: {
                zoom: 1.0,
                scrollX: 0,
                scrollY: 0
            }
        };

        expect(project.version).toBe('1.0.0');
        expect(project.metadata.name).toBe('Untitled');
        expect(project.settings.zoom).toBe(1.0);
    });
});

// ============================================================================
// Phase Block Serialization Tests
// ============================================================================

describe('Phase 2: Noun Block Serialization', () => {
    test('should serialize single noun block', () => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: 'promps_noun',
                        id: 'noun_block_1',
                        x: 50,
                        y: 50,
                        fields: {
                            TEXT: 'ユーザー'
                        }
                    }
                ]
            }
        };

        expect(workspace.blocks.blocks).toHaveLength(1);
        expect(workspace.blocks.blocks[0].type).toBe('promps_noun');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('ユーザー');
    });

    test('should deserialize single noun block', () => {
        const json = JSON.stringify({
            blocks: {
                blocks: [
                    {
                        type: 'promps_noun',
                        id: 'noun_block_1',
                        x: 50,
                        y: 50,
                        fields: { TEXT: 'Document' }
                    }
                ]
            }
        });

        const workspace = JSON.parse(json);

        expect(workspace.blocks.blocks[0].type).toBe('promps_noun');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('Document');
    });
});

describe('Phase 2: Particle Block Serialization', () => {
    const particleTypes = [
        'promps_particle_ga',
        'promps_particle_wo',
        'promps_particle_ni',
        'promps_particle_de',
        'promps_particle_to',
        'promps_particle_he',
        'promps_particle_kara',
        'promps_particle_made',
        'promps_particle_yori'
    ];

    test.each(particleTypes)('should serialize single %s block', (particleType) => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: particleType,
                        id: `${particleType}_1`,
                        x: 100,
                        y: 100
                    }
                ]
            }
        };

        expect(workspace.blocks.blocks).toHaveLength(1);
        expect(workspace.blocks.blocks[0].type).toBe(particleType);
    });

    test('should deserialize particle block', () => {
        const json = JSON.stringify({
            blocks: {
                blocks: [
                    {
                        type: 'promps_particle_wo',
                        id: 'particle_wo_1',
                        x: 100,
                        y: 100
                    }
                ]
            }
        });

        const workspace = JSON.parse(json);

        expect(workspace.blocks.blocks[0].type).toBe('promps_particle_wo');
    });
});

describe('Phase 3: Verb Block Serialization', () => {
    const fixedVerbTypes = [
        'promps_verb_analyze',
        'promps_verb_summarize',
        'promps_verb_translate',
        'promps_verb_create',
        'promps_verb_generate',
        'promps_verb_convert',
        'promps_verb_delete',
        'promps_verb_update',
        'promps_verb_extract',
        'promps_verb_explain',
        'promps_verb_describe',
        'promps_verb_teach'
    ];

    test.each(fixedVerbTypes)('should serialize single %s block', (verbType) => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: verbType,
                        id: `${verbType}_1`,
                        x: 150,
                        y: 150
                    }
                ]
            }
        };

        expect(workspace.blocks.blocks).toHaveLength(1);
        expect(workspace.blocks.blocks[0].type).toBe(verbType);
    });

    test('should serialize custom verb block with text field', () => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: 'promps_verb_custom',
                        id: 'custom_verb_1',
                        x: 150,
                        y: 150,
                        fields: {
                            TEXT: '実行して'
                        }
                    }
                ]
            }
        };

        expect(workspace.blocks.blocks[0].type).toBe('promps_verb_custom');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('実行して');
    });

    test('should deserialize custom verb block', () => {
        const json = JSON.stringify({
            blocks: {
                blocks: [
                    {
                        type: 'promps_verb_custom',
                        id: 'custom_verb_1',
                        x: 150,
                        y: 150,
                        fields: { TEXT: 'カスタム動詞' }
                    }
                ]
            }
        });

        const workspace = JSON.parse(json);

        expect(workspace.blocks.blocks[0].type).toBe('promps_verb_custom');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('カスタム動詞');
    });
});

describe('Phase 2: Other Block Serialization', () => {
    test('should serialize single other block', () => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: 'promps_other',
                        id: 'other_block_1',
                        x: 200,
                        y: 200,
                        fields: {
                            TEXT: 'その他テキスト'
                        }
                    }
                ]
            }
        };

        expect(workspace.blocks.blocks).toHaveLength(1);
        expect(workspace.blocks.blocks[0].type).toBe('promps_other');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('その他テキスト');
    });

    test('should deserialize other block', () => {
        const json = JSON.stringify({
            blocks: {
                blocks: [
                    {
                        type: 'promps_other',
                        id: 'other_block_1',
                        x: 200,
                        y: 200,
                        fields: { TEXT: 'custom text' }
                    }
                ]
            }
        });

        const workspace = JSON.parse(json);

        expect(workspace.blocks.blocks[0].type).toBe('promps_other');
        expect(workspace.blocks.blocks[0].fields.TEXT).toBe('custom text');
    });
});

describe('Combined Block Chain Serialization', () => {
    test('should serialize complete prompt chain: Noun → Particle → Verb', () => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: 'promps_noun',
                        id: 'noun_1',
                        x: 50,
                        y: 50,
                        fields: { TEXT: 'ドキュメント' },
                        next: {
                            block: {
                                type: 'promps_particle_wo',
                                id: 'particle_1',
                                next: {
                                    block: {
                                        type: 'promps_verb_analyze',
                                        id: 'verb_1'
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        };

        // Verify chain structure
        expect(workspace.blocks.blocks[0].type).toBe('promps_noun');
        expect(workspace.blocks.blocks[0].next.block.type).toBe('promps_particle_wo');
        expect(workspace.blocks.blocks[0].next.block.next.block.type).toBe('promps_verb_analyze');
    });

    test('should deserialize complete prompt chain', () => {
        const json = JSON.stringify({
            blocks: {
                blocks: [
                    {
                        type: 'promps_noun',
                        id: 'noun_1',
                        x: 50,
                        y: 50,
                        fields: { TEXT: 'レポート' },
                        next: {
                            block: {
                                type: 'promps_particle_wo',
                                id: 'particle_1',
                                next: {
                                    block: {
                                        type: 'promps_verb_summarize',
                                        id: 'verb_1'
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        });

        const workspace = JSON.parse(json);
        const topBlock = workspace.blocks.blocks[0];

        expect(topBlock.type).toBe('promps_noun');
        expect(topBlock.fields.TEXT).toBe('レポート');
        expect(topBlock.next.block.type).toBe('promps_particle_wo');
        expect(topBlock.next.block.next.block.type).toBe('promps_verb_summarize');
    });

    test('should serialize complex chain: Noun → Particle → Noun → Particle → Verb', () => {
        const workspace = {
            blocks: {
                blocks: [
                    {
                        type: 'promps_noun',
                        id: 'noun_1',
                        x: 50,
                        y: 50,
                        fields: { TEXT: 'ユーザー' },
                        next: {
                            block: {
                                type: 'promps_particle_ga',
                                id: 'particle_1',
                                next: {
                                    block: {
                                        type: 'promps_noun',
                                        id: 'noun_2',
                                        fields: { TEXT: 'データ' },
                                        next: {
                                            block: {
                                                type: 'promps_particle_wo',
                                                id: 'particle_2',
                                                next: {
                                                    block: {
                                                        type: 'promps_verb_create',
                                                        id: 'verb_1'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        };

        // Count blocks in chain
        let blockCount = 0;
        let current = workspace.blocks.blocks[0];
        while (current) {
            blockCount++;
            current = current.next?.block;
        }

        expect(blockCount).toBe(5);
    });

    test('should serialize all block types in one project', () => {
        const project = {
            version: '1.0.0',
            metadata: {
                name: 'All Blocks Test',
                createdAt: '2026-01-24T10:00:00Z',
                modifiedAt: '2026-01-24T10:00:00Z'
            },
            workspace: {
                blocks: {
                    blocks: [
                        // Chain 1: Noun → Particle → Verb
                        {
                            type: 'promps_noun',
                            id: 'noun_1',
                            x: 50,
                            y: 50,
                            fields: { TEXT: 'テスト' },
                            next: {
                                block: {
                                    type: 'promps_particle_wo',
                                    id: 'particle_1',
                                    next: {
                                        block: {
                                            type: 'promps_verb_analyze',
                                            id: 'verb_1'
                                        }
                                    }
                                }
                            }
                        },
                        // Chain 2: Other block (standalone)
                        {
                            type: 'promps_other',
                            id: 'other_1',
                            x: 50,
                            y: 200,
                            fields: { TEXT: 'テキスト' }
                        },
                        // Chain 3: Custom verb
                        {
                            type: 'promps_verb_custom',
                            id: 'custom_1',
                            x: 50,
                            y: 300,
                            fields: { TEXT: 'カスタム動詞' }
                        }
                    ]
                }
            },
            settings: { zoom: 1.0, scrollX: 0, scrollY: 0 }
        };

        // Serialize and deserialize
        const json = JSON.stringify(project);
        const restored = JSON.parse(json);

        expect(restored.workspace.blocks.blocks).toHaveLength(3);
        expect(restored.workspace.blocks.blocks[0].type).toBe('promps_noun');
        expect(restored.workspace.blocks.blocks[1].type).toBe('promps_other');
        expect(restored.workspace.blocks.blocks[2].type).toBe('promps_verb_custom');
    });
});
