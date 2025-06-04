# モデル選択機能の設計

## 概要

インタラクティブなモデル選択機能を実装し、選択したモデルを永続的に保存する。ユーザーは`ai model`コマンドでモデルを選択でき、設定は次回以降のセッションでも適用される。

## 要件

1. **インタラクティブな選択UI**
   - ターミナル上で上下キーでモデルを選択可能
   - シンプルにモデル名のみを表示
   - 現在のデフォルトモデルをハイライト表示

2. **永続化**
   - 選択したモデルをXDG準拠の設定ファイルに保存
   - 設定ファイル: `~/.config/ai-cli/preferences.json`

3. **優先順位**
   - コマンドライン引数 (`-m`) > 設定ファイル > デフォルト値

## アーキテクチャ

### 新規ファイル

1. **`src/core/preferences.ts`**
   - 設定の読み書きを管理
   - モデル設定の保存・読み込み

2. **`src/cli/model-selector.ts`**
   - インタラクティブなモデル選択UI
   - 上下キー操作のハンドリング

### 変更ファイル

1. **`src/cli/parser.ts`**
   - `model`サブコマンドの追加

2. **`src/index.ts`**
   - `model`コマンドのハンドリング追加
   - 設定ファイルからのモデル読み込み

3. **`src/api/gemini.ts`**
   - 設定ファイルからモデルを読み込む処理を追加

## 設定ファイル形式

`~/.config/ai-cli/preferences.json`:

```json
{
  "defaultModel": "gemini-2.0-flash",
  "lastUpdated": "2025-01-06T00:00:00Z"
}
```

## UI設計

```
🤖 Gemini モデルを選択してください

  > Gemini 2.5 Flash Preview
    Gemini 2.5 Flash Native Audio Dialog
    Gemini 2.5 Pro Preview
    Gemini 2.0 Flash ⭐
    Gemini 1.5 Pro
    Gemini 1.5 Flash
    Gemini 1.5 Flash 8B
    Gemini 1.5 Pro 002
    Gemini 1.5 Flash 002
    Gemini Embedding Experimental

[↑/↓] 選択  [Enter] 決定  [Esc/q] キャンセル
```

## 実装ステップ

1. **基盤となる設定管理 (`preferences.ts`)** の実装
2. **モデル選択UI (`model-selector.ts`)** の実装
3. **CLIパーサーの拡張** でmodelサブコマンドを追加
4. **メインエントリーポイント** でコマンドのハンドリング
5. **Gemini API統合** で設定ファイルからモデルを読み込む

## エラーハンドリング

- 設定ファイルが存在しない場合は自動作成
- 無効なモデルIDが設定されている場合はデフォルトにフォールバック
- ファイル権限エラーの適切な処理

## テスト計画

1. **単体テスト**
   - 設定ファイルの読み書き
   - モデル選択ロジック
   - 優先順位の検証

2. **統合テスト**
   - `ai model`コマンドの動作確認
   - 設定の永続化確認
   - `-m`オプションとの相互作用

## 将来の拡張性

- モデル設定のプロファイル機能
- 使用履歴の記録
- お気に入りモデルの設定

## 実装完了

✅ **実装ステータス: 完了**

### 実装されたファイル

1. **`src/core/preferences.ts`** - 設定の読み書き管理
2. **`src/cli/model-selector.ts`** - インタラクティブなモデル選択UI
3. **`src/cli/parser.ts`** - modelサブコマンド追加
4. **`src/index.ts`** - modelコマンドのハンドリング
5. **`src/cli/modes.ts`** - 設定ファイルからのモデル読み込み
6. **`src/ui/styles.ts`** - カラー関数のエクスポート追加

### 使用方法

```bash
# モデル選択UIを起動
ai model

# 通常通り使用（設定されたモデルが自動的に適用される）
ai "こんにちは"

# 一時的に別のモデルを使用（設定は変更されない）
ai -m gemini-1.5-pro "詳細な分析をお願いします"
```

### 設定ファイル

- **場所**: `~/.config/ai-cli/preferences.json`
- **形式**: JSON
- **自動生成**: 初回実行時に作成

### 優先順位

1. **コマンドライン引数** (`-m gemini-1.5-pro`)
2. **設定ファイル** (`preferences.json`の`defaultModel`)
3. **デフォルト値** (`gemini-2.0-flash`)

### 動作確認

- ✅ ビルド成功
- ✅ ヘルプ表示にmodelコマンド追加
- ✅ 全テスト通過
- ✅ 設定ファイルの読み書き
- ✅ モデル選択UI実装
