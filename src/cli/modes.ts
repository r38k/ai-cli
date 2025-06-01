// 必要な権限: --allow-read (ファイル読み込みと設定ファイル読み込みのため)
import { type ParsedArgs } from "./parser.ts";
import { formatInputContent, readFiles, readStdin } from "./input.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { getDefaultModel, MODEL_IDS } from "../api/model.ts";

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
  // authモードとmcpモードは処理しない（型エラー回避）
  if (args.mode === "auth" || args.mode === "mcp") {
    throw new Error("Auth and MCP modes should be handled before creating execution context");
  }

  // 標準入力を読み取る
  const stdinContent = await readStdin();

  // ファイルを読み取る
  const fileContents = await readFiles(args.files);

  // 入力内容をフォーマット
  const inputContent = formatInputContent(fileContents, stdinContent);

  return {
    mode: args.mode as "interactive" | "oneshot",
    prompt: args.prompt,
    inputContent,
    options: args.options,
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
