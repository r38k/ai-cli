// 必要な権限: --allow-read (ファイル読み込みのため)
import { type ParsedArgs } from "./parser.ts";
import { readStdin, readFiles, formatInputContent } from "./input.ts";

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
  args: ParsedArgs
): Promise<ExecutionContext> {
  // 標準入力を読み取る
  const stdinContent = await readStdin();
  
  // ファイルを読み取る
  const fileContents = await readFiles(args.files);
  
  // 入力内容をフォーマット
  const inputContent = formatInputContent(fileContents, stdinContent);

  return {
    mode: args.mode,
    prompt: args.prompt,
    inputContent,
    options: args.options,
  };
}