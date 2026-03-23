# Promps TODO List

**Last Updated**: 2026-01-26

---

## Phase 1: GUI Integration (Blockly.js)

### [Alert] Critical: Input Validation & Limits

**Status**: Not Implemented  
**Priority**: HIGH  
**Reason**: Prevent performance degradation and DoS attacks via direct Tauri IPC calls

#### Required Implementation

**Frontend Validation (UX Optimization)**:
```javascript
// File: res/js/blockly-config.js or res/js/ui-helpers.js

const LIMITS = {
    MAX_BLOCKS_RECOMMENDED: 100,    // Optimal UX, tested in Phase 0
    MAX_BLOCKS_WARNING: 50,         // Show warning to user
    MAX_BLOCKS_HARD_LIMIT: 10000,   // Technical maximum (tested)
};

function validateBlockCount() {
    const blockCount = getBlockCount();
    
    if (blockCount >= LIMITS.MAX_BLOCKS_RECOMMENDED) {
        showError("Block limit reached (100). Please reduce blocks for optimal performance.");
        return false;
    }
    
    if (blockCount >= LIMITS.MAX_BLOCKS_WARNING) {
        showWarning("Warning: Many blocks detected. Consider reducing for better UX.");
    }
    
    return true;
}
```

**Backend Validation (Security Layer - Phase 5)**:
```rust
// File: src/commands.rs (Phase 5 implementation)

pub const MAX_INPUT_LENGTH: usize = 100_000;      // 100,000 characters
pub const MAX_NOUN_COUNT: usize = 10_000;         // 10,000 nouns
pub const MAX_BLOCKS_RECOMMENDED: usize = 100;    // Recommended limit
pub const MAX_BLOCKS_WARNING: usize = 50;         // Warning threshold

#[tauri::command]
pub fn generate_prompt_from_text_checked(input: String) -> Result<String, String> {
    // Validate input length
    if input.len() > MAX_INPUT_LENGTH {
        return Err(format!("Input too large: {} bytes (max: {})", 
                          input.len(), MAX_INPUT_LENGTH));
    }
    
    let parts = parse_input(&input);
    
    // Validate noun count
    let noun_count = parts.iter().filter(|p| p.is_noun).count();
    if noun_count > MAX_NOUN_COUNT {
        return Err(format!("Too many nouns: {} (max: {})", 
                          noun_count, MAX_NOUN_COUNT));
    }
    
    Ok(generate_prompt(&parts))
}
```

#### Test Coverage (Phase 0 ✅)

**Already Tested**:
- ✅ 100 nouns: `test_many_nouns()` - Baseline for UI limit
- ✅ 1,000 nouns: `test_extreme_many_nouns()` - Stress test
- ✅ 10,000 characters: `test_very_long_input()` - Long text handling
- ✅ Consecutive markers: `test_consecutive_noun_markers()` - Edge case

**Location**: `src/lib.rs:260-333`

#### Implementation Checklist

- [ ] **Frontend**: Add block count limit (100 blocks recommended)
- [ ] **Frontend**: Show warning at 50 blocks
- [ ] **Frontend**: Prevent exceeding 100 blocks (hard UI limit)
- [ ] **Frontend**: Display clear error messages
- [ ] **Backend (Phase 5)**: Add `generate_prompt_from_text_checked()` command
- [ ] **Backend (Phase 5)**: Add input length validation (100,000 chars)
- [ ] **Backend (Phase 5)**: Add noun count validation (10,000 nouns)
- [ ] **Documentation**: Update Phase 1 docs with limit specifications

#### Rationale

**Why 100 blocks?**
- Tested in Phase 0: `test_many_nouns()` passes in <1ms
- UX consideration: Manageable visual complexity
- Performance: No noticeable latency

**Why 10,000 hard limit?**
- Tested in Phase 0: `test_extreme_many_nouns()` passes (1,000 nouns)
- DoS prevention: Protects against malicious direct Tauri IPC calls
- Memory safety: Within reasonable bounds for most systems

**Why delegate to OS beyond this?**
- Memory availability is dynamic (other processes)
- OS has better resource management (OOM Killer, swap)
- Prevents false negatives (rejecting valid operations)

See: `docs/en/ARCHITECTURE.md#resource-management-philosophy`

---

## Phase 1: Other Tasks

### Blockly.js Integration

- [ ] Add Blockly.js library to frontend
- [ ] Define custom blocks (Noun, Verb, Particle, etc.)
- [ ] Implement workspace serialization
- [ ] Implement DSL generation from blocks
- [ ] Add code preview panel

### UI/UX

- [ ] Design main application layout
- [ ] Add toolbar (New, Open, Save, Export)
- [ ] Add block palette (categorized blocks)
- [ ] Add output preview (real-time)
- [ ] Add example projects

---

## Phase 4: Project Persistence (v0.0.4)

### File I/O

- [ ] Define project file format (JSON)
- [ ] Implement save/load functionality
- [ ] Add autosave feature
- [ ] Add recent projects list
- [ ] Implement project templates

---

## Phase 5: Logic Check 基礎 (v0.0.5) ✅ Complete

### Basic Grammatical Validation

- [x] Implement validation.rs module with TokenType, ValidationResult, ValidationError
- [x] Implement 4 grammar rules (particle position, consecutive particles, verb position, consecutive nouns)
- [x] Add validate_dsl_sequence Tauri command
- [x] Create validation-ui.js for real-time error display
- [x] Add block highlighting for errors/warnings

---

## Phase 6: Logic Check 拡張 (v0.0.6) ✅ Complete

### Advanced Grammatical Validation

- [x] Add Rule 5-6: Missing subject/object warnings
- [x] Implement AutoFix with insertBlockBefore/insertBlockAfter
- [x] Add 7 pattern templates (SOV, OV, Topic, Means, Parallel, Source-Dest, OSV)
- [x] Implement analyze_patterns() for smart recommendations
- [x] Add 9 punctuation blocks with 3 punctuation grammar rules

---

## Documentation Updates

### When Implementing Phase 1

- [ ] Update `docs/en/ARCHITECTURE.md` with GUI architecture
- [ ] Update `docs/ja/ARCHITECTURE.md` with GUI architecture
- [ ] Create `docs/en/BLOCKLY_INTEGRATION.md`
- [ ] Create `docs/ja/BLOCKLY_INTEGRATION.md`
- [ ] Update `README.md` with GUI usage examples

### When Implementing Phase 5/6

- [ ] Create `docs/en/LOGIC_CHECK.md`
- [ ] Create `docs/ja/LOGIC_CHECK.md`
- [ ] Update `docs/en/API_REFERENCE.md` with error types
- [ ] Update `docs/ja/API_REFERENCE.md` with error types

---

## Testing

### Phase 1 Tests

- [ ] Add frontend unit tests (if using testing framework)
- [ ] Add integration tests (Blockly → DSL → Prompt)
- [ ] Add UI interaction tests (block placement, deletion)
- [ ] Add limit validation tests (50, 100 block scenarios)

### Phase 5/6 Tests

- [ ] Add pattern matching tests (50-100 test cases)
- [ ] Add error handling tests (invalid patterns)
- [ ] Add edge case tests (complex sentences)

---

## Security

### Phase 1

- [x] Document resource management philosophy (completed 2025-11-28)
- [x] Add stress tests (100, 1000 nouns) (completed 2025-11-28)
- [ ] Implement frontend block limit (100 blocks)
- [ ] Add user warnings (50+ blocks)

### Phase 5

- [ ] Implement backend validation (`generate_prompt_from_text_checked()`)
- [ ] Add rate limiting (optional, future consideration)
- [ ] Add input sanitization (if accepting external files)

---

## Post v1.0.0: Future Features

### i18n (多言語対応)

**Status**: Planned (after v1.0.0)
**Priority**: Medium
**Branch**: Separate from API layer implementation

#### Design Decisions (2026-01-24)

**Architecture**:
- i18n機能はPhase 0（コアレイヤー）に実装
- 上位レイヤーへはconfファイル経由で言語設定を伝搬
- conf読み出しロジックは共通化（一箇所で管理）
- 各レイヤーは受け取った言語でテキスト切り替えに集中

**Rationale**:
- Phase 0に置くことで全レイヤーが一貫してi18nを利用可能
- confファイル経由により、Phase 0のAPIを変更せずに言語設定を共有
- 責務の分離により、バグの原因特定が容易
  - conf読み出しに問題 → 共通部分
  - テキスト表示がおかしい → 該当レイヤー
- 実行時の言語切り替えにも対応しやすい設計

**Implementation Flow**:
```
[conf file] ← 言語設定を保存
     ↓
[Phase 0: conf読み出し共通関数]
     ↓
[Phase N: 各レイヤーでテキスト切り替え]
```

#### Implementation Checklist

- [ ] conf file format design (言語設定の保存形式)
- [ ] Phase 0: conf読み出し共通関数の実装
- [ ] Phase 0: 言語リソースファイルの設計 (JSON/TOML)
- [ ] Frontend: UI テキストの外部化
- [ ] Backend: エラーメッセージ等の外部化
- [ ] 言語切り替えUI（設定画面）
- [ ] 初期対応言語: 日本語、英語

---

## Notes

### Design Decisions (2025-11-28)

**Memory Management Responsibility**:
- Application handles business logic limits (100 blocks UI, 10,000 backend)
- OS handles system resource limits (OOM, memory pressure)
- Rationale: Dynamic memory availability, OS expertise, better UX

**Test Strategy**:
- Test realistic scenarios (100, 1,000 nouns)
- Do NOT test extreme memory exhaustion (100,000+ items)
- Reason: Hardware-dependent, risks system instability

**Multi-layer Defense**:
1. Frontend: UX optimization (100 block limit)
2. Backend: DoS prevention (10,000 noun limit, Phase 5)
3. OS: System protection (OOM Killer, swap management)

---

**Document Version**: 1.0  
**Created**: 2025-11-28  
**Next Review**: Before Phase 1 implementation begins
