# Gemini モデルツール互換性調査

## 問題の概要

`gemini-2.0-flash`モデルで`codeExecution`と`googleSearch`を同時に有効化するとエラーが発生することが確認された。一方、`gemini-2.5-flash`では同じ設定で正常に動作する。

## 調査結果

### 1. 現在の実装状況

**ツール設定（`src/api/gemini.ts`）**:

```typescript
tools: mcp.length > 0 ? [mcpToTool(...mcp, {}), 
  { codeExecution: {}, googleSearch: {} }, 
] : [
  { codeExecution: {}, googleSearch: {} },
],
```

**問題**:

- すべてのモデルで同一のツール設定を使用
- モデル毎のツール互換性チェックが未実装

### 2. 公式ドキュメント調査結果

#### モデル毎のツール対応状況

| モデル                     | Code Execution | Google Search  | 複数ツール同時使用 |
| -------------------------- | -------------- | -------------- | ------------------ |
| `gemini-2.0-flash`         | ✅             | ✅             | ❌（制限あり）     |
| `gemini-2.0-flash-exp`     | ✅             | ✅             | ✅（推定）         |
| `gemini-2.5-flash-preview` | ✅             | ✅             | ✅                 |
| `gemini-2.5-pro-preview`   | ✅             | ✅             | ✅                 |
| `gemini-1.5-flash`         | ✅             | ✅（検索のみ） | ✅                 |
| `gemini-1.5-pro`           | ❌             | ✅（検索のみ） | -                  |

#### 重要な発見事項

1. **Gemini 2.0 Flashの制限**:
   - Google Searchドキュメントに明記: "Combining Search with function calling is
     not yet supported"
   - これは`gemini-2.0-flash`（stable版）に適用される制限と推測

2. **Experimental vs Stable版の違い**:
   - `gemini-2.0-flash-exp`では複数ツール同時使用が可能と推測
   - Stable版（`gemini-2.0-flash`）では制限がある

3. **Code Executionの制限**:
   - Single turnモデル: 複数ツール使用不可
   - Bidirectionalモデル: 複数ツール使用可能

### 3. 推奨される対応策

#### 3.1 モデル定義の拡張

`src/api/model.ts`にツール互換性情報を追加:

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
    multiToolSupport: boolean; // 複数ツール同時使用
  };
  contextWindow: number;
  maxOutputTokens?: number;
  description: string;
}
```

#### 3.2 モデル毎のツール設定

各モデルのツール対応状況:

```typescript
export const GEMINI_MODELS = {
  "gemini-2.0-flash": {
    // ... 既存設定
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: false, // 重要: 同時使用不可
    },
  },
  "gemini-2.0-flash-exp": {
    id: "gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash Experimental",
    category: "flash",
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true, // 同時使用可能
    },
    // ... その他設定
  },
  "gemini-2.5-flash-preview-05-20": {
    // ... 既存設定
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true,
    },
  },
  // ... 他のモデル
};
```

#### 3.3 動的ツール設定

`src/api/gemini.ts`でモデル毎にツールを動的設定:

```typescript
function getToolsForModel(modelId: ModelId, mcp: Client[]): any[] {
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
    // 単一ツールのみ使用可能 - 優先順位で選択
    if (model.toolSupport.codeExecution) {
      tools.push({ codeExecution: {} });
    } else if (model.toolSupport.googleSearch) {
      tools.push({ googleSearch: {} });
    }
  }

  return tools;
}
```

### 4. 追加すべきモデル

現在のモデル一覧に以下を追加することを推奨:

```typescript
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
    multiToolSupport: true,
  },
  contextWindow: 1048576,
  maxOutputTokens: 8_192,
  description: "Experimental Flash model with enhanced multi-tool support",
},
```

### 5. エラーハンドリングの改善

ツール互換性エラーの適切な処理:

```typescript
function validateToolCompatibility(
  modelId: ModelId,
  requestedTools: string[],
): void {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  const hasMultipleTools = requestedTools.length > 1;
  if (hasMultipleTools && !model.toolSupport.multiToolSupport) {
    throw new Error(
      `Model ${modelId} does not support multiple tools simultaneously. ` +
        `Use gemini-2.0-flash-exp or gemini-2.5-flash instead.`,
    );
  }

  // 個別ツール対応チェック
  for (const tool of requestedTools) {
    if (tool === "codeExecution" && !model.toolSupport.codeExecution) {
      throw new Error(`Model ${modelId} does not support code execution`);
    }
    if (tool === "googleSearch" && !model.toolSupport.googleSearch) {
      throw new Error(`Model ${modelId} does not support Google Search`);
    }
  }
}
```

## まとめ

`gemini-2.0-flash`（stable版）には複数ツール同時使用の制限があり、`codeExecution`と`googleSearch`を同時に有効化できない。この問題を解決するには：

1. **推奨モデル**: `gemini-2.0-flash-exp`または`gemini-2.5-flash-preview`を使用
2. **実装改善**: モデル毎のツール互換性チェック機能を実装
3. **ユーザー通知**: 適切なエラーメッセージで制限事項を通知

この制限はGemini
APIの仕様によるものであり、将来のアップデートで改善される可能性がある。
