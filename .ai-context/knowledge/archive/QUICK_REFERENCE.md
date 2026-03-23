# Quick Reference - Promps Project

**Last Updated**: 2025-12-08
**Purpose**: Fast lookup for AI assistants during active development

---

## Current Phase Status

- **Phase 0 (CLI)**: ✅ Complete (100%) - **Critical Foundation**
- **Phase 1 (GUI)**: ✅ Complete (100%) - 42 tests at 100% passing
- **Phase 2 (Particle Blocks)**: ✅ Complete (100%) - 68 tests at 100% passing - **v0.0.2**
- **Phase 3 (Verb Blocks)**: [Soon] Next - Adding verb block types
- **Phase N (Logic Check)**: ⏳ Main Challenge - 50-100 pattern matching
- **Phase N+1 (File I/O)**: [List] Planned
- **Phase N+2 (Layout)**: [List] Planned

**Current Development Status**:
- **Architecture**: Mostly finalized
- **Strategy**: Pattern expansion (not new features)
- **Bottleneck**: Phase N logic check (Japanese particle analysis)
- **Foundation**: Phase 0's `_N:` prefix enables noun identification, Phase N focuses on particle patterns only
- **Latest**: v0.0.2 adds 9 particle blocks with collapsible category UI

---

## Critical Design Decisions

### 1. Token-Level Noun Detection (Phase 0-1)
```
Input:  "_N:User が _N:Order を 作成"
Output: "User (NOUN) が Order (NOUN) を 作成"
        ↑               ↑
        Each noun gets individual (NOUN) marker
```

**Why**: Multiple nouns in one sentence require individual marking for AI understanding.

### 2. _N: Prefix Purpose
- **NOT** just a marker - it's AST-like type annotation
- Guarantees noun identification (no inference needed)
- Foundation for Phase N validation
- User never sees it in GUI (auto-generated from blocks)

### 3. Single-Line Output Format
```
Output: "User (NOUN) が Order (NOUN) を 作成\n"
        ↑─────────────────────────────────↑
        Single line preserves sentence unity for AI
```

**Why**: AI processes as one task, not separate commands.

---

## File Locations

### Source Code
- **Core parsing**: `src/lib.rs` (parse_input, generate_prompt)
- **Tauri commands**: `src/commands.rs` (generate_prompt_from_text)
- **Frontend logic**: `res/js/main.js`, `res/js/blockly-config.js`

### Tests
- **Backend**: `src/lib.rs` (13 tests), `src/commands.rs` (13 tests)
- **Frontend**: `res/tests/blockly-config.test.js` (30 tests), `res/tests/main.test.js` (12 tests)
- **Total**: 68 tests at 100% passing

### Documentation
- **User docs**: `docs/ja/USER_GUIDE.md`
- **Testing docs**: `docs/testing/ja/TEST_OVERVIEW.md`, `FRONTEND_TEST_INDEX.md`
- **AI context**: `.ai-context/` (this directory)

---

## Key Data Structures

### PromptPart (Rust)
```rust
pub struct PromptPart {
    pub is_noun: bool,  // True if token is _N: prefixed
    pub text: String,   // Token text (without _N: prefix)
}
```

### Block Definition (JavaScript)
```javascript
{
  "type": "noun_block",
  "message0": "名詞 %1",
  "args0": [{"type": "field_input", "name": "TEXT", "text": ""}]
}
```

---

## Common Operations

### Running Tests
```bash
# Backend tests
cargo test

# Frontend tests
cd res/tests && npm test

# All tests
cargo test && cd res/tests && npm test && cd ../..
```

### Building
```bash
# Development
cargo tauri dev

# Production
cargo tauri build
```

---

## Current Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Core parsing (lib.rs) | 13 | ✅ 100% |
| Tauri integration (commands.rs) | 13 | ✅ 100% |
| Blockly config | 30 | ✅ 100% |
| UI logic | 12 | ✅ 100% |
| **Total** | **68** | **✅ 100%** |

---

## Phase 2 Complete ✅

**Goal**: Add particle block types

**Implemented**:
- ✅ 9 particle blocks (が、を、に、で、と、へ、から、まで、より)
- ✅ Collapsible category UI
- ✅ Fixed labels (non-editable)
- ✅ Enhanced visual separation with CSS
- ✅ 11 new tests added (total: 68 tests)
- ✅ Documentation created (USER_GUIDE.md, TEST_OVERVIEW.md, FRONTEND_TEST_INDEX.md)

**Release**: v0.0.2 (Tech Preview)

---

## Phase 3 Scope (Next)

**Goal**: Add verb block types

**Planned blocks**:
- Verb blocks (作成、更新、削除、取得、etc.)
- Action representation
- Fixed labels

**Phase N dependency**: Logic check requires knowing parts of speech.

---

## Future Features (Post v1.0 Release)

### Multiple Noun Enumeration Feature (Phase N+4 or later)

**Purpose**: Allow listing multiple nouns under a single subject (e.g., database table column definitions)

**Use Case Example**:
```
Input (Blockly):
  Table: User
    Columns: ID, Name, Email, CreatedAt

Output (DSL):
  _N:User { _N:ID _N:Name _N:Email _N:CreatedAt }
```

**Implementation Options**:
1. **Fixed slots** (⭐ Easy, ~30 min, low flexibility)
2. **Statement Input** (⭐⭐ Medium, 1-2 hours, medium flexibility)
3. **Mutator with +/- buttons** (⭐⭐⭐ Advanced, 3-5 hours, high flexibility) ← Recommended

**Release Strategy**:
- v1.0: Simple subject + single noun pattern
- Collect user feedback and usage patterns
- v2.0+: Add multiple noun enumeration as "power user feature"

**Phase N Impact**: Requires new pattern validation rules for table-like structures

**Status**: Deferred until post-v1.0 (awaiting user feedback)

---

## Branching Strategy (Critical)

**Strategy**: Persistent Feature Branch (branches are NOT deleted after merge)

**Branch Structure**:
```
dev (integration branch)
  ├── feature/phase-0 (persistent)
  ├── feature/phase-1 (persistent)
  ├── feature/phase-2 (persistent)
  └── feature/phase-n (persistent)
```

**Key Rules**:
1. **Do NOT delete** feature/phase-N branches after merge to dev
2. Each branch = Phase/Layer (module-like persistence)
3. Bug fixes: Work on corresponding feature/phase-N branch, then merge to dev

**Why This Works**:
- Phase count is finite (5-10 branches max)
- Layered architecture = independent modules
- Each Phase modifies different files/sections
- Merge conflicts are rare (file/section separation)

**API Stability**:
- Phase 0 APIs are **immutable**
- Add new functions instead of changing existing ones
- Upper layers call lower layers, never modify them

**Details**: See `workflows/BRANCHING_STRATEGY.md` and `development/API_STABILITY.md`

---

## Scalability Context (Critical)

**Why Promps is Minimal**: Intentional design choice, not limitation

**Key Points**:
- Phase count: 5-10 (finite, manageable)
- This scale enables pure layered architecture
- Larger projects (KakeiBon: 15-20+ phases) require different approaches
- Architecture is a tool, not a dogma - choose based on scale

**Guidance**:
- For projects with < 10 phases → Layered architecture works
- For projects with > 10 phases → Consider modular architecture
- Scale determines strategy, not the other way around

**Details**: See `core/SCALE_AND_ARCHITECTURE.md`

---

## Immediate Context Needs

When working on:

- **Code implementation** → Read `development/CONVENTIONS.md`
- **Architecture decisions** → Read `core/DESIGN_PHILOSOPHY.md`
- **Scalability/scope questions** → Read `core/SCALE_AND_ARCHITECTURE.md`
- **Testing strategy** → Read `development/TESTING_STRATEGY.md`
- **Project structure** → Read `architecture/PROJECT_STRUCTURE.md`
- **Workflow management** → Read `workflows/GITHUB_PROJECTS.md`
- **Branching/Git operations** → Read `workflows/BRANCHING_STRATEGY.md`
- **API changes** → Read `development/API_STABILITY.md`

---

**This file provides fast access to essential information without reading full documentation.**
