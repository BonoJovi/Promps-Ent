# API Stability Policy

**Last Updated**: 2025-12-08
**Purpose**: Rules for preventing merge conflicts through API stability
**Keywords**: API stability, API安定性, immutable API, 不変API, backward compatibility, 後方互換性, breaking changes, 破壊的変更, Phase 0, core layer, コアレイヤー, function signature, 関数シグネチャ, versioning, バージョニング, deprecation, 非推奨, additive changes, 追加のみ, no modification, 変更禁止
**Related**: @BRANCHING.md, @CONVENTIONS.md, @TESTING.md

---

## Core Principle

**Phase 0 (Core Layer) APIs are immutable.**

Once published, Phase 0 APIs must not change. Upper layers depend on these APIs, and changes cause conflicts across all feature branches.

---

## Rules

### Rule 1: Do Not Modify Existing APIs

**Forbidden**:
```rust
// ❌ BAD: Changing existing function signature
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>
```

**Allowed**:
```rust
// ✅ GOOD: Keep existing function, add new one
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // Original implementation (unchanged)
}

pub fn parse_input_with_options(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // New functionality
}
```

### Rule 2: Do Not Modify Existing Data Structures

**Forbidden**:
```rust
// ❌ BAD: Changing struct fields
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}
    ↓
pub struct PromptPart {
    pub part_type: PartType,  // Replaced is_noun
    pub text: String,
}
```

**Allowed**:
```rust
// ✅ GOOD: Add new fields, keep existing ones
pub struct PromptPart {
    pub is_noun: bool,        // Keep existing
    pub text: String,         // Keep existing
    pub metadata: Option<Metadata>,  // New field (optional)
}
```

### Rule 3: Upper Layers Do Not Modify Lower Layers

**Example**:
```
Phase N (feature/phase-n):
  ✅ Call parse_input()
  ✅ Use PromptPart
  ❌ Modify parse_input() implementation
  ❌ Modify PromptPart definition
```

**File-level rule**:
```
feature/phase-n:
  ✅ Create src/modules/validation.rs (new file)
  ✅ Read src/lib.rs (use exports)
  ❌ Edit src/lib.rs (modify Phase 0 code)
```

---

## Conflict Patterns

### Pattern 1: Function Signature Change

**Scenario**:
```rust
// Phase 0 (feature/phase-0) changes signature
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>

// Phase N (feature/phase-n) breaks
let parts = parse_input(input);  // ← Compile error: missing argument
```

**Impact**: All upper layers break

**Prevention**: Do not change existing signatures

### Pattern 2: Function Rename

**Scenario**:
```rust
// Phase 0 renames function
pub fn parse_input(...) -> ...
    ↓
pub fn parse_tokens(...) -> ...

// Phase N breaks
let parts = parse_input(input);  // ← Compile error: function not found
```

**Impact**: All call sites break

**Prevention**: Keep old name, add new name (alias if needed)

### Pattern 3: Struct Field Change

**Scenario**:
```rust
// Phase 0 changes struct
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}
    ↓
pub struct PromptPart {
    pub part_type: PartType,  // Replaced is_noun
    pub text: String,
}

// Phase N breaks
if part.is_noun { ... }  // ← Compile error: field not found
```

**Impact**: All field accesses break

**Prevention**: Add new fields, do not remove existing ones

---

## When API Change is Unavoidable

If API change is absolutely necessary, use **Deprecation Workflow**:

### Step 1: Mark as Deprecated

```rust
// Phase 0
#[deprecated(since = "0.1.0", note = "Use parse_input_v2 instead")]
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // Keep implementation unchanged
}

pub fn parse_input_v2(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // New implementation
}
```

### Step 2: Update Upper Layers

```rust
// Phase N (feature/phase-n)
// Change from old API to new API
let parts = parse_input_v2(input, ParseOptions::default());
```

### Step 3: Wait for All Layers to Migrate

Check all feature branches:
```bash
git checkout feature/phase-1 && git grep "parse_input("
git checkout feature/phase-2 && git grep "parse_input("
git checkout feature/phase-n && git grep "parse_input("
```

### Step 4: Remove Deprecated API (Next Major Version)

```rust
// v1.0.0: Remove deprecated API
// pub fn parse_input(...) -> ...  ← Delete this

pub fn parse_input_v2(...) -> ...  // Keep new API
```

---

## Layered API Design

Follow the **Dependency Inversion Principle**:

```
┌─────────────────────────────────────┐
│   Phase N: Validation Layer         │
│   - parse_input_checked()           │  ← Phase N API
│   - validate_pattern()              │
└────────────┬────────────────────────┘
             │ Depends on (calls only, no modify)
             ↓
┌─────────────────────────────────────┐
│   Phase 0: Core Parsing Layer       │
│   - parse_input()                   │  ← Immutable API
│   - generate_prompt()               │
└─────────────────────────────────────┘
```

**Characteristics**:
- Upper layers depend on lower layers
- Lower layers do not depend on upper layers
- Lower layer APIs are stable
- Upper layer APIs can change freely

---

## API Stability Levels

| Layer | Stability | Change Policy |
|-------|-----------|---------------|
| Phase 0 | **Immutable** | Never change existing APIs |
| Phase 1 | Stable | Avoid changes after v1.0.0 |
| Phase 2+ | Semi-stable | Can change with deprecation |
| Phase N+ | Unstable | Can change freely (not released yet) |

---

## Testing API Compatibility

### Compile-time Check

Rust's type system automatically detects API incompatibilities:

```rust
// If Phase 0 API changes, upper layers fail to compile
let parts = parse_input(input);  // ← Compile error if signature changed
```

### CI/CD Cross-Check

```yaml
# .github/workflows/api-compatibility.yml
name: API Compatibility Check

on:
  push:
    branches:
      - 'feature/**'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Merge dev and test compilation
      - name: Check compatibility with dev
        run: |
          git fetch origin dev
          git merge origin/dev --no-commit --no-ff || true
          cargo check --all-features

      - name: Notify on incompatibility
        if: failure()
        run: echo "⚠️ API incompatibility detected"
```

---

## Real-World Example

### Scenario: Adding Validation Options

**Requirement**: Phase N needs to configure validation strictness

**❌ Wrong Approach** (breaks API):
```rust
// Phase 0 change
pub fn parse_input(input: &str, strict: bool) -> Vec<PromptPart> {
    // ...
}

// Phase 1, 2, 3 all break
let parts = parse_input(input);  // ← Missing argument
```

**✅ Correct Approach** (new function):
```rust
// Phase 0: Keep existing API
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // Original implementation (unchanged)
}

// Phase N: Add new function
pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ValidationError> {
    let parts = parse_input(input);  // Reuse Phase 0 API
    validate_pattern(&parts)?;
    Ok(parts)
}
```

---

## Related Documentation

- **BRANCHING_STRATEGY.md**: Persistent Feature Branch strategy
- **DESIGN_PHILOSOPHY.md**: Layered Architecture principles
- **CONVENTIONS.md**: Coding standards

---

**For contributor-facing documentation, see**: `docs/ja/contributor/API_STABILITY.md`
