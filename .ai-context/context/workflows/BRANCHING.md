# Branching Strategy

**Last Updated**: 2025-12-08
**Purpose**: Persistent Feature Branch strategy for layered architecture
**Keywords**: branching, branch strategy, ブランチ戦略, persistent branches, 永続ブランチ, feature branch, フィーチャーブランチ, git workflow, ワークフロー, merge, マージ, no-delete, 削除禁止, layered architecture, レイヤードアーキテクチャ, phase branches, フェーズブランチ, dev branch, integration branch, 統合ブランチ, module-like, モジュール的
**Related**: @RELEASE.md, @API_STABILITY.md, @CONVENTIONS.md

---

## Overview

Promps uses **Persistent Feature Branch Strategy** where feature branches are **NOT deleted** after merging to `dev`.

**Key principle**: Branch = Layer/Module

---

## Branch Structure

```
dev (統合ブランチ)
  ├── feature/phase-0 (永続) - Core parsing
  ├── feature/phase-1 (永続) - GUI foundation
  ├── feature/phase-2 (永続) - Particle blocks
  ├── feature/phase-3 (永続) - Verb blocks
  ├── feature/phase-4 (永続) - Project Persistence
  ├── feature/phase-5 (永続) - Logic Check 基礎
  └── feature/phase-6 (永続) - Logic Check 拡張
```

---

## Rules

### Rule 1: Feature Branches are Persistent
- **DO NOT delete** feature/phase-N branches after merge
- Each branch represents a Phase/Layer
- Branches are kept for future bug fixes

### Rule 2: Each Phase Modifies Independent Files/Modules
- Phase 0: `src/lib.rs` (core parsing)
- Phase 1: `res/html/`, `res/js/main.js`, `res/js/blockly-config.js` (GUI foundation)
- Phase 2: `res/js/blockly-config.js` (particle blocks section)
- Phase 3: `res/js/blockly-config.js` (verb blocks section)
- Phase 4: `src/commands.rs`, `res/js/` (project persistence)
- Phase 5: `src/modules/validation.rs` (basic validation)
- Phase 6: `src/modules/validation.rs` (advanced validation + suggestions)

### Rule 3: Merge to dev, Keep Branch Alive
- After merging to `dev`, push feature branch to remote
- Do not delete local or remote branch
- Branch remains ready for next fix

---

## Workflow

### Phase Development

```bash
# 1. Create Phase branch
git checkout dev
git pull --rebase origin dev
git checkout -b feature/phase-3

# 2. Implement
# - Add verb blocks to blockly-config.js
# - Add tests/verb-blocks.test.js
# - Keep existing 42 tests unchanged

# 3. Test
cargo test && cd res/tests && npm test && cd ../..

# 4. Commit
git add .
git commit -m "feat(phase-3): add verb block types with 15 tests"
git push origin feature/phase-3

# 5. Merge to dev
git checkout dev
git pull --rebase origin dev
git merge --no-ff feature/phase-3
git push origin dev

# 6. Keep branch alive
git push origin feature/phase-3  # ← DO NOT DELETE
```

### Bug Fix in Existing Phase

```bash
# 1. Work on Phase branch
git checkout feature/phase-2
git pull --rebase origin dev  # Get latest dev changes

# 2. Fix bug
# - Modify res/js/blockly-config.js (particle section only)
# - Update tests

# 3. Test
cargo test && cd res/tests && npm test

# 4. Commit
git commit -m "fix(phase-2): fix particle block rendering issue"

# 5. Merge to dev
git checkout dev
git merge --no-ff feature/phase-2
git push origin dev

# 6. Update feature branch
git push origin feature/phase-2
```

---

## Merge Conflict Prevention

### Why Conflicts are Rare

**1. File-level separation**
```
Phase 0: src/lib.rs
Phase 1: res/html/, res/js/main.js
Phase N: src/modules/validation.rs (new file)
→ Different files = No conflict
```

**2. Function-level independence**
```rust
// Phase 0: Core API
pub fn parse_input(input: &str) -> Vec<PromptPart> { ... }

// Phase N: Validation layer (calls Phase 0, doesn't modify it)
pub fn parse_input_checked(input: &str) -> Result<...> {
    let parts = parse_input(input);  // Use Phase 0 API
    validate_pattern(&parts)?;        // Add validation
    Ok(parts)
}
```

**3. Section-level separation (same file)**
```javascript
// res/js/blockly-config.js

// Phase 1: Basic blocks
Blockly.Blocks['noun_block'] = { ... };

// Phase 2: Particle blocks
Blockly.Blocks['particle_ga'] = { ... };

// Phase 3: Verb blocks
Blockly.Blocks['verb_create'] = { ... };
```

### When Conflicts May Occur

**Primary risk: API changes**

Example:
```rust
// Phase 0 changes function signature
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>

// Phase N breaks
let parts = parse_input(input);  // ← Missing argument
```

**Prevention**: See API_STABILITY.md
- Phase 0 API must remain stable
- Add new functions instead of modifying existing ones

---

## Branch Naming Convention

```
feature/phase-0      # Phase 0 Core
feature/phase-1      # Phase 1 GUI
feature/phase-2      # Phase 2 Particle Blocks
feature/phase-3      # Phase 3 Verb Blocks
feature/phase-4      # Phase 4 Project Persistence
feature/phase-5      # Phase 5 Logic Check 基礎
feature/phase-6      # Phase 6 Logic Check 拡張

fix/critical-bug     # Cross-phase critical fixes (deleted after merge)
docs/update-readme   # Documentation only (deleted after merge)
```

**Persistent branches**: `feature/phase-*`
**Temporary branches**: `fix/*`, `docs/*`

---

## GitHub Projects Integration

```
Feature (GitHub Projects):
  Title: "Phase 3: Add Verb Block Types"
  Branch: feature/phase-3
  Status: Todo → In Progress → In Review → Done

Issue:
  Title: "Verb blocks rendering issue"
  Branch: fix/verb-block-rendering (or use feature/phase-3 directly)
```

---

## CI/CD

### Tests on Feature Branches

```yaml
# .github/workflows/feature-branch-check.yml
on:
  push:
    branches:
      - 'feature/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: cargo test
      - run: cd res/tests && npm test
```

### Release from dev Only

```yaml
# .github/workflows/release.yml
on:
  push:
    tags:
      - 'v*'

# Releases are created from dev branch only
```

---

## Rationale

### Why This Works for Promps

**1. Finite Phase count**
- Promps has 5-10 Phases (not infinite)
- Branch count is manageable

**2. Layered Architecture**
- Each Phase = Independent layer
- Non-Breaking Extension Principle
- Lower layers remain stable

**3. Clear module boundaries**
- Phase 0: Core parsing
- Phase 1: GUI foundation
- Phase 2-3: Block types (Particle, Verb)
- Phase 4: Project Persistence (File I/O)
- Phase 5-6: Logic Check (Validation)

**4. Minimal implementation**
- Small codebase
- Low conflict probability
- High module cohesion

---

## Related Documentation

- **API_STABILITY.md**: API change policy (prevents conflicts)
- **DESIGN_PHILOSOPHY.md**: Layered architecture details
- **QUICK_REFERENCE.md**: Current phase status
- **GITHUB_PROJECTS.md**: Issue tracking workflow

---

**For contributor-facing documentation, see**: `docs/ja/contributor/BRANCHING_STRATEGY.md`
