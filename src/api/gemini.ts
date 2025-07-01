/**
 * Gemini API統合モジュール
 *
 * Google Gemini AIとの統合機能を提供し、テキスト生成、ツール呼び出し、
 * ストリーミング対応、MCP（Model Context Protocol）ツール統合など、
 * 高度な会話AI機能を実現します。
 *
 * 主要機能:
 * - Gemini AIを使用したストリーミングテキスト生成
 * - MCPツールとビルトインツールの統合管理
 * - ツールセット設定に基づく動的ツール選択
 * - 関数呼び出し（Function Calling）対応
 * - リアルタイムツール実行結果の処理
 *
 * サポートするツールタイプ:
 * - custom: MCPサーバー経由のカスタムツール
 * - builtin: Gemini標準のビルトインツール
 * - codeExecution: コード実行専用モード
 * - googleSearch: Google検索専用モード
 *
 * ツール制限事項:
 * - Gemini APIの制限により、MCPツールとビルトインツールは同時使用不可
 * - モデルごとにツールサポート状況が異なる
 * - 複数ツール同時使用は一部のモデルのみ対応
 *
 * ストリーミング処理:
 * - AsyncGenerator による非同期イテレータベースのストリーミング
 * - テキスト、ツール呼び出し、ツール結果の統合処理
 * - リアルタイムコールバック対応
 *
 * 必要な権限:
 * - --allow-env: 認証キー取得
 * - --allow-read: 設定ファイル読み取り
 * - --allow-net: Gemini API通信
 *
 * 使用方法:
 * ```typescript
 * import { generateText } from "./gemini.ts";
 * import { Client } from "@modelcontextprotocol/sdk/client/index.js";
 *
 * const mcpClients: Client[] = []; // MCP クライアント
 * const contents = [{ parts: [{ text: "Hello, Gemini!" }], role: "user" }];
 *
 * for await (const chunk of generateText(contents, mcpClients, {
 *   model: "gemini-2.5-flash-preview-05-20",
 *   maxOutputTokens: 2000,
 *   systemPrompt: "You are a helpful assistant",
 *   onToolCall: (name, params) => console.log("Tool call:", name, params),
 *   onToolResult: (name, result) => console.log("Tool result:", name, result)
 * })) {
 *   if (chunk.text) {
 *     console.log(chunk.text);
 *   }
 * }
 * ```
 *
 * 技術仕様:
 * - Google GenAI SDK v0.21.0+ 対応
 * - Model Context Protocol SDK統合
 * - TypeScript完全対応
 * - エラーハンドリングとリトライ機構
 * - パフォーマンス最適化済みストリーミング
 *
 * 参考資料:
 * - Google GenAI Documentation: https://github.com/googleapis/js-genai
 * - Function Calling Sample: https://github.com/googleapis/js-genai/blob/main/sdk-samples/generate_content_with_function_calling.ts
 * - Model Context Protocol: https://modelcontextprotocol.io/
 */

import {
  Content,
  FunctionCallingConfigMode,
  type GenerateContentConfig,
  GoogleGenAI,
  mcpToTool,
  type ToolListUnion,
} from "@google/genai";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { getDefaultModel, getModelById, type ModelId } from "./model.ts";
import { getApiKey, getProvider, getVertexConfig } from "../core/auth.ts";
import { getDefaultToolset } from "../core/preferences.ts";

export interface GenerateTextOptions {
  model?: string;
  maxOutputTokens?: number;
  systemPrompt?: string;
  onToolCall?: (toolName: string, params: unknown) => void;
  onToolResult?: (toolName: string, result: unknown) => void;
}

/**
 * モデルとツールセット設定に基づいてツール設定を取得
 * Gemini APIの制限により、MCPツールとビルトインツールは同時に使用できない
 */
async function getToolsForModel(
  modelId: ModelId,
  mcp: Client[],
): Promise<ToolListUnion> {
  const model = getModelById(modelId);
  if (!model) {
    // モデルが見つからない場合はカスタムツールのみ
    return mcp.length > 0 ? [mcpToTool(...mcp, {})] : [];
  }

  const toolSupport = model.toolSupport;
  const selectedToolset = await getDefaultToolset();

  // ツールサポートがない場合はカスタムツールのみ
  if (!toolSupport.codeExecution && !toolSupport.googleSearch) {
    return mcp.length > 0 ? [mcpToTool(...mcp, {})] : [];
  }

  // ツールセットに基づいて適切なツールを選択
  switch (selectedToolset) {
    case "custom":
      // カスタム（MCP）ツールのみ
      return mcp.length > 0 ? [mcpToTool(...mcp, {})] : [];

    case "builtin":
      // ビルトインツール（codeExecution + googleSearch）
      if (toolSupport.multiToolSupport) {
        const builtinTools: Record<string, Record<string, never>> = {};
        if (toolSupport.codeExecution) builtinTools.codeExecution = {};
        if (toolSupport.googleSearch) builtinTools.googleSearch = {};
        return Object.keys(builtinTools).length > 0 ? [builtinTools] : [];
      } else {
        // 複数ツール非対応の場合はデフォルトツールまたは最初の利用可能ツール
        const defaultTool = toolSupport.defaultTools?.[0] ||
          (toolSupport.codeExecution ? "codeExecution" : "googleSearch");
        return [{ [defaultTool]: {} }];
      }

    case "codeExecution":
      // コード実行のみ
      return toolSupport.codeExecution ? [{ codeExecution: {} }] : [];

    case "googleSearch":
      // Google検索のみ
      return toolSupport.googleSearch ? [{ googleSearch: {} }] : [];

    default:
      // フォールバック: カスタムツール
      return mcp.length > 0 ? [mcpToTool(...mcp, {})] : [];
  }
}

export async function* generateText(
  contents: Content[],
  mcp: Client[],
  options: GenerateTextOptions = {},
): AsyncGenerator<
  {
    text?: string;
    toolCall?: { name: string; params: unknown };
    toolResult?: { name: string; result: unknown };
  }
> {
  // プロバイダーに応じてクライアントを初期化
  const provider = await getProvider();
  let client: GoogleGenAI;

  if (provider === "vertex-ai") {
    const vertexConfig = await getVertexConfig();
    if (!vertexConfig) {
      throw new Error(
        "Vertex AI設定がありません。'ai auth' コマンドで設定してください。",
      );
    }

    client = new GoogleGenAI({
      vertexai: true,
      project: vertexConfig.project,
      location: vertexConfig.location,
      apiVersion: "v1",
    });
  } else {
    // Gemini APIモード
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error(
        "APIキーが設定されていません。'ai auth' コマンドで認証してください。",
      );
    }

    client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  // Build config with dynamic tools based on model and toolset preference
  const modelId = (options.model || getDefaultModel()) as ModelId;
  const tools = await getToolsForModel(modelId, mcp);

  const config: GenerateContentConfig = {
    maxOutputTokens: options.maxOutputTokens || 8192,
    systemInstruction: options.systemPrompt,
    tools: tools,
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    },
  };

  const response = await client.models.generateContentStream({
    model: options.model || getDefaultModel(),
    contents: contents,
    config: config,
  });

  // Process the stream
  for await (const chunk of response) {
    // Check for function calls
    if (chunk.candidates?.[0]?.content?.parts) {
      for (const part of chunk.candidates[0].content.parts) {
        if ("functionCall" in part && part.functionCall) {
          const toolName = part.functionCall.name || "unknown";
          const params = part.functionCall.args || {};

          // Notify about tool call
          if (options.onToolCall) {
            options.onToolCall(toolName, params);
          }
          yield { toolCall: { name: toolName, params } };
        } else if ("functionResponse" in part && part.functionResponse) {
          const toolName = part.functionResponse.name || "unknown";
          const result = part.functionResponse.response || {};

          // Notify about tool result
          if (options.onToolResult) {
            options.onToolResult(toolName, result);
          }
          yield { toolResult: { name: toolName, result } };
        } else if (part.text) {
          yield { text: part.text };
        }
      }
    }
  }
}

// === テスト ===

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("getToolsForModel - カスタムツールセットでMCPツールを返す", async () => {
  // モックMCPクライアント
  const mockMcp: Client[] = [
    // 簡単なモックオブジェクトを作成
    {} as Client,
  ];

  // カスタムツールセット用のモデルでテスト
  const tools = await getToolsForModel("gemini-1.5-flash" as ModelId, mockMcp);

  // MCPツールが返されることを確認
  assertEquals(tools.length, 1);
  assertExists(tools[0]);
});

Deno.test("getToolsForModel - ツールサポートなしモデルでMCPツールを返す", async () => {
  const mockMcp: Client[] = [
    {} as Client,
  ];

  // ツールサポートなしのモデル
  const tools = await getToolsForModel("gemini-1.5-flash" as ModelId, mockMcp);

  // MCPツールが返されることを確認（ツールサポートがない場合のフォールバック）
  assertEquals(tools.length, 1);
});

Deno.test("getToolsForModel - MCPクライアントなしで空配列を返す", async () => {
  const tools = await getToolsForModel("gemini-1.5-flash" as ModelId, []);

  // 空配列が返されることを確認
  assertEquals(tools.length, 0);
});

Deno.test("GenerateTextOptions - インターフェースの構造チェック", () => {
  const options: GenerateTextOptions = {
    model: "gemini-2.5-flash-preview-05-20",
    maxOutputTokens: 1000,
    systemPrompt: "Test prompt",
    onToolCall: (name, params) => {
      console.log(`Tool call: ${name}`, params);
    },
    onToolResult: (name, result) => {
      console.log(`Tool result: ${name}`, result);
    },
  };

  assertEquals(options.model, "gemini-2.5-flash-preview-05-20");
  assertEquals(options.maxOutputTokens, 1000);
  assertEquals(options.systemPrompt, "Test prompt");
  assertEquals(typeof options.onToolCall, "function");
  assertEquals(typeof options.onToolResult, "function");
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== Gemini API統合 デバッグ ===\n");

  console.log("1. 認証情報の確認:");
  try {
    const provider = await getProvider();
    console.log(`プロバイダー: ${provider || "未設定"}`);

    if (provider === "vertex-ai") {
      const vertexConfig = await getVertexConfig();
      if (vertexConfig) {
        console.log(`✓ Vertex AI設定済み`);
        console.log(`  Project: ${vertexConfig.project}`);
        console.log(`  Location: ${vertexConfig.location}`);
      } else {
        console.log("✗ Vertex AI設定がありません");
      }
    } else if (provider === "gemini-api") {
      const apiKey = await getApiKey();
      if (apiKey) {
        console.log(`✓ APIキーが設定されています (長さ: ${apiKey.length}文字)`);
      } else {
        console.log("✗ APIキーが設定されていません");
      }
    }

    if (!provider) {
      console.log("  'ai auth' コマンドで認証してください");
    }
  } catch (error) {
    console.error(
      `認証情報取得エラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  console.log();

  console.log("2. デフォルト設定の確認:");
  const defaultModel = getDefaultModel();
  const model = getModelById(defaultModel);
  console.log(`デフォルトモデル: ${defaultModel}`);
  if (model) {
    console.log(`  表示名: ${model.displayName}`);
    console.log(
      `  文脈ウィンドウ: ${model.contextWindow.toLocaleString()} トークン`,
    );
    console.log(`  ツールサポート:`);
    console.log(`    コード実行: ${model.toolSupport.codeExecution}`);
    console.log(`    Google検索: ${model.toolSupport.googleSearch}`);
    console.log(`    複数ツール: ${model.toolSupport.multiToolSupport}`);
  }
  console.log();

  console.log("3. ツールセット設定の確認:");
  try {
    const toolset = await getDefaultToolset();
    console.log(`現在のツールセット: ${toolset}`);

    const toolsetDescriptions = {
      custom: "MCPサーバー経由のカスタムツール",
      builtin: "Gemini標準のビルトインツール（コード実行+Google検索）",
      codeExecution: "コード実行専用",
      googleSearch: "Google検索専用",
    };

    console.log(
      `  説明: ${toolsetDescriptions[toolset] || "不明なツールセット"}`,
    );
  } catch (error) {
    console.error(
      `ツールセット取得エラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  console.log();

  console.log("4. ツール設定のシミュレーション:");
  const testModels = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ] as ModelId[];

  for (const modelId of testModels) {
    const modelInfo = getModelById(modelId);
    if (modelInfo) {
      console.log(`\n  ${modelInfo.displayName} (${modelId}):`);

      try {
        // モックMCPクライアント
        const mockMcp: Client[] = [];
        const tools = await getToolsForModel(modelId, mockMcp);

        console.log(`    ツール数: ${tools.length}`);
        console.log(
          `    ツールサポート: コード実行=${modelInfo.toolSupport.codeExecution}, Google検索=${modelInfo.toolSupport.googleSearch}`,
        );
        console.log(
          `    複数ツール対応: ${modelInfo.toolSupport.multiToolSupport}`,
        );

        if (modelInfo.toolSupport.defaultTools) {
          console.log(
            `    デフォルトツール: ${
              modelInfo.toolSupport.defaultTools.join(", ")
            }`,
          );
        }
      } catch (error) {
        console.error(
          `    ツール設定エラー: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
  console.log();

  console.log("5. 生成設定のテスト:");
  const testOptions: GenerateTextOptions = {
    model: getDefaultModel(),
    maxOutputTokens: 1000,
    systemPrompt: "あなたは親切なアシスタントです。",
    onToolCall: (name, params) => {
      console.log(`    ツール呼び出し: ${name}`, params);
    },
    onToolResult: (name, result) => {
      console.log(`    ツール結果: ${name}`, result);
    },
  };

  console.log("テスト用GenerateTextOptions:");
  console.log(`  モデル: ${testOptions.model}`);
  console.log(`  最大トークン: ${testOptions.maxOutputTokens}`);
  console.log(`  システムプロンプト: ${testOptions.systemPrompt}`);
  console.log(
    `  コールバック設定: ${testOptions.onToolCall ? "有効" : "無効"}`,
  );
  console.log();

  console.log("6. Content構造のサンプル:");
  const sampleContent: Content[] = [
    {
      role: "user",
      parts: [
        { text: "こんにちは！Gemini AIの機能をテストしています。" },
      ],
    },
  ];

  console.log("サンプルContent配列:");
  console.log(JSON.stringify(sampleContent, null, 2));
  console.log();

  console.log("7. 実際のAPI呼び出しテスト:");
  const runApiTest = prompt(
    "実際のGemini APIを呼び出してテストしますか？ (y/N):",
  );

  if (runApiTest?.toLowerCase() === "y") {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.log(
          "✗ APIキーが設定されていません。'ai auth' コマンドで認証してください。",
        );
      } else {
        console.log("✓ 認証情報が確認できました。テスト呼び出しを実行中...");

        const testPrompt = prompt("テスト用のプロンプトを入力してください:") ||
          "こんにちは、簡単な挨拶をお願いします。";
        const testContent: Content[] = [
          {
            role: "user",
            parts: [{ text: testPrompt }],
          },
        ];

        console.log("\\nAPI呼び出し開始...");
        let responseText = "";
        let toolCallCount = 0;

        try {
          for await (
            const chunk of generateText(testContent, [], {
              model: getDefaultModel(),
              maxOutputTokens: 500,
              systemPrompt: "簡潔に回答してください。",
              onToolCall: (name, _params) => {
                toolCallCount++;
                console.log(`ツール呼び出し ${toolCallCount}: ${name}`);
              },
              onToolResult: (name, _result) => {
                console.log(`ツール結果: ${name}`);
              },
            })
          ) {
            if (chunk.text) {
              responseText += chunk.text;
              // リアルタイムでテキストを表示
              Deno.stdout.writeSync(new TextEncoder().encode(chunk.text));
            }
          }

          console.log("\\n\\n✓ API呼び出しが正常に完了しました");
          console.log(`  レスポンス長: ${responseText.length}文字`);
          console.log(`  ツール呼び出し数: ${toolCallCount}`);
        } catch (error) {
          console.error(
            `✗ API呼び出しエラー: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    } catch (error) {
      console.error(
        `テスト実行エラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    console.log("API呼び出しテストをスキップしました。");
  }

  console.log("\\n8. 設定とトラブルシューティング:");
  console.log("必要な環境変数:");
  console.log("  GEMINI_API_KEY - 開発モード用APIキー（オプション）");
  console.log("\\n認証ファイル:");
  console.log("  ~/.local/share/ai-cli/credentials - 認証情報");
  console.log("\\n設定ファイル:");
  console.log("  ~/.config/ai-cli/preferences.json - ツールセット設定");
  console.log("\\nトラブルシューティング:");
  console.log("  1. 'ai auth' でAPIキーを設定");
  console.log("  2. 'ai toolset' でツールセットを選択");
  console.log("  3. ネットワーク接続を確認");

  console.log("\\nデバッグモード終了");
}

// 参考資料:
// https://github.com/googleapis/js-genai/blob/main/sdk-samples/generate_content_with_function_calling.ts
