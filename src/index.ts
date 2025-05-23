// 必要な権限:
// --allow-env   # カラー出力の検出とMCP設定読み込みのため
// --allow-read  # ファイル読み込みとMCP設定読み込みのため
// --allow-net   # Gemini APIアクセスのため
// --allow-run   # MCPサーバープロセスの起動のため

import { parseArgs, showHelp } from "./cli/parser.ts";
import { createExecutionContext, type ExecutionContext } from "./cli/modes.ts";
import { generateText } from "./api/gemini.ts";
import { configureMCPClient } from "./tools/mcp.ts";
import { type Content } from "@google/genai";
import { type Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { error, info } from "./ui/console.ts";
import { 
  DEFAULT_SYSTEM_PROMPT, 
  buildContextualPrompt,
  buildWorkingDirectoryContext 
} from "./core/prompts.ts";

/**
 * インタラクティブモードの実行
 */
async function runInteractiveMode(context: ExecutionContext, mcpClient: Client[]) {
  info("インタラクティブモードを開始します。'exit'で終了します。");
  
  const history: Content[] = [];
  
  // システムプロンプトを設定（カスタムまたはデフォルト）
  const systemPrompt = context.options.system || DEFAULT_SYSTEM_PROMPT;
  const workingDirContext = buildWorkingDirectoryContext();
  
  history.push({
    role: "user",
    parts: [{ text: `${systemPrompt}\n\n${workingDirContext}` }]
  });
  history.push({
    role: "model",
    parts: [{ text: "了解しました。プログラミングに関する質問やタスクをお手伝いします。" }]
  });

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
      parts: [{ text: input }]
    });

    try {
      const stream = await generateText(history, mcpClient, {
        model: context.options.model,
        maxOutputTokens: context.options.maxTokens
      });
      let responseText = "";
      
      for await (const chunk of stream) {
        if (chunk.text) {
          responseText += chunk.text;
          Deno.stdout.writeSync(new TextEncoder().encode(chunk.text));
        }
      }
      
      console.log(); // 改行
      
      history.push({
        role: "model",
        parts: [{ text: responseText }]
      });
    } catch (err) {
      error(`エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * ワンショットモードの実行
 */
async function runOneshotMode(context: ExecutionContext, mcpClient: Client[]) {
  const history: Content[] = [];
  
  // システムプロンプトを設定（カスタムまたはデフォルト）
  const systemPrompt = context.options.system || DEFAULT_SYSTEM_PROMPT;
  const workingDirContext = buildWorkingDirectoryContext();
  
  // プロンプトを構築
  const { userMessage } = buildContextualPrompt(
    context.inputContent,
    context.prompt,
    context.options.system
  );
  
  history.push({
    role: "user",
    parts: [{ text: `${systemPrompt}\n\n${workingDirContext}` }]
  });
  history.push({
    role: "model",
    parts: [{ text: "了解しました。" }]
  });
  
  // ユーザーのメッセージを追加
  if (userMessage) {
    history.push({
      role: "user",
      parts: [{ text: userMessage }]
    });
  }

  try {
    const stream = await generateText(history, mcpClient, {
      model: context.options.model,
      maxOutputTokens: context.options.maxTokens
    });
    
    for await (const chunk of stream) {
      if (chunk.text) {
        Deno.stdout.writeSync(new TextEncoder().encode(chunk.text));
      }
    }
    
    console.log(); // 改行
  } catch (err) {
    error(`エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
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
    
    // 実行コンテキストを作成
    const context = await createExecutionContext(args);
    
    // 詳細モードの場合は情報を表示
    if (context.options.verbose) {
      info(`モード: ${context.mode}`);
      info(`モデル: ${context.options.model}`);
      info(`最大トークン数: ${context.options.maxTokens}`);
      info(`ツール: ${context.options.tools ? "有効" : "無効"}`);
    }
    
    // MCPクライアントを設定（--toolsオプションが有効な場合のみ）
    const mcpClient = context.options.tools ? await configureMCPClient() : [];
    
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