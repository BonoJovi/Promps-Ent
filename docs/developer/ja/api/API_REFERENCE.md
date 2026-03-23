# Promps API リファレンス

**バージョン**: v0.0.3-2 (Phase 3-2)
**最終更新**: 2026-01-19 (JST)
**対象**: Promps コアライブラリと統合する開発者

---

## 概要

このドキュメントは、Promps Phase 0 コアライブラリの完全な API リファレンスを提供します。ライブラリは以下で使用できるパーシングとプロンプト生成機能を公開します：

- CLI アプリケーション
- GUI アプリケーション（Tauri）
- 外部ツール
- テストフレームワーク

---

## ライブラリモジュール

### コアモジュール: `promps` (src/lib.rs)

**インポート**:
```rust
use promps::{PromptPart, parse_input, generate_prompt};
```

---

## データ型

### `PromptPart`

型アノテーション付きの単一の意味的単位（文/節）を表現します。

**定義**:
```rust
#[derive(Debug, Clone)]
pub struct PromptPart {
    pub is_noun: bool,   // 型アノテーション（名詞 or その他）
    pub text: String,    // 正規化されたテキスト（プレフィックス除去済み）
}
```

**フィールド**:

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `is_noun` | `bool` | 文が `_N:` マーカーを含む場合 `true`、それ以外は `false` |
| `text` | `String` | 全ての `_N:` プレフィックスが除去された文のテキスト |

**トレイト**:
- `Debug`: `{:?}` で出力可能
- `Clone`: `.clone()` でクローン可能

**例**:
```rust
let part = PromptPart {
    is_noun: true,
    text: "ユーザー が 注文 を 作成".to_string(),
};

println!("{:?}", part);
// 出力: PromptPart { is_noun: true, text: "ユーザー が 注文 を 作成" }
```

---

## 公開関数

### `parse_input`

生の DSL 入力テキストを構造化された `PromptPart` ベクターにパースします。

**シグネチャ**:
```rust
pub fn parse_input(input: &str) -> Vec<PromptPart>
```

**パラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `input` | `&str` | スペース区切りトークンを持つ生の DSL 入力テキスト |

**戻り値**:
- `Vec<PromptPart>`: パースされたプロンプトパーツのベクター

**パーシングルール**:
1. **行分割**: 改行（`\n`）で分割
2. **文分割**: ダブルスペース（またはそれ以上）で分割
3. **トークン分割**: シングルスペースで分割
4. **名詞検出**: 任意のトークンで `_N:` プレフィックスをスキャン
5. **テキスト再構築**: プレフィックスを除去して文を再構築

**エッジケース**:

| 入力 | 結果 | 備考 |
|------|------|------|
| 空文字列 | `vec![]` | 空のベクターを返す |
| 空白のみ | `vec![]` | 空白はトリムされ無視される |
| 空行 | スキップ | 空行は無視される |
| 複数スペース | 文区切り | 2+ スペース = 文の境界 |

**例 1: 基本的な使用**
```rust
let input = "_N:ユーザー が _N:注文 を 作成  説明文です";
let parts = parse_input(input);

assert_eq!(parts.len(), 2);
assert_eq!(parts[0].is_noun, true);
assert_eq!(parts[0].text, "ユーザー が 注文 を 作成");
assert_eq!(parts[1].is_noun, false);
assert_eq!(parts[1].text, "説明文です");
```

**例 2: 複数行入力**
```rust
let input = "_N:機能名
説明文です
_N:対象ユーザー  開発者向け";

let parts = parse_input(input);

assert_eq!(parts.len(), 3);
// パート 1: 機能名 (NOUN)
// パート 2: 説明文です
// パート 3: 対象ユーザー 開発者向け (2 文を持つ NOUN)
```

**例 3: 空入力**
```rust
let input = "";
let parts = parse_input(input);
assert_eq!(parts.len(), 0);
```

**例 4: 文中の名詞**
```rust
let input = "これは _N:変数 を 使います";
let parts = parse_input(input);

assert_eq!(parts.len(), 1);
assert_eq!(parts[0].is_noun, true);
assert_eq!(parts[0].text, "これは 変数 を 使います");
```

**時間計算量**: O(m × k)、m = トークン数、k = 平均トークン長

**メモリ割り当て**:
- 各 `PromptPart` に新しい `String` を割り当て
- 合計: O(n)、n = 入力の総文字数

---

### `generate_prompt`

`PromptPart` ベクターからフォーマットされたプロンプト文字列を生成します。

**シグネチャ**:
```rust
pub fn generate_prompt(parts: &[PromptPart]) -> String
```

**パラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `parts` | `&[PromptPart]` | `PromptPart` インスタンスのスライス |

**戻り値**:
- `String`: `(NOUN)` アノテーション付きのフォーマットされたプロンプト

**出力フォーマット**:
```
{text} (NOUN)\n    ← is_noun == true の場合
{text}\n            ← is_noun == false の場合
```

**エッジケース**:

| 入力 | 出力 | 備考 |
|------|------|------|
| 空スライス | `""` | 空文字列 |
| 全て名詞 | 全行が `(NOUN)` で終わる | 全パートが `is_noun == true` |
| 名詞なし | `(NOUN)` アノテーションなし | 全パートが `is_noun == false` |

**例 1: 混合型**
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

**例 2: 空ベクター**
```rust
let parts = vec![];
let prompt = generate_prompt(&parts);
assert_eq!(prompt, "");
```

**例 3: 全て名詞**
```rust
let parts = vec![
    PromptPart { is_noun: true, text: "A".to_string() },
    PromptPart { is_noun: true, text: "B".to_string() },
];

let prompt = generate_prompt(&parts);
assert_eq!(prompt, "A (NOUN)\nB (NOUN)\n");
```

**時間計算量**: O(p × t)、p = パーツ数、t = 平均テキスト長

**メモリ割り当て**:
- 単一 `String` 割り当て（段階的に拡張）
- 合計: O(n)、n = 総出力文字数

---

## PromptPart メソッド

### `PromptPart::from_token`

単一のトークンを `PromptPart` にパースします。

**シグネチャ**:
```rust
impl PromptPart {
    pub fn from_token(token: &str) -> Self
}
```

**パラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `token` | `&str` | 単一トークン文字列（`_N:` プレフィックスを含む可能性あり） |

**戻り値**:
- `PromptPart`: パースされたインスタンス

**動作**:
1. トークンが `_N:` で始まるかチェック
2. はいの場合: プレフィックスを除去、`is_noun = true` を設定
3. いいえの場合: トークンをそのまま使用、`is_noun = false` を設定

**例 1: 名詞トークン**
```rust
let part = PromptPart::from_token("_N:データベース");

assert_eq!(part.is_noun, true);
assert_eq!(part.text, "データベース");
```

**例 2: 非名詞トークン**
```rust
let part = PromptPart::from_token("を作成");

assert_eq!(part.is_noun, false);
assert_eq!(part.text, "を作成");
```

**例 3: エッジケース - 空のプレフィックス**
```rust
let part = PromptPart::from_token("_N:");

assert_eq!(part.is_noun, true);
assert_eq!(part.text, "");
```

**使用上の注意**: このメソッドは主に `parse_input()` によって内部的に使用されます。直接使用はサポートされていますが、典型的なワークフローでは一般的ではありません。

**時間計算量**: O(n)、n = トークン長

**メモリ割り当て**: 新しい `String` を割り当て（O(n)）

---

## Tauri コマンド

### モジュール: `commands` (src/commands.rs)

フロントエンド-バックエンド通信用の Tauri 固有コマンド。

**インポート**:
```rust
use commands::{generate_prompt_from_text, greet};
```

---

### `generate_prompt_from_text`

`parse_input()` + `generate_prompt()` の Tauri コマンドラッパー。

**シグネチャ**:
```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String
```

**パラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `input` | `String` | 生の DSL テキスト（所有） |

**戻り値**:
- `String`: フォーマットされたプロンプト文字列

**フロントエンド使用（JavaScript）**:
```javascript
import { invoke } from '@tauri-apps/api/tauri';

const input = "_N:ユーザー が _N:注文 を 作成";
const prompt = await invoke('generate_prompt_from_text', { input });

console.log(prompt);
// 出力:
// ユーザー が 注文 を 作成 (NOUN)
```

**バックエンド実装**:
```rust
pub fn generate_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt(&parts)
}
```

**エラーハンドリング**: なし（空でも常に文字列を返す）

---

### `greet`

Tauri 通信テスト用のヘルスチェックコマンド。

**シグネチャ**:
```rust
#[tauri::command]
pub fn greet(name: String) -> String
```

**パラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `name` | `String` | 挨拶する名前 |

**戻り値**:
- `String`: 挨拶メッセージ

**フロントエンド使用（JavaScript）**:
```javascript
const message = await invoke('greet', { name: 'World' });
console.log(message);
// 出力: "Hello, World! Welcome to Promps."
```

**目的**: Tauri IPC（プロセス間通信）が正しく動作していることを確認する。

---

## 使用パターン

### パターン 1: CLI 統合

```rust
use std::io::{self, Read};
use promps::{parse_input, generate_prompt};

fn main() {
    // stdin から読み込み
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    // パースと生成
    let parts = parse_input(&input);
    let prompt = generate_prompt(&parts);

    // stdout に出力
    println!("{}", prompt);
}
```

---

### パターン 2: GUI 統合（Tauri）

**バックエンド (src/commands.rs)**:
```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt(&parts)
}
```

**フロントエンド (JavaScript)**:
```javascript
async function generatePrompt() {
    const input = document.getElementById('input').value;
    const output = await invoke('generate_prompt_from_text', { input });
    document.getElementById('output').textContent = output;
}
```

---

### パターン 3: バッチ処理

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

### パターン 4: 中間処理

```rust
use promps::{parse_input, generate_prompt, PromptPart};

fn process_with_custom_logic(input: &str) -> String {
    let mut parts = parse_input(input);

    // カスタム処理: メタデータを追加
    for part in &mut parts {
        if part.is_noun {
            part.text = format!("[ENTITY] {}", part.text);
        }
    }

    // 変更されたプロンプトを生成
    generate_prompt(&parts)
}
```

---

## エラーハンドリング

### 現在の動作（Phase 0）

**明示的なエラーハンドリングなし**:
- 無効な入力 → そのままパース（予期しない結果を生成する可能性あり）
- 空の入力 → 空のベクター/文字列を返す
- 不正な形式の入力 → 検証エラーなし

**根拠**: Phase 0 はコア機能に焦点を当てています。検証は Phase N に延期されます。

---

### 将来のエラーハンドリング（Phase N+）

**計画されたエラー型**:
```rust
pub enum PrompError {
    InvalidSyntax(String),
    MissingNoun,
    InvalidPattern,
    EmptyInput,
}

pub type Result<T> = std::result::Result<T, PrompError>;
```

**計画されたシグネチャ**:
```rust
pub fn parse_input(input: &str) -> Result<Vec<PromptPart>>;
pub fn generate_prompt(parts: &[PromptPart]) -> Result<String>;
```

---

## パフォーマンス考慮事項

### ベンチマーク（概算）

| 操作 | 入力サイズ | 時間 | メモリ |
|------|----------|------|--------|
| `parse_input()` | 100 文字 | ~5 μs | ~1 KB |
| `parse_input()` | 1,000 文字 | ~50 μs | ~10 KB |
| `parse_input()` | 10,000 文字 | ~500 μs | ~100 KB |
| `generate_prompt()` | 10 パーツ | ~2 μs | ~500 バイト |
| `generate_prompt()` | 100 パーツ | ~20 μs | ~5 KB |

**ハードウェア**: x86_64 Linux、Rust 1.70、リリースビルド

**注意**: これらは概算です。実際のパフォーマンスはハードウェアと入力特性に依存します。

---

### 最適化のヒント

**1. アロケーションの再利用**:
```rust
// ✅ 良い - String を再利用
let mut output = String::with_capacity(1024);
for part in parts {
    output.push_str(&generate_prompt(&[part]));
}

// ❌ 悪い - 多数のアロケーション
let mut outputs = Vec::new();
for part in parts {
    outputs.push(generate_prompt(&[part]));
}
let output = outputs.join("");
```

**2. バッチ処理**:
```rust
// ✅ 良い - 一度だけパース
let parts = parse_input(&large_input);
for part in &parts {
    process(part);
}

// ❌ 悪い - 複数回パース
for line in large_input.lines() {
    let parts = parse_input(line);
    // ...
}
```

**3. 容量の事前割り当て**:
```rust
// ✅ 良い - サイズが既知の場合事前割り当て
let mut parts = Vec::with_capacity(expected_count);

// ❌ OK - ただし再割り当ての可能性あり
let mut parts = Vec::new();
```

---

## テスト

### テスト概要

**総テスト数**: 102（バックエンド 26 + フロントエンド 76）

**テスト実行**:
```bash
# バックエンドテスト（Rust）
cargo test

# フロントエンドテスト（Jest）
cd res/tests && npm test

# 全テスト実行
cargo test && cd res/tests && npm test
```

---

### バックエンドテストの例

**テストモジュール**: `src/lib.rs`（13 テスト）、`src/commands.rs`（13 テスト）

**テスト例**:
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

### フロントエンドテストの例

**テストモジュール**: `res/tests/blockly-config.test.js`（61 テスト）、`res/tests/main.test.js`（15 テスト）

**テストカテゴリ**:
- **名詞ブロック**: 固定名詞ブロック、カスタム名詞ブロック
- **助詞ブロック**: 9種類の助詞（が、を、に、で、と、は、も、から、まで）
- **動詞ブロック**: 固定動詞ブロック、カスタム動詞ブロック
- **改行ブロック**: 改行ブロック
- **ツールボックス**: カテゴリ構成

**テスト例**:
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

### 統合テストパターン

**ファイル**: `tests/integration_test.rs`（例）

```rust
use promps::{parse_input, generate_prompt};

#[test]
fn test_full_workflow() {
    // 準備
    let input = "_N:ユーザー が _N:注文 を 作成  説明文";

    // 実行
    let parts = parse_input(input);
    let prompt = generate_prompt(&parts);

    // 検証
    assert!(prompt.contains("(NOUN)"));
    assert!(prompt.contains("説明文\n"));
}
```

---

## マイグレーションガイド

### Phase 0 → Phase 1（GUI）✅ 完了

**API 変更なし**:
- コアライブラリ（`src/lib.rs`）は変更なし
- Tauri コマンドは拡張されたが既存 API は維持
- 100% 後方互換

**追加された機能**:
- Blockly.js ビジュアルブロックビルダー
- 名詞ブロック（固定 + カスタム）
- リアルタイムプレビュー

---

### Phase 1 → Phase 2（助詞ブロック）✅ 完了

**API 変更なし**: 100% 後方互換

**追加された機能**:
- 9種類の助詞ブロック（が、を、に、で、と、は、も、から、まで）
- ツールボックスに「助詞」カテゴリ追加

---

### Phase 2 → Phase 3（動詞ブロック）✅ 完了

**API 変更なし**: 100% 後方互換

**追加された機能**:
- 3種類の固定動詞ブロック（分析して、要約して、翻訳して）
- カスタム動詞ブロック
- ツールボックスに「動詞」カテゴリ追加

---

### Phase 3 → Phase N（ロジックチェック）将来

**破壊的変更が予想されます**:
- エラーハンドリング: 関数は `Result<T, PrompError>` を返す
- 検証: 無効なパターンはエラーを返す

**マイグレーション戦略**:
```rust
// Phase 0（現在）
let parts = parse_input(input);

// Phase N（将来）
let parts = parse_input(input)?;  // エラーを伝播
// または
let parts = parse_input(input).unwrap_or_default();  // エラー時デフォルトを使用
```

---

## バージョニング

**現在のバージョン**: v0.0.3-2 (Phase 3-2)

**セマンティックバージョニング**:
- Phase 0: `0.0.1`（コアライブラリ）✅ 完了
- Phase 1: `0.0.2`（GUI 統合）✅ 完了
- Phase 2: `0.0.3`（助詞ブロック）✅ 完了
- Phase 3: `0.0.3-2`（動詞ブロック）✅ 完了
- Phase N: `1.0.x`（ロジックチェック - 最初の安定版リリース）

**互換性の約束**:
- パッチバージョン（0.1.x）: 破壊的変更なし
- マイナーバージョン（0.x.0）: 追加機能、後方互換性あり
- メジャーバージョン（x.0.0）: 破壊的変更許可

---

## 付録

### DSL 構文クイックリファレンス

```
名詞マーカー:      _N:
トークン区切り:    シングルスペース (0x20)
文区切り:         ダブルスペース (0x20 0x20) 以上
改行:            \n（文は行内で継続）

例:
_N:User が _N:Order を 作成  説明文です
└─┬──┘ │ └─┬───┘ │ ──┬─  └───┬────┘
 名詞  助詞  名詞  助詞 動詞    説明
```

---

### 関連ドキュメント

- **コア機能**: `CORE_FEATURES.md`
- **アーキテクチャ**: `ARCHITECTURE.md`
- **ユーザーガイド**: `../../README.md`

---

**ドキュメントバージョン**: 2.0
**最終更新**: 2026-01-19 (JST)
**次回レビュー**: Phase 4 リリース前
