// 必要な権限:
// --allow-env   # カラー出力の検出と開発モードでの環境変数読み込みのため
// --allow-read  # ファイル読み込みと設定ファイル読み込みのため
// --allow-write # 認証情報とMCP設定ファイルの書き込みのため
// --allow-net   # Gemini APIアクセスのため
// --allow-run   # MCPサーバープロセスの起動のため

import { parseArgs, showHelp } from "./cli/parser.ts";
import { createExecutionContext, type ExecutionContext } from "./cli/modes.ts";
import { generateText } from "./api/gemini.ts";
import { configureMCPClient } from "./tools/mcp.ts";
import { type Content } from "@google/genai";
import { type Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import {
  box,
  createStreamingBuffer,
  divider,
  error,
  hideSpinner,
  info,
  showSpinner,
  toolCallEnd,
  toolCallStart,
} from "./ui/console.ts";
import { withSpinner } from "./ui/spinner.ts";
import {
  buildContextualPrompt,
  buildWorkingDirectoryContext,
  DEFAULT_SYSTEM_PROMPT,
} from "./core/prompts.ts";
import { runAuth } from "./cli/auth.ts";
import { addMcpServer, listMcpServers, removeMcpServer, showMcpHelp } from "./cli/mcp.ts";

/**
 * インタラクティブモードの実行
 */
async function runInteractiveMode(
  context: ExecutionContext,
  mcpClient: Client[],
) {
  info("インタラクティブモードを開始します。'exit'で終了します。");

  const history: Content[] = [];

  // システムプロンプトを設定（カスタムまたはデフォルト）
  const workingDirContext = buildWorkingDirectoryContext();
  const systemPrompt = context.options.system || DEFAULT_SYSTEM_PROMPT(workingDirContext);

  while (true) {
    const input = prompt(">");

    if (!input) {
      continue;
    }

    if (input === "exit") {
      info("終了します。");
      break;
    }

    history.push({
      role: "user",
      parts: [{ text: input }],
    });

    try {
      // 待機中のスピナー表示
      showSpinner("response", "Thinking");

      const stream = generateText(history, mcpClient, {
        model: context.options.model,
        maxOutputTokens: context.options.maxTokens,
        systemPrompt: systemPrompt,
        onToolCall: (name, params) => {
          hideSpinner("response");
          toolCallStart(name, params);
        },
        onToolResult: (name) => {
          toolCallEnd(name);
          console.log(); // 改行
        },
      });

      let responseText = "";
      let hasToolCalls = false;
      const buffer = createStreamingBuffer();
      let firstChunk = true;

      for await (const chunk of stream) {
        if (chunk.text) {
          // 最初のチャンクが来たらスピナーを隠す
          if (firstChunk) {
            hideSpinner("response");
            firstChunk = false;
          }
          responseText += chunk.text;
          buffer.append(chunk.text);
        } else if (chunk.toolCall) {
          hasToolCalls = true;
        }
      }

      // 残りのバッファを出力
      buffer.flush();
      console.log(); // 最後に改行

      if (hasToolCalls) {
        divider();
      }

      history.push({
        role: "model",
        parts: [{ text: responseText }],
      });
    } catch (err) {
      error(
        `エラーが発生しました: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

/**
 * ワンショットモードの実行
 */
async function runOneshotMode(context: ExecutionContext, mcpClient: Client[]) {
  const history: Content[] = [];

  // システムプロンプトを設定（カスタムまたはデフォルト）
  const workingDirContext = buildWorkingDirectoryContext();
  const systemPrompt = context.options.system || DEFAULT_SYSTEM_PROMPT(workingDirContext);

  // プロンプトを構築
  const { userMessage } = buildContextualPrompt(
    context.inputContent,
    context.prompt,
    context.options.system,
  );

  // ユーザーのメッセージを追加
  if (userMessage) {
    history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });
  }

  try {
    // 待機中のスピナー表示
    showSpinner("response", "Thinking");

    const stream = generateText(history, mcpClient, {
      model: context.options.model,
      maxOutputTokens: context.options.maxTokens,
      systemPrompt: systemPrompt,
      onToolCall: (name, params) => {
        hideSpinner("response");
        toolCallStart(name, params);
      },
      onToolResult: (name) => {
        toolCallEnd(name);
        console.log(); // 改行
      },
    });

    let hasToolCalls = false;
    const buffer = createStreamingBuffer();
    let firstChunk = true;

    for await (const chunk of stream) {
      if (chunk.text) {
        // 最初のチャンクが来たらスピナーを隠す
        if (firstChunk) {
          hideSpinner("response");
          firstChunk = false;
        }
        buffer.append(chunk.text);
      } else if (chunk.toolCall) {
        hasToolCalls = true;
      }
    }

    // 残りのバッファを出力
    buffer.flush();
    console.log(); // 最後に改行
    
    if (hasToolCalls) {
      divider();
    }
  } catch (err) {
    error(
      `エラーが発生しました: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    Deno.exit(1);
  }
}

/**
 * メイン関数
 */
async function main() {
  try {
    // コマンドライン引数をパース
    const args = parseArgs(Deno.args);

    // ヘルプ表示
    if (args.options.help) {
      showHelp();
      return;
    }

    // authコマンドの処理
    if (args.mode === "auth") {
      await runAuth();
      return;
    }

    // mcpコマンドの処理
    if (args.mode === "mcp") {
      switch (args.mcpSubcommand) {
        case "add":
          await addMcpServer();
          break;
        case "list":
          await listMcpServers();
          break;
        case "remove":
          await removeMcpServer();
          break;
        case "help":
        default:
          showMcpHelp();
          break;
      }
      return;
    }

    // 実行コンテキストを作成
    const context = await createExecutionContext(args);

    // 詳細モードの場合は情報を表示
    if (context.options.verbose) {
      box(
        `モード: ${context.mode}\nモデル: ${context.options.model}\n最大トークン数: ${context.options.maxTokens}\nツール: ${
          context.options.tools ? "有効" : "無効"
        }`,
        "設定",
      );
    }

    // MCPクライアントを設定（--toolsオプションが有効な場合のみ）
    const mcpClient = context.options.tools
      ? await withSpinner(
        "MCPサーバーに接続中...",
        () => configureMCPClient(),
        "MCPサーバーに接続しました",
      )
      : [];

    // モードに応じて実行
    if (context.mode === "interactive") {
      await runInteractiveMode(context, mcpClient);
    } else {
      await runOneshotMode(context, mcpClient);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("Unknown option")) {
      error(errorMessage);
      console.log("\n使用方法については -h または --help を参照してください。");
    } else {
      error(`エラーが発生しました: ${errorMessage}`);
    }
    Deno.exit(1);
  }
}

// メイン関数を実行
if (import.meta.main) {
  main();
}
