// 必要な権限: --allow-env (Kleurのカラー検出と開発モードでの環境変数読み込みのため)
import { parseArgs as nodeParseArgs } from "node:util";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { getDefaultModel } from "../api/model.ts";

/**
 * 実行モード
 */
export type ExecutionMode = "interactive" | "oneshot" | "auth" | "mcp" | "model";

/**
 * パース結果
 */
export interface ParsedArgs {
  mode: ExecutionMode;
  prompt?: string;
  files: string[];
  mcpSubcommand?: string;
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
  // authコマンドの特別処理
  if (args.length > 0 && args[0] === "auth") {
    return {
      mode: "auth",
      files: [],
      options: {
        help: false,
        model: getDefaultModel(),
        maxTokens: 1000,
        verbose: false,
        tools: false,
      },
    };
  }

  // mcpコマンドの特別処理
  if (args.length > 0 && args[0] === "mcp") {
    return {
      mode: "mcp",
      files: [],
      mcpSubcommand: args[1] || "help",
      options: {
        help: false,
        model: getDefaultModel(),
        maxTokens: 1000,
        verbose: false,
        tools: false,
      },
    };
  }

  // modelコマンドの特別処理
  if (args.length > 0 && args[0] === "model") {
    return {
      mode: "model",
      files: [],
      options: {
        help: false,
        model: getDefaultModel(),
        maxTokens: 1000,
        verbose: false,
        tools: false,
      },
    };
  }

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
        default: getDefaultModel(),
      },
      "max-tokens": {
        type: "string" as const, // parseArgsは数値型をサポートしないため
        short: "t",
        default: "8192",
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
    files: values.file
      ? (Array.isArray(values.file) ? values.file : [values.file])
      : [],
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
  ai auth                認証を設定
  ai mcp <subcommand>    MCP設定を管理
  ai model               モデルを選択

オプション:
  -f, --file <path>      入力ファイルを指定（複数指定可）
  -m, --model <name>     使用するモデルを指定 (default: ${getDefaultModel()})
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

  # 認証設定
  ai auth

  # MCP設定管理
  ai mcp add     # MCPサーバーを追加
  ai mcp list    # 設定済みサーバーを表示

  # モデル選択
  ai model       # インタラクティブにモデルを選択

必要な権限:
  --allow-env   # カラー出力の検出と開発モードでの環境変数読み込みのため
  --allow-read  # ファイル読み込みと設定ファイル読み込みのため
  --allow-write # 認証情報とMCP設定ファイルの書き込みのため
  --allow-net   # Gemini APIアクセスのため
  --allow-run   # MCPサーバープロセスの起動のため（--toolsオプション使用時）
`);
}

Deno.test("parseArgs - authコマンドをパース", () => {
  const args = parseArgs(["auth"]);

  assertEquals(args.mode, "auth");
  assertEquals(args.files, []);
  assertEquals(args.options.help, false);
  assertEquals(args.options.model, getDefaultModel());
  assertEquals(args.options.maxTokens, 1000);
  assertEquals(args.options.verbose, false);
  assertEquals(args.options.tools, false);
});

Deno.test("parseArgs - mcpコマンドをパース", () => {
  const args = parseArgs(["mcp", "add"]);

  assertEquals(args.mode, "mcp");
  assertEquals(args.mcpSubcommand, "add");
  assertEquals(args.files, []);
  assertEquals(args.options.help, false);
  assertEquals(args.options.model, getDefaultModel());
  assertEquals(args.options.maxTokens, 1000);
  assertEquals(args.options.verbose, false);
  assertEquals(args.options.tools, false);
});

Deno.test("parseArgs - mcpコマンド（サブコマンドなし）", () => {
  const args = parseArgs(["mcp"]);

  assertEquals(args.mode, "mcp");
  assertEquals(args.mcpSubcommand, "help");
  assertEquals(args.files, []);
});

Deno.test("parseArgs - mcpコマンド（各サブコマンド）", () => {
  const subcommands = ["add", "list", "remove", "help"];
  
  for (const subcommand of subcommands) {
    const args = parseArgs(["mcp", subcommand]);
    assertEquals(args.mode, "mcp");
    assertEquals(args.mcpSubcommand, subcommand);
  }
});

Deno.test("parseArgs - modelコマンドをパース", () => {
  const args = parseArgs(["model"]);

  assertEquals(args.mode, "model");
  assertEquals(args.files, []);
  assertEquals(args.options.help, false);
  assertEquals(args.options.model, getDefaultModel());
  assertEquals(args.options.maxTokens, 1000);
  assertEquals(args.options.verbose, false);
  assertEquals(args.options.tools, false);
});

Deno.test("showHelp - ヘルプメッセージを表示", () => {
  const originalLog = console.log;
  let output = "";
  console.log = (message: unknown) => {
    output = String(message);
  };

  showHelp();

  // ヘルプメッセージに含まれるべき内容をチェック
  assertEquals(output.includes("AI CLI"), true);
  assertEquals(output.includes("使用方法:"), true);
  assertEquals(output.includes("オプション:"), true);
  assertEquals(output.includes("-h, --help"), true);
  assertEquals(output.includes("ai auth"), true);
  assertEquals(output.includes("ai mcp"), true);

  console.log = originalLog;
});
