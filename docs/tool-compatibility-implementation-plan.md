# ツール互換性対応実装計画

## 概要

Geminiモデル毎のツール互換性問題を解決するための詳細実装計画。`gemini-2.0-flash`で複数ツール同時使用ができない問題への対策。

## 実装ステップ

### 1. モデル定義の拡張 (`src/api/model.ts`)

#### 1.1 GeminiModelインターフェース拡張

```typescript
export interface GeminiModel {
  id: string;
  displayName: string;
  category: "flash" | "pro" | "embedding" | "native-audio";
  capabilities: {
    text: boolean;
    images: boolean;
    video: boolean;
    audio: boolean;
    audioOutput?: boolean;
    embedding?: boolean;
  };
  toolSupport: {
    codeExecution: boolean;
    googleSearch: boolean;
    multiToolSupport: boolean; // 複数ツール同時使用可否
    defaultTools?: ("codeExecution" | "googleSearch")[]; // デフォルト使用ツール
  };
  contextWindow: number;
  maxOutputTokens?: number;
  description: string;
}
```

#### 1.2 モデル定義更新

各モデルに`toolSupport`プロパティを追加:

```typescript
export const GEMINI_MODELS = {
  "gemini-2.0-flash": {
    // ... 既存プロパティ
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: false, // 重要: 同時使用不可
      defaultTools: ["codeExecution"], // デフォルトはcodeExecution
    },
  },
  "gemini-2.0-flash-exp": {
    id: "gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash Experimental",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true, // 同時使用可能
    },
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Experimental Flash model with enhanced multi-tool support",
  },
  "gemini-2.5-flash-preview-05-20": {
    // ... 既存プロパティ
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true,
    },
  },
  // 他のモデルも同様に更新
};
```

### 2. ツール設定管理 (`src/core/preferences.ts`)

#### 2.1 設定ファイル拡張

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

#### 2.2 ツール設定関数追加

```typescript
/**
 * モデル毎のツール設定を取得
 */
export async function getToolPreferencesForModel(modelId: ModelId): Promise<string[]> {
  const preferences = await loadPreferences();
  return preferences.toolPreferences?.[modelId]?.selectedTools || [];
}

/**
 * モデル毎のツール設定を保存
 */
export async function setToolPreferencesForModel(
  modelId: ModelId, 
  selectedTools: string[]
): Promise<void> {
  const preferences = await loadPreferences();
  if (!preferences.toolPreferences) {
    preferences.toolPreferences = {};
  }
  
  preferences.toolPreferences[modelId] = {
    selectedTools: selectedTools as ("codeExecution" | "googleSearch")[],
    lastUpdated: new Date().toISOString(),
  };
  preferences.lastUpdated = new Date().toISOString();
  await savePreferences(preferences);
}
```

### 3. ツール選択UI (`src/cli/tool-selector.ts`)

#### 3.1 新規ファイル作成

モデル選択UIと同様のインターフェース:

```typescript
import { green, yellow, cyan, dim } from "../ui/styles.ts";
import { getModelById, type ModelId } from "../api/model.ts";
import { setToolPreferencesForModel } from "../core/preferences.ts";

export async function selectToolsForModel(modelId: ModelId): Promise<string[] | null> {
  const model = getModelById(modelId);
  if (!model || model.toolSupport.multiToolSupport) {
    // 複数ツール対応モデルは選択不要
    return null;
  }

  const availableTools = [];
  if (model.toolSupport.codeExecution) {
    availableTools.push("codeExecution");
  }
  if (model.toolSupport.googleSearch) {
    availableTools.push("googleSearch");
  }

  if (availableTools.length <= 1) {
    return availableTools;
  }

  // インタラクティブ選択UI（複数選択可能）
  // 実装詳細は model-selector.ts を参考
}
```

#### 3.2 UI仕様

- チェックボックス形式で複数選択可能
- スペースキーでトグル、Enter確定、Esc/qキャンセル
- 制限付きモデルの場合のみ表示

### 4. 動的ツール設定 (`src/api/gemini.ts`)

#### 4.1 ツール設定関数

```typescript
import { getModelById, type ModelId } from "./model.ts";
import { getToolPreferencesForModel } from "../core/preferences.ts";

async function getToolsForModel(modelId: ModelId, mcp: Client[]): Promise<any[]> {
  const model = getModelById(modelId);
  if (!model) return [];

  const tools: any[] = [];

  // MCPツールの追加
  if (mcp.length > 0) {
    tools.push(mcpToTool(...mcp, {}));
  }

  // モデル毎のツール対応チェック
  if (model.toolSupport.multiToolSupport) {
    // 複数ツール同時使用可能
    const builtInTools: any = {};
    if (model.toolSupport.codeExecution) {
      builtInTools.codeExecution = {};
    }
    if (model.toolSupport.googleSearch) {
      builtInTools.googleSearch = {};
    }
    if (Object.keys(builtInTools).length > 0) {
      tools.push(builtInTools);
    }
  } else {
    // 制限付きモデル - 設定から読み込み
    const selectedTools = await getToolPreferencesForModel(modelId);
    const effectiveTools = selectedTools.length > 0 
      ? selectedTools 
      : (model.toolSupport.defaultTools || []);

    const builtInTools: any = {};
    for (const tool of effectiveTools) {
      if (tool === "codeExecution" && model.toolSupport.codeExecution) {
        builtInTools.codeExecution = {};
      }
      if (tool === "googleSearch" && model.toolSupport.googleSearch) {
        builtInTools.googleSearch = {};
      }
    }
    if (Object.keys(builtInTools).length > 0) {
      tools.push(builtInTools);
    }
  }

  return tools;
}
```

### 5. メインロジック統合 (`src/index.ts`)

#### 5.1 ツール互換性チェック

```typescript
import { selectToolsForModel } from "./cli/tool-selector.ts";
import { getToolPreferencesForModel } from "./core/preferences.ts";

async function checkAndPromptToolCompatibility(modelId: ModelId): Promise<void> {
  const model = getModelById(modelId);
  if (!model || model.toolSupport.multiToolSupport) {
    return; // 制限なし
  }

  const savedTools = await getToolPreferencesForModel(modelId);
  if (savedTools.length > 0) {
    return; // 既に設定済み
  }

  // ツール選択プロンプト
  console.log(yellow(`⚠️  ${model.displayName} では複数のツールを同時使用できません`));
  console.log("使用するツールを選択してください：");
  
  const selectedTools = await selectToolsForModel(modelId);
  if (selectedTools && selectedTools.length > 0) {
    await setToolPreferencesForModel(modelId, selectedTools);
    console.log(green(`✓ ツール設定を保存しました: ${selectedTools.join(", ")}`));
  }
}
```

#### 5.2 実行前チェック統合

```typescript
// modelコマンド処理後に追加
if (args.mode === "model") {
  const selectedModel = await selectModel();
  if (selectedModel) {
    console.log(green(`✓ デフォルトモデルを ${selectedModel} に設定しました`));
    // ツール互換性チェック
    await checkAndPromptToolCompatibility(selectedModel);
  } else {
    info("モデル選択がキャンセルされました");
  }
  return;
}

// 通常実行前にもチェック
const context = await createExecutionContext(args);
await checkAndPromptToolCompatibility(context.options.model as ModelId);
```

### 6. CLI拡張

#### 6.1 新しいサブコマンド追加

```bash
ai tools          # ツール設定を表示
ai tools select   # ツール選択UI起動
ai tools reset    # ツール設定リセット
```

#### 6.2 パーサー拡張 (`src/cli/parser.ts`)

```typescript
export type ExecutionMode = "interactive" | "oneshot" | "auth" | "mcp" | "model" | "tools";

// toolsコマンドの処理追加
if (args.length > 0 && args[0] === "tools") {
  return {
    mode: "tools",
    files: [],
    toolsSubcommand: args[1] || "help",
    // ...
  };
}
```

## 実装優先順位

1. **High Priority**:
   - [ ] model.tsにtoolSupportプロパティ追加
   - [ ] preferences.tsにツール設定機能追加
   - [ ] gemini.tsに動的ツール設定実装

2. **Medium Priority**:
   - [ ] tool-selector.ts実装
   - [ ] index.tsに互換性チェック統合

3. **Low Priority**:
   - [ ] toolsサブコマンド実装
   - [ ] エラーハンドリング改善

## 注意事項

- 既存の設定ファイルとの後方互換性を保つ
- エラーメッセージは日本語で分かりやすく
- ツール選択はオプショナル（デフォルト動作を維持）
- テストケースの追加

## 期待される動作

1. **制限なしモデル**: 従来通り両ツール使用
2. **制限ありモデル（初回）**: ツール選択UIが表示
3. **制限ありモデル（設定済み）**: 保存された設定でツール使用
4. **モデル変更時**: 新モデルの制限に応じて再設定促す

この計画に従って次のセッションで実装を進めてください。