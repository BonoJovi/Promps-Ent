# AI Context TODO

**Last Updated**: 2026-01-09
**Status**: Completed

---

## 4バイト絵文字の削除作業 ✅ 完了

### 背景
Tracpathが4バイトUTF-8文字（拡張絵文字）を正しく処理できないため、全リポジトリのMarkdownファイルから4バイト絵文字を削除する必要があった。

**確認済み:**
- 3バイト絵文字（✅⚠✨❤など、U+2600〜U+27BF）は問題なし
- 4バイト絵文字（[Art][Rocket][Party]など、U+1F300以降）が文字化けの原因

### 完了した作業 (2026-01-09)

| リポジトリ | ファイル数 | ステータス |
|-----------|-----------|-----------|
| Promps (dev) | 15 | ✅ 完了 |
| KakeiBonByRust (dev) | 33 | ✅ 完了 |
| ai-context-shared (main) | 3 | ✅ 完了 |
| Baconian | - | ✅ スキップ（sharedは未追跡）|

### 置換ルール

- 4バイト絵文字 → テキスト代替（[Trophy], [Chart], [Bug]など）
- 3バイト絵文字（✅⚠✨❤）は維持

### コミット情報

```
docs: Remove 4-byte UTF-8 emojis for Tracpath compatibility

Replace 4-byte emojis (U+1F300+) with text alternatives.
3-byte emojis (U+2600-27BF) are retained.
```

---

## 完了済みタスク

- [x] Tracpath文字化け原因特定（4バイト絵文字）
- [x] 3バイト絵文字の互換性確認（問題なし）
- [x] 全リポジトリの修正量調査
- [x] sedスクリプトで一括置換
- [x] 各リポジトリでコミット・プッシュ
