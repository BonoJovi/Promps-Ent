# ブランチ戦略

**最終更新**: 2025-12-08

---

## はじめに

Prompsプロジェクトでは、**Persistent Feature Branch（永続的フィーチャーブランチ）戦略**を採用しています。

この戦略は、Prompsの**レイヤードアーキテクチャ**と完璧に一致するように設計されており、従来のGit Flow等とは異なる特徴を持っています。

---

## なぜこの戦略を採用したのか

### 背景: Prompsのレイヤードアーキテクチャ

Prompsは、Phase（フェーズ）と呼ばれるレイヤー構造で設計されています：

```
Phase N+2: Layout customization（レイアウトカスタマイズ）
  ↑
Phase N+1: File I/O（プロジェクトファイルの保存・読み込み）
  ↑
Phase N: Logic check（構文検証）
  ↑
Phase 2: Particle blocks（助詞ブロック）
  ↑
Phase 1: GUI (Blockly.js)（グラフィカルUI）
  ↑
Phase 0: Core parsing（DSL → Natural Language変換）
```

各Phaseは**独立したモジュール**として機能し、下位レイヤーを変更することなく上位レイヤーを追加できる設計になっています（**Non-Breaking Extension Principle**: 非破壊拡張原則）。

この設計哲学については、`.ai-context/core/DESIGN_PHILOSOPHY.md` で詳しく説明されています。

### 従来のブランチ戦略の問題点

一般的なFeature Branchワークフローでは：

1. Feature開発開始 → `feature/add-particle-blocks` 作成
2. 開発完了 → `dev` にマージ
3. **ブランチ削除** ← ここが問題

**何が問題か？**

3ヶ月後、Phase 2（Particle blocks）にバグが見つかったとします。このとき、修正はどこで行うべきでしょうか？

- `dev` で直接修正？ → どのPhaseの変更か不明確になる
- 新しい `fix/particle-bug` を作成？ → Phase 2専用の作業場所がない

結果として、**レイヤーの独立性が失われます**。

### Persistent Feature Branchの解決策

```
dev (統合ブランチ)
  ↑ merge
  ├── feature/phase-0 (永続)
  ├── feature/phase-1 (永続)
  ├── feature/phase-2 (永続) ← Phase 2専用の開発場所
  ├── feature/phase-3 (永続)
  └── feature/phase-n (永続)
```

**Phase 2のバグ修正時**:

1. `feature/phase-2` ブランチで修正（Phase 2専用の場所で作業）
2. テスト実行（42+ tests @ 100%）
3. `dev` にマージ
4. **`feature/phase-2` は削除しない**（次の修正に備える）

**メリット**:

- Phase 2の変更履歴が `feature/phase-2` に集約される
- 他のPhaseに影響を与えない
- レイヤーの独立性を完全に保持できる
- どのPhaseの変更か一目瞭然

---

## ブランチ構造

### メインブランチ

**`dev`**: 統合ブランチ

- 常にリリース可能な状態を保つ
- すべてのテストが通っていることが必須
- リリースタグ（`v0.0.1`, `v0.0.2`, ...）はここから作成

### フィーチャーブランチ（永続）

各Phaseに対応するブランチを作成し、**削除しません**：

| ブランチ名 | 対応Phase | 主な変更対象 | 状態 |
|-----------|----------|------------|------|
| `feature/phase-0` | Phase 0 Core | `src/lib.rs` | 完了 |
| `feature/phase-1` | Phase 1 GUI | `res/html/`, `res/js/main.js`, `res/js/blockly-config.js` | 完了 |
| `feature/phase-2` | Phase 2 Particle Blocks | `res/js/blockly-config.js` (particle section) | 完了 |
| `feature/phase-3` | Phase 3 Verb Blocks | `res/js/blockly-config.js` (verb section) | 予定 |
| `feature/phase-n` | Phase N Logic Check | `src/modules/validation.rs` (新規) | 予定 |
| `feature/phase-n1` | Phase N+1 File I/O | `src/modules/serialization.rs` (新規) | 予定 |
| `feature/phase-n2` | Phase N+2 Layout | `res/js/layout-config.js` (新規) | 予定 |

---

## 開発ワークフロー

### 新しいPhaseを開発する場合

**例: Phase 3（Verb blocks）の開発**

#### 1. ブランチ作成

```bash
git checkout dev
git pull --rebase origin dev
git checkout -b feature/phase-3
```

#### 2. 実装

Phase 3の変更対象：

- `res/js/blockly-config.js` にverb blocks追加
- `res/tests/verb-blocks.test.js` 追加（新規テストファイル）
- 既存の42 testsは変更しない（Phase 0-2のテストは触らない）

**重要**: Phase 3は独立したセクション/ファイルを変更するため、他のPhaseに影響を与えません。

#### 3. テスト

```bash
cargo test && cd res/tests && npm test && cd ../..
```

すべてのテスト（既存42 + 新規15 = 57 tests）が100%通ることを確認します。

#### 4. コミット・プッシュ

```bash
git add .
git commit -m "feat(phase-3): add verb block types with 15 tests"
git push origin feature/phase-3
```

コミットメッセージは英語で記述します（`.ai-context/development/CONVENTIONS.md` 参照）。

#### 5. devにマージ（Phase 3完了時）

```bash
git checkout dev
git pull --rebase origin dev
git merge --no-ff feature/phase-3
git push origin dev
```

`--no-ff` フラグを使用することで、マージコミットが作成され、Phase 3の変更履歴が明確になります。

#### 6. ブランチは削除しない

```bash
# ❌ やらないこと
git branch -d feature/phase-3
git push origin --delete feature/phase-3

# ✅ やること
git push origin feature/phase-3  # リモートにも保存しておく
```

**理由**: 将来Phase 3にバグが見つかったとき、`feature/phase-3` で修正できるようにするため。

---

### 既存Phaseのバグを修正する場合

**例: Phase 2（Particle blocks）にバグ発見**

#### 1. Phase 2ブランチで修正

```bash
git checkout feature/phase-2
git pull --rebase origin dev  # devの最新変更を取り込む
```

#### 2. 修正実装

- `res/js/blockly-config.js` のparticle blocksセクションのみ修正
- 必要に応じてテスト追加・更新

**重要**: Phase 2のコードのみを変更し、他のPhaseには触れません。

#### 3. テスト

```bash
cargo test && cd res/tests && npm test
```

#### 4. コミット

```bash
git commit -m "fix(phase-2): fix particle block rendering issue"
```

#### 5. devにマージ

```bash
git checkout dev
git merge --no-ff feature/phase-2
git push origin dev
```

#### 6. Phase 2ブランチを更新

```bash
git push origin feature/phase-2  # 次の修正に備える
```

---

## マージコンフリクトについて

### コンフリクトが起きにくい理由

Prompsのブランチ戦略では、**マージコンフリクトが起きにくい**設計になっています。

#### 1. ファイルレベルの分離

各Phaseは異なるファイルを変更します：

```
Phase 0: src/lib.rs (コアパース処理)
Phase 1: res/html/, res/js/main.js (GUI基盤)
Phase N: src/modules/validation.rs (新規ファイル)

→ 異なるファイル = コンフリクトなし
```

#### 2. 関数レベルの独立性

各Phaseは下位Phaseの関数を**呼び出すのみ**で、**変更しません**。

```rust
// Phase 0: Core API
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // Phase 0のロジック
}

// Phase N: Validation layer（Phase 0を呼ぶだけ、変更しない）
pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ValidationError> {
    let parts = parse_input(input);  // Phase 0 APIを使用
    validate_pattern(&parts)?;        // Phase N独自の検証を追加
    Ok(parts)
}
```

この原則については、`API_STABILITY.md` で詳しく説明されています。

#### 3. 同一ファイル内でもセクション分離

`blockly-config.js` のような共有ファイルでも、各Phaseは異なるセクションを変更します：

```javascript
// res/js/blockly-config.js

// Phase 1: Basic blocks
Blockly.Blocks['noun_block'] = {
    init: function() { ... }
};

// Phase 2: Particle blocks
Blockly.Blocks['particle_ga'] = {
    init: function() { ... }
};

// Phase 3: Verb blocks
Blockly.Blocks['verb_create'] = {
    init: function() { ... }
};
```

→ 異なるセクション = コンフリクトなし

---

### コンフリクトが起きる可能性

**主なケース: API変更**

Phase 0の関数シグネチャを変更した場合、上位Phaseに影響します。

**例**:

```rust
// Phase 0で関数シグネチャを変更
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>

// Phase Nで影響が出る
let parts = parse_input(input);  // ← 引数が足りない！
```

**対策**: API安定性ポリシー（`API_STABILITY.md` 参照）

- Phase 0のAPIは変更しない
- 新機能は新関数として追加する
- Deprecation期間を設ける（必要な場合）

---

## よくある質問

### Q1: ブランチが増えすぎませんか？

**A**: Prompsは**Phase数が有限**（5-10個程度）です。

Phaseは無限に増えるわけではなく、設計段階で決まっています：

| Phase | 目的 | ブランチ |
|-------|-----|---------|
| Phase 0 | Core parsing | feature/phase-0 |
| Phase 1 | GUI foundation | feature/phase-1 |
| Phase 2 | Particle blocks | feature/phase-2 |
| Phase 3 | Verb blocks | feature/phase-3 |
| Phase N | Logic check | feature/phase-n |
| Phase N+1 | File I/O | feature/phase-n1 |
| Phase N+2 | Layout | feature/phase-n2 |

→ 最大でも7-10個のブランチ（管理可能な範囲）

### Q2: なぜブランチを削除しないのですか？

**A**: 各Phaseは**モジュール**だからです。

ソフトウェアのモジュールは、一度作ったら削除されず、継続的にメンテナンスされます。ブランチもモジュールと同じように扱います。

**類推**:

```
npm パッケージ: 一度公開したら、継続的にメンテナンス
Rust crate: 一度公開したら、継続的にメンテナンス

Promps Phase: 一度実装したら、継続的にメンテナンス
  ↓
feature/phase-N ブランチ: 削除せず、継続的に使用
```

### Q3: 従来のGit Flowとの違いは？

| 項目 | Git Flow | Promps戦略 |
|-----|---------|-----------|
| Feature branch | 削除する | 削除しない（永続） |
| 目的 | 機能開発の一時的な場所 | モジュールの永続的な管理場所 |
| マージ後 | ブランチ削除 | ブランチ保持 |
| ブランチ数 | 変動的（増減を繰り返す） | 固定的（Phase数に対応） |
| 命名 | 機能名（`feature/add-login`） | Phase名（`feature/phase-0`） |

### Q4: 緊急のバグ修正はどうしますか？

**Phase特定のバグ**: 該当するPhaseブランチで修正

```bash
git checkout feature/phase-2
# ... 修正 ...
git checkout dev
git merge --no-ff feature/phase-2
```

**Phase横断的なバグ**: 一時的な `fix/` ブランチを使用

```bash
git checkout -b fix/critical-security-issue dev
# ... 修正 ...
git checkout dev
git merge --no-ff fix/critical-security-issue
git branch -d fix/critical-security-issue  # ← これは削除してOK
```

---

## ブランチ命名規則

### 永続的ブランチ（削除しない）

```
feature/phase-0      # Phase 0 Core
feature/phase-1      # Phase 1 GUI
feature/phase-2      # Phase 2 Particle Blocks
feature/phase-3      # Phase 3 Verb Blocks
feature/phase-n      # Phase N Logic Check
feature/phase-n1     # Phase N+1 File I/O
feature/phase-n2     # Phase N+2 Layout
```

### 一時的ブランチ（マージ後削除）

```
fix/critical-bug         # 緊急バグ修正（Phase横断的）
docs/update-readme       # ドキュメント更新のみ
chore/update-dependencies # 依存関係の更新
```

---

## GitHub Projectsとの連携

GitHub Projectsを使用してPhaseの進捗を管理します：

```
Feature (GitHub Projects):
  Title: "Phase 3: Add Verb Block Types"
  Branch: feature/phase-3
  Status: Todo → In Progress → In Review → Done

Issue (GitHub Projects):
  Title: "Particle block rendering issue in Phase 2"
  Branch: feature/phase-2（またはfix/particle-rendering）
  Labels: bug, phase-2
```

詳細は `.ai-context/workflows/GITHUB_PROJECTS.md` を参照してください。

---

## CI/CD

### Feature Branchでのテスト

Feature branchにpushすると、自動的にテストが実行されます：

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

### リリースはdevからのみ

リリースタグをpushすると、devブランチから自動的にビルド・リリースされます：

```yaml
# .github/workflows/release.yml
on:
  push:
    tags:
      - 'v*'
```

詳細は `.ai-context/workflows/RELEASE_PROCESS.md` を参照してください。

---

## この戦略が成立する理由

### 1. Phase数が有限

Prompsは**ミニマル実装**を目指しており、Phase数は5-10個程度に収まります。

無限にPhaseが増えることはありません。

### 2. レイヤードアーキテクチャ

各Phaseは独立したレイヤーとして機能し、下位レイヤーを変更せずに上位レイヤーを追加できます（**Non-Breaking Extension Principle**）。

### 3. 明確なモジュール境界

```
Phase 0: Core parsing（DSL → NL変換）
Phase 1: GUI foundation（Blockly.js統合）
Phase 2+: Block types（名詞、助詞、動詞、etc.）
Phase N: Validation（構文検証）
Phase N+1: File I/O（プロジェクト保存）
```

各Phaseの責務が明確に分かれています。

### 4. ファイル変更の局所性

各Phaseは異なるファイル、または同一ファイル内の異なるセクションを変更するため、コンフリクトが起きにくい設計になっています。

---

## 参考資料

### プロジェクト内ドキュメント

- **API_STABILITY.md**: API変更ルール（コンフリクト防止策）
- **DESIGN_PHILOSOPHY.md**: レイヤードアーキテクチャの詳細
- **CONVENTIONS.md**: コーディング規約
- **GITHUB_PROJECTS.md**: Issue/Feature管理方法
- **RELEASE_PROCESS.md**: リリース手順

### AI向けドキュメント

このドキュメントのAI向け版（簡潔なルールベース）は以下にあります：

- `.ai-context/workflows/BRANCHING_STRATEGY.md`

---

## 質問・フィードバック

この戦略について質問やフィードバックがあれば、GitHubのIssueで気軽にお知らせください！

---

**最終更新**: 2025-12-08
