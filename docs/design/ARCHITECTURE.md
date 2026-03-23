# Promps アーキテクチャドキュメント

**バージョン**: v0.0.3-2 (Phase 3-2)
**最終更新**: 2026-01-19 (JST)
**対象読者**: 開発者、コントリビューター、AI アシスタント

---

## 概要

このドキュメントは、モジュール構造、データフロー、設計決定、進化パスを含む Promps のアーキテクチャ設計を説明します。

**コアコンセプト**: Promps は、簡素化された入力言語を AI 消費用の構造化プロンプトに翻訳する**コンパイラ的な DSL プロセッサ**です。

---

## 高レベルアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                         Promps                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌──────────────┐            │
│  │    フロントエンド    │      │ バックエンド │            │
│  │    (Tauri UI)       │ IPC  │   (Rust)     │            │
│  │                     │◄────►│              │            │
│  │  - Blockly.js       │      │  - Parsing   │            │
│  │  - HTML/CSS/JS      │      │  - Generation│            │
│  │  - リアルタイム      │      │              │            │
│  │    プレビュー        │      │              │            │
│  └─────────────────────┘      └──────────────┘            │
│                                                             │
│         │                            │                     │
│         │                            ▼                     │
│         │                   ┌─────────────────┐           │
│         │                   │ コアライブラリ   │           │
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
│  │     ユーザー      │                                     │
│  │  ブロック操作     │                                     │
│  └──────────────────┘                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

入力フロー:
ブロック操作 → DSL生成 → Tauri IPC → バックエンドコマンド → コアライブラリ → プレビュー表示
```

---

## モジュール構造

### ディレクトリレイアウト

```
Promps/
├── src/                       # Rust ソースコード
│   ├── main.rs                # アプリケーションエントリーポイント（Tauri）
│   ├── lib.rs                 # コアライブラリ（パーシング、生成）
│   ├── commands.rs            # Tauri コマンド（IPC レイヤー）
│   └── modules/               #（将来）追加モジュール
│       └── mod.rs             # モジュール宣言
│
├── res/                       # フロントエンドリソース（Tauri）
│   ├── index.html             # メイン UI（Blockly.js ワークスペース）
│   ├── js/
│   │   ├── main.js            # フロントエンドロジック
│   │   └── blockly-config.js  # Blockly.js ブロック定義・設定
│   ├── css/
│   │   └── styles.css         # スタイルシート
│   └── tests/                 # フロントエンドテスト
│       ├── blockly-config.test.js
│       └── main.test.js
│
├── docs/                      # ドキュメント
│   ├── INDEX_ja.md            # 日本語目次
│   ├── INDEX_en.md            # 英語目次
│   ├── design/                # 設計ドキュメント
│   ├── developer/             # 開発者向け
│   ├── user/                  # ユーザー向け
│   └── testing/               # テストドキュメント
│
├── Cargo.toml                 # Rust 依存関係
├── tauri.conf.json            # Tauri 設定
└── README.md                  # ユーザードキュメント
```

---

## コアコンポーネント

### 1. コアライブラリ (`src/lib.rs`)

**責務**: 純粋なパーシングと生成ロジック（I/O なし、UI なし）

**主要設計**: ライブラリは**フレームワーク非依存**で、以下で使用可能：
- CLI ツール
- GUI アプリケーション（Tauri）
- Web サービス
- テストフレームワーク

**モジュール**:

```rust
// データ構造
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}

// 公開 API
pub fn parse_input(input: &str) -> Vec<PromptPart>
pub fn generate_prompt(parts: &[PromptPart]) -> String

// 内部 API
impl PromptPart {
    pub fn from_token(token: &str) -> Self
}
```

**依存関係**:
- なし（Rust 標準ライブラリのみ）

**テスト**: 7 つのユニットテスト（公開 API の 100% カバレッジ）

---

### 2. Tauri コマンド (`src/commands.rs`)

**責務**: フロントエンド（JavaScript）とバックエンド（Rust）の橋渡し

**設計パターン**: コアライブラリの薄いラッパー

**コマンド**:

```rust
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String
    ↓
呼び出し: parse_input() + generate_prompt()

#[tauri::command]
pub fn greet(name: String) -> String
    ↓
目的: Tauri IPC のヘルスチェック
```

**エラーハンドリング**: なし（Phase 0 - Phase N に延期）

**テスト**: 2 つのユニットテスト（コマンドレベルのテスト）

---

### 3. Tauri アプリケーション (`src/main.rs`)

**責務**: アプリケーションライフサイクル管理

**構造**:
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

**依存関係**:
- `tauri`: デスクトップアプリケーションフレームワーク
- `commands`: Tauri コマンドモジュール

---

### 4. フロントエンド (Blockly.js + HTML/JS)

**ステータス**: Phase 3-2 - ビジュアルブロックエディタ実装済み

**実装済み機能**:
- ✅ Blockly.js 統合
- ✅ ビジュアルブロックビルダー
- ✅ ドラッグアンドドロップインターフェース
- ✅ リアルタイムプレビュー
- ✅ 折りたたみ可能なカテゴリUI

**ブロックタイプ**:
- 名詞ブロック（固定 + カスタム）- Phase 1
- 助詞ブロック（9種類）- Phase 2
- 動詞ブロック（固定3個 + カスタム）- Phase 3

**現在の構造**:
```
res/
├── index.html          # メイン UI（Blockly.js ワークスペース）
├── js/
│   ├── main.js         # フロントエンドロジック、リアルタイムプレビュー
│   └── blockly-config.js  # ブロック定義、ツールボックス設定
├── css/
│   └── styles.css      # スタイルシート
└── tests/              # フロントエンドテスト（Jest）
    ├── blockly-config.test.js  # ブロック定義テスト
    └── main.test.js            # UIロジックテスト
```

---

## データフロー

### エンドツーエンドフロー（Tauri アプリケーション）

```
1. ユーザー入力（フロントエンド）
   │
   │ JavaScript: await invoke('generate_prompt_from_text', { input })
   ▼
2. Tauri IPC レイヤー
   │
   │ シリアル化: JavaScript String → Rust String
   ▼
3. バックエンドコマンド (src/commands.rs)
   │
   │ generate_prompt_from_text(input: String)
   ▼
4. コアライブラリ (src/lib.rs)
   │
   ├─► parse_input(&input)
   │    │
   │    ├─► 行で分割
   │    ├─► ダブルスペースで分割（文）
   │    ├─► シングルスペースで分割（トークン）
   │    ├─► _N: マーカーをスキャン
   │    └─► PromptPart ベクターを構築
   │
   └─► generate_prompt(&parts)
        │
        ├─► パーツを反復
        ├─► 各パーツをフォーマット（必要に応じて (NOUN) を追加）
        └─► フォーマット済み文字列を返す
   ▼
5. バックエンドコマンド（戻り値）
   │
   │ 戻り値: String
   ▼
6. Tauri IPC レイヤー
   │
   │ シリアル化: Rust String → JavaScript String
   ▼
7. フロントエンド（JavaScript）
   │
   │ 結果をユーザーに表示
   ▼
8. ユーザー出力
```

---

### パーシングフロー（詳細）

```
入力: "_N:User が _N:Order を 作成  説明文です"

parse_input() フロー:

1. 行で分割
   ↓
   ["_N:User が _N:Order を 作成  説明文です"]

2. ダブルスペースで分割
   ↓
   ["_N:User が _N:Order を 作成", "説明文です"]

3. 各文について:

   文 1: "_N:User が _N:Order を 作成"
   ├─► スペースで分割: ["_N:User", "が", "_N:Order", "を", "作成"]
   ├─► _N: をスキャン: トークン[0] と トークン[2] で発見
   ├─► has_noun = true
   ├─► テキストを再構築: "User が Order を 作成"
   └─► PromptPart { is_noun: true, text: "User が Order を 作成" }

   文 2: "説明文です"
   ├─► スペースで分割: ["説明文です"]
   ├─► _N: をスキャン: 見つからない
   ├─► has_noun = false
   ├─► テキストを再構築: "説明文です"
   └─► PromptPart { is_noun: false, text: "説明文です" }

4. ベクターを返す:
   ↓
   [
       PromptPart { is_noun: true, text: "User が Order を 作成" },
       PromptPart { is_noun: false, text: "説明文です" }
   ]
```

---

### 生成フロー（詳細）

```
入力: [
    PromptPart { is_noun: true, text: "User が Order を 作成" },
    PromptPart { is_noun: false, text: "説明文です" }
]

generate_prompt() フロー:

1. 出力を初期化: String::new()

2. パーツを反復:

   パート 1: is_noun = true
   ├─► 追加: "User が Order を 作成"
   ├─► 追加: " (NOUN)"
   └─► 追加: "\n"

   パート 2: is_noun = false
   ├─► 追加: "説明文です"
   └─► 追加: "\n"

3. 出力を返す:
   ↓
   "User が Order を 作成 (NOUN)\n説明文です\n"
```

---

## 設計決定

### 決定 1: ライブラリファーストアーキテクチャ

**問題**: CLI と GUI の両方の使用のためにコードを構造化する方法は？

**解決策**: コアロジックを `src/lib.rs`（ライブラリ）に、アプリケーション固有のコードを `src/main.rs` と `src/commands.rs` に配置。

**メリット**:
- ✅ アプリケーション間で再利用可能（CLI、GUI、Web サービス）
- ✅ 独立してテスト可能（ユニットテストに UI 不要）
- ✅ フレームワーク非依存（Tauri を他のフレームワークと交換可能）

**トレードオフ**:
- ⚠️ 追加の間接レイヤー（commands.rs が lib.rs をラップ）
- ⚠️ より多くのファイルをメンテナンス

**結論**: メリットが長期的な保守性のためのトレードオフを上回る。

---

### 決定 2: トークンレベルの名詞検出（Phase 0-1）

**問題**: 複数の名詞が1つの文に現れる場合、どのように処理すべきか？

**解決策**: 各 `_N:` トークンを個別の `PromptPart` として処理し、それぞれに `(NOUN)` マーカーを付与。

**実装**:
```rust
// Phase 0-1: トークンレベル検出（採用）
入力: "_N:User が _N:Order を 作成"

PromptPart { is_noun: true, text: "User" }
PromptPart { is_noun: false, text: "が" }
PromptPart { is_noun: true, text: "Order" }
PromptPart { is_noun: false, text: "を 作成" }

出力: "User (NOUN) が Order (NOUN) を 作成"
```

**メリット**:
- ✅ 複数名詞を正しく処理（「_N:タコ と _N:イカ を 食べる」）
- ✅ 各名詞に明示的な `(NOUN)` マーカー
- ✅ AI が名詞の境界を明確に理解可能
- ✅ 1行出力で文の統一性を維持（AI タスク処理のため）

**Phase N+1 での進化**:
- 品詞ブロック（助詞、動詞など）の追加
- より正確な文法検証
- より洗練された出力フォーマット

**結論**: トークンレベル検出により、Phase 0-1 の要件（複数名詞の自然な処理）を満たしつつ、将来の拡張性を確保。

---

### 決定 3: 文のどこにでも `_N:` を配置可能

**問題**: `_N:` は文の先頭のみに許可すべきか？

**解決策**: `_N:` は文の**どこにでも**配置可能。

**メリット**:
- ✅ 自然言語の柔軟性（日本語の語順は柔軟）
- ✅ ユーザーは強調を表現可能（"注文を _N:ユーザーが 作成" は User を強調）
- ✅ ユーザーの思考プロセスの強制的な並び替えなし

**実装コスト**:
- ⚠️ やや複雑なパーシング（文全体をスキャンする必要）

**結論**: 柔軟性は軽微な実装の複雑さに値する。

---

### 決定 4: Phase 0 ではエラーハンドリングなし

**問題**: 無効な入力をどのように処理するか？

**解決策**: Phase 0 では**検証なし**（Phase N に延期）。

**根拠**:
- Phase 0 の目標: コア機能を確立
- 検証には AST ベースのパターンマッチングが必要（Phase N のスコープ）
- 早期の検証は Phase N 実装時にリファクタリングが必要になる可能性

**現在の動作**:
- 無効な入力 → そのままパース（予期しない出力を生成する可能性）
- 空の入力 → 空のベクター/文字列を返す

**将来（Phase N）**:
```rust
pub enum PrompError { ... }
pub fn parse_input(input: &str) -> Result<Vec<PromptPart>, PrompError>
```

**結論**: エラーハンドリングの延期は、将来の拡張性を犠牲にすることなく Phase 0 の複雑さを軽減。

---

### 決定 5: Phase 0 ではファイル I/O なし

**問題**: Phase 0 はプロンプトの保存/読み込みをサポートすべきか？

**解決策**: Phase 0 では**ファイル I/O なし**（Phase N+1 に延期）。

**根拠**:
- Phase 0: CLI/GUI 入力 → 即座の出力（永続化なし）
- Phase 1: ビジュアルブロックビルダー（テストのみ、保存なし）
- Phase N+1: 確定したブロックタイプ → 一度だけ保存/読み込みを実装

**メリット**:
- ✅ 急速な開発中のスキーマ変更を回避（Phase 1-N）
- ✅ マイグレーションの複雑さなし
- ✅ 安定時に単一の実装努力

**YAGNI 原則**: "You Aren't Gonna Need It" - 実際に必要になるまで機能を実装しない。

**結論**: ファイル I/O の延期は早すぎる設計のロックインを防ぐ。

---

## アーキテクチャパターン

### パターン 1: コンパイラアナロジー

Promps アーキテクチャは**コンパイラパイプライン**を模倣：

```
コンパイラフェーズ   Promps フェーズ         ステータス
─────────────────────────────────────────────────────────
字句解析           →  トークンパーシング      ✅ Phase 0
構文解析           →  AST 構築              [Soon] Phase N
構文検証           →  パターンマッチング     [Soon] Phase N
意味分析           → （なし - AI の仕事）    ❌ スコープ外
型チェック         →  名詞の関係性           [Soon] Phase N
IR 生成            →  正規化された AST       [Soon] Phase N+1
コード生成         →  プロンプト出力         ✅ Phase 0
```

**Phase 0 のスコープ**: 字句解析 + コード生成（最小限の実行可能コンパイラ）

---

### パターン 2: AST 的データ構造

`PromptPart` は **AST ノード**：

```rust
PromptPart {
    is_noun: bool,    // ← 型アノテーション（AST ノードタイプのような）
    text: String,     // ← 意味的内容（AST ノード値のような）
}
```

**AST 比較**:
```
従来の AST ノード:
  type: NodeType (enum)
  children: Vec<Node>
  value: Option<Value>

PromptPart（簡素化された AST ノード）:
  is_noun: bool（型アノテーション）
  text: String（値）
  children:（なし - Phase 0 ではフラット構造）
```

**将来（Phase N）**: ネストされたノードを持つ階層的 AST。

---

### パターン 3: 関心の分離

**コアライブラリ** (src/lib.rs):
- ✅ 純粋関数（副作用なし）
- ✅ I/O なし（ファイル読み書きなし、ネットワークなし）
- ✅ UI 依存関係なし（Tauri なし、HTML/JS なし）
- ✅ フレームワーク非依存

**アプリケーション層** (src/main.rs, src/commands.rs):
- ✅ I/O 処理（stdin/stdout、ファイル操作）
- ✅ UI 統合（Tauri IPC）
- ✅ アプリケーションライフサイクル
- ✅ フレームワーク固有コード

**メリット**:
- 簡単なテスト（コアライブラリを独立してテスト）
- 簡単なリファクタリング（コアに影響を与えずに UI を変更）
- 簡単な再利用（異なるコンテキストでコアライブラリを使用可能）

---

## パフォーマンス特性

### 時間計算量

| 関数 | 計算量 | 備考 |
|------|--------|------|
| `PromptPart::from_token()` | O(n) | n = トークン長 |
| `parse_input()` | O(m × k) | m = トークン数、k = 平均トークン長 |
| `generate_prompt()` | O(p × t) | p = パーツ数、t = 平均テキスト長 |

**全体**: O(m × k) - 総入力サイズに対して線形

---

### メモリ使用量

**データ構造サイズ**（64 ビットシステム）:
```
PromptPart:         25 バイト
├─ is_noun:         1 バイト（bool）
├─ text:           24 バイト（String）
│   ├─ ptr:         8 バイト
│   ├─ len:         8 バイト
│   └─ cap:         8 バイト
└─ padding:         0 バイト

Vec<PromptPart>:    24 バイト（オーバーヘッド）+ 25n バイト（要素）
```

**総メモリ**: O(n)、n = 総文字数

---

### スケーラビリティ

**現在の制限**（Phase 0）:
- ✅ 入力サイズ: ハードリミットなし（利用可能メモリによる制限）
- ✅ トークン数: ハードリミットなし
- ✅ 文の数: ハードリミットなし

**実用的な制限**（テスト済み）:
- 10,000 文字: ~500 μs、~100 KB メモリ
- 100 個の名詞: テスト済み、推奨 UI 制限
- 1,000 個の名詞: テスト済み、ストレステスト合格
- 予想される実際の使用: プロンプトあたり <1,000 文字

**ボトルネック**: 文字列割り当て（テキスト処理では避けられない）

---

## リソース管理哲学

### メモリ管理の責任分離

Promps はリソース管理において**関心の分離**原則に従います：

**アプリケーション層（Promps）**:
- **ビジネスロジック制限**: 
  - 推奨値: 100 ブロック（UX 最適化）
  - 警告閾値: 50 ブロック（UX ガイダンス）
  - ハード制限（Phase N）: 10,000 ブロック（DoS 防止）
- **パフォーマンス最適化**: 1,000 個の名詞までテスト済み
- **テスト範囲**: 10,000 文字、1,000 個の名詞まで

**OS 層（委譲）**:
- **システムメモリ管理**: 動的割り当て
- **OOM（メモリ不足）処理**: OS 固有のメカニズム
  - Linux: OOM Killer が適切なプロセスを終了
  - Windows: メモリ枯渇エラーダイアログ
  - macOS: メモリ圧縮 + プロセス終了
- **プロセス終了**: リソース枯渇時

**根拠**:
1. **動的な性質**: 利用可能メモリはシステム負荷により変動
2. **システム依存性**: 他のプロセスが利用可能リソースに影響
3. **OS の専門性**: OS はメモリ圧力処理により適している
4. **ユーザー体験**: OS のエラーメッセージの方がアプリ独自制限より明確
5. **偽陰性の防止**: 有効な操作の拒否を回避

**テスト戦略**:
- ✅ ビジネスロジック制限をテスト（100、1,000 個の名詞）
- ✅ パフォーマンス特性をテスト（10,000 文字）
- ❌ メモリ枯渇はテストしない（10,000+ 名詞、100,000+ 文字）
  - 理由: ハードウェア依存、OS の責任
  - リスク: 低メモリマシンでシステム不安定化の可能性

**Phase N 予定制限値**:
```rust
pub const MAX_BLOCKS_RECOMMENDED: usize = 100;    // UX 最適
pub const MAX_BLOCKS_WARNING: usize = 50;         // 警告表示
pub const MAX_BLOCKS_HARD_LIMIT: usize = 10_000;  // DoS 防止
```

---

## テスト戦略

### 概要

**合計テスト数**: 102（バックエンド 26 + フロントエンド 76）
**カバレッジ**: 公開 API の 100%

### バックエンドテスト（Rust）

**テスト構造**:
```
src/lib.rs（13 テスト）:
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

src/commands.rs（13 テスト）:
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

**テスト実行**:
```bash
cargo test              # 全バックエンドテスト
cargo test --lib        # ライブラリテストのみ
cargo test commands::   # コマンドテストのみ
```

---

### フロントエンドテスト（Jest + JSDOM）

**テスト構造**:
```
res/tests/（76 テスト）:
├─ blockly-config.test.js   # ブロック定義テスト
│   ├─ 名詞ブロックテスト
│   ├─ 助詞ブロックテスト（9種類）
│   ├─ 動詞ブロックテスト（固定3個 + カスタム）
│   └─ カテゴリ・ツールボックステスト
│
└─ main.test.js             # UIロジックテスト
    ├─ DSL生成テスト
    ├─ リアルタイムプレビューテスト
    └─ イベントハンドリングテスト
```

**テスト実行**:
```bash
cd res/tests && npm test    # 全フロントエンドテスト
```

---

### 全テスト実行

```bash
# バックエンド + フロントエンド
cargo test && cd res/tests && npm test
```

**エッジケースカバレッジ**:
- 連続する名詞マーカー（スペース有り/無し）
- 非常に長い入力（10,000 文字）
- 多数の名詞（100 ブロック - UI 制限のベースライン）
- 極端に多数の名詞（1,000 ブロック - ストレステスト）
- 各ブロックタイプの個別テスト

---

## 進化パス

### Phase 0 → Phase 1（GUI 統合）✅ 完了

**実装済み**:
```
追加:
├─ res/index.html             (Blockly.js UI)
├─ res/js/blockly-config.js   (ブロック定義)
├─ res/js/main.js             (UIロジック、リアルタイムプレビュー)
└─ res/tests/                 (フロントエンドテスト)

不変:
└─ src/lib.rs                 (コアライブラリ - 変更なし)
```

**互換性**: 100% 後方互換性（コア API 不変）

---

### Phase 1 → Phase 2（助詞ブロック）✅ 完了

**実装済み**:
- 9種類の助詞ブロック（が、を、に、で、と、から、まで、より、へ）
- 折りたたみ可能なカテゴリUI
- フロントエンドテスト追加

---

### Phase 2 → Phase 3（動詞ブロック）✅ 完了

**実装済み**:
- 固定動詞ブロック3個（分析して、要約して、翻訳して）
- カスタム動詞ブロック
- Phase 3-2 で追加テスト

---

### Phase 3 → Phase N（ロジックチェック）- 将来

**設計哲学**: **レイヤー化アーキテクチャ - 非破壊的拡張**

Phase N は、開放閉鎖原則に従って、Phase 0 の上に検証を**別レイヤー**として追加します：
- Phase 0 コアは**不変**（修正に対して閉鎖）
- 検証レイヤーを**追加**（拡張に対して開放）

**変更**:
```
追加:
├─ src/modules/validation.rs  (新規: 検証レイヤー)
│   ├─ parse_input_checked() → Result<Vec<PromptPart>, ValidationError>
│   ├─ validate_pattern()
│   └─ ValidationError enum
│
├─ src/modules/patterns.rs    (新規: 文法パターン)
│   └─ VALID_PATTERNS
│
└─ src/modules/parser.rs      (新規: AST 構築 - 将来)

不変:
└─ src/lib.rs                 (Phase 0 コア - 変更なし)
    ├─ parse_input()          (安定した API を維持)
    ├─ generate_prompt()      (安定した API を維持)
    └─ PromptPart             (安定した構造を維持)
```

**レイヤー化アーキテクチャ**:
```
┌─────────────────────────────────────┐
│   Phase N: 検証レイヤー            │  ← 新規
│   ├─ parse_input_checked()         │
│   ├─ validate_pattern()             │
│   └─ Error → ユーザーに再入力促す  │
└────────────┬────────────────────────┘
             │ 検証 OK
             ▼
┌─────────────────────────────────────┐
│   Phase 0: コアパーシングレイヤー  │  ← 不変
│   ├─ parse_input()                 │
│   ├─ generate_prompt()             │
│   └─ PromptPart                    │
└─────────────────────────────────────┘
```

**実装例**:
```rust
// Phase N 検証レイヤー (src/modules/validation.rs)
pub fn parse_input_checked(input: &str) -> Result<Vec<PromptPart>, ValidationError> {
    // Phase 0 コアを再利用（修正不要）
    let parts = parse_input(input);

    // 検証を上に追加
    validate_pattern(&parts)?;
    validate_noun_relationships(&parts)?;

    Ok(parts)
}
```

**UI 統合**:
```javascript
// 検証付きフロントエンド
async function processInput(input) {
    try {
        // 検証レイヤーを使用
        const result = await invoke('parse_input_checked', { input });
        displayPrompt(result);  // 成功 → 次へ進む
    } catch (error) {
        // エラー → ユーザーに再入力を促す
        showError(error.message);
        highlightInvalidInput(error.position);
    }
}
```

**互換性**: **非破壊的**（Phase 0 API は安定を維持）

**メリット**:
- ✅ **関心の分離**: パーシング vs. 検証
- ✅ **単一責任**: 各レイヤーが1つの仕事のみ
- ✅ **開放閉鎖原則**: 修正なしで拡張
- ✅ **ゼロマイグレーションコスト**: 既存コードは動作し続ける
- ✅ **テスト容易性**: 各レイヤーを独立してテスト

**マイグレーション**（オプション - 既存コードはそのまま動作）:
```rust
// Phase 0 コード（まだ動作、変更不要）
let parts = parse_input(input);

// Phase N コード（検証をオプトイン）
let parts = parse_input_checked(input)?;  // 検証エラーを取得
```

---

### Phase N → Phase N+1（プロジェクト永続化）

**変更**:
```
追加:
├─ src/modules/io.rs          (ファイル I/O 操作)
├─ src/modules/project.rs     (プロジェクト構造)
└─ src/commands.rs            (save_project、load_project コマンド)
```

**ファイルフォーマット**（計画）:
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

**互換性**: 追加的（コアライブラリへの破壊的変更なし）

---

## デプロイメントアーキテクチャ

### 現在（Phase 0）

```
┌─────────────────────────────┐
│ Tauri デスクトップアプリ    │
│  (単一実行ファイル)         │
│                             │
│  ├─ フロントエンド          │
│  │  (HTML/CSS/JS)           │
│  └─ バックエンド            │
│     (Rust バイナリ)         │
└─────────────────────────────┘
```

**プラットフォームサポート**:
- ✅ Linux（開発環境）
- [Soon] Windows（将来）
- [Soon] macOS（将来）

**配布**:
- ソースコード: GitHub リポジトリ
- バイナリ: `cargo build --release`（ローカルビルド）

---

### 将来（Phase 1+）

**クロスプラットフォームビルド**:
```
ビルドマトリックス:
├─ Linux (x86_64)
├─ Windows (x86_64)
├─ macOS (x86_64)
└─ macOS (ARM64 / Apple Silicon)
```

**配布チャネル**:
- GitHub Releases（ビルド済みバイナリ）
- パッケージマネージャー（Homebrew、Chocolatey など）

---

## セキュリティ考慮事項

### Phase 0 セキュリティ

**セキュリティ要件なし**（シングルユーザー、ローカルのみ）:
- ❌ 認証なし
- ❌ 認可なし
- ❌ 暗号化なし
- ❌ ネットワーク通信なし

**根拠**: Promps Phase 0 は外部通信のない**ローカル専用ツール**。

---

### 将来のセキュリティ（Phase 1+）

**潜在的なリスク**（機能が追加された場合）:
1. **ファイル I/O**（Phase N+1）:
   - リスク: パストラバーサル攻撃
   - 緩和策: ファイルパスの検証、ファイルアクセスのサンドボックス化

2. **ネットワーク機能**（将来）:
   - リスク: データ漏洩、MITM 攻撃
   - 緩和策: HTTPS のみ、証明書検証

3. **マルチユーザー**（スコープ外）:
   - リスク: 不正アクセス
   - 緩和策: 適用外（シングルユーザーツール）

---

## 付録

### 技術スタックサマリー

| レイヤー | 技術 | バージョン | 目的 |
|----------|------|-----------|------|
| デスクトップフレームワーク | Tauri | 1.x | クロスプラットフォームデスクトップアプリ |
| バックエンド言語 | Rust | 1.70+ | コアロジック、パーシング、生成 |
| フロントエンド言語 | JavaScript | ES6+ | UI ロジック（将来） |
| フロントエンド UI | HTML/CSS | - | ユーザーインターフェース（将来） |
| ブロックエディタ | Blockly.js | - | ビジュアルプログラミング（Phase 1） |

---

### ビルド依存関係

**Rust クレート**:
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }
```

**フロントエンド依存関係**（Phase 1）:
```json
{
  "dependencies": {
    "@tauri-apps/api": "^1.5.0",
    "blockly": "^9.0.0"
  }
}
```

---

### 用語集

| 用語 | 定義 |
|------|------|
| AST | Abstract Syntax Tree - コード構造の階層的表現 |
| DSL | Domain Specific Language - 特定の問題領域用の専門言語 |
| IPC | Inter-Process Communication - Tauri フロントエンド-バックエンド通信のメカニズム |
| 字句解析 | コンパイルの最初のフェーズ - トークン化 |
| PromptPart | 意味的単位（文）を表すコアデータ構造 |
| Tauri | Web 技術でデスクトップアプリを構築するフレームワーク |

---

### 関連ドキュメント

- **コア機能**: `CORE_FEATURES.md`
- **API リファレンス**: `API_REFERENCE.md`
- **ユーザーガイド**: `../../README.md`

---

**ドキュメントバージョン**: 2.0
**最終更新**: 2026-01-19 (JST)
**次回レビュー**: Phase N 実装開始前
