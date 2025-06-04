/**
 * 実行モード管理モジュール
 *
 * AI CLIアプリケーションの異なる実行モード（対話型、ワンショット）を管理し、
 * 各モードに応じた実行コンテキストの構築を行います。ユーザーの入力、ファイル、
 * 標準入力を統合し、AIモデルが処理しやすい形式にフォーマットして提供します。
 *
 * 実行モード:
 * - interactive: 対話型モード（継続的な会話）
 * - oneshot: ワンショット実行モード（単発の質問・回答）
 *
 * 主要機能:
 * - 実行コンテキストの構築と設定
 * - 入力ソースの統合（ファイル + 標準入力 + プロンプト）
 * - モデル設定とオプションの適用
 * - システムプロンプトの構築
 * - 実行環境の検証と初期化
 *
 * 処理する要素:
 * - ユーザープロンプト（コマンドライン引数）
 * - ファイル入力（複数ファイル対応）
 * - 標準入力（パイプ対応）
 * - システムプロンプト（カスタム対応）
 * - AIモデル設定（model, maxTokens等）
 *
 * 必要な権限:
 * - --allow-read: 設定ファイル・入力ファイル読み取り
 *
 * 使用方法:
 * ```typescript
 * const args: ParsedArgs = parseArgs(Deno.args);
 * const context = await createExecutionContext(args);
 *
 * // 実行コンテキストを使用してAI処理を実行
 * await runAI(context);
 * ```
 *
 * 出力形式:
 * - 統一されたExecutionContext型
 * - モデル設定、入力内容、オプションを含む
 * - AIエンジンが直接使用可能な形式
 */

import { type ParsedArgs } from "./parser.ts";
import { formatInputContent, readFiles, readStdin } from "./input.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { getDefaultModel } from "../api/model.ts";
import { getDefaultModelFromPreferences } from "../core/preferences.ts";

/**
 * 実行コンテキスト
 */
export interface ExecutionContext {
  mode: "interactive" | "oneshot";
  prompt?: string;
  inputContent: string;
  options: {
    help: boolean;
    model: string;
    maxTokens: number;
    system?: string;
    verbose: boolean;
    tools: boolean;
  };
}

/**
 * パース結果から実行コンテキストを作成
 * @param args パース済みの引数
 * @returns 実行コンテキスト
 */
export async function createExecutionContext(
  args: ParsedArgs,
): Promise<ExecutionContext> {
  // authモード、mcpモード、modelモードは処理しない（型エラー回避）
  if (args.mode === "auth" || args.mode === "mcp" || args.mode === "model") {
    throw new Error(
      "Auth, MCP, and Model modes should be handled before creating execution context",
    );
  }

  // 標準入力を読み取る
  const stdinContent = await readStdin();

  // ファイルを読み取る
  const fileContents = await readFiles(args.files);

  // 入力内容をフォーマット
  const inputContent = formatInputContent(fileContents, stdinContent);

  // モデル設定の優先順位: コマンドライン引数 > 設定ファイル > デフォルト値
  const defaultModelFromPrefs = await getDefaultModelFromPreferences();
  const modelToUse = args.options.model !== getDefaultModel()
    ? args.options.model
    : defaultModelFromPrefs;

  return {
    mode: args.mode as "interactive" | "oneshot",
    prompt: args.prompt,
    inputContent,
    options: {
      ...args.options,
      model: modelToUse,
    },
  };
}

Deno.test({
  name: "createExecutionContext - インタラクティブモード",
  sanitizeResources: false,
}, async () => {
  const args: ParsedArgs = {
    mode: "interactive",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 1000,
      verbose: false,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);

  assertEquals(context.mode, "interactive");
  assertEquals(context.prompt, undefined);
  assertEquals(context.inputContent, "");
  assertEquals(context.options.model, getDefaultModel());
});

Deno.test("createExecutionContext - ワンショットモード（プロンプトのみ）", async () => {
  const args: ParsedArgs = {
    mode: "oneshot",
    prompt: "Hello world",
    files: [],
    options: {
      help: false,
      model: "gemini-1.5-pro",
      maxTokens: 2000,
      verbose: true,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);

  assertEquals(context.mode, "oneshot");
  assertEquals(context.prompt, "Hello world");
  assertEquals(context.inputContent, "");
  assertEquals(context.options.model, "gemini-1.5-pro");
  assertEquals(context.options.verbose, true);
});

Deno.test("createExecutionContext - ワンショットモード（標準入力あり）", async () => {
  // 標準入力をモック
  const originalStdin = Deno.stdin;
  const encoder = new TextEncoder();
  const data = encoder.encode("Piped content");

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  // @ts-ignore: テスト用にstdinをモック
  Deno.stdin = {
    readable: stream,
    isTerminal: () => false,
  };

  const args: ParsedArgs = {
    mode: "oneshot",
    prompt: "この内容を説明して",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 1000,
      verbose: false,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);

  assertEquals(context.mode, "oneshot");
  assertEquals(context.prompt, "この内容を説明して");
  assertEquals(context.inputContent, "Piped content");

  // 元に戻す
  // @ts-ignore: テスト後にstdinを復元
  Deno.stdin = originalStdin;
});

Deno.test("createExecutionContext - ファイル入力", async () => {
  // テスト用の一時ファイルを作成
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, "File content\nLine 2");

  try {
    const args: ParsedArgs = {
      mode: "oneshot",
      prompt: "ファイルをレビューして",
      files: [tempFile],
      options: {
        help: false,
        model: getDefaultModel(),
        maxTokens: 1000,
        verbose: false,
        tools: false,
      },
    };

    const context = await createExecutionContext(args);

    assertEquals(context.mode, "oneshot");
    assertEquals(context.prompt, "ファイルをレビューして");
    assertEquals(context.inputContent.includes("File content\nLine 2"), true);
    assertEquals(context.inputContent.includes(tempFile), true);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("createExecutionContext - システムプロンプト", async () => {
  const args: ParsedArgs = {
    mode: "interactive",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 1000,
      system: "あなたは親切なアシスタントです",
      verbose: false,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);

  assertEquals(context.options.system, "あなたは親切なアシスタントです");
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== 実行モード管理 デバッグモード ===\n");

  // 1. 各実行モードの説明
  console.log("1. 実行モードの種類:");
  console.log("  - interactive: 対話モード（デフォルト）");
  console.log("  - oneshot: 一回実行モード");
  console.log("  - pipe: パイプ処理モード");
  console.log();

  // 2. 実行コンテキストのテスト作成
  console.log("2. 実行コンテキストのテスト:");

  // インタラクティブモードのテスト
  const interactiveArgs: ParsedArgs = {
    mode: "interactive",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 2000,
      verbose: true,
      tools: false,
    },
  };

  try {
    const interactiveContext = await createExecutionContext(interactiveArgs);
    console.log("✓ インタラクティブモード:");
    console.log(`  モード: ${interactiveContext.mode}`);
    console.log(`  モデル: ${interactiveArgs.options.model}`);
    console.log(`  最大トークン: ${interactiveContext.options.maxTokens}`);
    console.log(`  詳細モード: ${interactiveContext.options.verbose}`);
    console.log(`  入力内容長: ${interactiveContext.inputContent.length}文字`);
  } catch (error) {
    console.error(
      `✗ インタラクティブモードエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // ワンショットモードのテスト
  const oneshotArgs: ParsedArgs = {
    mode: "oneshot",
    prompt: "このプロジェクトについて説明してください",
    files: ["deno.json"],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 1000,
      verbose: false,
      tools: true,
    },
  };

  try {
    const oneshotContext = await createExecutionContext(oneshotArgs);
    console.log("✓ ワンショットモード:");
    console.log(`  モード: ${oneshotContext.mode}`);
    console.log(`  プロンプト: ${oneshotContext.prompt || "(なし)"}`);
    console.log(`  ファイル数: ${oneshotArgs.files?.length || 0}`);
    console.log(`  ツール有効: ${oneshotContext.options.tools}`);
    console.log(`  入力内容長: ${oneshotContext.inputContent.length}文字`);
  } catch (error) {
    console.error(
      `✗ ワンショットモードエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // パイプモードのテスト（oneshotモードで代用）
  const pipeArgs: ParsedArgs = {
    mode: "oneshot",
    prompt: "要約してください",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 500,
      verbose: false,
      tools: false,
    },
  };

  try {
    const pipeContext = await createExecutionContext(pipeArgs);
    console.log("✓ パイプモード:");
    console.log(`  モード: ${pipeContext.mode}`);
    console.log(`  プロンプト: ${pipeContext.prompt || "(なし)"}`);
    console.log(`  標準入力処理: 対応`);
    console.log(`  入力内容長: ${pipeContext.inputContent.length}文字`);
  } catch (error) {
    console.error(
      `✗ パイプモードエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // 3. システムプロンプトのテスト
  console.log("\n3. システムプロンプトテスト:");
  const systemArgs: ParsedArgs = {
    mode: "interactive",
    files: [],
    options: {
      help: false,
      model: getDefaultModel(),
      maxTokens: 1000,
      system: "あなたは技術文書の専門家です。",
      verbose: false,
      tools: false,
    },
  };

  try {
    const systemContext = await createExecutionContext(systemArgs);
    console.log("✓ カスタムシステムプロンプト:");
    console.log(`  プロンプト: ${systemContext.options.system}`);
    console.log(
      `  設定成功: ${
        systemContext.options.system === systemArgs.options.system
      }`,
    );
  } catch (error) {
    console.error(
      `✗ システムプロンプトエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // 4. オプションの確認
  console.log("\n4. デフォルトオプション:");
  console.log(`  デフォルトモデル: ${getDefaultModel()}`);
  console.log(`  デフォルト最大トークン: 未設定時の動作`);

  console.log("\nデバッグモード終了");
}
