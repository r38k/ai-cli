import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

/**
 * 入力ファイルの内容
 */
export interface InputContent {
  path: string;
  content: string;
}

/**
 * 標準入力から読み取る
 * @returns 標準入力の内容（TTYの場合は空文字）
 */
export async function readStdin(): Promise<string> {
  // TTY（対話型ターミナル）の場合はパイプ入力なし
  if (Deno.stdin.isTerminal()) {
    return "";
  }

  // Response.text()を使用してシンプルに読み取る
  try {
    const response = new Response(Deno.stdin.readable);
    return await response.text();
  } catch {
    // エラーが発生した場合は空文字を返す
    return "";
  }
}

Deno.test("readStdin - 標準入力からテキストを読み取る", async () => {
  // 標準入力をモック
  const originalStdin = Deno.stdin;
  const encoder = new TextEncoder();
  const data = encoder.encode("Hello from stdin\nLine 2");

  // ReadableStreamを作成
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  // @ts-ignore: テスト用にstdinをモックするためにDenoStdin型を無視
  Deno.stdin = {
    readable: stream,
    isTerminal: () => false,
  };

  const content = await readStdin();
  assertEquals(content, "Hello from stdin\nLine 2");

  // 元に戻す
  // @ts-ignore: テスト後にstdinを復元するためにDenoStdin型を無視
  Deno.stdin = originalStdin;
});

Deno.test("readStdin - TTYの場合は空文字を返す", async () => {
  const originalStdin = Deno.stdin;

  // @ts-ignore: テスト用にstdinをモックするためにDenoStdin型を無視
  Deno.stdin = {
    readable: new ReadableStream(),
    isTerminal: () => true,
  };

  const content = await readStdin();
  assertEquals(content, "");

  // 元に戻す
  // @ts-ignore: テスト後にstdinを復元するためにDenoStdin型を無視
  Deno.stdin = originalStdin;
});

/**
 * ファイルを読み取る
 * @param paths ファイルパスの配列
 * @returns ファイル内容の配列
 */
export async function readFiles(paths: string[]): Promise<InputContent[]> {
  const contents: InputContent[] = [];

  for (const path of paths) {
    const content = await Deno.readTextFile(path);
    contents.push({ path, content });
  }

  return contents;
}

// テスト用の一時ファイルを作成するヘルパー
async function createTempFile(content: string): Promise<string> {
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, content);
  return tempFile;
}

Deno.test("readFiles - 単一ファイルを読み取る", async () => {
  const tempFile = await createTempFile("Test content\nLine 2");

  try {
    const contents = await readFiles([tempFile]);
    assertEquals(contents.length, 1);
    assertEquals(contents[0].path, tempFile);
    assertEquals(contents[0].content, "Test content\nLine 2");
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("readFiles - 複数ファイルを読み取る", async () => {
  const tempFile1 = await createTempFile("File 1 content");
  const tempFile2 = await createTempFile("File 2 content");

  try {
    const contents = await readFiles([tempFile1, tempFile2]);
    assertEquals(contents.length, 2);
    assertEquals(contents[0].content, "File 1 content");
    assertEquals(contents[1].content, "File 2 content");
  } finally {
    await Deno.remove(tempFile1);
    await Deno.remove(tempFile2);
  }
});

Deno.test("readFiles - 存在しないファイル", async () => {
  await assertRejects(
    async () => {
      await readFiles(["/nonexistent/file.txt"]);
    },
    Deno.errors.NotFound,
  );
});

Deno.test("readFiles - 空の配列", async () => {
  const contents = await readFiles([]);
  assertEquals(contents, []);
});

import { formatFileContent } from "../core/prompts.ts";

/**
 * 入力内容をフォーマット
 * @param files ファイル内容の配列
 * @param stdin 標準入力の内容
 * @returns フォーマットされた入力文字列
 */
export function formatInputContent(
  files: InputContent[],
  stdin: string = "",
): string {
  const parts: string[] = [];

  // ファイル内容を追加（改善されたフォーマット）
  for (const file of files) {
    parts.push(formatFileContent(file.path, file.content));
    parts.push("");
  }

  // 標準入力を追加
  if (stdin.trim()) {
    if (files.length > 0) {
      parts.push("## 標準入力");
      parts.push("```");
      parts.push(stdin);
      parts.push("```");
    } else {
      parts.push(stdin);
    }
  }

  return parts.join("\n").trim();
}
