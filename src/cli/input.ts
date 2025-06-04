/**
 * 入力処理統合モジュール
 *
 * AI CLIアプリケーションでの多様な入力ソース（ファイル、標準入力、パイプ）を
 * 統一的に処理し、適切にフォーマットして提供する機能を実装します。
 * TTY環境の検出、ファイル内容の読み取り、標準入力の非同期処理などを含みます。
 *
 * 主要機能:
 * - 複数ファイルの並行読み取り
 * - 標準入力の非ブロッキング読み取り
 * - TTY環境での適切な入力処理
 * - ファイル内容と標準入力の統合フォーマット
 * - エラーハンドリングと回復処理
 *
 * 対応する入力形式:
 * - 単一・複数ファイルの指定読み取り
 * - パイプ経由の標準入力
 * - 対話型ターミナルでの適切な処理
 * - 混在入力（ファイル + 標準入力）
 *
 * 必要な権限:
 * - --allow-read: ファイル読み込み
 *
 * 使用方法:
 * ```typescript
 * // ファイル読み取り
 * const files = await readFiles(["file1.txt", "file2.ts"]);
 *
 * // 標準入力読み取り
 * const stdin = await readStdin();
 *
 * // 統合フォーマット
 * const combined = combineInputContent(files, stdin);
 * ```
 *
 * 出力形式:
 * - Markdown形式でのファイル内容表示
 * - 言語自動判定によるシンタックスハイライト対応
 * - 標準入力の適切な区切りと表示
 */

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

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== 入力処理モジュール デバッグモード ===\n");

  // 1. 標準入力のテスト
  console.log("1. 標準入力の読み取りテスト");
  console.log("TTY環境:", Deno.stdin.isTerminal());

  if (!Deno.stdin.isTerminal()) {
    console.log("パイプ入力を検出しました。読み取り中...");
    try {
      const stdinContent = await readStdin();
      console.log("標準入力の内容:");
      console.log(stdinContent);
    } catch (error) {
      console.error(
        `標準入力の読み取りエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    console.log("TTY環境のため、パイプ入力はありません。");
  }

  // 2. ファイル読み取りのテスト
  console.log("\n2. ファイル読み取りテスト");
  const testFiles = [
    "deno.json",
    "README.md",
    "src/index.ts",
  ];

  for (const filepath of testFiles) {
    try {
      const result = await readFiles([filepath]);
      if (result.length > 0) {
        console.log(`✓ ${filepath} - ${result[0].content.length}文字`);
      } else {
        console.log(`✗ ${filepath} - 読み取り失敗`);
      }
    } catch (error) {
      console.log(
        `✗ ${filepath} - エラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // 3. 入力統合のテスト
  console.log("\n3. 入力統合テスト");
  try {
    const files = await readFiles(["deno.json"]);
    const stdin = ""; // TTY環境では空
    const combined = formatInputContent(files, stdin);

    console.log("統合された入力の文字数:", combined.length);
    console.log("プレビュー (最初の200文字):");
    console.log(
      combined.substring(0, 200) + (combined.length > 200 ? "..." : ""),
    );
  } catch (error) {
    console.error(
      `統合テストエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // 4. エラーハンドリングのテスト
  console.log("\n4. エラーハンドリングテスト");
  try {
    const nonExistent = await readFiles(["non-existent-file.txt"]);
    console.log(
      "存在しないファイル:",
      nonExistent.length,
      "個のファイルが読み取られました",
    );
  } catch (error) {
    console.log(
      `期待通りのエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  console.log("\nデバッグモード終了");
}
