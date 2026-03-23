# Promps API Reference

**Version**: v0.0.3-2 (Phase 3-2)
**Last Updated**: 2026-01-19 (JST)
**Target**: Developers integrating with Promps core library

---

## Overview

This document provides a complete API reference for the Promps Phase 0 core library. The library exposes parsing and prompt generation functionality that can be used in:

- CLI applications
- GUI applications (Tauri)
- External tools
- Test frameworks

---

## Library Modules

### Core Module: `promps` (src/lib.rs)

**Import**:
```rust
use promps::{PromptPart, parse_input, generate_prompt};
```

---

## Data Types

### `PromptPart`

Represents a single semantic unit (sentence/clause) with type annotation.

**Definition**:
```rust
#[derive(Debug, Clone)]
pub struct PromptPart {
    pub is_noun: bool,   // Type annotation (NOUN or other)
    pub text: String,    // Normalized text (prefix stripped)
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `is_noun` | `bool` | `true` if sentence contains `_N:` marker, `false` otherwise |
| `text` | `String` | Sentence text with all `_N:` prefixes removed |

**Traits**:
- `Debug`: Can be printed with `{:?}`
- `Clone`: Can be cloned with `.clone()`

**Example**:
```rust
let part = PromptPart {
    is_noun: true,
    text: "ユーザー が 注文 を 作成".to_string(),
};

println!("{:?}", part);
// Output: PromptPart { is_noun: true, text: "ユーザー が 注文 を 作成" }
```

---

## Public Functions

### `parse_input`

Parses raw DSL input text into structured `PromptPart` vector.

**Signature**:
```rust
pub fn parse_input(input: &str) -> Vec<PromptPart>
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `&str` | Raw DSL input text with space-delimited tokens |

**Returns**:
- `Vec<PromptPart>`: Vector of parsed prompt parts

**Parsing Rules**:
1. **Line splitting**: Split by newlines (`\n`)
2. **Sentence splitting**: Split by double spaces (or more)
3. **Token splitting**: Split by single spaces
4. **Noun detection**: Scan for `_N:` prefix in any token
5. **Text reconstruction**: Rebuild sentence with prefixes stripped

**Edge Cases**:

| Input | Result | Notes |
|-------|--------|-------|
| Empty string | `vec![]` | Returns empty vector |
| Only whitespace | `vec![]` | Whitespace is trimmed and ignored |
| Empty lines | Skipped | Empty lines are ignored |
| Multiple spaces | Sentence delimiter | 2+ spaces = sentence boundary |

**Example 1: Basic Usage**
```rust
let input = "_N:ユーザー が _N:注文 を 作成  説明文です";
let parts = parse_input(input);

assert_eq!(parts.len(), 2);
assert_eq!(parts[0].is_noun, true);
assert_eq!(parts[0].text, "ユーザー が 注文 を 作成");
assert_eq!(parts[1].is_noun, false);
assert_eq!(parts[1].text, "説明文です");
```

**Example 2: Multi-Line Input**
```rust
let input = "_N:機能名
説明文です
_N:対象ユーザー  開発者向け";

let parts = parse_input(input);

assert_eq!(parts.len(), 3);
// Part 1: 機能名 (NOUN)
// Part 2: 説明文です
// Part 3: 対象ユーザー 開発者向け (NOUN with two sentences)
```

**Example 3: Empty Input**
```rust
let input = "";
let parts = parse_input(input);
assert_eq!(parts.len(), 0);
```

**Example 4: Noun in Middle**
```rust
let input = "これは _N:変数 を 使います";
let parts = parse_input(input);

assert_eq!(parts.len(), 1);
assert_eq!(parts[0].is_noun, true);
assert_eq!(parts[0].text, "これは 変数 を 使います");
```

**Time Complexity**: O(m × k) where m = token count, k = average token length

**Memory Allocation**:
- Allocates new `String` for each `PromptPart`
- Total: O(n) where n = total character count in input

---

### `generate_prompt`

Generates formatted prompt string from `PromptPart` vector.

**Signature**:
```rust
pub fn generate_prompt(parts: &[PromptPart]) -> String
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `parts` | `&[PromptPart]` | Slice of `PromptPart` instances |

**Returns**:
- `String`: Formatted prompt with `(NOUN)` annotations

**Output Format**:
```
{text} (NOUN)\n    ← If is_noun == true
{text}\n            ← If is_noun == false
```

**Edge Cases**:

| Input | Output | Notes |
|-------|--------|-------|
| Empty slice | `""` | Empty string |
| All nouns | All lines end with `(NOUN)` | All parts have `is_noun == true` |
| No nouns | No `(NOUN)` annotations | All parts have `is_noun == false` |

**Example 1: Mixed Types**
```rust
let parts = vec![
    PromptPart {
        is_noun: true,
        text: "機能名".to_string(),
    },
    PromptPart {
        is_noun: false,
        text: "説明文".to_string(),
    },
];

let prompt = generate_prompt(&parts);
assert_eq!(prompt, "機能名 (NOUN)\n説明文\n");
```

**Example 2: Empty Vector**
```rust
let parts = vec![];
let prompt = generate_prompt(&parts);
assert_eq!(prompt, "");
```

**Example 3: All Nouns**
```rust
let parts = vec![
    PromptPart { is_noun: true, text: "A".to_string() },
    PromptPart { is_noun: true, text: "B".to_string() },
];

let prompt = generate_prompt(&parts);
assert_eq!(prompt, "A (NOUN)\nB (NOUN)\n");
```

**Time Complexity**: O(p × t) where p = parts count, t = average text length

**Memory Allocation**:
- Single `String` allocation (grown incrementally)
- Total: O(n) where n = total output character count

---

## PromptPart Methods

### `PromptPart::from_token`

Parses a single token into a `PromptPart`.

**Signature**:
```rust
impl PromptPart {
    pub fn from_token(token: &str) -> Self
}
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `&str` | Single token string (may include `_N:` prefix) |

**Returns**:
- `PromptPart`: Parsed instance

**Behavior**:
1. Check if token starts with `_N:`
2. If yes: Strip prefix, set `is_noun = true`
3. If no: Use token as-is, set `is_noun = false`

**Example 1: Noun Token**
```rust
let part = PromptPart::from_token("_N:データベース");

assert_eq!(part.is_noun, true);
assert_eq!(part.text, "データベース");
```

**Example 2: Non-Noun Token**
```rust
let part = PromptPart::from_token("を作成");

assert_eq!(part.is_noun, false);
assert_eq!(part.text, "を作成");
```

**Example 3: Edge Case - Empty Prefix**
```rust
let part = PromptPart::from_token("_N:");

assert_eq!(part.is_noun, true);
assert_eq!(part.text, "");
```

**Usage Note**: This method is primarily used internally by `parse_input()`. Direct usage is supported but uncommon in typical workflows.

**Time Complexity**: O(n) where n = token length

**Memory Allocation**: Allocates new `String` (O(n))

---

## Tauri Commands

### Module: `commands` (src/commands.rs)

Tauri-specific commands for frontend-backend communication.

**Import**:
```rust
use commands::{generate_prompt_from_text, greet};
```

---

### `generate_prompt_from_text`

Tauri command wrapper for `parse_input()` + `generate_prompt()`.

**Signature**:
```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `String` | Raw DSL text (owned) |

**Returns**:
- `String`: Formatted prompt string

**Frontend Usage (JavaScript)**:
```javascript
import { invoke } from '@tauri-apps/api/tauri';

const input = "_N:ユーザー が _N:注文 を 作成";
const prompt = await invoke('generate_prompt_from_text', { input });

console.log(prompt);
// Output:
// ユーザー が 注文 を 作成 (NOUN)
```

**Backend Implementation**:
```rust
pub fn generate_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt(&parts)
}
```

**Error Handling**: None (always returns string, even if empty)

---

### `greet`

Health check command for testing Tauri communication.

**Signature**:
```rust
#[tauri::command]
pub fn greet(name: String) -> String
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `String` | Name to greet |

**Returns**:
- `String`: Greeting message

**Frontend Usage (JavaScript)**:
```javascript
const message = await invoke('greet', { name: 'World' });
console.log(message);
// Output: "Hello, World! Welcome to Promps."
```

**Purpose**: Verify Tauri IPC (Inter-Process Communication) is working correctly.

---

## Usage Patterns

### Pattern 1: CLI Integration

```rust
use std::io::{self, Read};
use promps::{parse_input, generate_prompt};

fn main() {
    // Read from stdin
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    // Parse and generate
    let parts = parse_input(&input);
    let prompt = generate_prompt(&parts);

    // Output to stdout
    println!("{}", prompt);
}
```

---

### Pattern 2: GUI Integration (Tauri)

**Backend (src/commands.rs)**:
```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt(&parts)
}
```

**Frontend (JavaScript)**:
```javascript
async function generatePrompt() {
    const input = document.getElementById('input').value;
    const output = await invoke('generate_prompt_from_text', { input });
    document.getElementById('output').textContent = output;
}
```

---

### Pattern 3: Batch Processing

```rust
use promps::{parse_input, generate_prompt};

fn process_batch(inputs: Vec<String>) -> Vec<String> {
    inputs
        .iter()
        .map(|input| {
            let parts = parse_input(input);
            generate_prompt(&parts)
        })
        .collect()
}
```

---

### Pattern 4: Intermediate Processing

```rust
use promps::{parse_input, generate_prompt, PromptPart};

fn process_with_custom_logic(input: &str) -> String {
    let mut parts = parse_input(input);

    // Custom processing: Add metadata
    for part in &mut parts {
        if part.is_noun {
            part.text = format!("[ENTITY] {}", part.text);
        }
    }

    // Generate modified prompt
    generate_prompt(&parts)
}
```

---

## Error Handling

### Current Behavior (Phase 0)

**No explicit error handling**:
- Invalid input → Parsed as-is (may produce unexpected results)
- Empty input → Returns empty vector/string
- Malformed input → No validation errors

**Rationale**: Phase 0 focuses on core functionality. Validation is deferred to Phase N.

---

### Future Error Handling (Phase N+)

**Planned Error Types**:
```rust
pub enum PrompError {
    InvalidSyntax(String),
    MissingNoun,
    InvalidPattern,
    EmptyInput,
}

pub type Result<T> = std::result::Result<T, PrompError>;
```

**Planned Signatures**:
```rust
pub fn parse_input(input: &str) -> Result<Vec<PromptPart>>;
pub fn generate_prompt(parts: &[PromptPart]) -> Result<String>;
```

---

## Performance Considerations

### Benchmarks (Approximate)

| Operation | Input Size | Time | Memory |
|-----------|-----------|------|--------|
| `parse_input()` | 100 chars | ~5 μs | ~1 KB |
| `parse_input()` | 1,000 chars | ~50 μs | ~10 KB |
| `parse_input()` | 10,000 chars | ~500 μs | ~100 KB |
| `generate_prompt()` | 10 parts | ~2 μs | ~500 bytes |
| `generate_prompt()` | 100 parts | ~20 μs | ~5 KB |

**Hardware**: x86_64 Linux, Rust 1.70, Release build

**Note**: These are rough estimates. Actual performance depends on hardware and input characteristics.

---

### Optimization Tips

**1. Reuse Allocations**:
```rust
// ✅ Good - reuse String
let mut output = String::with_capacity(1024);
for part in parts {
    output.push_str(&generate_prompt(&[part]));
}

// ❌ Bad - many allocations
let mut outputs = Vec::new();
for part in parts {
    outputs.push(generate_prompt(&[part]));
}
let output = outputs.join("");
```

**2. Batch Processing**:
```rust
// ✅ Good - parse once
let parts = parse_input(&large_input);
for part in &parts {
    process(part);
}

// ❌ Bad - parse multiple times
for line in large_input.lines() {
    let parts = parse_input(line);
    // ...
}
```

**3. Capacity Pre-allocation**:
```rust
// ✅ Good - pre-allocate if size is known
let mut parts = Vec::with_capacity(expected_count);

// ❌ OK - but may reallocate
let mut parts = Vec::new();
```

---

## Testing

### Test Overview

**Total Tests**: 102 (Backend 26 + Frontend 76)

**Running Tests**:
```bash
# Backend tests (Rust)
cargo test

# Frontend tests (Jest)
cd res/tests && npm test

# All tests
cargo test && cd res/tests && npm test
```

---

### Backend Test Examples

**Test Modules**: `src/lib.rs` (13 tests), `src/commands.rs` (13 tests)

**Example Test**:
```rust
#[test]
fn test_parse_input() {
    let input = "_N:データベーステーブルブロック機能  データベースのテーブル構造を視覚的に定義する機能です";
    let parts = parse_input(input);

    assert_eq!(parts.len(), 2);
    assert_eq!(parts[0].is_noun, true);
    assert_eq!(parts[0].text, "データベーステーブルブロック機能");
    assert_eq!(parts[1].is_noun, false);
    assert_eq!(parts[1].text, "データベースのテーブル構造を視覚的に定義する機能です");
}
```

---

### Frontend Test Examples

**Test Modules**: `res/tests/blockly-config.test.js` (61 tests), `res/tests/main.test.js` (15 tests)

**Test Categories**:
- **Noun Blocks**: Fixed noun blocks, custom noun blocks
- **Particle Blocks**: 9 particle types (が, を, に, で, と, は, も, から, まで)
- **Verb Blocks**: Fixed verb blocks, custom verb blocks
- **Newline Blocks**: Line break blocks
- **Toolbox**: Category configuration

**Example Test**:
```javascript
describe('Verb Blocks', () => {
  test('verb_analyze block should be defined', () => {
    expect(Blockly.Blocks['verb_analyze']).toBeDefined();
  });

  test('verb_custom block should generate correct DSL', () => {
    const block = createMockBlock('verb_custom', { VERB_TEXT: '削除して' });
    const code = javascriptGenerator.forBlock['verb_custom'](block);
    expect(code).toBe('削除して');
  });
});
```

---

### Integration Test Pattern

**File**: `tests/integration_test.rs` (example)

```rust
use promps::{parse_input, generate_prompt};

#[test]
fn test_full_workflow() {
    // Arrange
    let input = "_N:ユーザー が _N:注文 を 作成  説明文";

    // Act
    let parts = parse_input(input);
    let prompt = generate_prompt(&parts);

    // Assert
    assert!(prompt.contains("(NOUN)"));
    assert!(prompt.contains("説明文\n"));
}
```

---

## Migration Guide

### Phase 0 → Phase 1 (GUI) ✅ COMPLETED

**No API Changes**:
- Core library (`src/lib.rs`) unchanged
- Tauri commands extended but existing APIs maintained
- 100% backward compatible

**Added Features**:
- Blockly.js visual block builder
- Noun blocks (fixed + custom)
- Real-time preview

---

### Phase 1 → Phase 2 (Particle Blocks) ✅ COMPLETED

**No API Changes**: 100% backward compatible

**Added Features**:
- 9 particle block types (が, を, に, で, と, は, も, から, まで)
- "Particle" category added to toolbox

---

### Phase 2 → Phase 3 (Verb Blocks) ✅ COMPLETED

**No API Changes**: 100% backward compatible

**Added Features**:
- 3 fixed verb blocks (分析して, 要約して, 翻訳して)
- Custom verb block
- "Verb" category added to toolbox

---

### Phase 3 → Phase N (Logic Check) FUTURE

**Breaking Changes Expected**:
- Error handling: Functions will return `Result<T, PrompError>`
- Validation: Invalid patterns will return errors

**Migration Strategy**:
```rust
// Phase 0 (current)
let parts = parse_input(input);

// Phase N (future)
let parts = parse_input(input)?;  // Handle error
// or
let parts = parse_input(input).unwrap_or_default();  // Use default on error
```

---

## Versioning

**Current Version**: v0.0.3-2 (Phase 3-2)

**Semantic Versioning**:
- Phase 0: `0.0.1` (Core library) ✅ COMPLETED
- Phase 1: `0.0.2` (GUI integration) ✅ COMPLETED
- Phase 2: `0.0.3` (Particle blocks) ✅ COMPLETED
- Phase 3: `0.0.3-2` (Verb blocks) ✅ COMPLETED
- Phase N: `1.0.x` (Logic check - first stable release)

**Compatibility Promise**:
- Patch versions (0.1.x): No breaking changes
- Minor versions (0.x.0): Additive features, backward compatible
- Major versions (x.0.0): Breaking changes allowed

---

## Appendix

### DSL Syntax Quick Reference

```
Noun marker:       _N:
Token delimiter:   Single space (0x20)
Sentence delimiter: Double space (0x20 0x20) or more
Line break:        \n (sentences continue within lines)

Example:
_N:User が _N:Order を 作成  説明文です
└─┬──┘ │ └─┬───┘ │ ──┬─  └───┬────┘
Noun  Particle Noun Particle Verb   Description
```

---

### Related Documentation

- **Core Features**: `docs/CORE_FEATURES.md`
- **Design Philosophy**: `.ai-context/PROMPS_DESIGN_PHILOSOPHY.md`
- **User Guide**: `README.md`

---

**Document Version**: 2.0
**Last Updated**: 2026-01-19 (JST)
**Next Review**: Before Phase 4 release
