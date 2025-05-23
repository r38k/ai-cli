import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createExecutionContext } from "./modes.ts";
import { type ParsedArgs } from "./parser.ts";

Deno.test("createExecutionContext - インタラクティブモード", async () => {
  const args: ParsedArgs = {
    mode: "interactive",
    files: [],
    options: {
      help: false,
      model: "gemini-2.0-flash-exp",
      maxTokens: 1000,
      verbose: false,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);
  
  assertEquals(context.mode, "interactive");
  assertEquals(context.prompt, undefined);
  assertEquals(context.inputContent, "");
  assertEquals(context.options.model, "gemini-2.0-flash-exp");
});

Deno.test("createExecutionContext - ワンショットモード（プロンプトのみ）", async () => {
  const args: ParsedArgs = {
    mode: "oneshot",
    prompt: "Hello world",
    files: [],
    options: {
      help: false,
      model: "gemini-pro",
      maxTokens: 2000,
      verbose: true,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);
  
  assertEquals(context.mode, "oneshot");
  assertEquals(context.prompt, "Hello world");
  assertEquals(context.inputContent, "");
  assertEquals(context.options.model, "gemini-pro");
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
    }
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
      model: "gemini-2.0-flash-exp",
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
        model: "gemini-2.0-flash-exp",
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
      model: "gemini-2.0-flash-exp",
      maxTokens: 1000,
      system: "あなたは親切なアシスタントです",
      verbose: false,
      tools: false,
    },
  };

  const context = await createExecutionContext(args);
  
  assertEquals(context.options.system, "あなたは親切なアシスタントです");
});