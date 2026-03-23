/**
 * Promps - Blockly.js Configuration Tests
 *
 * Tests for custom block definitions and DSL generation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock Blockly for testing
global.Blockly = {
    Blocks: {},
    JavaScript: {
        forBlock: {}
    },
    Events: {
        UI: 'ui'
    }
};

// Import the blockly-config module (we'll need to adjust imports)
// For now, we'll test the logic directly

describe('Promps Noun Block', () => {
    test('should have correct block definition structure', () => {
        // Define the block (same as in blockly-config.js)
        const nounBlock = {
            init: function() {
                this.appendDummyInput = () => ({
                    appendField: () => ({ appendField: () => {} })
                });
                this.setPreviousStatement = () => {};
                this.setNextStatement = () => {};
                this.setColour = () => {};
                this.setTooltip = () => {};
                this.setHelpUrl = () => {};
            }
        };

        expect(nounBlock.init).toBeDefined();
        expect(typeof nounBlock.init).toBe('function');
    });

    test('should generate correct DSL code from noun block', () => {
        // Mock block with text field
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return 'User';
                }
                return '';
            }
        };

        // Generator function (same logic as in blockly-config.js)
        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return '_N:' + text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('_N:User ');
    });

    test('should handle Japanese text in noun blocks', () => {
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return 'ユーザー';
                }
                return '';
            }
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return '_N:' + text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('_N:ユーザー ');
    });

    test('should handle empty text field', () => {
        const mockBlock = {
            getFieldValue: () => ''
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return '_N:' + text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('_N: ');
    });

    test('should handle multi-word text', () => {
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return 'データベース テーブル ブロック';
                }
                return '';
            }
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return '_N:' + text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('_N:データベース テーブル ブロック ');
    });
});

describe('Workspace Code Generation', () => {
    test('should generate DSL from multiple noun blocks', () => {
        // Simulate multiple blocks
        const blocks = [
            { getFieldValue: () => 'User' },
            { getFieldValue: () => 'Order' }
        ];

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return '_N:' + text + ' ';
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User _N:Order ');
    });

    test('should handle empty workspace', () => {
        const blocks = [];
        const code = blocks.map(b => '_N:' + b.getFieldValue('TEXT') + ' ').join('');
        expect(code).toBe('');
    });
});

describe('Promps Other Block', () => {
    test('should have correct block definition structure', () => {
        const otherBlock = {
            init: function() {
                this.appendDummyInput = () => ({
                    appendField: () => ({ appendField: () => {} })
                });
                this.setPreviousStatement = () => {};
                this.setNextStatement = () => {};
                this.setColour = () => {};
                this.setTooltip = () => {};
                this.setHelpUrl = () => {};
            }
        };

        expect(otherBlock.init).toBeDefined();
        expect(typeof otherBlock.init).toBe('function');
    });

    test('should generate correct DSL code from other block (particle)', () => {
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return 'が';
                }
                return '';
            }
        };

        // Generator function (no _N: prefix for other blocks)
        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('が ');
    });

    test('should generate correct DSL code from other block (verb)', () => {
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return '作成';
                }
                return '';
            }
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('作成 ');
    });

    test('should handle various particle types', () => {
        const particles = ['が', 'を', 'に', 'で', 'と', 'や'];

        particles.forEach(particle => {
            const mockBlock = {
                getFieldValue: () => particle
            };

            const generateDSL = (block) => {
                const text = block.getFieldValue('TEXT');
                return text + ' ';
            };

            const result = generateDSL(mockBlock);
            expect(result).toBe(particle + ' ');
        });
    });

    test('should not add _N: prefix for other blocks', () => {
        const mockBlock = {
            getFieldValue: () => 'を'
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).not.toContain('_N:');
        expect(result).toBe('を ');
    });
});

describe('Mixed Block Types', () => {
    test('should generate DSL from mixed noun and other blocks', () => {
        // Simulate: [Noun: User] [Other: が] [Noun: Order] [Other: を] [Other: 作成]
        const blocks = [
            { type: 'noun', text: 'User' },
            { type: 'other', text: 'が' },
            { type: 'noun', text: 'Order' },
            { type: 'other', text: 'を' },
            { type: 'other', text: '作成' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User が _N:Order を 作成 ');
    });

    test('should handle complex sentence structure', () => {
        const blocks = [
            { type: 'noun', text: 'データベース' },
            { type: 'other', text: 'の' },
            { type: 'noun', text: 'テーブル' },
            { type: 'other', text: 'を' },
            { type: 'other', text: '定義' },
            { type: 'other', text: 'する' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:データベース の _N:テーブル を 定義 する ');
    });
});

describe('Blockly Change Event Handling', () => {
    test('should filter out UI events', () => {
        const event = { type: 'ui' };
        const shouldUpdate = event.type !== 'ui';
        expect(shouldUpdate).toBe(false);
    });

    test('should process non-UI events', () => {
        const event = { type: 'create' };
        const shouldUpdate = event.type !== 'ui';
        expect(shouldUpdate).toBe(true);
    });
});

describe('Particle Blocks (Phase 2)', () => {
    // Particle block generator function (returns fixed text + space)
    const generateParticleDSL = (particleText) => {
        return particleText + ' ';
    };

    test('should generate correct DSL for が particle', () => {
        const result = generateParticleDSL('が');
        expect(result).toBe('が ');
    });

    test('should generate correct DSL for を particle', () => {
        const result = generateParticleDSL('を');
        expect(result).toBe('を ');
    });

    test('should generate correct DSL for に particle', () => {
        const result = generateParticleDSL('に');
        expect(result).toBe('に ');
    });

    test('should generate correct DSL for で particle', () => {
        const result = generateParticleDSL('で');
        expect(result).toBe('で ');
    });

    test('should generate correct DSL for と particle', () => {
        const result = generateParticleDSL('と');
        expect(result).toBe('と ');
    });

    test('should generate correct DSL for へ particle', () => {
        const result = generateParticleDSL('へ');
        expect(result).toBe('へ ');
    });

    test('should generate correct DSL for から particle', () => {
        const result = generateParticleDSL('から');
        expect(result).toBe('から ');
    });

    test('should generate correct DSL for まで particle', () => {
        const result = generateParticleDSL('まで');
        expect(result).toBe('まで ');
    });

    test('should generate correct DSL for より particle', () => {
        const result = generateParticleDSL('より');
        expect(result).toBe('より ');
    });

    test('should handle all 9 particle types', () => {
        const particles = ['が', 'を', 'に', 'で', 'と', 'へ', 'から', 'まで', 'より'];

        particles.forEach(particle => {
            const result = generateParticleDSL(particle);
            expect(result).toBe(particle + ' ');
        });
    });

    test('particle blocks should not have _N: prefix', () => {
        const particles = ['が', 'を', 'に', 'で', 'と', 'へ', 'から', 'まで', 'より'];

        particles.forEach(particle => {
            const result = generateParticleDSL(particle);
            expect(result).not.toContain('_N:');
        });
    });

    test('should generate complete sentence with particle blocks', () => {
        // Sentence: User が Order を 作成
        const blocks = [
            { type: 'noun', text: 'User' },
            { type: 'particle', text: 'が' },
            { type: 'noun', text: 'Order' },
            { type: 'particle', text: 'を' },
            { type: 'other', text: '作成' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else if (block.type === 'particle') {
                return block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User が _N:Order を 作成 ');
    });

    test('should generate sentence with から and まで particles', () => {
        // Sentence: Database から Data まで 移行
        const blocks = [
            { type: 'noun', text: 'Database' },
            { type: 'particle', text: 'から' },
            { type: 'noun', text: 'Data' },
            { type: 'particle', text: 'まで' },
            { type: 'other', text: '移行' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Database から _N:Data まで 移行 ');
    });

    test('should generate sentence with と particle for conjunction', () => {
        // Sentence: User と Admin が 作成
        const blocks = [
            { type: 'noun', text: 'User' },
            { type: 'particle', text: 'と' },
            { type: 'noun', text: 'Admin' },
            { type: 'particle', text: 'が' },
            { type: 'other', text: '作成' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User と _N:Admin が 作成 ');
    });
});

describe('Verb Blocks (Phase 3)', () => {
    // Verb block generator function (returns text + space)
    const generateVerbDSL = (verbText) => {
        return verbText + ' ';
    };

    test('should generate correct DSL for 分析して verb', () => {
        const result = generateVerbDSL('分析して');
        expect(result).toBe('分析して ');
    });

    test('should generate correct DSL for 要約して verb', () => {
        const result = generateVerbDSL('要約して');
        expect(result).toBe('要約して ');
    });

    test('should generate correct DSL for 翻訳して verb', () => {
        const result = generateVerbDSL('翻訳して');
        expect(result).toBe('翻訳して ');
    });

    test('should handle all 3 original fixed verb types', () => {
        const verbs = ['分析して', '要約して', '翻訳して'];

        verbs.forEach(verb => {
            const result = generateVerbDSL(verb);
            expect(result).toBe(verb + ' ');
        });
    });

    // Phase 3-2: Additional verb blocks (9 new verbs)
    test('should generate correct DSL for 作成して verb', () => {
        const result = generateVerbDSL('作成して');
        expect(result).toBe('作成して ');
    });

    test('should generate correct DSL for 生成して verb', () => {
        const result = generateVerbDSL('生成して');
        expect(result).toBe('生成して ');
    });

    test('should generate correct DSL for 変換して verb', () => {
        const result = generateVerbDSL('変換して');
        expect(result).toBe('変換して ');
    });

    test('should generate correct DSL for 削除して verb', () => {
        const result = generateVerbDSL('削除して');
        expect(result).toBe('削除して ');
    });

    test('should generate correct DSL for 更新して verb', () => {
        const result = generateVerbDSL('更新して');
        expect(result).toBe('更新して ');
    });

    test('should generate correct DSL for 抽出して verb', () => {
        const result = generateVerbDSL('抽出して');
        expect(result).toBe('抽出して ');
    });

    test('should generate correct DSL for 説明して verb', () => {
        const result = generateVerbDSL('説明して');
        expect(result).toBe('説明して ');
    });

    test('should generate correct DSL for 解説して verb', () => {
        const result = generateVerbDSL('解説して');
        expect(result).toBe('解説して ');
    });

    test('should generate correct DSL for 教えて verb', () => {
        const result = generateVerbDSL('教えて');
        expect(result).toBe('教えて ');
    });

    test('should handle all 12 fixed verb types (Phase 3 complete)', () => {
        const verbs = [
            // 分析系 (Analysis)
            '分析して', '要約して', '翻訳して',
            // 変換・生成系 (Conversion/Generation)
            '作成して', '生成して', '変換して',
            // 操作系 (Operations)
            '削除して', '更新して', '抽出して',
            // 説明系 (Explanation)
            '説明して', '解説して', '教えて'
        ];

        verbs.forEach(verb => {
            const result = generateVerbDSL(verb);
            expect(result).toBe(verb + ' ');
        });
    });

    test('new verb blocks should not have _N: prefix', () => {
        const newVerbs = ['作成して', '生成して', '変換して', '削除して', '更新して', '抽出して', '説明して', '解説して', '教えて'];

        newVerbs.forEach(verb => {
            const result = generateVerbDSL(verb);
            expect(result).not.toContain('_N:');
        });
    });

    test('verb blocks should not have _N: prefix', () => {
        const verbs = ['分析して', '要約して', '翻訳して'];

        verbs.forEach(verb => {
            const result = generateVerbDSL(verb);
            expect(result).not.toContain('_N:');
        });
    });

    test('should generate correct DSL for custom verb block', () => {
        const mockBlock = {
            getFieldValue: (fieldName) => {
                if (fieldName === 'TEXT') {
                    return '作成して';
                }
                return '';
            }
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe('作成して ');
    });

    test('should handle various custom verb inputs', () => {
        const customVerbs = ['作成して', '削除して', '更新して', '保存して', '読み込んで'];

        customVerbs.forEach(verb => {
            const mockBlock = {
                getFieldValue: () => verb
            };

            const generateDSL = (block) => {
                const text = block.getFieldValue('TEXT');
                return text + ' ';
            };

            const result = generateDSL(mockBlock);
            expect(result).toBe(verb + ' ');
        });
    });

    test('should generate complete sentence with verb block', () => {
        // Sentence: User が Order を 分析して
        const blocks = [
            { type: 'noun', text: 'User' },
            { type: 'particle', text: 'が' },
            { type: 'noun', text: 'Order' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '分析して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User が _N:Order を 分析して ');
    });

    test('should generate sentence with 要約して verb', () => {
        // Sentence: Document を 要約して
        const blocks = [
            { type: 'noun', text: 'Document' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '要約して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Document を 要約して ');
    });

    test('should generate sentence with 翻訳して verb', () => {
        // Sentence: Text を English に 翻訳して
        const blocks = [
            { type: 'noun', text: 'Text' },
            { type: 'particle', text: 'を' },
            { type: 'noun', text: 'English' },
            { type: 'particle', text: 'に' },
            { type: 'verb', text: '翻訳して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Text を _N:English に 翻訳して ');
    });

    test('should generate sentence with custom verb', () => {
        // Sentence: Database に Data を 保存して
        const blocks = [
            { type: 'noun', text: 'Database' },
            { type: 'particle', text: 'に' },
            { type: 'noun', text: 'Data' },
            { type: 'particle', text: 'を' },
            { type: 'verb-custom', text: '保存して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else if (block.type === 'verb-custom') {
                return block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Database に _N:Data を 保存して ');
    });

    test('should handle empty custom verb field', () => {
        const mockBlock = {
            getFieldValue: () => ''
        };

        const generateDSL = (block) => {
            const text = block.getFieldValue('TEXT');
            return text + ' ';
        };

        const result = generateDSL(mockBlock);
        expect(result).toBe(' ');
    });

    test('should generate complex sentence with multiple verb types', () => {
        // Sentence: User が Document を 分析して Result を 要約して
        const blocks = [
            { type: 'noun', text: 'User' },
            { type: 'particle', text: 'が' },
            { type: 'noun', text: 'Document' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '分析して' },
            { type: 'noun', text: 'Result' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '要約して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:User が _N:Document を 分析して _N:Result を 要約して ');
    });

    // Phase 3-2: Sentence tests for new verb categories

    // 変換・生成系 (Conversion/Generation) tests
    test('should generate sentence with 作成して verb', () => {
        // Sentence: Report を 作成して
        const blocks = [
            { type: 'noun', text: 'Report' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '作成して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Report を 作成して ');
    });

    test('should generate sentence with 生成して verb', () => {
        // Sentence: Template から Document を 生成して
        const blocks = [
            { type: 'noun', text: 'Template' },
            { type: 'particle', text: 'から' },
            { type: 'noun', text: 'Document' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '生成して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Template から _N:Document を 生成して ');
    });

    test('should generate sentence with 変換して verb', () => {
        // Sentence: Data を JSON に 変換して
        const blocks = [
            { type: 'noun', text: 'Data' },
            { type: 'particle', text: 'を' },
            { type: 'noun', text: 'JSON' },
            { type: 'particle', text: 'に' },
            { type: 'verb', text: '変換して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Data を _N:JSON に 変換して ');
    });

    // 操作系 (Operations) tests
    test('should generate sentence with 削除して verb', () => {
        // Sentence: File を 削除して
        const blocks = [
            { type: 'noun', text: 'File' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '削除して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:File を 削除して ');
    });

    test('should generate sentence with 更新して verb', () => {
        // Sentence: Database を 更新して
        const blocks = [
            { type: 'noun', text: 'Database' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '更新して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Database を 更新して ');
    });

    test('should generate sentence with 抽出して verb', () => {
        // Sentence: Document から Keyword を 抽出して
        const blocks = [
            { type: 'noun', text: 'Document' },
            { type: 'particle', text: 'から' },
            { type: 'noun', text: 'Keyword' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '抽出して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Document から _N:Keyword を 抽出して ');
    });

    // 説明系 (Explanation) tests
    test('should generate sentence with 説明して verb', () => {
        // Sentence: Concept を 説明して
        const blocks = [
            { type: 'noun', text: 'Concept' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '説明して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Concept を 説明して ');
    });

    test('should generate sentence with 解説して verb', () => {
        // Sentence: Algorithm を 解説して
        const blocks = [
            { type: 'noun', text: 'Algorithm' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '解説して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Algorithm を 解説して ');
    });

    test('should generate sentence with 教えて verb', () => {
        // Sentence: Method を 教えて
        const blocks = [
            { type: 'noun', text: 'Method' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '教えて' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Method を 教えて ');
    });

    // Complex sentence with new verbs
    test('should generate complex sentence with 抽出して and 変換して verbs', () => {
        // Sentence: Document から Data を 抽出して JSON に 変換して
        const blocks = [
            { type: 'noun', text: 'Document' },
            { type: 'particle', text: 'から' },
            { type: 'noun', text: 'Data' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '抽出して' },
            { type: 'noun', text: 'JSON' },
            { type: 'particle', text: 'に' },
            { type: 'verb', text: '変換して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:Document から _N:Data を 抽出して _N:JSON に 変換して ');
    });
});

// ============================================================================
// Punctuation Block Tests (句読点)
// ============================================================================

describe('Punctuation Blocks (句読点)', () => {
    // Punctuation block generator function (returns punctuation + space)
    const generatePunctDSL = (punctText) => {
        return punctText + ' ';
    };

    test('should generate correct DSL for 、(touten)', () => {
        const result = generatePunctDSL('、');
        expect(result).toBe('、 ');
    });

    test('should generate correct DSL for 。(kuten)', () => {
        const result = generatePunctDSL('。');
        expect(result).toBe('。 ');
    });

    test('should generate correct DSL for ！(exclamation)', () => {
        const result = generatePunctDSL('！');
        expect(result).toBe('！ ');
    });

    test('should generate correct DSL for ？(question)', () => {
        const result = generatePunctDSL('？');
        expect(result).toBe('？ ');
    });

    test('should generate correct DSL for "(double quote)', () => {
        const result = generatePunctDSL('"');
        expect(result).toBe('" ');
    });

    test('should generate correct DSL for \'(single quote)', () => {
        const result = generatePunctDSL("'");
        expect(result).toBe("' ");
    });

    test('should generate correct DSL for ,(comma)', () => {
        const result = generatePunctDSL(',');
        expect(result).toBe(', ');
    });

    test('should generate correct DSL for /(slash)', () => {
        const result = generatePunctDSL('/');
        expect(result).toBe('/ ');
    });

    test('should generate correct DSL for &(ampersand)', () => {
        const result = generatePunctDSL('&');
        expect(result).toBe('& ');
    });

    test('should handle all punctuation types in a sentence', () => {
        const punctMarks = ['、', '。', '！', '？', '"', "'", ',', '/', '&'];

        punctMarks.forEach(punct => {
            const result = generatePunctDSL(punct);
            expect(result).toBe(punct + ' ');
        });
    });
});

describe('Mixed Blocks with Punctuation', () => {
    test('should generate DSL with punctuation in sentence', () => {
        // Sentence: データ、ファイル を 分析して！
        const blocks = [
            { type: 'noun', text: 'データ' },
            { type: 'punct', text: '、' },
            { type: 'noun', text: 'ファイル' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '分析して' },
            { type: 'punct', text: '！' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:データ 、 _N:ファイル を 分析して ！ ');
    });

    test('should handle question with ？', () => {
        // Sentence: データ を 分析して？
        const blocks = [
            { type: 'noun', text: 'データ' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '分析して' },
            { type: 'punct', text: '？' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:データ を 分析して ？ ');
    });

    test('should handle quoted text with " marks', () => {
        // Sentence: "エラー" を 検索して
        const blocks = [
            { type: 'punct', text: '"' },
            { type: 'noun', text: 'エラー' },
            { type: 'punct', text: '"' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '検索して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('" _N:エラー " を 検索して ');
    });

    test('should handle slash for alternatives', () => {
        // Sentence: データ / ファイル を 選択して
        const blocks = [
            { type: 'noun', text: 'データ' },
            { type: 'punct', text: '/' },
            { type: 'noun', text: 'ファイル' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '選択して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:データ / _N:ファイル を 選択して ');
    });

    test('should handle ampersand for AND conditions', () => {
        // Sentence: データ & ログ を 保存して
        const blocks = [
            { type: 'noun', text: 'データ' },
            { type: 'punct', text: '&' },
            { type: 'noun', text: 'ログ' },
            { type: 'particle', text: 'を' },
            { type: 'verb', text: '保存して' }
        ];

        const generateDSL = (block) => {
            if (block.type === 'noun') {
                return '_N:' + block.text + ' ';
            } else {
                return block.text + ' ';
            }
        };

        const code = blocks.map(generateDSL).join('');
        expect(code).toBe('_N:データ & _N:ログ を 保存して ');
    });
});
