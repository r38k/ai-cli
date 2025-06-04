# 次セッション実装指示

## 現在の状況

**ブランチ**: `feature/model-selection` **最新コミット**: `29ced05` -
モデル選択機能とツール互換性調査完了

## 実装済み機能

✅ **モデル選択機能**:

- `ai model` コマンドでインタラクティブ選択
- 設定ファイル永続化 (`~/.config/ai-cli/preferences.json`)
- 優先順位制御 (CLI引数 > 設定ファイル > デフォルト)

## 次に実装する機能

**目標**: Geminiモデル毎のツール互換性対応

### 背景問題

- `gemini-2.0-flash`で`codeExecution`と`googleSearch`を同時使用するとエラー
- `gemini-2.5-flash`では正常動作
- モデル毎にツール対応状況が異なる

### 解決方針

1. **モデル定義拡張**: ツール対応情報をmodel.tsに追加
2. **ツール選択UI**: 制限付きモデルでツール選択画面表示
3. **動的ツール設定**: モデル毎に適切なツール構成を適用

## 実装ステップ

### 1. 最優先タスク (必須)

#### 1.1 `src/api/model.ts` の拡張

```typescript
export interface GeminiModel {
  // ... 既存プロパティ
  toolSupport: {
    codeExecution: boolean;
    googleSearch: boolean;
    multiToolSupport: boolean; // 複数ツール同時使用可否
    defaultTools?: ("codeExecution" | "googleSearch")[]; // デフォルト使用ツール
  };
}
```

**対応表**:

- `gemini-2.0-flash`: `multiToolSupport: false`,
  `defaultTools: ["codeExecution"]`
- `gemini-2.0-flash-exp`: `multiToolSupport: true` (新規追加)
- `gemini-2.5-flash-preview-*`: `multiToolSupport: true`

#### 1.2 `src/core/preferences.ts` の拡張

```typescript
export interface Preferences {
  defaultModel: ModelId;
  toolPreferences: {
    [modelId: string]: {
      selectedTools: ("codeExecution" | "googleSearch")[];
      lastUpdated: string;
    };
  };
  lastUpdated: string;
}
```

**関数追加**:

- `getToolPreferencesForModel(modelId: ModelId): Promise<string[]>`
- `setToolPreferencesForModel(modelId: ModelId, tools: string[]): Promise<void>`

#### 1.3 `src/api/gemini.ts` の修正

現在の固定ツール設定:

```typescript
tools: [{ codeExecution: {}, googleSearch: {} }];
```

↓

動的ツール設定:

```typescript
tools: await getToolsForModel(modelId, mcp);
```

### 2. 中優先タスク

#### 2.1 `src/cli/tool-selector.ts` 作成

- モデル選択UIと同様のインターフェース
- チェックボックス形式で複数選択可能
- スペースキーでトグル、Enter確定

#### 2.2 `src/index.ts` の統合

- ツール互換性チェック機能追加
- 制限付きモデル使用時にツール選択UI表示
- 継続処理フロー実装

### 3. 低優先タスク

#### 3.1 CLIコマンド拡張

```bash
ai tools          # ツール設定表示
ai tools select   # ツール選択UI
ai tools reset    # ツール設定リセット
```

## 重要な参考ファイル

### 詳細実装計画

📄 `/docs/tool-compatibility-implementation-plan.md`

- 完全な実装仕様とコード例

### 調査結果

📄 `/docs/gemini-tools-compatibility.md`

- ツール互換性問題の詳細調査結果

### 既存実装参考

📄 `src/cli/model-selector.ts`

- インタラクティブUI実装の参考 📄 `src/core/preferences.ts`
- 設定管理の実装参考

## 期待される動作フロー

### ケース1: 制限なしモデル

```bash
ai "コードを実行して" --tools
# → 従来通り両ツール使用
```

### ケース2: 制限ありモデル（初回）

```bash
ai "コードを実行して" --tools  # gemini-2.0-flash使用
# → ツール選択UI表示
# → 選択後に設定保存
# → 処理継続
```

### ケース3: 制限ありモデル（設定済み）

```bash
ai "検索して" --tools  # gemini-2.0-flash使用
# → 保存された設定でツール使用
# → 処理継続
```

## 実装時の注意点

### 必須事項

- [ ] 既存設定ファイルとの後方互換性維持
- [ ] エラーメッセージは日本語で分かりやすく
- [ ] デフォルト動作を変更せず、オプショナル機能として実装
- [ ] 全テスト通過確認

### テスト対象

- [ ] モデル定義の拡張テスト
- [ ] 設定ファイル読み書きテスト
- [ ] ツール選択UIの基本動作テスト
- [ ] 動的ツール設定の検証

## 完了条件

1. ✅ `gemini-2.0-flash`で複数ツール使用時にエラーが発生しない
2. ✅ ツール選択UIが正常動作する
3. ✅ 設定が適切に保存・読み込みされる
4. ✅ 既存機能に影響しない
5. ✅ 全テストが通過する

## 次々回セッション予定

- プルリクエスト作成
- メインブランチへのマージ
- 残りTODO項目（Vertex AI対応、ビルトインツール）の検討

## 質問や不明点があれば

実装中に疑問が生じた場合は、`/docs/tool-compatibility-implementation-plan.md`を参照してください。完全なコード例と詳細仕様が記載されています。

---

**開始コマンド**:

```bash
cd /home/r38k/my-cli/ai-cli
git status  # feature/model-selection ブランチであることを確認
deno task dev  # 開発モードで動作確認
```

---

**⚠️ 重要**: このファイル (`docs/next-session-instructions.md`)
は実装完了後に削除してください。一時的な引き継ぎファイルです。
