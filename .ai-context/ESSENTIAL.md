# AI Context - Essential Information Only

**Last Updated**: 2026-02-27
**Purpose**: Minimal context for session startup (token optimization)
**Keywords**: essential, quick start, overview, status, current state, 現在の状態, エッセンシャル, 概要, project status, version, tests, テスト, critical rules, 重要なルール, quick reference, クイックリファレンス, entry point, starting point
**Related**: @README.md, @context/coding/API_STABILITY.md, @context/workflows/BRANCHING.md, @context/coding/TESTING.md

---

## Current Status

**Version**: v2.1.0 Ent (Stable Release)
**Phase**: All phases complete - Wizard Template + Custom Wizard
**Tests**: 911 tests at 100% passing (Backend 277 + Frontend 634)
**Branch**: main (integration branch)

---

## Roadmap

| Version | Phase | Content | Status |
|---------|-------|---------|--------|
| v0.0.3-2 | Phase 3 | Verb blocks | ✅ Complete |
| v0.0.4 | Phase 4 | Project Persistence (save/load) | ✅ Complete |
| v0.0.5 | Phase 5 | Logic Check 基礎 (basic validation) | ✅ Complete |
| v0.0.6 | Phase 6 | Logic Check 拡張 (advanced + patterns + punctuation) | ✅ Complete |
| **v1.0.0** | - | **Stable Release** | 🎉 **Released** |
| **v1.1.0** | - | **English Grammar Engine** | 🎉 **Released** |
| **v1.2.0** | - | **Template/Macro Feature** | 🎉 **Released** |
| **v1.3.0** | - | **Export Feature** | 🎉 **Released** |
| **v1.4.0** | - | **Tags & Search Feature (Pro)** | 🎉 **Released** |
| **v1.5.0** | - | **Block Favorites Feature (Pro)** | 🎉 **Released** |
| **v1.6.0 Pro** | - | **Multi-AI Compare (Pro)** | 🎉 **Released** |
| **v1.7.0 Pro** | - | **7-Day Free Trial (Pro)** | 🎉 **Released** |
| **v1.8.0 Pro** | - | **Template Center Placement & Workspace Origin (Pro)** | 🎉 **Released** |
| **v1.9.0 Pro** | - | **French Language Support (Pro Trilingual)** | 🎉 **Released** |
| **v1.4.0 Ent** | - | **Color Theme Customization + Code Consistency** | 🎉 **Released** |
| **v1.5.0 Ent** | - | **Multi-AI Compare** | 🎉 **Released** |
| **v1.6.0 Ent** | - | **7-Day Free Trial** | 🎉 **Released** |
| **v1.6.1 Ent** | - | **Dark Mode CSS Variables + trial cleanup** | 🎉 **Released** |
| **v1.6.2 Ent** | - | **CSS Variable Migration & Pro Sync** | 🎉 **Released** |
| **v1.6.3 Ent** | - | **Template Dialog Fix** | 🎉 **Released** |
| **v1.6.4 Ent** | - | **_V: Verb Prefix for Grammar Validation** | 🎉 **Released** |
| **v1.6.5 Ent** | - | **CSS Variable Migration for Dark Mode** | 🎉 **Released** |
| **v1.7.0 Ent** | - | **Template Center Placement & Workspace Origin** | 🎉 **Released** |
| **v1.8.0 Ent** | - | **French Language Support (Trilingual)** | 🎉 **Released** |
| **v2.0.0 Ent** | - | **QR Code & LAN P2P Sharing** | 🎉 **Released** |
| **v2.1.0 Ent** | - | **Wizard Template + Custom Wizard** | 🎉 **Released** |

---

## Critical Rules (5 Points)

### 1. API Stability
- **Phase 0 APIs are immutable** - Never modify existing functions/structs
- Add new functions instead of changing existing ones
- Details: `@.ai-context/context/coding/API_STABILITY.md`

### 2. Branching Strategy
- **Persistent Feature Branches** - Do NOT delete feature/phase-* branches after merge
- Each branch = One Phase/Layer (module-like persistence)
- Details: `@.ai-context/context/workflows/BRANCHING.md`

### 3. Testing Policy
- **All tests must pass before merge** (680 tests currently)
- Implement tests immediately after feature completion
- Details: `@.ai-context/context/coding/TESTING.md`

### 4. Git Push Policy
- **Always `git pull` before `git push`**
- Reason: GitHub Actions updates README.md (access graph)
- Pushing without pull may cause conflicts

### 5. Release & Repository Operations
- **Verify repository before changes**: `pwd && git remote -v`
- **Update ALL 3 version files**: `Cargo.toml`, `tauri.conf.json`, `package.json`
- Details: `@.ai-context/shared/workflows/CRITICAL_OPERATIONS.md`

---

## Quick File Locations

**Source Code**:
- Core: `src/lib.rs`, `src/commands.rs`
- Validation: `src/modules/validation.rs`
- Trial: `src/modules/trial.rs`
- Frontend: `res/js/main.js`, `res/js/blockly-config.js`, `res/js/project-manager.js`, `res/js/validation-ui.js`, `res/js/export-manager.js`, `res/js/project-index.js`, `res/js/project-sidebar.js`, `res/js/block-favorites-manager.js`, `res/js/floating-palette.js`, `res/js/ai-compare.js`, `res/js/qr-share.js`, `res/js/lan-share.js`

**Tests**:
- Backend: `src/lib.rs` (13 tests), `src/commands.rs` (149 tests), `src/modules/trial.rs` (9 tests), `src/modules/qr_share.rs` (14 tests), `src/modules/lan_discovery.rs` (12 tests), `src/modules/lan_transfer.rs` (14 tests)
- Frontend: `res/tests/` (557 tests)

---

## When You Need More Context

**For Coding**:
- Conventions: `@.ai-context/context/coding/CONVENTIONS.md`
- Testing: `@.ai-context/context/coding/TESTING.md`
- API Stability: `@.ai-context/context/coding/API_STABILITY.md`

**For Architecture**:
- Project Structure: `@.ai-context/context/architecture/PROJECT_STRUCTURE.md`
- Tauri Integration: `@.ai-context/context/architecture/TAURI.md`

**For Workflows**:
- Branching: `@.ai-context/context/workflows/BRANCHING.md`
- Release: `@.ai-context/context/workflows/RELEASE.md`

**Shared Context** (via submodule `shared/`):
- **Critical Operations**: `@.ai-context/shared/workflows/CRITICAL_OPERATIONS.md` (release/repo checks)
- Documentation: `@.ai-context/shared/workflows/DOCUMENTATION_CREATION.md`
- Developer Profile: `@.ai-context/shared/developer/YOSHIHIRO_NAKAHARA_PROFILE.md`
- Methodology: `@.ai-context/shared/methodology/AI_COLLABORATION.md`
- Design Philosophy: `@.ai-context/shared/methodology/DESIGN_PHILOSOPHY.md`
- Insights: `@.ai-context/shared/insights/`

---

## Common Operations (Quick Reference)

**Run tests**:
```bash
cargo test && cd res/tests && npm test
```

**Development**:
```bash
cargo tauri dev
```

**Git workflow** (with persistent branches):
```bash
git checkout -b feature/phase-N
# ... implement ...
git commit -m "feat(phase-N): description"
git checkout dev && git merge --no-ff feature/phase-N
git pull origin dev  # ← Always pull before push (GitHub Actions updates README)
git push origin dev
git push origin feature/phase-N  # ← Keep branch alive
```

---

**This file loads < 100 lines. Load other contexts only when needed.**
