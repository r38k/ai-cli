/**
 * 設定管理CLIモジュール
 *
 * AI CLIツールの設定情報を表示・管理するためのCLIコマンドを提供します。
 * 認証プロバイダー、モデル設定、ツールセット設定など、
 * 現在の設定状態を確認できます。
 *
 * 主要機能:
 * - 認証プロバイダーの表示（Gemini API/Vertex AI）
 * - デフォルトモデルの表示
 * - ツールセット設定の表示
 * - 設定ファイルパスの表示
 *
 * サブコマンド:
 * - show/get: 現在の設定を表示
 * - help: ヘルプメッセージを表示
 *
 * 使用方法:
 * ```bash
 * ai conf          # 設定を表示
 * ai conf show     # 設定を表示
 * ai conf help     # ヘルプを表示
 * ```
 */

import { error, info, success, warning } from "../ui/console.ts";
import {
  getApiKey,
  getProvider,
  getVertexConfig,
  loadCredentials,
} from "../core/auth.ts";
import { getDefaultModel } from "../api/model.ts";
import { getDefaultToolset } from "../core/preferences.ts";
import { getXdgConfigDir, getXdgDataDir } from "../core/xdg.ts";

/**
 * 設定表示のメインコマンド
 */
export async function runConf(subcommand?: string): Promise<void> {
  // サブコマンドの処理
  switch (subcommand) {
    case undefined:
    case "":
    case "show":
    case "get":
      await showConfig();
      break;
    case "help":
      showHelp();
      break;
    default:
      error(`不明なサブコマンド: ${subcommand}`);
      showHelp();
      break;
  }
}

/**
 * 現在の設定を表示
 */
async function showConfig(): Promise<void> {
  console.log("\n=== AI CLI 設定情報 ===\n");

  // 認証情報
  console.log("【認証設定】");
  const credentials = await loadCredentials();
  const provider = await getProvider();

  if (credentials && provider) {
    success(
      `プロバイダー: ${provider === "gemini-api" ? "Gemini API" : "Vertex AI"}`,
    );

    if (provider === "gemini-api") {
      const apiKey = await getApiKey();
      if (apiKey) {
        console.log(`  APIキー: ${apiKey.substring(0, 8)}...`);
      }
    } else if (provider === "vertex-ai") {
      const vertexConfig = await getVertexConfig();
      if (vertexConfig) {
        console.log(`  Project: ${vertexConfig.project}`);
        console.log(`  Location: ${vertexConfig.location}`);
      }
    }

    console.log(`  作成日時: ${credentials.createdAt}`);
    console.log(`  更新日時: ${credentials.updatedAt}`);
  } else {
    warning("未認証");
    console.log("  'ai auth' コマンドで認証してください");
  }

  console.log("\n【モデル設定】");
  const defaultModel = getDefaultModel();
  console.log(`  デフォルトモデル: ${defaultModel}`);

  console.log("\n【ツール設定】");
  try {
    const toolset = await getDefaultToolset();
    console.log(`  デフォルトツールセット: ${toolset}`);

    const toolsetDescriptions: Record<string, string> = {
      custom: "MCPサーバー経由のカスタムツール",
      builtin: "Gemini標準ツール（コード実行+Google検索）",
      codeExecution: "コード実行専用",
      googleSearch: "Google検索専用",
    };

    const description = toolsetDescriptions[toolset];
    if (description) {
      info(`  説明: ${description}`);
    }
  } catch (err) {
    error(`ツールセット取得エラー: ${err}`);
  }

  console.log("\n【設定ファイル】");
  const configDir = getXdgConfigDir();
  const dataDir = getXdgDataDir();

  console.log(`  設定ディレクトリ: ${configDir}`);
  console.log(`    - preferences.json (モデル・ツール設定)`);
  console.log(`    - mcp-config.json (MCPサーバー設定)`);

  console.log(`  データディレクトリ: ${dataDir}`);
  console.log(`    - credentials (認証情報)`);

  console.log("\n【環境変数（開発モード用）】");
  const isDev = Deno.env.get("DENO_ENV") === "development";
  if (isDev) {
    info("開発モードが有効です");
    const envApiKey = Deno.env.get("GEMINI_API_KEY");
    const envMcpPath = Deno.env.get("MCP_CONFIG_PATH");

    if (envApiKey) {
      console.log(
        `  GEMINI_API_KEY: 設定済み (${envApiKey.substring(0, 8)}...)`,
      );
    }
    if (envMcpPath) {
      console.log(`  MCP_CONFIG_PATH: ${envMcpPath}`);
    }
  } else {
    console.log("  開発モードは無効です");
  }

  console.log("");
}

/**
 * ヘルプメッセージを表示
 */
function showHelp(): void {
  console.log(`
AI CLI 設定管理コマンド

使用方法:
  ai conf [サブコマンド]

サブコマンド:
  show    現在の設定を表示（デフォルト）
  get     現在の設定を表示（showと同じ）
  help    このヘルプメッセージを表示

例:
  ai conf          # 設定を表示
  ai conf show     # 設定を表示
  ai conf help     # ヘルプを表示

関連コマンド:
  ai auth          # 認証設定を変更
  ai model         # デフォルトモデルを変更
  ai toolset       # ツールセットを変更
  ai mcp           # MCPサーバー設定を管理
`);
}

// === テスト ===
Deno.test("conf - showConfig関数の存在確認", () => {
  // showConfig関数が定義されていることを確認
  const functionExists = typeof showConfig === "function";
  if (!functionExists) {
    throw new Error("showConfig関数が定義されていません");
  }
});

Deno.test("conf - runConf関数の存在確認", () => {
  // runConf関数が定義されていることを確認
  const functionExists = typeof runConf === "function";
  if (!functionExists) {
    throw new Error("runConf関数が定義されていません");
  }
});

// === デバッグ用サンプル実行 ===
if (import.meta.main) {
  console.log("=== 設定管理CLI デバッグモード ===\n");

  const commands = [
    "show - 現在の設定を表示",
    "help - ヘルプを表示",
    "exit - 終了",
  ];

  console.log("利用可能なコマンド:");
  commands.forEach((cmd) => console.log(`  ${cmd}`));
  console.log();

  while (true) {
    const command = prompt("\nサブコマンドを入力 (show/help/exit):");

    if (!command || command === "exit") {
      console.log("終了します。");
      break;
    }

    try {
      await runConf(command);
    } catch (err) {
      console.error(
        `エラー: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
