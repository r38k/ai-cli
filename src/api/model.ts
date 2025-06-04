/**
 * Geminiモデル定義・管理モジュール
 *
 * Google AI の利用可能な Gemini モデルの定義と管理機能を提供します。
 * モデルの詳細情報、能力、制限事項、ツール対応状況などを統一的に管理し、
 * アプリケーション全体で一貫したモデル情報アクセスを実現します。
 *
 * 主要機能:
 * - Geminiモデルの完全な定義とメタデータ管理
 * - モデル検索・フィルタリング機能
 * - カテゴリ別モデル取得
 * - マルチモーダル対応モデルの識別
 * - デフォルトモデル設定
 *
 * サポートするモデルカテゴリ:
 * - flash: 高速処理に特化したモデル
 * - pro: 高度な推論能力を持つモデル
 * - embedding: 埋め込みベクトル生成専用モデル
 * - native-audio: ネイティブ音声処理対応モデル
 *
 * モデル能力定義:
 * - text: テキスト処理
 * - images: 画像理解・生成
 * - video: 動画処理
 * - audio: 音声処理
 * - audioOutput: 音声出力生成
 * - embedding: 埋め込みベクトル生成
 *
 * ツールサポート:
 * - codeExecution: コード実行機能
 * - googleSearch: Google検索統合
 * - multiToolSupport: 複数ツール同時使用
 * - defaultTools: デフォルト有効ツール
 *
 * 使用方法:
 * ```typescript
 * import { getDefaultModel, getModelById, getModelsByCategory } from "./model.ts";
 *
 * // デフォルトモデルの取得
 * const defaultModel = getDefaultModel();
 *
 * // 特定モデルの詳細取得
 * const model = getModelById("gemini-2.5-flash-preview-05-20");
 *
 * // カテゴリ別モデル検索
 * const flashModels = getModelsByCategory("flash");
 * ```
 *
 * 技術仕様:
 * - TypeScript型安全性による厳密なモデル定義
 * - 定数オブジェクトによる実行時型チェック
 * - Google AI公式ドキュメントベースの正確な情報
 * - パフォーマンス最適化済みの検索関数
 *
 * 参考資料:
 * - Google AI Gemini API Documentation: https://ai.google.dev/gemini-api/docs/models
 */

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
  contextWindow: number;
  maxOutputTokens?: number;
  description: string;
  toolSupport: {
    codeExecution: boolean;
    googleSearch: boolean;
    multiToolSupport: boolean; // 複数ツール同時使用可否
    defaultTools?: ("codeExecution" | "googleSearch")[]; // デフォルト使用ツール
  };
}

export const GEMINI_MODELS = {
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
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Experimental version with full tool support",
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true,
    },
  },
  "gemini-2.5-flash-preview-05-20": {
    id: "gemini-2.5-flash-preview-05-20",
    displayName: "Gemini 2.5 Flash Preview",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 65_536,
    description:
      "Latest Flash model with adaptive thinking and cost efficiency",
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true,
    },
  },
  "gemini-2.5-flash-preview-native-audio-dialog": {
    id: "gemini-2.5-flash-preview-native-audio-dialog",
    displayName: "Gemini 2.5 Flash Native Audio Dialog",
    category: "native-audio",
    capabilities: {
      text: true,
      images: false,
      video: true,
      audio: true,
      audioOutput: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 8_000,
    description:
      "Specialized for interactive audio conversations with audio generation",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-2.5-pro-preview-05-06": {
    id: "gemini-2.5-pro-preview-05-06",
    displayName: "Gemini 2.5 Pro Preview",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 65_536,
    description: "Advanced reasoning and complex problem solving capabilities",
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: true,
    },
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Next-gen tool use with native streaming support",
    toolSupport: {
      codeExecution: true,
      googleSearch: true,
      multiToolSupport: false,
      defaultTools: ["codeExecution"],
    },
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 2097152,
    maxOutputTokens: 8_192,
    description: "Large data processing with 2M token context window",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Fast and versatile performance across diverse tasks",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-1.5-flash-8b": {
    id: "gemini-1.5-flash-8b",
    displayName: "Gemini 1.5 Flash 8B",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Smaller, faster variant ideal for lower intelligence tasks",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-1.5-pro-002": {
    id: "gemini-1.5-pro-002",
    displayName: "Gemini 1.5 Pro 002",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 2097152,
    maxOutputTokens: 8_192,
    description: "Updated Pro model with improved performance",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-1.5-flash-002": {
    id: "gemini-1.5-flash-002",
    displayName: "Gemini 1.5 Flash 002",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8_192,
    description: "Updated Flash model with enhanced capabilities",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
  "gemini-embedding-exp-03-07": {
    id: "gemini-embedding-exp-03-07",
    displayName: "Gemini Embedding Experimental",
    category: "embedding",
    capabilities: {
      text: true,
      images: false,
      video: false,
      audio: false,
      embedding: true,
    },
    contextWindow: 8192,
    maxOutputTokens: 8_192,
    description: "Multi-lingual embeddings with high retrieval performance",
    toolSupport: {
      codeExecution: false,
      googleSearch: false,
      multiToolSupport: false,
    },
  },
} as const satisfies Record<string, GeminiModel>;

export type ModelId = keyof typeof GEMINI_MODELS;
export const MODEL_IDS = Object.keys(GEMINI_MODELS) as ModelId[];

// Helper functions
export function getModelById(id: ModelId): GeminiModel | undefined {
  return GEMINI_MODELS[id];
}

export function getModelsByCategory(
  category: GeminiModel["category"],
): GeminiModel[] {
  return Object.values(GEMINI_MODELS).filter((model) =>
    model.category === category
  );
}

export function getMultimodalModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS).filter(
    (model) =>
      model.capabilities.text &&
      model.capabilities.images &&
      model.capabilities.video &&
      model.capabilities.audio,
  );
}

export function getDefaultModel(): ModelId {
  return "gemini-2.5-flash-preview-05-20";
}

// === テスト ===

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("getDefaultModel - デフォルトモデルが正しく設定されている", () => {
  const defaultModel = getDefaultModel();
  assertEquals(defaultModel, "gemini-2.5-flash-preview-05-20");
  // デフォルトモデルが実際に定義されていることを確認
  const model = getModelById(defaultModel);
  assertNotEquals(model, undefined);
});

Deno.test("getModelById - 存在するモデルを正しく取得", () => {
  const model = getModelById("gemini-2.0-flash-exp");
  assertEquals(model?.id, "gemini-2.0-flash-exp");
  assertEquals(model?.displayName, "Gemini 2.0 Flash Experimental");
  assertEquals(model?.category, "flash");
});

Deno.test("getModelById - 存在しないモデルはundefinedを返す", () => {
  const model = getModelById("non-existent-model" as ModelId);
  assertEquals(model, undefined);
});

Deno.test("getModelsByCategory - flashカテゴリのモデルを正しく取得", () => {
  const flashModels = getModelsByCategory("flash");
  assertEquals(flashModels.length > 0, true);

  // 全てのモデルがflashカテゴリであることを確認
  for (const model of flashModels) {
    assertEquals(model.category, "flash");
  }

  // 特定のflashモデルが含まれていることを確認
  const hasTargetModel = flashModels.some((m) =>
    m.id === "gemini-2.5-flash-preview-05-20"
  );
  assertEquals(hasTargetModel, true);
});

Deno.test("getModelsByCategory - proカテゴリのモデルを正しく取得", () => {
  const proModels = getModelsByCategory("pro");
  assertEquals(proModels.length > 0, true);

  // 全てのモデルがproカテゴリであることを確認
  for (const model of proModels) {
    assertEquals(model.category, "pro");
  }
});

Deno.test("getModelsByCategory - embeddingカテゴリのモデルを正しく取得", () => {
  const embeddingModels = getModelsByCategory("embedding");
  assertEquals(embeddingModels.length > 0, true);

  // 全てのモデルがembeddingカテゴリであることを確認
  for (const model of embeddingModels) {
    assertEquals(model.category, "embedding");
  }
});

Deno.test("getMultimodalModels - マルチモーダルモデルを正しく取得", () => {
  const multimodalModels = getMultimodalModels();
  assertEquals(multimodalModels.length > 0, true);

  // 全てのモデルがマルチモーダル対応であることを確認
  for (const model of multimodalModels) {
    assertEquals(model.capabilities.text, true);
    assertEquals(model.capabilities.images, true);
    assertEquals(model.capabilities.video, true);
    assertEquals(model.capabilities.audio, true);
  }
});

Deno.test("MODEL_IDS - 全モデルIDが正しく含まれている", () => {
  const expectedIds = Object.keys(GEMINI_MODELS);
  assertEquals(MODEL_IDS.length, expectedIds.length);

  // 全てのIDが含まれていることを確認
  for (const id of expectedIds) {
    assertEquals(MODEL_IDS.includes(id as ModelId), true);
  }
});

Deno.test("GEMINI_MODELS - モデル定義の整合性チェック", () => {
  for (const [id, model] of Object.entries(GEMINI_MODELS)) {
    // IDの整合性
    assertEquals(model.id, id);

    // 必須フィールドの存在チェック
    assertEquals(typeof model.displayName, "string");
    assertEquals(typeof model.description, "string");
    assertEquals(typeof model.contextWindow, "number");

    // 文脈ウィンドウは正の数であること
    assertEquals(model.contextWindow > 0, true);

    // カテゴリは有効な値であること
    const validCategories = ["flash", "pro", "embedding", "native-audio"];
    assertEquals(validCategories.includes(model.category), true);
  }
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== Geminiモデル定義・管理 デバッグ ===\n");

  console.log("1. 利用可能なモデル一覧:");
  console.log(`総モデル数: ${MODEL_IDS.length}`);
  for (const id of MODEL_IDS) {
    const model = getModelById(id);
    if (model) {
      console.log(`  ${id}:`);
      console.log(`    表示名: ${model.displayName}`);
      console.log(`    カテゴリ: ${model.category}`);
      console.log(
        `    文脈ウィンドウ: ${model.contextWindow.toLocaleString()} トークン`,
      );
      if (model.maxOutputTokens) {
        console.log(
          `    最大出力: ${model.maxOutputTokens.toLocaleString()} トークン`,
        );
      }
      console.log(`    説明: ${model.description}`);
      console.log();
    }
  }

  console.log("2. カテゴリ別モデル統計:");
  const categories = ["flash", "pro", "embedding", "native-audio"] as const;
  for (const category of categories) {
    const models = getModelsByCategory(category);
    console.log(`  ${category}: ${models.length}個のモデル`);
    models.forEach((model) => console.log(`    - ${model.displayName}`));
    console.log();
  }

  console.log("3. マルチモーダル対応モデル:");
  const multimodalModels = getMultimodalModels();
  console.log(`マルチモーダル対応: ${multimodalModels.length}個のモデル`);
  for (const model of multimodalModels) {
    console.log(`  - ${model.displayName}`);
    console.log(
      `    能力: テキスト=${model.capabilities.text}, 画像=${model.capabilities.images}, 動画=${model.capabilities.video}, 音声=${model.capabilities.audio}`,
    );
  }
  console.log();

  console.log("4. ツール対応状況:");
  const toolSupportStats = {
    codeExecution: 0,
    googleSearch: 0,
    multiTool: 0,
  };

  for (const model of Object.values(GEMINI_MODELS)) {
    if (model.toolSupport.codeExecution) toolSupportStats.codeExecution++;
    if (model.toolSupport.googleSearch) toolSupportStats.googleSearch++;
    if (model.toolSupport.multiToolSupport) toolSupportStats.multiTool++;
  }

  console.log(`  コード実行対応: ${toolSupportStats.codeExecution}個のモデル`);
  console.log(`  Google検索対応: ${toolSupportStats.googleSearch}個のモデル`);
  console.log(`  複数ツール対応: ${toolSupportStats.multiTool}個のモデル`);
  console.log();

  console.log("5. デフォルトモデル情報:");
  const defaultModelId = getDefaultModel();
  const defaultModel = getModelById(defaultModelId);
  if (defaultModel) {
    console.log(`  ID: ${defaultModel.id}`);
    console.log(`  表示名: ${defaultModel.displayName}`);
    console.log(`  カテゴリ: ${defaultModel.category}`);
    console.log(
      `  文脈ウィンドウ: ${defaultModel.contextWindow.toLocaleString()} トークン`,
    );
    console.log(
      `  最大出力: ${
        defaultModel.maxOutputTokens?.toLocaleString() || "制限なし"
      } トークン`,
    );
    console.log(
      `  ツール対応: コード実行=${defaultModel.toolSupport.codeExecution}, Google検索=${defaultModel.toolSupport.googleSearch}`,
    );
  }
  console.log();

  console.log("6. パフォーマンス比較:");
  console.log("文脈ウィンドウサイズ順（上位5モデル）:");
  const sortedByContext = Object.values(GEMINI_MODELS)
    .sort((a, b) => b.contextWindow - a.contextWindow)
    .slice(0, 5);

  for (const model of sortedByContext) {
    console.log(
      `  ${model.displayName}: ${model.contextWindow.toLocaleString()} トークン`,
    );
  }
  console.log();

  console.log("最大出力トークン順（上位5モデル）:");
  const sortedByOutput = Object.values(GEMINI_MODELS)
    .filter((model) => model.maxOutputTokens)
    .sort((a, b) => (b.maxOutputTokens || 0) - (a.maxOutputTokens || 0))
    .slice(0, 5);

  for (const model of sortedByOutput) {
    console.log(
      `  ${model.displayName}: ${model.maxOutputTokens?.toLocaleString()} トークン`,
    );
  }
  console.log();

  console.log("7. 対話型モデル探索:");
  const runInteractive = prompt("対話型モデル探索を実行しますか？ (y/N):");

  if (runInteractive?.toLowerCase() === "y") {
    while (true) {
      console.log("\n利用可能なコマンド:");
      console.log("  search <カテゴリ> - カテゴリでモデル検索");
      console.log("  info <モデルID> - モデル詳細情報");
      console.log("  multimodal - マルチモーダルモデル一覧");
      console.log("  tools - ツール対応モデル一覧");
      console.log("  exit - 終了");

      const input = prompt("\nコマンドを入力:");
      if (!input || input === "exit") {
        console.log("探索を終了します。");
        break;
      }

      const [command, ...args] = input.split(" ");

      switch (command) {
        case "search": {
          const category = args[0] as typeof categories[number];
          if (categories.includes(category)) {
            const models = getModelsByCategory(category);
            console.log(`\n${category}カテゴリのモデル (${models.length}個):`);
            models.forEach((model) => {
              console.log(`  - ${model.id}: ${model.displayName}`);
            });
          } else {
            console.log(
              `無効なカテゴリです。利用可能: ${categories.join(", ")}`,
            );
          }
          break;
        }

        case "info": {
          const modelId = args[0] as ModelId;
          const model = getModelById(modelId);
          if (model) {
            console.log(`\n${model.displayName} の詳細:`);
            console.log(`  ID: ${model.id}`);
            console.log(`  カテゴリ: ${model.category}`);
            console.log(`  説明: ${model.description}`);
            console.log(
              `  文脈ウィンドウ: ${model.contextWindow.toLocaleString()} トークン`,
            );
            console.log(
              `  最大出力: ${
                model.maxOutputTokens?.toLocaleString() || "制限なし"
              } トークン`,
            );
            console.log("  対応能力:");
            console.log(`    テキスト: ${model.capabilities.text}`);
            console.log(`    画像: ${model.capabilities.images}`);
            console.log(`    動画: ${model.capabilities.video}`);
            console.log(`    音声: ${model.capabilities.audio}`);
            if (model.capabilities.audioOutput) {
              console.log(`    音声出力: ${model.capabilities.audioOutput}`);
            }
            if (model.capabilities.embedding) {
              console.log(`    埋め込み: ${model.capabilities.embedding}`);
            }
            console.log("  ツール対応:");
            console.log(`    コード実行: ${model.toolSupport.codeExecution}`);
            console.log(`    Google検索: ${model.toolSupport.googleSearch}`);
            console.log(
              `    複数ツール: ${model.toolSupport.multiToolSupport}`,
            );
            if (model.toolSupport.defaultTools) {
              console.log(
                `    デフォルトツール: ${
                  model.toolSupport.defaultTools.join(", ")
                }`,
              );
            }
          } else {
            console.log(`モデル '${modelId}' が見つかりません。`);
            console.log(
              `利用可能なモデル: ${MODEL_IDS.slice(0, 3).join(", ")}...`,
            );
          }
          break;
        }

        case "multimodal": {
          const models = getMultimodalModels();
          console.log(`\nマルチモーダル対応モデル (${models.length}個):`);
          models.forEach((model) => {
            console.log(`  - ${model.displayName} (${model.id})`);
          });
          break;
        }

        case "tools": {
          console.log("\nツール対応モデル:");
          for (const model of Object.values(GEMINI_MODELS)) {
            if (
              model.toolSupport.codeExecution || model.toolSupport.googleSearch
            ) {
              const tools = [];
              if (model.toolSupport.codeExecution) tools.push("コード実行");
              if (model.toolSupport.googleSearch) tools.push("Google検索");
              console.log(`  - ${model.displayName}: ${tools.join(", ")}`);
            }
          }
          break;
        }

        default:
          console.log(`不明なコマンド: ${command}`);
      }
    }
  }

  console.log("\nデバッグモード終了");
}
