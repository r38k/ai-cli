/**
 * CLI引数解析モジュール
 *
 * AI CLIアプリケーションのコマンドライン引数を解析し、適切な実行設定を生成します。
 * 複雑なオプション、サブコマンド、ファイル指定などを統一的に処理し、
 * 型安全で検証済みの設定オブジェクトを提供します。
 *
 * 対応するコマンド形式:
 * - ai [options] [prompt]           # 標準実行
 * - ai auth                         # 認証管理
 * - ai mcp <subcommand>             # MCP設定管理
 * - ai model                        # モデル選択
 * - ai toolset                      # ツールセット選択
 * - ai --help                       # ヘルプ表示
 *
 * 対応するオプション:
 * - --model, -m: AIモデル指定
 * - --max-tokens: 最大トークン数
 * - --system: システムプロンプト
 * - --files, -f: 入力ファイル指定
 * - --verbose, -v: 詳細出力
 * - --tools, -t: ツール有効化
 * - --help, -h: ヘルプ表示
 *
 * 主要機能:
 * - コマンドライン引数の構造化解析
 * - オプション値の型変換と検証
 * - サブコマンドの識別と分岐
 * - ファイルパスの配列処理
 * - エラーハンドリングと使用方法表示
 *
 * 必要な権限:
 * - --allow-env: カラー検出と開発モード環境変数
 *
 * 使用方法:
 * ```typescript
 * const args = parseArgs(Deno.args);
 *
 * switch (args.mode) {
 *   case "interactive":
 *     await runInteractive(args);
 *     break;
 *   case "oneshot":
 *     await runOneshot(args);
 *     break;
 * }
 * ```
 *
 * 出力形式:
 * - ParsedArgs型の構造化データ
 * - 実行モード、オプション、ファイルリストを含む
 * - 後続処理で直接使用可能な形式
 */

import { parseArgs as nodeParseArgs } from "node:util";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { getDefaultModel } from "../api/model.ts";

/**
 * 実行モード
 */
export type ExecutionMode =
  | "interactive"
  | "oneshot"
  | "auth"
  | "mcp"
  | "model"
  | "toolset"
  | "conf";

/**
 * パース結果
 */
export interface ParsedArgs {
  mode: ExecutionMode;
  prompt?: string;
  files: string[];
  mcpSubcommand?: string;
  confSubcommand?: string;
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

  // toolsetコマンドの特別処理
  if (args.length > 0 && args[0] === "toolset") {
    return {
      mode: "toolset",
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

  // confコマンドの特別処理
  if (args.length > 0 && args[0] === "conf") {
    return {
      mode: "conf",
      files: [],
      confSubcommand: args[1],
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
  ai toolset             ツールセットを選択
  ai conf                設定情報を表示

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

  # ツールセット選択
  ai toolset     # インタラクティブにツールセットを選択

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

Deno.test("parseArgs - toolsetコマンドをパース", () => {
  const args = parseArgs(["toolset"]);

  assertEquals(args.mode, "toolset");
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

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== CLI引数解析 デバッグモード ===\n");

  // 1. サンプル引数の解析テスト
  const testCases = [
    // 基本的なケース
    [""],
    ["--help"],
    ["hello world"],
    ["--model", "gemini-2.0-flash-exp"],
    ["--max-tokens", "1000", "質問です"],
    ["--verbose", "--tools", "ファイルを解析して"],
    ["--system", "親切なアシスタント", "こんにちは"],
    ["-f", "deno.json", "設定ファイルを確認"],
    ["--files", "src/index.ts", "src/api/model.ts", "コードレビュー"],

    // 複合ケース
    [
      "--model",
      "gemini-1.5-pro",
      "--verbose",
      "--max-tokens",
      "2000",
      "プロジェクト分析",
    ],
    ["--system", "専門家", "--tools", "--files", "README.md", "文書の要約"],
  ];

  console.log("2. 引数解析テスト:");
  for (let i = 0; i < testCases.length; i++) {
    const args = testCases[i];
    console.log(
      `\nテストケース ${i + 1}: [${args.map((a) => `"${a}"`).join(", ")}]`,
    );

    try {
      const parsed = parseArgs(args);
      console.log(`  ✓ モード: ${parsed.mode}`);
      console.log(
        `  ✓ プロンプト: ${
          parsed.prompt
            ? `"${parsed.prompt.substring(0, 30)}${
              parsed.prompt.length > 30 ? "..." : ""
            }"`
            : "(なし)"
        }`,
      );
      console.log(`  ✓ ファイル数: ${parsed.files?.length || 0}`);
      console.log(`  ✓ オプション:`);
      console.log(`    - help: ${parsed.options.help}`);
      console.log(`    - model: ${parsed.options.model || "(デフォルト)"}`);
      console.log(
        `    - maxTokens: ${parsed.options.maxTokens || "(デフォルト)"}`,
      );
      console.log(`    - verbose: ${parsed.options.verbose}`);
      console.log(`    - tools: ${parsed.options.tools}`);
      if (parsed.options.system) {
        console.log(
          `    - system: "${parsed.options.system.substring(0, 20)}${
            parsed.options.system.length > 20 ? "..." : ""
          }"`,
        );
      }
    } catch (error) {
      console.log(
        `  ✗ エラー: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 3. ヘルプメッセージの表示
  console.log("\n3. ヘルプメッセージ:");
  console.log("=".repeat(50));
  showHelp();
  console.log("=".repeat(50));

  // 4. エラーケースのテスト
  console.log("\n4. エラーケーステスト:");
  const errorCases = [
    ["--invalid-option"],
    ["--model"], // 値なし
    ["--max-tokens", "invalid"], // 無効な数値
    ["--files"], // 値なし
  ];

  for (let i = 0; i < errorCases.length; i++) {
    const args = errorCases[i];
    console.log(
      `\nエラーケース ${i + 1}: [${args.map((a) => `"${a}"`).join(", ")}]`,
    );

    try {
      const parsed = parseArgs(args);
      console.log(`  ⚠ 期待に反して成功: ${JSON.stringify(parsed, null, 2)}`);
    } catch (error) {
      console.log(
        `  ✓ 期待通りエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // 5. 対話型テスト
  console.log("\n5. 対話型テスト:");
  const interactive = prompt(
    "実際のコマンドライン引数を入力してテストしますか？ (y/N):",
  );

  if (interactive?.toLowerCase() === "y") {
    while (true) {
      const input = prompt("\n引数を入力 (空文字で終了):");
      if (!input) break;

      const args = input.split(/\s+/).filter((arg) => arg.length > 0);
      console.log(`入力: [${args.map((a) => `"${a}"`).join(", ")}]`);

      try {
        const parsed = parseArgs(args);
        console.log("解析結果:");
        console.log(JSON.stringify(parsed, null, 2));
      } catch (error) {
        console.log(
          `エラー: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  console.log("\nデバッグモード終了");
}
