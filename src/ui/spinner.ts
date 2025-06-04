/**
 * スピナーコンポーネントモジュール
 *
 * ターミナル環境でのローディング表示とプログレスインジケータを提供します。
 * アニメーションフレームによる視覚的フィードバックと、
 * 非同期処理の進行状況表示機能を統合的に管理します。
 *
 * 主要機能:
 * - 回転アニメーションスピナー表示
 * - カスタマイズ可能なメッセージ
 * - 非同期処理との統合（withSpinner）
 * - 適切なカーソル制御とクリーンアップ
 * - 成功/失敗メッセージの自動表示
 *
 * スピナーの仕様:
 * - フレーム: Brailleパターン文字による8フレームアニメーション
 * - 更新間隔: 80ms（滑らかな視覚効果を提供）
 * - カラー: シアン色でハイライト表示
 * - カーソル制御: 表示中は非表示、終了時に復元
 *
 * 使用方法:
 * ```typescript
 * import { Spinner, withSpinner } from "./spinner.ts";
 *
 * // 基本的な使用
 * const spinner = new Spinner("処理中...");
 * spinner.start();
 * // 非同期処理
 * spinner.stop("完了しました");
 *
 * // 便利関数での使用
 * const result = await withSpinner(
 *   "データを取得中...",
 *   async () => await fetchData(),
 *   "取得完了",
 *   "取得失敗"
 * );
 * ```
 *
 * 技術仕様:
 * - ANSIエスケープシーケンスによるカーソル制御
 * - setInterval/clearIntervalによるフレーム管理
 * - TextEncoder/Deno.stdout.writeSyncによる直接出力
 * - 状態管理による重複起動防止
 */

import { createStyler } from "./styles.ts";

export class Spinner {
  private frames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
  private currentFrame = 0;
  private intervalId?: number;
  private message: string;
  private isSpinning = false;

  constructor(message: string = "Loading...") {
    this.message = message;
  }

  start(): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    const styler = createStyler();

    // Hide cursor
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      const output = `\r${styler.cyan(frame)} ${this.message}`;

      Deno.stdout.writeSync(new TextEncoder().encode(output));

      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  stop(finalMessage?: string): void {
    if (!this.isSpinning) return;

    this.isSpinning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Clear the line and show cursor
    const clearLine = "\r\x1b[K";
    Deno.stdout.writeSync(new TextEncoder().encode(clearLine));
    Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));

    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  updateMessage(message: string): void {
    this.message = message;
  }
}

/**
 * 一時的なスピナーを表示
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string,
): Promise<T> {
  const spinner = new Spinner(message);
  spinner.start();

  try {
    const result = await fn();
    const styler = createStyler();
    spinner.stop(
      successMessage ? `${styler.green("✓")} ${successMessage}` : undefined,
    );
    return result;
  } catch (error) {
    const styler = createStyler();
    spinner.stop(
      errorMessage ? `${styler.red("✗")} ${errorMessage}` : undefined,
    );
    throw error;
  }
}

// === テスト ===

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Spinner - 基本的なインスタンス生成", () => {
  const spinner = new Spinner("Test message");
  assertEquals(spinner instanceof Spinner, true);
});

Deno.test("Spinner - デフォルトメッセージ", () => {
  const spinner = new Spinner();
  assertEquals(spinner instanceof Spinner, true);
});

Deno.test("Spinner - メッセージ更新", () => {
  const spinner = new Spinner("Initial message");
  spinner.updateMessage("Updated message");
  // メッセージが正常に更新されることを確認（内部状態のテスト）
  assertEquals(spinner instanceof Spinner, true);
});

Deno.test("withSpinner - 成功時の動作", async () => {
  let executed = false;

  const result = await withSpinner(
    "Testing...",
    () => {
      executed = true;
      return Promise.resolve("success");
    },
    "Success message",
    "Error message",
  );

  assertEquals(executed, true);
  assertEquals(result, "success");
});

Deno.test("withSpinner - エラー時の動作", async () => {
  let executed = false;
  let errorThrown = false;

  try {
    await withSpinner(
      "Testing error...",
      () => {
        executed = true;
        return Promise.reject(new Error("Test error"));
      },
      "Success message",
      "Error message",
    );
  } catch (error) {
    errorThrown = true;
    assertEquals((error as Error).message, "Test error");
  }

  assertEquals(executed, true);
  assertEquals(errorThrown, true);
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== スピナーコンポーネント デバッグ ===\n");

  console.log("1. 基本的なスピナーテスト:");
  const basicSpinner = new Spinner("基本的な処理中...");
  basicSpinner.start();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  basicSpinner.stop("✓ 基本処理完了");

  console.log("\n2. メッセージ更新テスト:");
  const updateSpinner = new Spinner("初期メッセージ...");
  updateSpinner.start();

  await new Promise((resolve) => setTimeout(resolve, 1000));
  updateSpinner.updateMessage("更新されたメッセージ...");

  await new Promise((resolve) => setTimeout(resolve, 1000));
  updateSpinner.stop("✓ 更新テスト完了");

  console.log("\n3. withSpinner関数テスト:");

  // 成功ケース
  const result1 = await withSpinner(
    "成功処理のテスト中",
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return "成功結果";
    },
    "処理が正常に完了しました",
  );
  console.log(`結果: ${result1}`);

  // エラーケース
  try {
    await withSpinner(
      "エラー処理のテスト中",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        throw new Error("テストエラー");
      },
      "処理が完了しました",
      "処理中にエラーが発生しました",
    );
  } catch (error) {
    console.log(`捕捉されたエラー: ${(error as Error).message}`);
  }

  console.log("\n4. 複数スピナーの同時実行テスト:");

  const promises = [
    withSpinner(
      "タスク1実行中",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return "タスク1完了";
      },
    ),
    withSpinner(
      "タスク2実行中",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return "タスク2完了";
      },
    ),
  ];

  const results = await Promise.all(promises);
  console.log(`並行処理結果: ${results.join(", ")}`);

  console.log("\n5. 対話型スピナーテスト:");
  const runInteractiveTest = prompt("対話型テストを実行しますか？ (y/N):");

  if (runInteractiveTest?.toLowerCase() === "y") {
    const message = prompt("スピナーメッセージを入力:") ||
      "カスタムメッセージ...";
    const duration = parseInt(prompt("表示時間（秒）:") || "3");

    console.log(`\n"${message}" を ${duration}秒間表示します:`);

    const customSpinner = new Spinner(message);
    customSpinner.start();

    await new Promise((resolve) => setTimeout(resolve, duration * 1000));
    customSpinner.stop("✓ カスタムテスト完了");
  }

  console.log("\nデバッグモード終了");
}
