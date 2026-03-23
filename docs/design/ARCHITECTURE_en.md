# Promps Architecture Documentation

**Version**: v0.0.3-2 (Phase 3-2)
**Last Updated**: 2026-01-19 (JST)
**Audience**: Developers, Contributors, AI Assistants

---

## Overview

This document describes the architectural design of Promps, including module structure, data flow, design decisions, and evolution path.

**Core Concept**: Promps is a **compiler-like DSL processor** that translates simplified input language into structured prompts for AI consumption.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Promps                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌──────────────┐            │
│  │      Frontend       │      │   Backend    │            │
│  │     (Tauri UI)      │ IPC  │   (Rust)     │            │
│  │                     │◄────►│              │            │
│  │  - Blockly.js       │      │  - Parsing   │            │
│  │  - HTML/CSS/JS      │      │  - Generation│            │
│  │  - Real-time        │      │              │            │
│  │    Preview          │      │              │            │
│  └─────────────────────┘      └──────────────┘            │
│                                                             │
│         │                            │                     │
│         │                            ▼                     │
│         │                   ┌─────────────────┐           │
│         │                   │  Core Library   │           │
│         │                   │  (src/lib.rs)   │           │
│         │                   │                 │           │
│         │                   │  - PromptPart   │           │
│         │                   │  - parse_input  │           │
│         │                   │  - generate_    │           │
│         │                   │    prompt       │           │
│         │                   └─────────────────┘           │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────────┐                                     │
│  │       User       │                                     │
│  │  Block Operations│                                     │
│  └──────────────────┘                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Input Flow:
Block Operations → DSL Generation → Tauri IPC → Backend Command → Core Library → Preview Display
```

---

## Module Structure

### Directory Layout

```
Promps/
├── src/                       # Rust source code
│   ├── main.rs                # Application entry point (Tauri)
│   ├── lib.rs                 # Core library (parsing, generation)
│   ├── commands.rs            # Tauri commands (IPC layer)
│   └── modules/               # (Future) Additional modules
│       └── mod.rs             # Module declarations
│
├── res/                       # Frontend resources (Tauri)
│   ├── index.html             # Main UI (Blockly.js workspace)
│   ├── js/
│   │   ├── main.js            # Frontend logic
│   │   └── blockly-config.js  # Blockly.js block definitions
│   ├── css/
│   │   └── styles.css         # Stylesheet
│   └── tests/                 # Frontend tests
│       ├── blockly-config.test.js
│       └── main.test.js
│
├── docs/                      # Documentation
│   ├── INDEX_ja.md            # Japanese index
│   ├── INDEX_en.md            # English index
│   ├── design/                # Design documents
│   ├── developer/             # Developer docs
│   ├── user/                  # User docs
│   └── testing/               # Test documentation
│
├── Cargo.toml                 # Rust dependencies
├── tauri.conf.json            # Tauri configuration
└── README.md                  # User documentation
```

---

## Core Components

### 1. Core Library (`src/lib.rs`)

**Responsibility**: Pure parsing and generation logic (no I/O, no UI)

**Key Design**: Library is **framework-agnostic** and can be used by:
- CLI tools
- GUI applications (Tauri)
- Web services
- Test frameworks

**Modules**:

```rust
// Data Structure
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}

// Public API
pub fn parse_input(input: &str) -> Vec<PromptPart>
pub fn generate_prompt(parts: &[PromptPart]) -> String

// Internal API
impl PromptPart {
    pub fn from_token(token: &str) -> Self
}
```

**Dependencies**:
- None (only Rust standard library)

**Testing**: 7 unit tests (100% coverage of public API)

---

### 2. Tauri Commands (`src/commands.rs`)

**Responsibility**: Bridge between frontend (JavaScript) and backend (Rust)

**Design Pattern**: Thin wrapper around core library

**Commands**:

```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String
    ↓
Calls: parse_input() + generate_prompt()

#[tauri::command]
pub fn greet(name: String) -> String
    ↓
Purpose: Health check for Tauri IPC
```

**Error Handling**: None (Phase 0 - deferred to Phase N)

**Testing**: 2 unit tests (command-level testing)

---

### 3. Tauri Application (`src/main.rs`)

**Responsibility**: Application lifecycle management

**Structure**:
```rust
mod commands;
mod modules;

use commands::{generate_prompt_from_text, greet};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            generate_prompt_from_text,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Dependencies**:
- `tauri`: Desktop application framework
- `commands`: Tauri command module

---

### 4. Frontend (Blockly.js + HTML/JS)

**Status**: Phase 3-2 - Visual block editor implemented

**Implemented Features**:
- ✅ Blockly.js integration
- ✅ Visual block builder
- ✅ Drag-and-drop interface
- ✅ Real-time prompt preview
- ✅ Block categories (Noun, Particle, Verb, Other)

**Block Types (Phase 3-2)**:
- **Noun blocks**: Fixed nouns (User, Order, etc.) + Custom input
- **Particle blocks**: 9 types (が, を, に, で, と, は, も, から, まで)
- **Verb blocks**: 3 fixed (分析して, 要約して, 翻訳して) + Custom input
- **Other blocks**: Newline

**Current Structure**:
```
res/
├── html/
│   └── index.html        # Main UI with Blockly workspace
├── js/
│   ├── main.js           # Frontend logic, event handling
│   └── blockly-config.js # Block definitions and toolbox
├── css/
│   └── common.css        # Styling
└── tests/
    ├── blockly-config.test.js  # Block definition tests
    └── main.test.js            # Frontend logic tests
```

---

## Data Flow

### End-to-End Flow (Tauri Application)

```
1. User Input (Frontend)
   │
   │ JavaScript: await invoke('generate_prompt_from_text', { input })
   ▼
2. Tauri IPC Layer
   │
   │ Serialization: JavaScript String → Rust String
   ▼
3. Backend Command (src/commands.rs)
   │
   │ generate_prompt_from_text(input: String)
   ▼
4. Core Library (src/lib.rs)
   │
   ├─► parse_input(&input)
   │    │
   │    ├─► Split by lines
   │    ├─► Split by double spaces (sentences)
   │    ├─► Split by single spaces (tokens)
   │    ├─► Scan for _N: markers
   │    └─► Build PromptPart vector
   │
   └─► generate_prompt(&parts)
        │
        ├─► Iterate through parts
        ├─► Format each part (append (NOUN) if needed)
        └─► Return formatted string
   ▼
5. Backend Command (return)
   │
   │ Return: String
   ▼
6. Tauri IPC Layer
   │
   │ Serialization: Rust String → JavaScript String
   ▼
7. Frontend (JavaScript)
   │
   │ Display result to user
   ▼
8. User Output
```

---

### Parsing Flow (Detailed)

```
Input: "_N:User が _N:Order を 作成  説明文です"

parse_input() flow:

1. Split by lines
   ↓
   ["_N:User が _N:Order を 作成  説明文です"]

2. Split by double spaces
   ↓
   ["_N:User が _N:Order を 作成", "説明文です"]

3. For each sentence:

   Sentence 1: "_N:User が _N:Order を 作成"
   ├─► Split by spaces: ["_N:User", "が", "_N:Order", "を", "作成"]
   ├─► Scan for _N:: Found at tokens[0] and tokens[2]
   ├─► has_noun = true
   ├─► Rebuild text: "User が Order を 作成"
   └─► PromptPart { is_noun: true, text: "User が Order を 作成" }

   Sentence 2: "説明文です"
   ├─► Split by spaces: ["説明文です"]
   ├─► Scan for _N:: Not found
   ├─► has_noun = false
   ├─► Rebuild text: "説明文です"
   └─► PromptPart { is_noun: false, text: "説明文です" }

4. Return vector:
   ↓
   [
       PromptPart { is_noun: true, text: "User が Order を 作成" },
       PromptPart { is_noun: false, text: "説明文です" }
   ]
```

---

### Generation Flow (Detailed)

```
Input: [
    PromptPart { is_noun: true, text: "User が Order を 作成" },
    PromptPart { is_noun: false, text: "説明文です" }
]

generate_prompt() flow:

1. Initialize output: String::new()

2. Iterate through parts:

   Part 1: is_noun = true
   ├─► Append: "User が Order を 作成"
   ├─► Append: " (NOUN)"
   └─► Append: "\n"

   Part 2: is_noun = false
   ├─► Append: "説明文です"
   └─► Append: "\n"

3. Return output:
   ↓
   "User が Order を 作成 (NOUN)\n説明文です\n"
```

---

## Design Decisions

### Decision 1: Library-First Architecture

**Problem**: How to structure code for both CLI and GUI usage?

**Solution**: Core logic in `src/lib.rs` (library), application-specific code in `src/main.rs` and `src/commands.rs`.

**Benefits**:
- ✅ Reusable across applications (CLI, GUI, web service)
- ✅ Testable independently (unit tests don't require UI)
- ✅ Framework-agnostic (can swap Tauri for other frameworks)

**Trade-offs**:
- ⚠️ Extra indirection layer (commands.rs wraps lib.rs)
- ⚠️ More files to maintain

**Conclusion**: Benefits outweigh trade-offs for long-term maintainability.

---

### Decision 2: Token-Level Noun Detection (Phase 0-1)

**Problem**: How to handle multiple nouns in a single sentence?

**Solution**: Each `_N:` token creates a separate `PromptPart`, with individual `(NOUN)` markers.

**Implementation**:
```rust
// Phase 0-1: Token-level detection (CHOSEN)
Input: "_N:User が _N:Order を 作成"

PromptPart { is_noun: true, text: "User" }
PromptPart { is_noun: false, text: "が" }
PromptPart { is_noun: true, text: "Order" }
PromptPart { is_noun: false, text: "を 作成" }

Output: "User (NOUN) が Order (NOUN) を 作成"
```

**Benefits**:
- ✅ Correctly handles multiple nouns ("_N:タコ と _N:イカ を 食べる")
- ✅ Explicit `(NOUN)` marker for each noun
- ✅ AI can clearly understand noun boundaries
- ✅ Single-line output maintains sentence unity for AI task processing

**Evolution in Phase N+1**:
- Addition of part-of-speech blocks (particles, verbs, etc.)
- More accurate grammar validation
- More sophisticated output formatting

**Conclusion**: Token-level detection fulfills Phase 0-1 requirements (natural handling of multiple nouns) while ensuring future extensibility.

---

### Decision 3: `_N:` Anywhere in Sentence

**Problem**: Should `_N:` only be allowed at sentence start?

**Solution**: `_N:` can appear **anywhere** in sentence.

**Benefits**:
- ✅ Natural language flexibility (Japanese word order is flexible)
- ✅ User can express emphasis ("注文を _N:ユーザーが 作成" emphasizes User)
- ✅ No forced reordering of user's thought process

**Implementation Cost**:
- ⚠️ Slightly more complex parsing (must scan entire sentence)

**Conclusion**: Flexibility is worth minor implementation complexity.

---

### Decision 4: No Error Handling in Phase 0

**Problem**: How to handle invalid input?

**Solution**: **No validation** in Phase 0 (deferred to Phase N).

**Rationale**:
- Phase 0 goal: Establish core functionality
- Validation requires AST-based pattern matching (Phase N scope)
- Early validation may need refactoring when Phase N is implemented

**Current Behavior**:
- Invalid input → Parsed as-is (may produce unexpected output)
- Empty input → Returns empty vector/string

**Future (Phase N)**:
```rust
pub enum PrompError { ... }
pub fn parse_input(input: &str) -> Result<Vec<PromptPart>, PrompError>
```

**Conclusion**: Deferred error handling reduces Phase 0 complexity without sacrificing future extensibility.

---

### Decision 5: No File I/O in Phase 0

**Problem**: Should Phase 0 support saving/loading prompts?

**Solution**: **No file I/O** in Phase 0 (deferred to Phase N+1).

**Rationale**:
- Phase 0: CLI/GUI input → immediate output (no persistence)
- Phase 1: Visual block builder (testing only, no save)
- Phase N+1: Finalized block types → implement save/load once

**Benefits**:
- ✅ Avoid schema changes during rapid development (Phase 1-N)
- ✅ No migration complexity
- ✅ Single implementation effort when stable

**YAGNI Principle**: "You Aren't Gonna Need It" - implement features when actually needed.

**Conclusion**: Deferred file I/O prevents premature design lock-in.

---

## Architectural Patterns

### Pattern 1: Compiler Analogy

Promps architecture mirrors a **compiler pipeline**:

```
Compiler Phases       Promps Phases           Status
─────────────────────────────────────────────────────────
Lexical Analysis   →  Token Parsing           ✅ Phase 0
Syntax Analysis    →  AST Construction        [Soon] Phase N
Syntax Validation  →  Pattern Matching        [Soon] Phase N
Semantic Analysis  →  (None - AI's job)       ❌ Out of scope
Type Checking      →  Noun Relationships      [Soon] Phase N
IR Generation      →  Normalized AST          [Soon] Phase N+1
Code Generation    →  Prompt Output           ✅ Phase 0
```

**Phase 0 Scope**: Lexical Analysis + Code Generation (minimal viable compiler)

---

### Pattern 2: AST-like Data Structure

`PromptPart` is an **AST node**:

```rust
PromptPart {
    is_noun: bool,    // ← Type annotation (like AST node type)
    text: String,     // ← Semantic content (like AST node value)
}
```

**AST Comparison**:
```
Traditional AST Node:
  type: NodeType (enum)
  children: Vec<Node>
  value: Option<Value>

PromptPart (Simplified AST Node):
  is_noun: bool (type annotation)
  text: String (value)
  children: (none - flat structure in Phase 0)
```

**Future (Phase N)**: Hierarchical AST with nested nodes.

---

### Pattern 3: Separation of Concerns

**Core Library** (src/lib.rs):
- ✅ Pure functions (no side effects)
- ✅ No I/O (no file read/write, no network)
- ✅ No UI dependencies (no Tauri, no HTML/JS)
- ✅ Framework-agnostic

**Application Layer** (src/main.rs, src/commands.rs):
- ✅ I/O handling (stdin/stdout, file operations)
- ✅ UI integration (Tauri IPC)
- ✅ Application lifecycle
- ✅ Framework-specific code

**Benefits**:
- Easy testing (core library tested in isolation)
- Easy refactoring (change UI without affecting core)
- Easy reuse (core library usable in different contexts)

---

## Performance Characteristics

### Time Complexity

| Function | Complexity | Notes |
|----------|-----------|-------|
| `PromptPart::from_token()` | O(n) | n = token length |
| `parse_input()` | O(m × k) | m = tokens, k = avg token length |
| `generate_prompt()` | O(p × t) | p = parts, t = avg text length |

**Overall**: O(m × k) - Linear in total input size

---

### Memory Usage

**Data Structure Sizes** (64-bit system):
```
PromptPart:         25 bytes
├─ is_noun:         1 byte (bool)
├─ text:           24 bytes (String)
│   ├─ ptr:         8 bytes
│   ├─ len:         8 bytes
│   └─ cap:         8 bytes
└─ padding:         0 bytes

Vec<PromptPart>:    24 bytes (overhead) + 25n bytes (elements)
```

**Total Memory**: O(n) where n = total character count

---

### Scalability

**Current Limits** (Phase 0):
- ✅ Input size: No hard limit (limited by available memory)
- ✅ Token count: No hard limit
- ✅ Sentence count: No hard limit

**Practical Limits** (tested):
- 10,000 characters: ~500 μs, ~100 KB memory
- 100 nouns: Tested, recommended UI limit
- 1,000 nouns: Tested, stress test passed
- Expected real-world usage: <1,000 characters per prompt

**Bottleneck**: String allocations (inevitable for text processing)

---

## Resource Management Philosophy

### Memory Management Responsibility

Promps follows the **Separation of Concerns** principle for resource management:

**Application Layer (Promps)**:
- **Business logic limits**: 
  - Recommended: 100 blocks (UX optimization)
  - Warning threshold: 50 blocks (UX guidance)
  - Hard limit (Phase N): 10,000 blocks (DoS prevention)
- **Performance optimization**: Tested up to 1,000 nouns
- **Testing scope**: Up to 10,000 characters, 1,000 nouns

**OS Layer (Delegated)**:
- **System memory management**: Dynamic allocation
- **OOM (Out of Memory) handling**: OS-specific mechanisms
  - Linux: OOM Killer terminates appropriate processes
  - Windows: Memory exhaustion error dialogs
  - macOS: Memory compression + process termination
- **Process termination**: On resource exhaustion

**Rationale**:
1. **Dynamic nature**: Available memory changes with system load
2. **System dependencies**: Other processes affect available resources
3. **OS expertise**: Operating systems are better equipped for memory pressure handling
4. **User experience**: OS error messages are clearer than app-imposed limits
5. **False negatives prevention**: Avoiding rejection of valid operations

**Testing Strategy**:
- ✅ Test business logic limits (100, 1,000 nouns)
- ✅ Test performance characteristics (10,000 characters)
- ❌ Do NOT test memory exhaustion (10,000+ nouns, 100,000+ characters)
  - Reason: Hardware-dependent, OS responsibility
  - Risk: May cause system instability on low-memory machines

**Phase N Planned Limits**:
```rust
pub const MAX_BLOCKS_RECOMMENDED: usize = 100;    // UX optimal
pub const MAX_BLOCKS_WARNING: usize = 50;         // Show warning
pub const MAX_BLOCKS_HARD_LIMIT: usize = 10_000;  // DoS prevention
```

---

## Testing Strategy

### Unit Testing

**Coverage**: 100% of public API

**Test Structure**:

**Backend Tests (26 tests)**:
```
src/lib.rs (tests module):
├─ test_parse_noun()
├─ test_parse_everything_else()
├─ test_generate_prompt()
├─ test_empty_parts()
├─ test_noun_prefix_stripping()
├─ test_multi_token_sentence()
├─ test_noun_in_middle_of_sentence()
├─ test_parse_input()
├─ test_consecutive_noun_markers()
├─ test_consecutive_noun_markers_with_space()
├─ test_very_long_input()
├─ test_many_nouns()
└─ test_extreme_many_nouns()

src/commands.rs (tests module):
├─ test_generate_prompt_from_text()
├─ test_greet()
├─ test_single_noun_block()
├─ test_multiple_noun_blocks()
├─ test_japanese_noun_blocks()
├─ test_empty_input()
├─ test_whitespace_only_input()
├─ test_complex_sentence_structure()
├─ test_noun_and_description_alternating()
├─ test_blockly_generated_code_pattern()
├─ test_special_characters_in_noun()
├─ test_greet_with_empty_name()
└─ test_greet_with_japanese_name()
```

**Frontend Tests (76 tests)**:
```
res/tests/
├─ blockly-config.test.js (61 tests)
│   ├─ Noun Blocks - fixed and custom noun blocks
│   ├─ Particle Blocks - 9 particle types
│   ├─ Verb Blocks - fixed and custom verb blocks
│   ├─ Newline Blocks - line break blocks
│   └─ Toolbox Configuration - category structure
│
└─ main.test.js (15 tests)
    ├─ Initialization - page load behavior
    ├─ Event Handling - workspace change events
    ├─ DSL Generation - text output from blocks
    └─ Error Handling - edge cases
```

**Total Tests**: 102 (26 backend + 76 frontend)

**Edge Case Coverage** (added 2025-11-28):
- Consecutive noun markers (with/without space)
- Very long input (10,000 characters)
- Many nouns (100 blocks - UI limit baseline)
- Extreme many nouns (1,000 blocks - stress test)

**Running Tests**:
```bash
# Backend tests (Rust)
cargo test              # All tests
cargo test --lib        # Library tests only
cargo test commands::   # Command tests only

# Frontend tests (Jest)
cd res/tests && npm test           # All frontend tests
cd res/tests && npm test -- blockly-config  # Block tests only
cd res/tests && npm test -- main   # Main.js tests only

# All tests
cargo test && cd res/tests && npm test
```

---

### Integration Testing

**Status**: Phase 3-2 - Frontend tests implemented

**Current Structure**:
```
res/tests/
├─ blockly-config.test.js  # Block definition tests (61 tests)
├─ main.test.js            # Frontend logic tests (15 tests)
├─ package.json            # Jest configuration
└─ node_modules/           # Test dependencies

src/ (backend)
├─ lib.rs                  # Core logic tests (13 tests)
└─ commands.rs             # Tauri command tests (13 tests)
```

**Test Coverage**:
- ✅ Block definitions (noun, particle, verb, newline)
- ✅ Toolbox configuration
- ✅ DSL generation logic
- ✅ Event handling
- ✅ Backend parsing and prompt generation

---

### Test-Driven Development

**Workflow** (followed in Phase 0):
1. Write tests first (define expected behavior)
2. Implement minimal code to pass tests
3. Refactor without breaking tests
4. Add more tests for edge cases

**Example**:
```rust
// Step 1: Write test
#[test]
fn test_parse_noun() {
    let token = "_N:データベース";
    let part = PromptPart::from_token(token);
    assert_eq!(part.is_noun, true);
    assert_eq!(part.text, "データベース");
}

// Step 2: Implement
impl PromptPart {
    pub fn from_token(token: &str) -> Self {
        if let Some(text) = token.strip_prefix("_N:") {
            PromptPart { is_noun: true, text: text.to_string() }
        } else {
            PromptPart { is_noun: false, text: token.to_string() }
        }
    }
}

// Step 3: Test passes → Done
```

---

## Evolution Path

### Phase 0 → Phase 1 (GUI Integration) ✅ COMPLETED

**Status**: Completed (2025-12)

**Changes**:
```
Added:
├─ res/html/index.html        (Blockly.js UI)
├─ res/js/blockly-config.js   (Block definitions)
├─ res/js/main.js             (Frontend logic)
└─ res/css/common.css         (Styling)

Modified:
└─ src/commands.rs            (New Tauri commands for GUI)

Unchanged:
└─ src/lib.rs                 (Core library - no changes)
```

**Compatibility**: 100% backward compatible (core API unchanged)

---

### Phase 1 → Phase 2 (Particle Blocks) ✅ COMPLETED

**Status**: Completed (2026-01)

**Changes**:
```
Added (9 particle types):
└─ res/js/blockly-config.js
    ├─ particle_ga (が)
    ├─ particle_wo (を)
    ├─ particle_ni (に)
    ├─ particle_de (で)
    ├─ particle_to (と)
    ├─ particle_ha (は)
    ├─ particle_mo (も)
    ├─ particle_kara (から)
    └─ particle_made (まで)

Updated:
└─ res/tests/blockly-config.test.js (particle block tests)
```

**Compatibility**: 100% backward compatible

---

### Phase 2 → Phase 3 (Verb Blocks) ✅ COMPLETED

**Status**: Completed (2026-01)

**Changes**:
```
Added (3 fixed verbs + custom):
└─ res/js/blockly-config.js
    ├─ verb_analyze (分析して)
    ├─ verb_summarize (要約して)
    ├─ verb_translate (翻訳して)
    └─ verb_custom (カスタム動詞)

Updated:
└─ res/tests/blockly-config.test.js (verb block tests)
```

**Compatibility**: 100% backward compatible

---

### Phase 3 → Phase N (Logic Check)

**Design Philosophy**: **Layered Architecture - Non-Breaking Extension**

Phase N adds validation as a **separate layer** on top of Phase 0, following the Open-Closed Principle:
- Phase 0 core remains **unchanged** (closed for modification)
- Validation layer is **added** (open for extension)

**Changes**:
```
Added:
├─ src/modules/validation.rs  (NEW: Validation layer)
│   ├─ parse_input_checked() → Result<Vec<PromptPart>, ValidationError>
│   ├─ validate_pattern()
│   └─ ValidationError enum
│
├─ src/modules/patterns.rs    (NEW: Grammatical patterns)
│   └─ VALID_PATTERNS
│
└─ src/modules/parser.rs      (NEW: AST construction - future)

Unchanged:
└─ src/lib.rs                 (Phase 0 core - NO changes)
    ├─ parse_input()          (Stable API maintained)
    ├─ generate_prompt()      (Stable API maintained)
    └─ PromptPart             (Stable structure maintained)
```

**Layered Architecture**:
```
┌─────────────────────────────────────┐
│   Phase N: Validation Layer        │  ← NEW
│   ├─ parse_input_checked()         │
│   ├─ validate_pattern()             │
│   └─ Error → Re-prompt user         │
└────────────┬────────────────────────┘
             │ Validation OK
             ▼
┌─────────────────────────────────────┐
│   Phase 0: Core Parsing Layer      │  ← UNCHANGED
│   ├─ parse_input()                 │
│   ├─ generate_prompt()             │
│   └─ PromptPart                    │
└─────────────────────────────────────┘
```

**Implementation Example**:
```rust
// Phase N validation layer (src/modules/validation.rs)
pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ValidationError> {
    // Reuse Phase 0 core (no modification needed)
    let parts = parse_input(input);

    // Add validation on top
    validate_pattern(&parts)?;
    validate_noun_relationships(&parts)?;

    Ok(parts)
}
```

**UI Integration**:
```javascript
// Frontend with validation
async function processInput(input) {
    try {
        // Use validation layer
        const result = await invoke('parse_input_checked', { input });
        displayPrompt(result);  // Success → proceed
    } catch (error) {
        // Error → re-prompt user
        showError(error.message);
        highlightInvalidInput(error.position);
    }
}
```

**Compatibility**: **Non-breaking** (Phase 0 API remains stable)

**Benefits**:
- ✅ **Separation of Concerns**: Parsing vs. Validation
- ✅ **Single Responsibility**: Each layer has one job
- ✅ **Open-Closed Principle**: Extended without modification
- ✅ **Zero Migration Cost**: Existing code continues to work
- ✅ **Testability**: Each layer tested independently

**Migration** (Optional - existing code works as-is):
```rust
// Phase 0 code (still works, no changes needed)
let parts = parse_input(input);

// Phase N code (opt-in to validation)
let parts = parse_input_checked(input)?;  // Get validation errors
```

---

### Phase N → Phase N+1 (Project Persistence)

**Changes**:
```
Added:
├─ src/modules/io.rs          (File I/O operations)
├─ src/modules/project.rs     (Project structure)
└─ src/commands.rs            (save_project, load_project commands)
```

**File Format** (planned):
```json
{
    "version": "0.2.0",
    "workspace": "...",  // Blockly XML/JSON
    "metadata": {
        "created": "2025-11-25T12:00:00Z",
        "modified": "2025-11-25T13:00:00Z"
    }
}
```

**Compatibility**: Additive (no breaking changes to core library)

---

## Deployment Architecture

### Current (Phase 0)

```
┌─────────────────────────────┐
│  Tauri Desktop Application  │
│  (Single executable)        │
│                             │
│  ├─ Frontend (HTML/CSS/JS)  │
│  └─ Backend (Rust binary)   │
└─────────────────────────────┘
```

**Platform Support**:
- ✅ Linux (development environment)
- [Soon] Windows (future)
- [Soon] macOS (future)

**Distribution**:
- Source code: GitHub repository
- Binary: `cargo build --release` (local build)

---

### Future (Phase 1+)

**Cross-Platform Builds**:
```
Build Matrix:
├─ Linux (x86_64)
├─ Windows (x86_64)
├─ macOS (x86_64)
└─ macOS (ARM64 / Apple Silicon)
```

**Distribution Channels**:
- GitHub Releases (pre-built binaries)
- Package managers (Homebrew, Chocolatey, etc.)

---

## Security Considerations

### Phase 0 Security

**No Security Requirements** (single-user, local-only):
- ❌ No authentication
- ❌ No authorization
- ❌ No encryption
- ❌ No network communication

**Rationale**: Promps Phase 0 is a **local-only tool** with no external communication.

---

### Future Security (Phase 1+)

**Potential Risks** (if features are added):
1. **File I/O** (Phase N+1):
   - Risk: Path traversal attacks
   - Mitigation: Validate file paths, sandbox file access

2. **Network Features** (Future):
   - Risk: Data leakage, MITM attacks
   - Mitigation: HTTPS only, certificate validation

3. **Multi-User** (Out of scope):
   - Risk: Unauthorized access
   - Mitigation: Not applicable (single-user tool)

---

## Appendix

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Desktop Framework | Tauri | 1.x | Cross-platform desktop application |
| Backend Language | Rust | 1.70+ | Core logic, parsing, generation |
| Frontend Language | JavaScript | ES6+ | UI logic (future) |
| Frontend UI | HTML/CSS | - | User interface (future) |
| Block Editor | Blockly.js | - | Visual programming (Phase 1) |

---

### Build Dependencies

**Rust Crates**:
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }
```

**Frontend Dependencies** (Phase 1):
```json
{
  "dependencies": {
    "@tauri-apps/api": "^1.5.0",
    "blockly": "^9.0.0"
  }
}
```

---

### Glossary

| Term | Definition |
|------|------------|
| AST | Abstract Syntax Tree - hierarchical representation of code structure |
| DSL | Domain Specific Language - specialized language for a specific problem domain |
| IPC | Inter-Process Communication - mechanism for Tauri frontend-backend communication |
| Lexical Analysis | First phase of compilation - tokenization |
| PromptPart | Core data structure representing a semantic unit (sentence) |
| Tauri | Framework for building desktop applications with web technologies |

---

### Related Documentation

- **Core Features**: `docs/CORE_FEATURES.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Design Philosophy**: `.ai-context/PROMPS_DESIGN_PHILOSOPHY.md`
- **Development Methodology**: `.ai-context/DEVELOPMENT_METHODOLOGY.md`
- **User Guide**: `README.md`

---

**Document Version**: 2.0
**Last Updated**: 2026-01-19 (JST)
**Next Review**: Before Phase 4 implementation begins
