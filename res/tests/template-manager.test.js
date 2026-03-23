/**
 * Promps v1.2.0 - Template Manager Tests
 *
 * Tests for template v2 data structure, migration, category management,
 * and export/import functionality.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// ========================================================================
// Template Constants (same as blockly-config.js)
// ========================================================================

const TEMPLATE_VERSION = '2';

const TEMPLATE_ICONS = {
    star: '⭐',
    heart: '❤️',
    lightning: '⚡',
    fire: '🔥',
    leaf: '🌿',
    gem: '💎',
    rocket: '🚀',
    flag: '🚩',
    bookmark: '🔖',
    folder: '📁',
    document: '📄',
    code: '💻',
    chat: '💬',
    search: '🔍',
    tool: '🔧',
    custom: '📦'
};

const TEMPLATE_COLORS = {
    green: 120,
    cyan: 180,
    blue: 230,
    purple: 290,
    pink: 330,
    red: 0,
    orange: 30,
    yellow: 60
};

const TEMPLATE_DEFAULTS = {
    color: 330,
    icon: 'custom',
    category: 'default',
    description: '',
    version: TEMPLATE_VERSION
};

// ========================================================================
// Mock localStorage
// ========================================================================

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// ========================================================================
// Template Manager Functions (extracted for testing)
// ========================================================================

/**
 * Count blocks in serialized block data
 */
function _countBlocks(blockData) {
    if (!blockData || typeof blockData !== 'object') return 0;

    let count = 1;

    if (blockData.next && blockData.next.block) {
        count += _countBlocks(blockData.next.block);
    }

    if (blockData.inputs) {
        for (const inputName in blockData.inputs) {
            const input = blockData.inputs[inputName];
            if (input && input.block) {
                count += _countBlocks(input.block);
            }
        }
    }

    return count;
}

/**
 * Extract text values from blocks recursively
 */
function _extractTextFromBlocks(blockData, parts) {
    if (!blockData || typeof blockData !== 'object') return;

    if (blockData.fields) {
        for (const fieldName in blockData.fields) {
            const value = blockData.fields[fieldName];
            if (typeof value === 'string' && value.trim()) {
                parts.push(value.trim());
            }
        }
    }

    if (blockData.next && blockData.next.block) {
        _extractTextFromBlocks(blockData.next.block, parts);
    }

    if (blockData.inputs) {
        for (const inputName in blockData.inputs) {
            const input = blockData.inputs[inputName];
            if (input && input.block) {
                _extractTextFromBlocks(input.block, parts);
            }
        }
    }
}

/**
 * Generate preview text from serialized block data
 */
function _generatePreviewText(blockData) {
    if (!blockData || typeof blockData !== 'object') return '';

    const parts = [];
    _extractTextFromBlocks(blockData, parts);

    const fullText = parts.join(' ').trim();
    if (fullText.length > 50) {
        return fullText.substring(0, 47) + '...';
    }
    return fullText;
}

/**
 * Migrate a v1 template to v2 format
 */
function migrateToV2(template) {
    if (template.version === TEMPLATE_VERSION) {
        return template;
    }

    const blockCount = _countBlocks(template.blocks);
    const previewText = _generatePreviewText(template.blocks);

    return {
        ...template,
        version: TEMPLATE_VERSION,
        color: template.color ?? TEMPLATE_DEFAULTS.color,
        icon: template.icon ?? TEMPLATE_DEFAULTS.icon,
        category: template.category ?? TEMPLATE_DEFAULTS.category,
        description: template.description ?? TEMPLATE_DEFAULTS.description,
        blockCount: blockCount,
        previewText: previewText
    };
}

/**
 * Validate template v2 structure
 */
function isValidV2Template(template) {
    return template &&
           template.version === TEMPLATE_VERSION &&
           typeof template.id === 'string' &&
           typeof template.name === 'string' &&
           template.blocks !== undefined &&
           typeof template.color === 'number' &&
           typeof template.icon === 'string' &&
           typeof template.category === 'string';
}

/**
 * Generate export data
 */
function exportTemplate(template) {
    return {
        type: 'promps-template',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedFrom: 'Promps Ent v1.2.0',
        template: {
            name: template.name,
            description: template.description,
            color: template.color,
            icon: template.icon,
            category: template.category,
            blocks: template.blocks,
            blockCount: template.blockCount,
            previewText: template.previewText
        }
    };
}

/**
 * Import template from file data
 */
function importTemplate(data) {
    if (!data || data.type !== 'promps-template' || !data.template) {
        return null;
    }

    const imported = data.template;

    if (!imported.name || !imported.blocks) {
        return null;
    }

    return {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        name: imported.name,
        blocks: imported.blocks,
        createdAt: new Date().toISOString(),
        version: TEMPLATE_VERSION,
        color: imported.color ?? TEMPLATE_DEFAULTS.color,
        icon: imported.icon ?? TEMPLATE_DEFAULTS.icon,
        category: imported.category ?? TEMPLATE_DEFAULTS.category,
        description: imported.description ?? TEMPLATE_DEFAULTS.description,
        blockCount: imported.blockCount ?? _countBlocks(imported.blocks),
        previewText: imported.previewText ?? _generatePreviewText(imported.blocks)
    };
}

// ========================================================================
// Tests: Template Constants
// ========================================================================

describe('Template Constants', () => {
    test('TEMPLATE_VERSION should be "2"', () => {
        expect(TEMPLATE_VERSION).toBe('2');
    });

    test('TEMPLATE_ICONS should have 16 icons', () => {
        expect(Object.keys(TEMPLATE_ICONS).length).toBe(16);
    });

    test('TEMPLATE_ICONS should have required icons', () => {
        expect(TEMPLATE_ICONS.star).toBe('⭐');
        expect(TEMPLATE_ICONS.rocket).toBe('🚀');
        expect(TEMPLATE_ICONS.custom).toBe('📦');
    });

    test('TEMPLATE_COLORS should have 8 colors', () => {
        expect(Object.keys(TEMPLATE_COLORS).length).toBe(8);
    });

    test('TEMPLATE_COLORS should have valid HSV hue values (0-360)', () => {
        Object.values(TEMPLATE_COLORS).forEach(hue => {
            expect(hue).toBeGreaterThanOrEqual(0);
            expect(hue).toBeLessThanOrEqual(360);
        });
    });

    test('TEMPLATE_DEFAULTS should have default values', () => {
        expect(TEMPLATE_DEFAULTS.color).toBe(330);
        expect(TEMPLATE_DEFAULTS.icon).toBe('custom');
        expect(TEMPLATE_DEFAULTS.category).toBe('default');
        expect(TEMPLATE_DEFAULTS.description).toBe('');
        expect(TEMPLATE_DEFAULTS.version).toBe('2');
    });
});

// ========================================================================
// Tests: Block Counting
// ========================================================================

describe('Block Counting (_countBlocks)', () => {
    test('should return 0 for null/undefined input', () => {
        expect(_countBlocks(null)).toBe(0);
        expect(_countBlocks(undefined)).toBe(0);
    });

    test('should count single block', () => {
        const block = { type: 'promps_noun' };
        expect(_countBlocks(block)).toBe(1);
    });

    test('should count chained blocks (next)', () => {
        const blocks = {
            type: 'promps_noun',
            next: {
                block: {
                    type: 'promps_particle',
                    next: {
                        block: {
                            type: 'promps_verb'
                        }
                    }
                }
            }
        };
        expect(_countBlocks(blocks)).toBe(3);
    });

    test('should count nested blocks (inputs)', () => {
        const blocks = {
            type: 'promps_container',
            inputs: {
                CONTENT: {
                    block: {
                        type: 'promps_noun'
                    }
                }
            }
        };
        expect(_countBlocks(blocks)).toBe(2);
    });

    test('should count complex nested structure', () => {
        const blocks = {
            type: 'promps_noun',
            inputs: {
                INPUT1: { block: { type: 'child1' } },
                INPUT2: { block: { type: 'child2' } }
            },
            next: {
                block: {
                    type: 'promps_verb',
                    inputs: {
                        INPUT: { block: { type: 'child3' } }
                    }
                }
            }
        };
        expect(_countBlocks(blocks)).toBe(5);
    });
});

// ========================================================================
// Tests: Preview Text Generation
// ========================================================================

describe('Preview Text Generation (_generatePreviewText)', () => {
    test('should return empty string for null/undefined input', () => {
        expect(_generatePreviewText(null)).toBe('');
        expect(_generatePreviewText(undefined)).toBe('');
    });

    test('should extract text from fields', () => {
        const block = {
            type: 'promps_noun',
            fields: { TEXT: 'ユーザー' }
        };
        expect(_generatePreviewText(block)).toBe('ユーザー');
    });

    test('should extract text from chained blocks', () => {
        const blocks = {
            type: 'promps_noun',
            fields: { TEXT: 'ユーザー' },
            next: {
                block: {
                    type: 'promps_particle',
                    fields: { TEXT: 'が' }
                }
            }
        };
        expect(_generatePreviewText(blocks)).toBe('ユーザー が');
    });

    test('should truncate long text to 50 chars', () => {
        const block = {
            fields: {
                TEXT: 'This is a very long text that should be truncated because it exceeds the 50 character limit'
            }
        };
        const result = _generatePreviewText(block);
        expect(result.length).toBeLessThanOrEqual(50);
        expect(result.endsWith('...')).toBe(true);
    });
});

// ========================================================================
// Tests: Template Migration (v1 → v2)
// ========================================================================

describe('Template Migration (v1 → v2)', () => {
    test('should not modify v2 templates', () => {
        const v2Template = {
            id: '123',
            name: 'Test',
            blocks: { type: 'promps_noun' },
            version: '2',
            color: 230,
            icon: 'star',
            category: 'favorites',
            description: 'A test template',
            blockCount: 1,
            previewText: 'Test'
        };

        const result = migrateToV2(v2Template);
        expect(result).toEqual(v2Template);
    });

    test('should migrate v1 template with default values', () => {
        const v1Template = {
            id: '123',
            name: 'Old Template',
            blocks: { type: 'promps_noun', fields: { TEXT: 'Hello' } },
            createdAt: '2025-01-01T00:00:00Z'
        };

        const result = migrateToV2(v1Template);

        expect(result.version).toBe('2');
        expect(result.color).toBe(330); // default pink
        expect(result.icon).toBe('custom');
        expect(result.category).toBe('default');
        expect(result.description).toBe('');
        expect(result.blockCount).toBe(1);
        expect(result.previewText).toBe('Hello');
    });

    test('should preserve existing v1 fields', () => {
        const v1Template = {
            id: '456',
            name: 'Preserved',
            blocks: { type: 'promps_noun' },
            createdAt: '2025-06-15T10:30:00Z'
        };

        const result = migrateToV2(v1Template);

        expect(result.id).toBe('456');
        expect(result.name).toBe('Preserved');
        expect(result.createdAt).toBe('2025-06-15T10:30:00Z');
    });

    test('should calculate blockCount during migration', () => {
        const v1Template = {
            id: '789',
            name: 'Chain Test',
            blocks: {
                type: 'promps_noun',
                next: { block: { type: 'promps_particle' } }
            }
        };

        const result = migrateToV2(v1Template);
        expect(result.blockCount).toBe(2);
    });
});

// ========================================================================
// Tests: Template Validation
// ========================================================================

describe('Template Validation', () => {
    test('should validate correct v2 template', () => {
        const template = {
            id: '123',
            name: 'Valid',
            blocks: { type: 'promps_noun' },
            version: '2',
            color: 230,
            icon: 'star',
            category: 'default'
        };

        expect(isValidV2Template(template)).toBe(true);
    });

    test('should reject template without version', () => {
        const template = {
            id: '123',
            name: 'Invalid',
            blocks: {},
            color: 230,
            icon: 'star',
            category: 'default'
        };

        expect(isValidV2Template(template)).toBe(false);
    });

    test('should reject template with wrong version', () => {
        const template = {
            id: '123',
            name: 'Invalid',
            blocks: {},
            version: '1',
            color: 230,
            icon: 'star',
            category: 'default'
        };

        expect(isValidV2Template(template)).toBe(false);
    });

    test('should reject template without required fields', () => {
        expect(isValidV2Template(null)).toBeFalsy();
        expect(isValidV2Template({})).toBeFalsy();
        expect(isValidV2Template({ version: '2' })).toBeFalsy();
    });
});

// ========================================================================
// Tests: Template Export
// ========================================================================

describe('Template Export', () => {
    test('should generate valid export structure', () => {
        const template = {
            id: '123',
            name: 'Export Test',
            blocks: { type: 'promps_noun' },
            version: '2',
            color: 230,
            icon: 'rocket',
            category: 'favorites',
            description: 'Test description',
            blockCount: 1,
            previewText: 'Test'
        };

        const exported = exportTemplate(template);

        expect(exported.type).toBe('promps-template');
        expect(exported.version).toBe('1.0.0');
        expect(exported.exportedFrom).toBe('Promps Ent v1.2.0');
        expect(exported.exportedAt).toBeDefined();
        expect(exported.template.name).toBe('Export Test');
        expect(exported.template.color).toBe(230);
        expect(exported.template.icon).toBe('rocket');
    });

    test('should not include template ID in export', () => {
        const template = {
            id: '123',
            name: 'No ID',
            blocks: {},
            version: '2',
            color: 330,
            icon: 'custom',
            category: 'default'
        };

        const exported = exportTemplate(template);

        expect(exported.template.id).toBeUndefined();
    });
});

// ========================================================================
// Tests: Template Import
// ========================================================================

describe('Template Import', () => {
    test('should import valid template data', () => {
        const importData = {
            type: 'promps-template',
            version: '1.0.0',
            template: {
                name: 'Imported Template',
                blocks: { type: 'promps_noun', fields: { TEXT: 'Test' } },
                color: 120,
                icon: 'star',
                category: 'custom',
                description: 'Imported'
            }
        };

        const result = importTemplate(importData);

        expect(result).not.toBeNull();
        expect(result.name).toBe('Imported Template');
        expect(result.color).toBe(120);
        expect(result.icon).toBe('star');
        expect(result.version).toBe('2');
        expect(result.id).toBeDefined();
    });

    test('should reject invalid type', () => {
        const importData = {
            type: 'wrong-type',
            template: { name: 'Test', blocks: {} }
        };

        expect(importTemplate(importData)).toBeNull();
    });

    test('should reject missing template data', () => {
        const importData = {
            type: 'promps-template',
            version: '1.0.0'
        };

        expect(importTemplate(importData)).toBeNull();
    });

    test('should reject template without name', () => {
        const importData = {
            type: 'promps-template',
            template: { blocks: {} }
        };

        expect(importTemplate(importData)).toBeNull();
    });

    test('should reject template without blocks', () => {
        const importData = {
            type: 'promps-template',
            template: { name: 'Test' }
        };

        expect(importTemplate(importData)).toBeNull();
    });

    test('should use defaults for missing optional fields', () => {
        const importData = {
            type: 'promps-template',
            template: {
                name: 'Minimal',
                blocks: { type: 'promps_noun' }
            }
        };

        const result = importTemplate(importData);

        expect(result.color).toBe(TEMPLATE_DEFAULTS.color);
        expect(result.icon).toBe(TEMPLATE_DEFAULTS.icon);
        expect(result.category).toBe(TEMPLATE_DEFAULTS.category);
    });

    test('should generate new ID on import', () => {
        const importData = {
            type: 'promps-template',
            template: {
                name: 'New ID',
                blocks: {}
            }
        };

        const result1 = importTemplate(importData);
        const result2 = importTemplate(importData);

        expect(result1.id).not.toBe(result2.id);
    });
});

// ========================================================================
// Tests: Export/Import Roundtrip
// ========================================================================

describe('Export/Import Roundtrip', () => {
    test('should preserve template data through export/import', () => {
        const original = {
            id: '123',
            name: 'Roundtrip Test',
            blocks: {
                type: 'promps_noun',
                fields: { TEXT: 'Hello' },
                next: { block: { type: 'promps_verb', fields: { TEXT: 'analyze' } } }
            },
            version: '2',
            color: 230,
            icon: 'rocket',
            category: 'favorites',
            description: 'Test roundtrip',
            blockCount: 2,
            previewText: 'Hello analyze'
        };

        const exported = exportTemplate(original);
        const imported = importTemplate(exported);

        expect(imported.name).toBe(original.name);
        expect(imported.color).toBe(original.color);
        expect(imported.icon).toBe(original.icon);
        expect(imported.category).toBe(original.category);
        expect(imported.description).toBe(original.description);
        expect(JSON.stringify(imported.blocks)).toBe(JSON.stringify(original.blocks));
    });
});

// ========================================================================
// Tests: Category Manager
// ========================================================================

const DEFAULT_CATEGORIES = [
    { id: 'default', nameKey: 'category.default', order: 0, isSystem: true },
    { id: 'favorites', nameKey: 'category.favorites', order: 1, isSystem: true },
    { id: 'recent', nameKey: 'category.recent', order: 2, isSystem: true }
];

describe('Category Manager', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('should have default categories', () => {
        expect(DEFAULT_CATEGORIES.length).toBe(3);
        expect(DEFAULT_CATEGORIES[0].id).toBe('default');
        expect(DEFAULT_CATEGORIES[1].id).toBe('favorites');
        expect(DEFAULT_CATEGORIES[2].id).toBe('recent');
    });

    test('default categories should be system categories', () => {
        DEFAULT_CATEGORIES.forEach(cat => {
            expect(cat.isSystem).toBe(true);
        });
    });

    test('default categories should have nameKey for i18n', () => {
        DEFAULT_CATEGORIES.forEach(cat => {
            expect(cat.nameKey).toBeDefined();
            expect(cat.nameKey.startsWith('category.')).toBe(true);
        });
    });
});

// ========================================================================
// Tests: Icon/Color Validation
// ========================================================================

describe('Icon Validation', () => {
    test('should validate known icons', () => {
        const knownIcons = Object.keys(TEMPLATE_ICONS);
        knownIcons.forEach(icon => {
            expect(TEMPLATE_ICONS[icon]).toBeDefined();
        });
    });

    test('all icons should be emoji strings', () => {
        Object.values(TEMPLATE_ICONS).forEach(emoji => {
            expect(typeof emoji).toBe('string');
            expect(emoji.length).toBeGreaterThan(0);
        });
    });
});

describe('Color Validation', () => {
    test('should validate known colors', () => {
        const knownColors = Object.keys(TEMPLATE_COLORS);
        knownColors.forEach(color => {
            expect(TEMPLATE_COLORS[color]).toBeDefined();
        });
    });

    test('all colors should be valid HSV hue values', () => {
        Object.values(TEMPLATE_COLORS).forEach(hue => {
            expect(typeof hue).toBe('number');
            expect(hue).toBeGreaterThanOrEqual(0);
            expect(hue).toBeLessThanOrEqual(360);
        });
    });

    test('default color should be pink (330)', () => {
        expect(TEMPLATE_COLORS.pink).toBe(330);
        expect(TEMPLATE_DEFAULTS.color).toBe(330);
    });
});
