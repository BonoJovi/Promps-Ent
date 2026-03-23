# Test-Driven AI Collaboration

**Last Updated**: 2025-11-25
**Purpose**: Testing strategies for AI-assisted development
**Keywords**: testing, tests, テスト, test-driven, TDD, テスト駆動, unit tests, ユニットテスト, integration tests, 統合テスト, cargo test, npm test, test coverage, カバレッジ, backend tests, frontend tests, バックエンドテスト, フロントエンドテスト, test strategy, テスト戦略, quality assurance, QA, 品質保証
**Related**: @RELEASE.md, @CONVENTIONS.md, @API_STABILITY.md

---

## Philosophy

**Core principle**: Implement functionality, then immediately generate tests.

---

## The Workflow

```
1. You: "Implement feature X"
   ↓
2. AI: Generates code
   ↓
3. You: "Create test cases for this feature"
   ↓
4. AI: Generates tests
   ↓
5. AI: "Should I run the tests?" (AI often asks)
   ↓
6. You: "Yes, run them"
   ↓
7. AI: Runs tests → Detects errors
   ↓
8. AI: Self-corrects (without human intervention)
   ↓
9. You: Verify final result only
```

---

## Why "Immediately" Matters

**❌ Batch testing (implementation first)**:
```
Implement A → Implement B → Implement C → Test all
  ↓
Problems:
- Hard to isolate which feature has bugs
- AI's context about A is stale
- Complex debugging session
```

**✅ Immediate testing**:
```
Implement A → Test A → Fix A (if needed) → Done
Implement B → Test B → Fix B (if needed) → Done
  ↓
Benefits:
- Easy isolation of problems
- AI's context is fresh
- Simple, focused fixes
```

---

## Tests as Objective Specifications

**Human explanation** (subjective):
```
"Create a user update function"
  ↓
AI interprets (may vary)
```

**Test cases** (objective):
```rust
assert_eq!(updated_user.name, "NewName");
assert!(updated_user.update_dt.is_some());
  ↓
AI sees exact success criteria (no ambiguity)
```

---

## AI Self-Correction Trigger

**Key insight**: Test generation triggers AI self-review.

```
Code generation only:
AI: "Implemented as specified" (no verification)

Code + Test generation:
AI: "Let me verify against tests... wait, there's a bug!"
  ↓
Self-correction without human prompting
```

---

## When Self-Correction Happens

**Your observation**: "Self-correction happens most often right after test implementation"

**Pattern**:
```
AI generates tests
  ↓
AI reviews own code against test expectations
  ↓
AI: "Oh, I forgot to update UPDATE_DT"
  ↓
AI: Corrects immediately
  ↓
You: (no intervention needed)
```

---

## AI's "Should I run tests?" Pattern

**Why AI asks**:
- Learned pattern: test generation → test execution
- Predicts next logical step
- Seeks confirmation

**Why you say "Yes"**:
- Triggers AI self-correction loop
- Minimizes human intervention
- Maximizes efficiency

---

## Not Always 100%, But Eventually Correct

**Your insight**: "AI output isn't always 100% on first try, but it often self-corrects"

```
Initial output: 80-90% correct (often has minor bugs)
  ↓
Test generation: AI reviews own code
  ↓
Self-correction: → 95-100% correct
  ↓
Test execution: Final verification
  ↓
Result: High quality without human debugging
```

**Key point**: Focus on results, not process perfection.

---

## Testing Levels (3-Tier Approach)

**Last Updated**: 2025-12-09
**Purpose**: Structured testing process to catch bugs at different levels

### Overview

```
1. Unit Tests (Automated)
   ├─ Backend: cargo test
   └─ Frontend: npm test

2. Integration Tests (Automated)
   └─ Full test suite: cargo test && npm test

3. Human Tests (Manual)
   ├─ UI/UX verification
   ├─ Real-world usage scenarios
   └─ Visual quality checks
```

---

### Level 1: Unit Tests

**Purpose**: Test individual components in isolation

**Backend (Rust)**:
```bash
cargo test
```

**What to verify**:
- ✅ Core parsing logic (`parse_input`, `generate_prompt`)
- ✅ Data structure correctness (`PromptPart`)
- ✅ Edge cases (empty input, special characters)

**Frontend (JavaScript)**:
```bash
cd res/tests && npm test
```

**What to verify**:
- ✅ Block definitions (noun, particle, verb blocks)
- ✅ DSL generation logic
- ✅ Event handling
- ✅ Mock-based component tests

**Success criteria**: 100% test pass rate

---

### Level 2: Integration Tests

**Purpose**: Test end-to-end functionality across components

```bash
# Run all tests together
cargo test && cd res/tests && npm test
```

**What to verify**:
- ✅ Backend + Frontend integration
- ✅ All 81 tests (26 backend + 55 frontend) passing
- ✅ No regressions in existing features

**Success criteria**:
- All tests pass
- Test count increases (never decreases)

---

### Level 3: Human Tests

**Purpose**: Verify real-world usability and visual quality

**When to run**:
- ✅ After implementing new UI features (blocks, categories)
- ✅ Before committing to version control
- ✅ Before creating a release

**How to run**:
```bash
cargo tauri dev
```

#### Human Test Checklist

**Phase 3 Verb Blocks Example**:

**1. Visual Verification**:
- [ ] "動詞" category appears in toolbox
- [ ] Category is collapsible
- [ ] Verb blocks have correct color (290 = red)
- [ ] 4 blocks visible: 分析して、要約して、翻訳して、カスタム

**2. Fixed Verb Blocks**:
- [ ] Drag "分析して" to workspace → Block appears
- [ ] Block displays "分析して" label
- [ ] Block has tooltip "動詞: 分析して"
- [ ] Repeat for "要約して" and "翻訳して"

**3. Custom Verb Block**:
- [ ] Drag custom verb block to workspace
- [ ] Default text is "作成して"
- [ ] Click text field → Can edit
- [ ] Change to "削除して" → Text updates
- [ ] Tooltip shows "カスタム動詞ブロック"

**4. Block Connectivity**:
- [ ] Verb blocks snap to previous block
- [ ] Verb blocks accept next block
- [ ] Connection points are visible

**5. Prompt Generation**:
- [ ] Create: [Noun: Document] → [Particle: を] → [Verb: 分析して]
- [ ] Preview shows: "Document (NOUN) を 分析して"
- [ ] Updates in real-time as blocks are added
- [ ] Spaces are correct (single space between tokens)

**6. Category Interaction**:
- [ ] Click "動詞" → Category expands
- [ ] Click again → Category collapses
- [ ] Other categories (名詞、助詞、その他) still work

**7. Edge Cases**:
- [ ] Empty custom verb field → Preview shows space only
- [ ] Multiple verb blocks in sequence → All generate correctly
- [ ] Delete verb block → Preview updates correctly
- [ ] Undo/Redo → Works with verb blocks

**8. Visual Quality**:
- [ ] Block colors are consistent
- [ ] Text is readable
- [ ] No visual glitches
- [ ] Responsive to window resize

**Success criteria**:
- All checklist items pass
- No visual bugs
- User experience feels natural

---

### Testing Process Flow

**Recommended order**:

```
Step 1: Implement feature
  ↓
Step 2: Add unit tests for feature
  ↓
Step 3: Run unit tests (Level 1)
  ↓ [PASS]
Step 4: Run integration tests (Level 2)
  ↓ [PASS]
Step 5: Run human tests (Level 3)
  ↓ [PASS]
Step 6: Commit & push
```

**If any level fails**:
- Fix immediately
- Re-run from failed level
- Do not proceed to next level until current level passes

---

### Why This Matters

**Problem without human testing**:
```
Unit tests pass ✅
Integration tests pass ✅
  ↓
Commit → Push → Deploy
  ↓
User opens app: "The new blocks don't appear!"
  ↓
Reason: Typo in toolbox configuration (not covered by unit tests)
```

**Solution with human testing**:
```
Unit tests pass ✅
Integration tests pass ✅
  ↓
Human test: "Wait, blocks don't appear in toolbox"
  ↓
Fix immediately (5 minutes)
  ↓
Re-test → Now works
  ↓
Commit → Push → Deploy
  ↓
User opens app: Everything works perfectly
```

**Time saved**: Hours of debugging after deployment → 5 minutes of verification before commit

---

## Real-World Example: Promps Phase 0-1 Testing

**Context**: After completing Phase 1 (Tauri + Blockly.js GUI), tests were implemented immediately before moving to Phase 2.

**Timeline**:
```
Day 1, Session 1:
  - Implemented Phase 1 features (Blockly integration, real-time preview)
  - Phase 1 marked as "complete" based on manual testing

Day 1, Session 2:
  - User: "Let's implement tests before Phase 2"
  - Created frontend tests: Jest + JSDOM (21 tests)
  - Created backend integration tests: Rust (11 tests)
  - Tests revealed critical design issue
```

**The Discovery**:
```
Test expectation:
  Input:  "_N:User _N:Order"
  Output: "User (NOUN) が Order (NOUN) を 作成"
           ↑               ↑
           Two separate noun markers expected

Actual output:
  "User Order (NOUN)"
   ↑
   Only ONE marker for entire sentence

Problem identified:
  Implementation was sentence-level, but requirement was token-level
```

**User's Real-World Example**:
```
Japanese: "_N:タコ と _N:イカ を 食べる"
Expected: "タコ (NOUN) と イカ (NOUN) を 食べる"
          ↑               ↑
          Each noun marked individually

Why this matters:
  - Multiple nouns in one sentence are common in Japanese
  - Each noun needs explicit marking for AI understanding
  - Sentence unity must be preserved (no double-space split)
```

**Refactoring Impact**:
```
Files modified:
  - src/lib.rs: Complete parse_input() refactoring
  - src/lib.rs: Modified generate_prompt() output format
  - src/commands.rs: Updated 11 integration tests
  - docs/*: Updated 6 documentation files

Code change magnitude:
  - Core algorithm: ~50 lines changed
  - Test expectations: ~20 lines updated
  - Documentation: ~30 sections updated

Time to fix:
  - Discovery to completion: ~45 minutes
  - All 42 tests passing at 100%
```

**What If Tests Were Deferred?**:
```
Without immediate testing:
  Phase 1 → Phase 2 (add more block types)
    ↓
  Phase 3 → Phase 4 (implement more features)
    ↓
  Phase N (finally add tests)
    ↓
  Discover sentence-level doesn't work
    ↓
  Must refactor ALL phases retroactively
    ↓
  Estimated impact: Days to weeks of rework

With immediate testing:
  Phase 1 → Tests (catch issue immediately)
    ↓
  Fix before Phase 2
    ↓
  Estimated impact: 45 minutes
    ↓
  Time saved: Multiple days of debugging and rework
```

**The Key Insight**:
```
User quote: "リアルタイムでテストケースを実装して良かったです。
             これで後続Phaseにて変なバグに悩まされずに済みます。
             これがテストケースを早いうちに実装するパワーとメリットですね。"

Translation: "It was good to implement test cases in real-time.
              This way we won't be troubled by weird bugs in subsequent phases.
              This is the power and merit of implementing test cases early."
```

**Quantitative Evidence**:
```
Test coverage achieved:
  - Backend: 21 tests (lib.rs + commands.rs)
  - Frontend: 21 tests (blockly-config.js + main.js)
  - Total: 42 tests at 100% passing

Types of bugs caught:
  1. Sentence-level vs token-level mismatch (critical)
  2. Output format inconsistency (moderate)
  3. Mock setup issues in frontend tests (minor)

Prevention value:
  - Phase 2+ development: Safe to proceed
  - Confidence level: High (42 tests covering core behavior)
  - Technical debt: Zero (fixed before it accumulated)
```

**Application to Other Projects**:
```
When to implement tests:
  ✅ Immediately after completing a phase
  ✅ Before adding features that depend on current implementation
  ✅ When manual testing shows "it works" but behavior isn't validated

What to test:
  ✅ Core algorithms (parse_input, generate_prompt)
  ✅ Integration points (Tauri commands, UI logic)
  ✅ Edge cases (multiple nouns, empty input, special characters)

Expected outcomes:
  ✅ Design issues discovered early (before they compound)
  ✅ Refactoring is surgical (not architectural)
  ✅ Development speed increases (no mystery bugs later)
```

**Comparison with KakeiBon**:
```
KakeiBon: 525 tests, 100% success
  - Strategy: Test after each feature
  - Result: Minimal specification changes, rare bugs

Promps: 42 tests (so far), 100% success
  - Strategy: Test after Phase 1 (before Phase 2)
  - Result: Critical design issue caught immediately
  - Time saved: Days of potential rework

Common pattern:
  Immediate testing → Early bug detection → Exponential time savings
```

---

**This document provides testing strategy guidance specifically for AI-assisted development workflows.**
