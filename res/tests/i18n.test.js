/**
 * i18n Module Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('i18n Module', () => {
    let TRANSLATIONS, t, getLocale, setLocale, toggleLocale, updateUIText;
    let localStorageMock, documentMock, windowMock;

    beforeEach(() => {
        // Mock localStorage
        localStorageMock = {
            store: {},
            getItem: (key) => localStorageMock.store[key] || null,
            setItem: (key, value) => {
                localStorageMock.store[key] = value;
            },
            removeItem: (key) => {
                delete localStorageMock.store[key];
            },
            clear: () => {
                localStorageMock.store = {};
            }
        };

        // Mock document
        documentMock = {
            readyState: 'complete',
            documentElement: {
                lang: 'ja'
            },
            querySelectorAll: jest.fn(() => []),
            addEventListener: jest.fn()
        };

        // Mock window
        windowMock = {
            dispatchEvent: jest.fn(),
            addEventListener: jest.fn()
        };

        // Create context for executing the code
        const context = {
            localStorage: localStorageMock,
            document: documentMock,
            window: windowMock,
            console: console,
            module: { exports: {} },
            CustomEvent: class CustomEvent {
                constructor(type, options) {
                    this.type = type;
                    this.detail = options?.detail;
                }
            }
        };

        // Load and execute i18n.js
        const i18nPath = path.join(__dirname, '../js/i18n.js');
        const i18nCode = fs.readFileSync(i18nPath, 'utf8');

        vm.createContext(context);
        vm.runInContext(i18nCode, context);

        // Get the exported functions
        ({ t, getLocale, setLocale, toggleLocale, updateUIText, TRANSLATIONS } = context.module.exports);
    });

    describe('TRANSLATIONS', () => {
        test('should have ja and en translations', () => {
            expect(TRANSLATIONS).toHaveProperty('ja');
            expect(TRANSLATIONS).toHaveProperty('en');
        });

        test('should have matching keys in both languages', () => {
            const jaKeys = Object.keys(TRANSLATIONS.ja);
            const enKeys = Object.keys(TRANSLATIONS.en);

            expect(jaKeys.sort()).toEqual(enKeys.sort());
        });

        test('should have app.subtitle translation', () => {
            expect(TRANSLATIONS.ja['app.subtitle']).toBeDefined();
            expect(TRANSLATIONS.en['app.subtitle']).toBeDefined();
        });

        test('should have toolbar translations', () => {
            // Japanese locale has Japanese text
            expect(TRANSLATIONS.ja['toolbar.new']).toBe('新規');
            // English locale has English text
            expect(TRANSLATIONS.en['toolbar.new']).toBe('New');
        });

        test('should have blockly category translations', () => {
            // Japanese locale has Japanese category names
            expect(TRANSLATIONS.ja['blockly.category.noun']).toBe('名詞');
            // English locale has English category names
            expect(TRANSLATIONS.en['blockly.category.noun']).toBe('Noun');
        });

        test('should have blockly tooltip translations', () => {
            expect(TRANSLATIONS.ja['blockly.noun.tooltip']).toBeDefined();
            expect(TRANSLATIONS.en['blockly.noun.tooltip']).toBeDefined();
        });

        test('should have validation translations', () => {
            expect(TRANSLATIONS.ja['validation.passed']).toBeDefined();
            expect(TRANSLATIONS.en['validation.passed']).toBeDefined();
        });

        test('should have pattern translations', () => {
            expect(TRANSLATIONS.ja['pattern.header']).toBeDefined();
            expect(TRANSLATIONS.en['pattern.header']).toBeDefined();
        });

        test('should have project translations', () => {
            expect(TRANSLATIONS.ja['project.unsaved.title']).toBeDefined();
            expect(TRANSLATIONS.en['project.unsaved.title']).toBeDefined();
        });

        // Pro-specific translations (non-license)
        test('should have Pro API Key translations', () => {
            expect(TRANSLATIONS.ja['pro.apiKey.title']).toBe('APIキー設定');
            expect(TRANSLATIONS.en['pro.apiKey.title']).toBe('API Key Settings');
            expect(TRANSLATIONS.ja['pro.apiKey.enterKey']).toBeDefined();
            expect(TRANSLATIONS.en['pro.apiKey.enterKey']).toBeDefined();
            expect(TRANSLATIONS.ja['pro.apiKey.saveFailed']).toBeDefined();
            expect(TRANSLATIONS.en['pro.apiKey.saveFailed']).toBeDefined();
            expect(TRANSLATIONS.ja['pro.apiKey.deleteFailed']).toBeDefined();
            expect(TRANSLATIONS.en['pro.apiKey.deleteFailed']).toBeDefined();
        });

        test('should have Pro Send to AI translations', () => {
            expect(TRANSLATIONS.ja['pro.sendAi.selectProvider']).toBe('プロバイダーを選択...');
            expect(TRANSLATIONS.en['pro.sendAi.selectProvider']).toBe('Select Provider...');
            expect(TRANSLATIONS.ja['pro.sendAi.sending']).toBe('送信中...');
            expect(TRANSLATIONS.en['pro.sendAi.sending']).toBe('Sending...');
            expect(TRANSLATIONS.ja['pro.sendAi.send']).toBe('送信');
            expect(TRANSLATIONS.en['pro.sendAi.send']).toBe('Send');
        });

        test('should have version in footer', () => {
            expect(TRANSLATIONS.ja['footer.version']).toBeDefined();
            expect(TRANSLATIONS.en['footer.version']).toBeDefined();
        });
    });

    describe('t() function', () => {
        test('should return translation for valid key', () => {
            // Default locale is 'ja' when localStorage is empty
            // Japanese locale returns Japanese text
            expect(t('toolbar.new')).toBe('新規');
        });

        test('should return key for missing translation', () => {
            const result = t('non.existent.key');
            expect(result).toBe('non.existent.key');
        });

        test('should support parameter interpolation', () => {
            // We don't have parameterized translations in the current set,
            // but the function should handle it gracefully
            // Default locale is 'ja', so returns Japanese
            const result = t('toolbar.new', { param: 'value' });
            expect(result).toBe('新規');
        });

        test('should return English translation when locale is en', () => {
            setLocale('en');
            expect(t('toolbar.new')).toBe('New');
        });
    });

    describe('getLocale() function', () => {
        test('should return default locale when localStorage is empty', () => {
            expect(getLocale()).toBe('ja');
        });
    });

    describe('setLocale() function', () => {
        test('should change locale to en', () => {
            setLocale('en');
            expect(localStorageMock.store['promps-lang']).toBe('en');
        });

        test('should change locale to ja', () => {
            setLocale('ja');
            expect(localStorageMock.store['promps-lang']).toBe('ja');
        });

        test('should update document.documentElement.lang', () => {
            setLocale('en');
            expect(documentMock.documentElement.lang).toBe('en');
        });

        test('should dispatch localechange event', () => {
            setLocale('en');
            expect(windowMock.dispatchEvent).toHaveBeenCalled();
        });

        test('should not change locale for unsupported language', () => {
            setLocale('ja');
            setLocale('zz');
            // Locale should remain unchanged for unsupported language
            expect(localStorageMock.store['promps-lang']).toBe('ja');
        });
    });

    describe('toggleLocale() function', () => {
        test('should toggle from ja to en', () => {
            // Set initial locale to ja
            setLocale('ja');

            toggleLocale();
            expect(localStorageMock.store['promps-lang']).toBe('en');
        });

        test('should toggle from en to fr', () => {
            // Set initial locale to en
            setLocale('en');

            toggleLocale();
            expect(localStorageMock.store['promps-lang']).toBe('fr');
        });

        test('should toggle from fr to ja', () => {
            // Set initial locale to fr
            setLocale('fr');

            toggleLocale();
            expect(localStorageMock.store['promps-lang']).toBe('ja');
        });
    });

    describe('updateUIText() function', () => {
        test('should be a function', () => {
            expect(typeof updateUIText).toBe('function');
        });

        test('should query for data-i18n elements', () => {
            updateUIText();
            expect(documentMock.querySelectorAll).toHaveBeenCalledWith('[data-i18n]');
        });
    });
});

describe('Language toggle button behavior', () => {
    let TRANSLATIONS;

    beforeEach(() => {
        const localStorageMock = {
            store: {},
            getItem: (key) => localStorageMock.store[key] || null,
            setItem: (key, value) => {
                localStorageMock.store[key] = value;
            }
        };

        const context = {
            localStorage: localStorageMock,
            document: {
                readyState: 'complete',
                documentElement: { lang: 'ja' },
                querySelectorAll: jest.fn(() => []),
                addEventListener: jest.fn()
            },
            window: {
                dispatchEvent: jest.fn(),
                addEventListener: jest.fn()
            },
            console: console,
            module: { exports: {} },
            CustomEvent: class CustomEvent {
                constructor(type, options) {
                    this.type = type;
                    this.detail = options?.detail;
                }
            }
        };

        const i18nPath = path.join(__dirname, '../js/i18n.js');
        const i18nCode = fs.readFileSync(i18nPath, 'utf8');

        vm.createContext(context);
        vm.runInContext(i18nCode, context);

        TRANSLATIONS = context.module.exports.TRANSLATIONS;
    });

    test('should show JA when locale is ja (current language)', () => {
        expect(TRANSLATIONS.ja['toolbar.lang']).toBe('JA');
    });

    test('should show EN when locale is en (current language)', () => {
        expect(TRANSLATIONS.en['toolbar.lang']).toBe('EN');
    });
});
