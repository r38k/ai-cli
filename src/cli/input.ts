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

import { formatFileContent } from "../core/prompts.ts";

/**
 * 入力内容をフォーマット
 * @param files ファイル内容の配列
 * @param stdin 標準入力の内容
 * @returns フォーマットされた入力文字列
 */
export function formatInputContent(
  files: InputContent[],
  stdin: string = ""
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