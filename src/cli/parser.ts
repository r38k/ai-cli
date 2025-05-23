// 必要な権限: --allow-env (Kleurのカラー検出のため)
import { parseArgs as nodeParseArgs } from "node:util";

/**
 * 実行モード
 */
export type ExecutionMode = "interactive" | "oneshot";

/**
 * パース結果
 */
export interface ParsedArgs {
  mode: ExecutionMode;
  prompt?: string;
  files: string[];
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
 * コマンドライン引数をパース (node:util.parseArgs使用)
 */
export function parseArgs(args: string[]): ParsedArgs {
  const config = {
    options: {
      help: {
        type: "boolean" as const,
        short: "h",
      },
      file: {
        type: "string" as const,
        short: "f",
        multiple: true,
      },
      model: {
        type: "string" as const,
        short: "m",
        default: "gemini-2.0-flash-exp",
      },
      "max-tokens": {
        type: "string" as const, // parseArgsは数値型をサポートしないため
        short: "t",
        default: "1000",
      },
      system: {
        type: "string" as const,
        short: "s",
      },
      verbose: {
        type: "boolean" as const,
        short: "v",
      },
      tools: {
        type: "boolean" as const,
        default: false,
      },
    },
    allowPositionals: true,
  };

  const { values, positionals } = nodeParseArgs({ args, ...config });

  // max-tokensを数値に変換
  const maxTokens = parseInt(values["max-tokens"] as string, 10);
  if (isNaN(maxTokens)) {
    throw new Error("Option --max-tokens requires a numeric value");
  }

  // 結果を構築
  const result: ParsedArgs = {
    mode: positionals.length > 0 ? "oneshot" : "interactive",
    prompt: positionals.length > 0 ? positionals.join(" ") : undefined,
    files: values.file ? (Array.isArray(values.file) ? values.file : [values.file]) : [],
    options: {
      help: values.help ?? false,
      model: values.model as string,
      maxTokens,
      system: values.system as string | undefined,
      verbose: values.verbose ?? false,
      tools: values.tools ?? false,
    },
  };

  return result;
}

/**
 * ヘルプメッセージを表示
 */
export function showHelp(): void {
  console.log(`
AI CLI - Gemini AIを使用したコマンドラインツール

使用方法:
  ai [options] [prompt]

オプション:
  -f, --file <path>      入力ファイルを指定（複数指定可）
  -m, --model <name>     使用するモデルを指定 (default: gemini-2.0-flash-exp)
  -t, --max-tokens <n>   最大出力トークン数 (default: 1000)
  -s, --system <prompt>  システムプロンプトを指定
  -v, --verbose          詳細な出力を表示
  --tools                MCPツールを有効化（ファイル操作等）
  -h, --help             このヘルプを表示

例:
  # インタラクティブモード
  ai

  # ワンショット実行
  ai "package.jsonの依存関係を説明して"

  # ファイルを指定
  ai -f src/index.ts "このコードをレビューして"

  # 複数のオプション
  ai -f README.md -m gemini-pro -t 2000 "より良いREADMEに改善して"

必要な権限:
  --allow-env   # カラー出力の検出のため
  --allow-read  # ファイル読み込みのため
  --allow-net   # Gemini APIアクセスのため
`);
}