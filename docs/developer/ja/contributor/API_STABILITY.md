# API安定性ポリシー

**最終更新**: 2025-12-08

---

## はじめに

このドキュメントでは、Prompsプロジェクトにおける**API安定性ポリシー**について説明します。

API安定性ポリシーは、**マージコンフリクトを防ぐ**ための重要なルールであり、Prompsの**Persistent Feature Branch戦略**と密接に関連しています。

---

## なぜAPI安定性が重要なのか

### 背景: レイヤードアーキテクチャ

Prompsは、Phase（フェーズ）と呼ばれるレイヤー構造で設計されています：

```
Phase N: Validation Layer
  ↓ 依存（呼び出すのみ）
Phase 0: Core Parsing Layer
```

上位のPhase（Phase N）は、下位のPhase（Phase 0）が提供するAPIを使用します。

### 問題: API変更が引き起こすコンフリクト

もし、Phase 0のAPI（例: `parse_input()` 関数）を変更したらどうなるでしょうか？

```rust
// Phase 0 (feature/phase-0) で関数を変更
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓ シグネチャを変更
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>
```

```rust
// Phase N (feature/phase-n) で影響が出る
pub fn validate_pattern(input: &str) -> Result<()> {
    let parts = parse_input(input);  // ← コンパイルエラー！引数が足りない
    // ...
}
```

**影響範囲**:
- Phase 0を変更しただけなのに、Phase N, N+1, N+2... すべてが壊れる
- すべてのfeature branchで修正が必要
- マージコンフリクトが多発

### 解決策: API安定性ポリシー

**原則**: **Phase 0のAPIは不変**

一度公開したAPIは変更せず、新機能は新しいAPIとして追加します。

```rust
// ✅ 良い例: 既存APIを維持し、新APIを追加
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存の実装（変更しない）
}

pub fn parse_input_with_options(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // 新しい実装
}
```

この方法なら、既存のPhase N, N+1, N+2はそのまま動作し、コンフリクトが発生しません。

---

## API安定性のルール

### ルール1: 既存APIを変更しない

**禁止事項**:

```rust
// ❌ 悪い例: 関数シグネチャの変更
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>

// ❌ 悪い例: 関数名の変更
pub fn parse_input(...) -> ...
    ↓
pub fn parse_tokens(...) -> ...

// ❌ 悪い例: 戻り値の型変更
pub fn parse_input(...) -> Vec<PromptPart>
    ↓
pub fn parse_input(...) -> Result<Vec<PromptPart>, ParseError>
```

**許可される方法**:

```rust
// ✅ 良い例: 既存APIを維持し、新APIを追加
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存の実装（そのまま）
}

pub fn parse_input_v2(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // 新しい実装
}

// または

pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ParseError> {
    // 新しい実装（エラー処理付き）
}
```

---

### ルール2: 既存データ構造を変更しない

**禁止事項**:

```rust
// ❌ 悪い例: フィールドの削除・名称変更
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}
    ↓
pub struct PromptPart {
    pub part_type: PartType,  // is_noun を置き換え
    pub text: String,
}
```

この変更は、以下のコードをすべて壊します：

```rust
// Phase Nのコード
if part.is_noun {  // ← コンパイルエラー！フィールドが存在しない
    // ...
}
```

**許可される方法**:

```rust
// ✅ 良い例: フィールドを追加（既存フィールドは維持）
pub struct PromptPart {
    pub is_noun: bool,           // 既存フィールド（維持）
    pub text: String,            // 既存フィールド（維持）
    pub metadata: Option<Metadata>,  // 新しいフィールド（Option型）
}
```

新しいフィールドを `Option<T>` 型にすることで、既存コードへの影響を最小限に抑えられます。

---

### ルール3: 上位レイヤーは下位レイヤーを変更しない

**各Phaseの責務**:

```
Phase N (feature/phase-n):
  ✅ parse_input() を呼び出す
  ✅ PromptPart を使用する
  ❌ parse_input() の実装を変更する
  ❌ PromptPart の定義を変更する
```

**ファイルレベルのルール**:

```
feature/phase-n での開発:
  ✅ src/modules/validation.rs を作成（新規ファイル）
  ✅ src/lib.rs をインポート（エクスポートを使用）
  ❌ src/lib.rs を編集（Phase 0のコードを変更）
```

**理由**:

Phase 0は**すべてのPhaseの基盤**です。基盤を変更すると、すべての上位レイヤーに影響が及びます。

---

## コンフリクトのパターンと対策

### パターン1: 関数シグネチャの変更

**シナリオ**:

```rust
// Phase 0 (feature/phase-0) で変更
pub fn parse_input(input: &str) -> Vec<PromptPart>
    ↓
pub fn parse_input(input: &str, options: ParseOptions) -> Vec<PromptPart>

// Phase N (feature/phase-n) で壊れる
let parts = parse_input(input);  // ← コンパイルエラー: 引数が足りない
```

**影響**: すべての上位レイヤーが壊れる

**対策**: 既存シグネチャを変更せず、新関数を追加する

```rust
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存実装を維持
}

pub fn parse_input_with_options(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // 新しい実装
}
```

---

### パターン2: 関数名の変更

**シナリオ**:

```rust
// Phase 0 で関数名を変更
pub fn parse_input(...) -> ...
    ↓
pub fn parse_tokens(...) -> ...

// Phase N で壊れる
let parts = parse_input(input);  // ← コンパイルエラー: 関数が見つからない
```

**影響**: すべての呼び出し箇所が壊れる

**対策**: 古い名前を維持し、新しい名前を追加（必要に応じてエイリアス）

```rust
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存実装
}

// エイリアス（将来的に parse_input を deprecated にする場合）
pub fn parse_tokens(input: &str) -> Vec<PromptPart> {
    parse_input(input)  // 内部的に既存関数を呼ぶ
}
```

---

### パターン3: 構造体フィールドの変更

**シナリオ**:

```rust
// Phase 0 で構造体を変更
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}
    ↓
pub struct PromptPart {
    pub part_type: PartType,  // is_noun を置き換え
    pub text: String,
}

// Phase N で壊れる
if part.is_noun { ... }  // ← コンパイルエラー: フィールドが存在しない
```

**影響**: すべてのフィールドアクセスが壊れる

**対策**: 新しいフィールドを追加し、既存フィールドは削除しない

```rust
pub struct PromptPart {
    pub is_noun: bool,           // 既存フィールド（維持）
    pub text: String,            // 既存フィールド（維持）
    pub part_type: Option<PartType>,  // 新しいフィールド
}
```

---

## やむを得ずAPIを変更する必要がある場合

もし、どうしてもAPIを変更する必要がある場合は、**Deprecation（非推奨化）ワークフロー**を使用します。

### Step 1: 非推奨マークを付ける

```rust
// Phase 0
#[deprecated(since = "0.1.0", note = "Use parse_input_v2 instead")]
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存実装を維持（まだ削除しない）
}

pub fn parse_input_v2(input: &str, options: ParseOptions) -> Vec<PromptPart> {
    // 新しい実装
}
```

Rust コンパイラは、非推奨APIを使用している箇所で警告を出します：

```
warning: use of deprecated function `parse_input`: Use parse_input_v2 instead
```

### Step 2: 上位レイヤーを更新

すべてのfeature branchで、古いAPIから新しいAPIに移行します：

```rust
// Phase N (feature/phase-n)
// 古いAPI
let parts = parse_input(input);
    ↓
// 新しいAPI
let parts = parse_input_v2(input, ParseOptions::default());
```

### Step 3: すべてのレイヤーが移行するまで待つ

すべてのfeature branchを確認します：

```bash
git checkout feature/phase-1 && git grep "parse_input("
git checkout feature/phase-2 && git grep "parse_input("
git checkout feature/phase-n && git grep "parse_input("
```

古いAPIの使用箇所が0になるまで待ちます。

### Step 4: 非推奨APIを削除（次のメジャーバージョン）

v1.0.0など、メジャーバージョンアップ時に非推奨APIを削除します：

```rust
// v1.0.0: 非推奨APIを削除
// pub fn parse_input(...) -> ...  ← この行を削除

pub fn parse_input_v2(...) -> ...  // 新しいAPIを維持
```

---

## レイヤー化されたAPI設計

Prompsは**Dependency Inversion Principle（依存性逆転の原則）**に従っています：

```
┌─────────────────────────────────────┐
│   Phase N: Validation Layer         │
│   - parse_input_checked()           │  ← Phase N のAPI
│   - validate_pattern()              │
└────────────┬────────────────────────┘
             │ 依存（呼び出すのみ、変更しない）
             ↓
┌─────────────────────────────────────┐
│   Phase 0: Core Parsing Layer       │
│   - parse_input()                   │  ← 不変のAPI
│   - generate_prompt()               │
└─────────────────────────────────────┘
```

**特徴**:

- 上位レイヤーは下位レイヤーに依存する
- 下位レイヤーは上位レイヤーに依存しない
- 下位レイヤーのAPIは安定している
- 上位レイヤーのAPIは自由に変更できる

---

## API安定性レベル

各Phaseには、異なる安定性レベルがあります：

| レイヤー | 安定性レベル | 変更ポリシー |
|---------|------------|-------------|
| Phase 0 | **不変** | 既存APIは絶対に変更しない |
| Phase 1 | 安定 | v1.0.0以降は変更を避ける |
| Phase 2+ | 半安定 | 非推奨化を経て変更可能 |
| Phase N+ | 不安定 | 自由に変更可能（まだリリースされていない） |

**ガイドライン**:

- **Phase 0**: 最も重要。すべてのPhaseの基盤。
- **Phase 1**: GUIの基盤。Phase 2+が依存。
- **Phase 2+**: ブロックタイプ。比較的独立しているが、Phase Nが依存する可能性。
- **Phase N+**: まだリリースされていないため、自由に実験可能。

---

## API互換性のテスト

### コンパイル時チェック

Rustの型システムは、APIの非互換性を自動的に検出します：

```rust
// Phase 0のAPIが変更された場合、上位レイヤーはコンパイルに失敗
let parts = parse_input(input);  // ← シグネチャが変わるとコンパイルエラー
```

これは**安全装置**として機能します。

### CI/CDでのクロスチェック

GitHub Actionsを使用して、feature branchがdevと互換性があるかチェックします：

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

      # devをマージしてコンパイルできるかチェック
      - name: Check compatibility with dev
        run: |
          git fetch origin dev
          git merge origin/dev --no-commit --no-ff || true
          cargo check --all-features

      # 失敗したら通知
      - name: Notify on incompatibility
        if: failure()
        run: echo "⚠️ API incompatibility detected"
```

---

## 実例: 検証オプションの追加

### 要件

Phase Nで、検証の厳格度を設定できるようにしたい。

### ❌ 間違ったアプローチ（APIを壊す）

```rust
// Phase 0を変更
pub fn parse_input(input: &str, strict: bool) -> Vec<PromptPart> {
    // ...
}

// Phase 1, 2, 3がすべて壊れる
let parts = parse_input(input);  // ← コンパイルエラー: 引数が足りない
```

この方法では、Phase 1, 2, 3のすべてのfeature branchで修正が必要になります。

### ✅ 正しいアプローチ（新しい関数を追加）

```rust
// Phase 0: 既存APIを維持
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    // 既存の実装（変更しない）
}

// Phase N: 新しい関数を追加
pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ValidationError> {
    let parts = parse_input(input);  // Phase 0のAPIを再利用
    validate_pattern(&parts)?;        // Phase Nの検証を追加
    Ok(parts)
}
```

この方法なら：

- Phase 1, 2, 3は影響を受けない（既存のまま動作）
- Phase Nだけが新しいAPIを使用
- コンフリクトなし

---

## まとめ

### 重要なポイント

1. **Phase 0のAPIは不変**
   - 既存の関数シグネチャを変更しない
   - 既存の構造体フィールドを削除しない
   - 新機能は新しいAPIとして追加

2. **上位レイヤーは下位レイヤーを変更しない**
   - Phase Nは Phase 0のコードを変更しない
   - Phase 0のAPIを呼び出すのみ

3. **やむを得ない場合はDeprecation Workflow**
   - 非推奨マークを付ける
   - すべてのレイヤーを移行
   - メジャーバージョンアップで削除

### この戦略の利点

- **マージコンフリクトが劇的に減少**
- **各Phaseが独立して開発できる**
- **変更の影響範囲が明確**
- **Persistent Feature Branch戦略と完璧に一致**

---

## 参考資料

### プロジェクト内ドキュメント

- **BRANCHING_STRATEGY.md**: Persistent Feature Branch戦略
- **DESIGN_PHILOSOPHY.md**: レイヤードアーキテクチャの詳細
- **CONVENTIONS.md**: コーディング規約

### AI向けドキュメント

このドキュメントのAI向け版（簡潔なルールベース）は以下にあります：

- `.ai-context/development/API_STABILITY.md`

---

## 質問・フィードバック

API安定性ポリシーについて質問やフィードバックがあれば、GitHubのIssueで気軽にお知らせください！

---

**最終更新**: 2025-12-08
