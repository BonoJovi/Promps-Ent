/**
 * Promps Ent - AI Import Manager Tests
 *
 * Tests for morpheme token mapping and block generation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock the AiImportManager class for testing
class AiImportManager {
    /**
     * Map a particle text to its specific block type
     * @param {string} text - Particle text
     * @returns {string} Block type
     */
    mapParticleToBlockType(text) {
        const particleMap = {
            'が': 'promps_particle_ga',
            'を': 'promps_particle_wo',
            'に': 'promps_particle_ni',
            'で': 'promps_particle_de',
            'と': 'promps_particle_to',
            'へ': 'promps_particle_he',
            'から': 'promps_particle_kara',
            'まで': 'promps_particle_made',
            'より': 'promps_particle_yori',
            'の': 'promps_particle_ni',
            'も': 'promps_particle_to',
            'は': 'promps_particle_ga',
            'か': 'promps_particle_to',
        };

        return particleMap[text] || 'promps_other';
    }

    /**
     * Map an article text to its specific block type
     * @param {string} text - Article text
     * @returns {string} Block type
     */
    mapArticleToBlockType(text) {
        const articleMap = {
            'a': 'promps_article_a',
            'an': 'promps_article_an',
            'the': 'promps_article_the',
            'this': 'promps_article_this',
            'that': 'promps_article_that',
            'please': 'promps_article_please',
        };

        const lowerText = text.toLowerCase();
        return articleMap[lowerText] || 'promps_other';
    }

    /**
     * Map a verb text to its specific block type
     * @param {string} text - Verb text
     * @param {string} locale - Current locale
     * @returns {string} Block type
     */
    mapVerbToBlockType(text, locale) {
        const verbMapJa = {
            '分析して': 'promps_verb_analyze',
            '要約して': 'promps_verb_summarize',
            '翻訳して': 'promps_verb_translate',
            '作成して': 'promps_verb_create',
            '生成して': 'promps_verb_generate',
            '変換して': 'promps_verb_convert',
            '削除して': 'promps_verb_delete',
            '更新して': 'promps_verb_update',
            '抽出して': 'promps_verb_extract',
            '説明して': 'promps_verb_explain',
            '解説して': 'promps_verb_describe',
            '教えて': 'promps_verb_teach',
        };

        const verbMapEn = {
            'analyze': 'promps_verb_analyze',
            'summarize': 'promps_verb_summarize',
            'translate': 'promps_verb_translate',
            'create': 'promps_verb_create',
            'generate': 'promps_verb_generate',
            'convert': 'promps_verb_convert',
            'delete': 'promps_verb_delete',
            'update': 'promps_verb_update',
            'extract': 'promps_verb_extract',
            'explain': 'promps_verb_explain',
            'describe': 'promps_verb_describe',
            'teach': 'promps_verb_teach',
        };

        const verbMap = locale === 'ja' ? verbMapJa : verbMapEn;
        const lowerText = text.toLowerCase();

        if (verbMap[text]) {
            return verbMap[text];
        }
        if (verbMap[lowerText]) {
            return verbMap[lowerText];
        }

        return 'promps_verb_custom';
    }

    /**
     * Map a morpheme token to a Blockly block type
     * @param {Object} token - Token with text and type
     * @param {string} locale - Current locale
     * @returns {string|null} Blockly block type or null
     */
    mapTokenToBlockType(token, locale) {
        const type = token.token_type || token.type;
        const text = token.text;

        switch (type) {
            case 'noun':
                return 'promps_noun';
            case 'particle':
                return this.mapParticleToBlockType(text);
            case 'article':
                return this.mapArticleToBlockType(text);
            case 'verb':
                return this.mapVerbToBlockType(text, locale);
            case 'other':
            default:
                return 'promps_other';
        }
    }
}

describe('AiImportManager - Particle Mapping', () => {
    let manager;

    beforeEach(() => {
        manager = new AiImportManager();
    });

    test('should map が to promps_particle_ga', () => {
        expect(manager.mapParticleToBlockType('が')).toBe('promps_particle_ga');
    });

    test('should map を to promps_particle_wo', () => {
        expect(manager.mapParticleToBlockType('を')).toBe('promps_particle_wo');
    });

    test('should map に to promps_particle_ni', () => {
        expect(manager.mapParticleToBlockType('に')).toBe('promps_particle_ni');
    });

    test('should map で to promps_particle_de', () => {
        expect(manager.mapParticleToBlockType('で')).toBe('promps_particle_de');
    });

    test('should map と to promps_particle_to', () => {
        expect(manager.mapParticleToBlockType('と')).toBe('promps_particle_to');
    });

    test('should map へ to promps_particle_he', () => {
        expect(manager.mapParticleToBlockType('へ')).toBe('promps_particle_he');
    });

    test('should map から to promps_particle_kara', () => {
        expect(manager.mapParticleToBlockType('から')).toBe('promps_particle_kara');
    });

    test('should map まで to promps_particle_made', () => {
        expect(manager.mapParticleToBlockType('まで')).toBe('promps_particle_made');
    });

    test('should map より to promps_particle_yori', () => {
        expect(manager.mapParticleToBlockType('より')).toBe('promps_particle_yori');
    });

    test('should map は to promps_particle_ga (topic marker)', () => {
        expect(manager.mapParticleToBlockType('は')).toBe('promps_particle_ga');
    });

    test('should map の to promps_particle_ni (possessive)', () => {
        expect(manager.mapParticleToBlockType('の')).toBe('promps_particle_ni');
    });

    test('should map unknown particle to promps_other', () => {
        expect(manager.mapParticleToBlockType('xyz')).toBe('promps_other');
    });
});

describe('AiImportManager - Article Mapping', () => {
    let manager;

    beforeEach(() => {
        manager = new AiImportManager();
    });

    test('should map "a" to promps_article_a', () => {
        expect(manager.mapArticleToBlockType('a')).toBe('promps_article_a');
    });

    test('should map "an" to promps_article_an', () => {
        expect(manager.mapArticleToBlockType('an')).toBe('promps_article_an');
    });

    test('should map "the" to promps_article_the', () => {
        expect(manager.mapArticleToBlockType('the')).toBe('promps_article_the');
    });

    test('should map "this" to promps_article_this', () => {
        expect(manager.mapArticleToBlockType('this')).toBe('promps_article_this');
    });

    test('should map "that" to promps_article_that', () => {
        expect(manager.mapArticleToBlockType('that')).toBe('promps_article_that');
    });

    test('should map "please" to promps_article_please', () => {
        expect(manager.mapArticleToBlockType('please')).toBe('promps_article_please');
    });

    test('should handle uppercase articles', () => {
        expect(manager.mapArticleToBlockType('The')).toBe('promps_article_the');
        expect(manager.mapArticleToBlockType('A')).toBe('promps_article_a');
    });

    test('should map unknown article to promps_other', () => {
        expect(manager.mapArticleToBlockType('xyz')).toBe('promps_other');
    });
});

describe('AiImportManager - Verb Mapping', () => {
    let manager;

    beforeEach(() => {
        manager = new AiImportManager();
    });

    // Japanese verbs
    test('should map 分析して to promps_verb_analyze', () => {
        expect(manager.mapVerbToBlockType('分析して', 'ja')).toBe('promps_verb_analyze');
    });

    test('should map 要約して to promps_verb_summarize', () => {
        expect(manager.mapVerbToBlockType('要約して', 'ja')).toBe('promps_verb_summarize');
    });

    test('should map 翻訳して to promps_verb_translate', () => {
        expect(manager.mapVerbToBlockType('翻訳して', 'ja')).toBe('promps_verb_translate');
    });

    test('should map 作成して to promps_verb_create', () => {
        expect(manager.mapVerbToBlockType('作成して', 'ja')).toBe('promps_verb_create');
    });

    test('should map 教えて to promps_verb_teach', () => {
        expect(manager.mapVerbToBlockType('教えて', 'ja')).toBe('promps_verb_teach');
    });

    // English verbs
    test('should map "analyze" to promps_verb_analyze', () => {
        expect(manager.mapVerbToBlockType('analyze', 'en')).toBe('promps_verb_analyze');
    });

    test('should map "summarize" to promps_verb_summarize', () => {
        expect(manager.mapVerbToBlockType('summarize', 'en')).toBe('promps_verb_summarize');
    });

    test('should map "translate" to promps_verb_translate', () => {
        expect(manager.mapVerbToBlockType('translate', 'en')).toBe('promps_verb_translate');
    });

    test('should map "create" to promps_verb_create', () => {
        expect(manager.mapVerbToBlockType('create', 'en')).toBe('promps_verb_create');
    });

    test('should map "teach" to promps_verb_teach', () => {
        expect(manager.mapVerbToBlockType('teach', 'en')).toBe('promps_verb_teach');
    });

    test('should handle uppercase English verbs', () => {
        expect(manager.mapVerbToBlockType('Analyze', 'en')).toBe('promps_verb_analyze');
        expect(manager.mapVerbToBlockType('CREATE', 'en')).toBe('promps_verb_create');
    });

    test('should map unknown verb to promps_verb_custom', () => {
        expect(manager.mapVerbToBlockType('カスタム動作', 'ja')).toBe('promps_verb_custom');
        expect(manager.mapVerbToBlockType('custom_action', 'en')).toBe('promps_verb_custom');
    });
});

describe('AiImportManager - Token to Block Type Mapping', () => {
    let manager;

    beforeEach(() => {
        manager = new AiImportManager();
    });

    test('should map noun token to promps_noun', () => {
        const token = { text: 'ユーザー', type: 'noun' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_noun');
    });

    test('should map particle token to specific particle block', () => {
        const token = { text: 'を', type: 'particle' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_particle_wo');
    });

    test('should map article token to specific article block', () => {
        const token = { text: 'the', type: 'article' };
        expect(manager.mapTokenToBlockType(token, 'en')).toBe('promps_article_the');
    });

    test('should map verb token to specific verb block (known verb)', () => {
        const token = { text: '分析して', type: 'verb' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_verb_analyze');
    });

    test('should map verb token to custom verb block (unknown verb)', () => {
        const token = { text: 'カスタム', type: 'verb' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_verb_custom');
    });

    test('should map other token to promps_other', () => {
        const token = { text: 'something', type: 'other' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_other');
    });

    test('should handle token_type field (API response format)', () => {
        const token = { text: 'Document', token_type: 'noun' };
        expect(manager.mapTokenToBlockType(token, 'en')).toBe('promps_noun');
    });

    test('should handle unknown type as other', () => {
        const token = { text: 'unknown', type: 'unknown_type' };
        expect(manager.mapTokenToBlockType(token, 'ja')).toBe('promps_other');
    });
});

describe('AiImportManager - Full Token Sequence', () => {
    let manager;

    beforeEach(() => {
        manager = new AiImportManager();
    });

    test('should map Japanese sentence tokens correctly', () => {
        const tokens = [
            { text: 'ユーザー', type: 'noun' },
            { text: 'を', type: 'particle' },
            { text: '分析して', type: 'verb' }
        ];

        const blockTypes = tokens.map(t => manager.mapTokenToBlockType(t, 'ja'));
        expect(blockTypes).toEqual([
            'promps_noun',
            'promps_particle_wo',
            'promps_verb_analyze'
        ]);
    });

    test('should map English sentence tokens correctly', () => {
        const tokens = [
            { text: 'analyze', type: 'verb' },
            { text: 'the', type: 'article' },
            { text: 'document', type: 'noun' }
        ];

        const blockTypes = tokens.map(t => manager.mapTokenToBlockType(t, 'en'));
        expect(blockTypes).toEqual([
            'promps_verb_analyze',
            'promps_article_the',
            'promps_noun'
        ]);
    });

    test('should handle complex Japanese sentence', () => {
        const tokens = [
            { text: 'ドキュメント', type: 'noun' },
            { text: 'を', type: 'particle' },
            { text: '日本語', type: 'noun' },
            { text: 'から', type: 'particle' },
            { text: '英語', type: 'noun' },
            { text: 'に', type: 'particle' },
            { text: '翻訳して', type: 'verb' }
        ];

        const blockTypes = tokens.map(t => manager.mapTokenToBlockType(t, 'ja'));
        expect(blockTypes).toEqual([
            'promps_noun',
            'promps_particle_wo',
            'promps_noun',
            'promps_particle_kara',
            'promps_noun',
            'promps_particle_ni',
            'promps_verb_translate'
        ]);
    });
});
