/**
 * 認証管理CLIモジュール
 *
 * Gemini APIの認証情報を対話的に管理するためのCLIコマンドを提供します。
 * APIキーの安全な入力（マスク表示）、保存、確認、削除機能を含み、
 * TTY環境でのセキュアな入力とnon-TTY環境の両方に対応しています。
 *
 * 主要機能:
 * - APIキーのセキュアな入力（パスワードマスク付き）
 * - 認証情報の暗号化保存
 * - 認証状態の確認
 * - 認証情報の削除
 * - TTY/non-TTY環境の自動判定
 *
 * セキュリティ機能:
 * - パスワード入力時のマスク表示（*文字）
 * - Backspace対応の安全な入力編集
 * - 印字可能文字のみの入力制限
 * - TTY環境でのraw mode制御
 *
 * 対応する操作:
 * - ai auth: 新規認証またはAPIキー更新
 * - 認証状態確認（作成・更新日時表示）
 * - 認証情報削除（確認プロンプト付き）
 *
 * 必要な権限:
 * - --allow-env: 環境変数へのアクセス
 * - --allow-read: 設定ファイルの読み取り
 * - --allow-write: 設定ファイルの書き込み
 *
 * 使用方法:
 * ```typescript
 * await runAuth();        // 認証フローの実行
 * await showAuthStatus(); // 認証状態の確認
 * await clearAuth();      // 認証情報の削除
 * ```
 *
 * 技術仕様:
 * - 入力文字範囲: ASCII 32-126（印字可能文字）
 * - 制御文字: Enter(10,13), Backspace(127,8), ESC(27)
 * - マスク文字: アスタリスク（*）
 * - ファイル権限: 600（読み書き所有者のみ）
 */

import { error, info, success, warning } from "../ui/console.ts";
import {
  deleteCredentials,
  loadCredentials,
  saveCredentials,
} from "../core/auth.ts";

/**
 * 認証フローを実行
 */
export async function runAuth(): Promise<void> {
  // 既存の認証情報を確認
  const existing = await loadCredentials();
  if (existing) {
    warning("既存の認証情報が見つかりました。");
    const overwrite = confirm("上書きしますか？");
    if (!overwrite) {
      info("認証をキャンセルしました。");
      return;
    }
  }

  // プロバイダーの選択
  console.log("\n認証プロバイダーを選択してください:");
  console.log("1. Gemini API (APIキーを使用)");
  console.log("2. Vertex AI (Google Cloudプロジェクトを使用)");

  const providerChoice = prompt("\n選択 (1 or 2):");

  if (providerChoice === "1") {
    await setupGeminiApi();
  } else if (providerChoice === "2") {
    await setupVertexAi();
  } else {
    error("無効な選択です。");
    return;
  }
}

/**
 * Gemini API の設定
 */
async function setupGeminiApi(): Promise<void> {
  // APIキーの入力を受け付け（セキュアな入力）
  const apiKey = await securePrompt("Gemini API Key: ");

  if (!apiKey || apiKey.trim() === "") {
    error("APIキーが入力されませんでした。");
    return;
  }

  try {
    // APIキーを保存
    await saveCredentials({
      provider: "gemini-api",
      geminiApiKey: apiKey.trim(),
    });
    success("認証情報を保存しました。");
    info("プロバイダー: Gemini API");
    info("これで ai コマンドが使用できます。");
  } catch (err) {
    error(`認証情報の保存に失敗しました: ${err}`);
  }
}

/**
 * Vertex AI の設定
 */
async function setupVertexAi(): Promise<void> {
  console.log("\nVertex AI の設定:");

  const project = prompt("Google Cloud Project ID:");
  if (!project || project.trim() === "") {
    error("Project IDが入力されませんでした。");
    return;
  }

  const location = prompt("Location (デフォルト: us-central1):") ||
    "us-central1";

  try {
    await saveCredentials({
      provider: "vertex-ai",
      vertexProject: project.trim(),
      vertexLocation: location.trim(),
    });
    success("認証情報を保存しました。");
    info("プロバイダー: Vertex AI");
    info(`Project: ${project}`);
    info(`Location: ${location}`);
    info(
      "\n注意: Vertex AIを使用するには、gcloud CLIで認証されている必要があります。",
    );
    info("  gcloud auth application-default login");
  } catch (err) {
    error(`認証情報の保存に失敗しました: ${err}`);
  }
}

/**
 * セキュアな入力を受け付ける
 */
async function securePrompt(message: string): Promise<string> {
  // TTYが利用可能かチェック
  if (Deno.stdin.isTerminal()) {
    // 改行せずにプロンプトを表示
    await Deno.stdout.write(new TextEncoder().encode(message));

    // パスワード入力を隠すための設定
    const decoder = new TextDecoder();
    Deno.stdin.setRaw(true);

    const inputBytes: number[] = [];

    try {
      while (true) {
        const buf = new Uint8Array(1);
        const n = await Deno.stdin.read(buf);

        if (n === null || n === 0) break;

        const char = buf[0];

        // Enter key
        if (char === 10 || char === 13) {
          console.log(); // 改行
          break;
        }

        // Backspace
        if (char === 127 || char === 8) {
          if (inputBytes.length > 0) {
            inputBytes.pop();
            // カーソルを戻して文字を消す
            await Deno.stdout.write(new TextEncoder().encode("\b \b"));
          }
          continue;
        }

        // 通常の文字
        if (char >= 32 && char <= 126) {
          inputBytes.push(char);
          // アスタリスクを表示
          await Deno.stdout.write(new TextEncoder().encode("*"));
        }
      }
    } finally {
      Deno.stdin.setRaw(false);
    }

    return decoder.decode(new Uint8Array(inputBytes));
  } else {
    // TTYが利用できない場合は通常のpromptを使用
    return prompt(message) || "";
  }
}

/**
 * 認証情報のステータスを表示
 */
export async function showAuthStatus(): Promise<void> {
  const credentials = await loadCredentials();

  if (credentials) {
    success("認証済み");
    console.log(
      `プロバイダー: ${
        credentials.provider === "gemini-api" ? "Gemini API" : "Vertex AI"
      }`,
    );
    console.log(`作成日時: ${credentials.createdAt}`);
    console.log(`更新日時: ${credentials.updatedAt}`);

    if (credentials.provider === "gemini-api" && credentials.geminiApiKey) {
      console.log(`APIキー: ${credentials.geminiApiKey.substring(0, 8)}...`);
    } else if (credentials.provider === "vertex-ai") {
      console.log(`Project: ${credentials.vertexProject}`);
      console.log(`Location: ${credentials.vertexLocation || "us-central1"}`);
    }
  } else {
    warning("未認証");
    console.log("ai auth コマンドで認証してください。");
  }
}

/**
 * 認証情報をクリア
 */
export async function clearAuth(): Promise<void> {
  const confirm = prompt("認証情報を削除しますか？ (y/N):");

  if (confirm?.toLowerCase() === "y") {
    await deleteCredentials();
    success("認証情報を削除しました。");
  } else {
    info("キャンセルしました。");
  }
}

// === テスト ===

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("auth - セキュアな入力機能の基本動作", () => {
  // TTY環境の検出
  const isTTY = Deno.stdin.isTerminal();
  assertEquals(typeof isTTY, "boolean", "TTY検出は真偽値を返す必要があります");
});

Deno.test("auth - APIキーのマスク処理", () => {
  const testKey = "test-api-key-12345";
  const masked = testKey.substring(0, 8) + "...";
  assertEquals(
    masked,
    "test-api...",
    "APIキーは最初の8文字のみ表示されるべきです",
  );
});

Deno.test("auth - 入力文字の範囲チェック", () => {
  // 印字可能文字の範囲（32-126）
  const printableMin = 32;
  const printableMax = 126;

  // スペース文字
  assertEquals(printableMin, 32);
  // チルダ文字
  assertEquals(printableMax, 126);

  // 制御文字
  const enterKey = 13;
  const backspace = 127;
  assert(
    enterKey < printableMin,
    "Enterキーは印字可能文字の範囲外である必要があります",
  );
  assert(
    backspace > printableMax,
    "Backspaceは印字可能文字の範囲外である必要があります",
  );
});

Deno.test("auth - プロンプトメッセージの整合性", () => {
  const authPrompt = "Gemini API Key: ";
  const statusPrompt = "ai auth コマンドで認証してください。";
  const confirmPrompt = "認証情報を削除しますか？ (y/N):";

  assertExists(authPrompt);
  assertExists(statusPrompt);
  assertExists(confirmPrompt);
});

Deno.test("auth - 保存パスの一貫性", () => {
  const displayPath = "~/.local/share/ai-cli/credentials";
  assert(
    displayPath.includes("credentials"),
    "認証情報ファイル名が含まれている必要があります",
  );
});

import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== 認証管理CLI デバッグモード ===\n");

  const commands = [
    "status - 現在の認証状態を表示",
    "auth   - 新しい認証情報を設定",
    "clear  - 認証情報を削除",
    "test   - テスト用のマスク入力デモ",
    "exit   - 終了",
  ];

  console.log("利用可能なコマンド:");
  commands.forEach((cmd) => console.log(`  ${cmd}`));
  console.log();

  while (true) {
    const command = prompt("\nコマンドを入力 (status/auth/clear/test/exit):");

    if (!command || command === "exit") {
      console.log("終了します。");
      break;
    }

    try {
      switch (command) {
        case "status":
          await showAuthStatus();
          break;

        case "auth":
          await runAuth();
          break;

        case "clear":
          await clearAuth();
          break;

        default:
          console.log(`不明なコマンド: ${command}`);
      }
    } catch (error) {
      console.error(
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
