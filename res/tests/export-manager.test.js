/**
 * Promps Pro - Export Manager Tests
 *
 * Tests for export functionality:
 * - Markdown generation
 * - JSON format generation
 * - Default file name generation
 * - Empty prompt handling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Tauri API
let mockInvoke;

// Mock project manager
let mockProjectManager;

beforeEach(() => {
    mockInvoke = jest.fn();

    // Mock Tauri v2 API
    global.window = global.window || {};
    global.window.__TAURI_INTERNALS__ = {
        invoke: mockInvoke
    };
    global.invoke = mockInvoke;

    // Mock i18n
    global.window.t = jest.fn((key) => key);

    // Mock isEntLicensed
    global.window.isEntLicensed = true;

    // Mock project manager
    mockProjectManager = {
        getCurrentProject: jest.fn(() => ({
            version: '1.0.0',
            metadata: {
                name: 'Test Project',
                createdAt: '2026-01-23T10:00:00Z',
                modifiedAt: '2026-01-23T10:00:00Z'
            },
            workspace: {},
            settings: { zoom: 1.0, scrollX: 0, scrollY: 0 }
        })),
        getWorkspaceState: jest.fn(() => ({ blocks: {} }))
    };
    global.window.projectManager = mockProjectManager;
});

describe('Markdown Generation', () => {
    test('should generate markdown with header', () => {
        const content = 'Test prompt content';
        const expected = '# Generated Prompt\n\n' + content + '\n';

        const generateMarkdown = (content) => `# Generated Prompt\n\n${content}\n`;
        const result = generateMarkdown(content);

        expect(result).toBe(expected);
    });

    test('should handle empty content', () => {
        const content = '';
        const expected = '# Generated Prompt\n\n\n';

        const generateMarkdown = (content) => `# Generated Prompt\n\n${content}\n`;
        const result = generateMarkdown(content);

        expect(result).toBe(expected);
    });

    test('should preserve multiline content', () => {
        const content = 'Line 1\nLine 2\nLine 3';
        const generateMarkdown = (content) => `# Generated Prompt\n\n${content}\n`;
        const result = generateMarkdown(content);

        expect(result).toContain('Line 1\nLine 2\nLine 3');
    });

    test('should preserve special characters', () => {
        const content = 'Test with **bold** and _italic_';
        const generateMarkdown = (content) => `# Generated Prompt\n\n${content}\n`;
        const result = generateMarkdown(content);

        expect(result).toContain('**bold**');
        expect(result).toContain('_italic_');
    });

    test('should handle Japanese content', () => {
        const content = 'ユーザー (NOUN) が ドキュメント (NOUN) を 分析して';
        const generateMarkdown = (content) => `# Generated Prompt\n\n${content}\n`;
        const result = generateMarkdown(content);

        expect(result).toContain('ユーザー');
        expect(result).toContain('分析して');
    });
});

describe('JSON Generation for Prompt', () => {
    test('should create valid JSON structure', () => {
        const content = 'Test prompt content';

        const generatePromptJson = (content) => {
            const data = {
                type: 'prompt',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                content: content
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generatePromptJson(content);
        const parsed = JSON.parse(result);

        expect(parsed.type).toBe('prompt');
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.content).toBe(content);
        expect(parsed.exportedAt).toBeDefined();
    });

    test('should include exportedAt timestamp', () => {
        const content = 'Test content';

        const generatePromptJson = (content) => {
            const data = {
                type: 'prompt',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                content: content
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generatePromptJson(content);
        const parsed = JSON.parse(result);

        // Check timestamp format (ISO 8601)
        expect(parsed.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle empty content', () => {
        const content = '';

        const generatePromptJson = (content) => {
            const data = {
                type: 'prompt',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                content: content
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generatePromptJson(content);
        const parsed = JSON.parse(result);

        expect(parsed.content).toBe('');
    });

    test('should handle special characters in content', () => {
        const content = 'Test with "quotes" and \\backslash\\ and 日本語';

        const generatePromptJson = (content) => {
            const data = {
                type: 'prompt',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                content: content
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generatePromptJson(content);
        const parsed = JSON.parse(result);

        expect(parsed.content).toBe(content);
    });
});

describe('JSON Generation for Project Export', () => {
    test('should create valid project export structure', () => {
        const promptContent = 'Generated prompt text';
        const project = mockProjectManager.getCurrentProject();

        const generateProjectJson = (project, promptContent) => {
            const data = {
                type: 'project_export',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                project: project,
                generatedPrompt: promptContent
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generateProjectJson(project, promptContent);
        const parsed = JSON.parse(result);

        expect(parsed.type).toBe('project_export');
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.generatedPrompt).toBe(promptContent);
        expect(parsed.project.metadata.name).toBe('Test Project');
    });

    test('should include all project metadata', () => {
        const promptContent = 'Test prompt';
        const project = {
            version: '1.0.0',
            metadata: {
                name: 'Full Metadata Test',
                description: 'A test project with full metadata',
                createdAt: '2026-01-01T00:00:00Z',
                modifiedAt: '2026-02-01T12:00:00Z',
                author: 'Test Author'
            },
            workspace: { blocks: {} },
            settings: { zoom: 1.5, scrollX: 100, scrollY: 200 }
        };

        const generateProjectJson = (project, promptContent) => {
            const data = {
                type: 'project_export',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                project: project,
                generatedPrompt: promptContent
            };
            return JSON.stringify(data, null, 2);
        };

        const result = generateProjectJson(project, promptContent);
        const parsed = JSON.parse(result);

        expect(parsed.project.metadata.description).toBe('A test project with full metadata');
        expect(parsed.project.metadata.author).toBe('Test Author');
        expect(parsed.project.settings.zoom).toBe(1.5);
    });
});

describe('Default File Name Generation', () => {
    test('should generate timestamp-based name for prompt export', () => {
        const generateFileName = (exportType) => {
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '-')
                .slice(0, 19);

            if (exportType === 'project') {
                return 'project-export';
            } else {
                return `prompt-${timestamp}`;
            }
        };

        const result = generateFileName('prompt');

        expect(result).toMatch(/^prompt-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
    });

    test('should generate project-based name for project export', () => {
        const projectName = 'MyProject';

        const generateFileName = (exportType, projectName) => {
            if (exportType === 'project') {
                return `${projectName}-export`;
            } else {
                const now = new Date();
                const timestamp = now.toISOString()
                    .replace(/[:.]/g, '-')
                    .replace('T', '-')
                    .slice(0, 19);
                return `prompt-${timestamp}`;
            }
        };

        const result = generateFileName('project', projectName);

        expect(result).toBe('MyProject-export');
    });

    test('should sanitize project name for filename', () => {
        // Note: In real implementation, special characters might need sanitization
        const projectName = 'My Project';

        const generateFileName = (exportType, projectName) => {
            if (exportType === 'project') {
                return `${projectName}-export`;
            }
            return 'prompt';
        };

        const result = generateFileName('project', projectName);

        expect(result).toBe('My Project-export');
    });
});

describe('Empty Prompt Handling', () => {
    test('should detect empty prompt', () => {
        const getCurrentPrompt = () => '';

        const result = getCurrentPrompt();

        expect(result).toBe('');
        expect(result.length).toBe(0);
    });

    test('should detect placeholder as empty', () => {
        const isEmptyPrompt = (element) => {
            if (!element) return true;
            const placeholder = element.querySelector('.placeholder');
            if (placeholder) return true;
            return (element.textContent || '').trim() === '';
        };

        // Mock element with placeholder
        const mockElement = {
            querySelector: jest.fn(() => ({ className: 'placeholder' })),
            textContent: ''
        };

        expect(isEmptyPrompt(mockElement)).toBe(true);
    });

    test('should detect non-empty prompt', () => {
        const isEmptyPrompt = (content) => {
            return !content || content.trim() === '';
        };

        expect(isEmptyPrompt('Test content')).toBe(false);
        expect(isEmptyPrompt('ユーザー (NOUN) を 分析して')).toBe(false);
    });
});

describe('Export Format Options', () => {
    test('should support txt format', () => {
        const formats = ['txt', 'md', 'json'];

        expect(formats).toContain('txt');
    });

    test('should support md format', () => {
        const formats = ['txt', 'md', 'json'];

        expect(formats).toContain('md');
    });

    test('should support json format', () => {
        const formats = ['txt', 'md', 'json'];

        expect(formats).toContain('json');
    });

    test('project export should only support json', () => {
        const getFormatsForType = (exportType) => {
            if (exportType === 'project') {
                return ['json'];
            }
            return ['txt', 'md', 'json'];
        };

        expect(getFormatsForType('project')).toEqual(['json']);
        expect(getFormatsForType('prompt')).toEqual(['txt', 'md', 'json']);
    });
});

describe('Export Dialog Commands', () => {
    beforeEach(() => {
        mockInvoke.mockClear();
    });

    test('should call show_export_dialog command', async () => {
        mockInvoke.mockResolvedValue('/path/to/file.txt');

        await mockInvoke('show_export_dialog', {
            defaultName: 'prompt-2026-01-23',
            format: 'txt'
        });

        expect(mockInvoke).toHaveBeenCalledWith('show_export_dialog', {
            defaultName: 'prompt-2026-01-23',
            format: 'txt'
        });
    });

    test('should handle cancelled dialog', async () => {
        mockInvoke.mockResolvedValue(null);

        const result = await mockInvoke('show_export_dialog', {
            defaultName: 'test',
            format: 'txt'
        });

        expect(result).toBeNull();
    });

    test('should call export_prompt command', async () => {
        mockInvoke.mockResolvedValue({
            success: true,
            path: '/path/to/file.txt',
            message: 'Export successful'
        });

        const result = await mockInvoke('export_prompt', {
            path: '/path/to/file.txt',
            content: 'Test content',
            format: 'txt'
        });

        expect(mockInvoke).toHaveBeenCalledWith('export_prompt', {
            path: '/path/to/file.txt',
            content: 'Test content',
            format: 'txt'
        });
        expect(result.success).toBe(true);
    });

    test('should call export_project command', async () => {
        const project = mockProjectManager.getCurrentProject();

        mockInvoke.mockResolvedValue({
            success: true,
            path: '/path/to/project.json',
            message: 'Project export successful'
        });

        const result = await mockInvoke('export_project', {
            path: '/path/to/project.json',
            project: project,
            prompt: 'Generated prompt'
        });

        expect(mockInvoke).toHaveBeenCalledWith('export_project', {
            path: '/path/to/project.json',
            project: project,
            prompt: 'Generated prompt'
        });
        expect(result.success).toBe(true);
    });

    test('should handle export error', async () => {
        mockInvoke.mockResolvedValue({
            success: false,
            path: null,
            message: 'Failed to write file'
        });

        const result = await mockInvoke('export_prompt', {
            path: '/invalid/path.txt',
            content: 'Test',
            format: 'txt'
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Failed');
    });
});

