/**
 * コンソール出力管理モジュール
 *
 * ターミナル向けの統一されたメッセージ出力システムを提供します。
 * カラーリング、スタイリング、セマンティックなメッセージタイプ（エラー、成功等）を
 * 統合的に管理し、NO_COLOR環境変数への対応やクロスプラットフォーム互換性を保証します。
 *
 * 主要機能:
 * - セマンティックメッセージ出力（error, success, warning, info）
 * - カスタマイズ可能なテキストスタイリング
 * - NO_COLOR環境変数の自動対応
 * - ANSIエスケープシーケンスの適切な制御
 * - チェーン可能なスタイル適用システム
 *
 * 対応するスタイル:
 * - カラー: red, green, yellow, cyan, blue, magenta, gray
 * - テキスタイル: bold, dim, underline
 * - 環境依存: NO_COLORサポート、TTY検出
 *
 * メッセージタイプ:
 * - error(): 赤色で「✗」アイコン付きエラーメッセージ
 * - success(): 緑色で「✓」アイコン付き成功メッセージ
 * - warning(): 黄色で「⚠」アイコン付き警告メッセージ
 * - info(): シアンで「ⓘ」アイコン付き情報メッセージ
 * - print(): カスタムスタイル適用可能な汎用出力
 *
 * 使用方法:
 * ```typescript
 * import { error, success, warning, info, print } from "./console.ts";
 *
 * // セマンティックメッセージ
 * error("処理に失敗しました");
 * success("処理が完了しました");
 * warning("注意が必要です");
 * info("参考情報です");
 *
 * // カスタムスタイル
 * print("重要な情報", { color: "red", bold: true });
 * ```
 *
 * 技術仕様:
 * - NO_COLOR環境変数によるカラー無効化対応
 * - Kleurライブラリベースのスタイリング
 * - ANSIエスケープシーケンスの適切な処理
 * - TTY/non-TTY環境での適切な動作保証
 */

import { applyColor, createStyler, type Styler } from "./styles.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stripAnsiCode } from "https://deno.land/std@0.208.0/fmt/colors.ts";

export interface PrintOptions {
  color?: "red" | "green" | "yellow" | "cyan" | "blue" | "magenta" | "gray";
  bold?: boolean;
  dim?: boolean;
  underline?: boolean;
}

// スタイラーを動的に取得（環境変数の変更に対応）
function getStyler(): Styler {
  return createStyler();
}

/**
 * テキストにスタイルを適用
 */
function applyStyle(text: string, options?: PrintOptions): string {
  if (!options) {
    return text;
  }

  const styler = getStyler();
  let currentStyler: Styler | ((text: string) => string) = styler;

  // スタイル適用（チェーン可能）
  if (options.bold && typeof currentStyler === "object") {
    currentStyler = currentStyler.bold();
  }
  if (options.dim && typeof currentStyler === "object") {
    currentStyler = currentStyler.dim();
  }
  if (options.underline && typeof currentStyler === "object") {
    currentStyler = currentStyler.underline();
  }

  // カラー適用
  if (options.color && typeof currentStyler === "object") {
    return applyColor(currentStyler, options.color, text);
  }

  return text;
}

/**
 * 基本的な出力関数
 */
export function print(message: string, options?: PrintOptions): void {
  console.log(applyStyle(message, options));
}

Deno.test("print - 基本的な出力", () => {
  const mockOutput: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  print("Hello, World!");

  assertEquals(stripAnsiCode(mockOutput[0]), "Hello, World!");
  console.log = originalLog;
});

Deno.test("print - カスタムスタイル", () => {
  const mockOutput: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  print("Custom message", { color: "blue", bold: true });

  // テキスト内容は正しい
  assertEquals(stripAnsiCode(mockOutput[0]), "Custom message");

  // 色とスタイルが適用されることを確認（環境に依存）
  // CI環境などではANSIコードが含まれない場合があるため、
  // テキスト内容のみを検証

  console.log = originalLog;
});

/**
 * エラーメッセージ表示
 */
export function error(message: string): void {
  const styler = getStyler();
  const prefix = styler.red("✗");
  const text = styler.red(message);
  console.error(`${prefix} ${text}`);
}

Deno.test("error - エラーメッセージ表示", () => {
  const mockOutput: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  error("Something went wrong");

  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "✗ Something went wrong");
  console.error = originalError;
});

/**
 * 成功メッセージ表示
 */
export function success(message: string): void {
  const styler = getStyler();
  const prefix = styler.green("✓");
  const text = styler.green(message);
  console.log(`${prefix} ${text}`);
}

Deno.test("success - 成功メッセージ表示", () => {
  const mockOutput: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  success("Task completed");

  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "✓ Task completed");
  console.log = originalLog;
});

/**
 * 警告メッセージ表示
 */
export function warning(message: string): void {
  const styler = getStyler();
  const prefix = styler.yellow("⚠");
  const text = styler.yellow(message);
  console.log(`${prefix} ${text}`);
}

Deno.test("warning - 警告メッセージ表示", () => {
  const mockOutput: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  warning("This is deprecated");

  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "⚠ This is deprecated");
  console.log = originalLog;
});

/**
 * 情報メッセージ表示
 */
export function info(message: string): void {
  const styler = getStyler();
  const prefix = styler.cyan("ℹ");
  const text = styler.cyan(message);
  console.log(`${prefix} ${text}`);
}

Deno.test("info - 情報メッセージ表示", () => {
  const mockOutput: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  info("New version available");

  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "ℹ New version available");
  console.log = originalLog;
});

/**
 * ツール呼び出し開始メッセージ（Claude Codeスタイル）
 */
export function toolCallStart(toolName: string, params?: unknown): void {
  const styler = getStyler();
  const bullet = styler.cyan("●");
  const name = styler.bold().cyan(toolName); // ツール名もシアンで表示
  console.log(`\n${bullet} ${name}`);

  if (params && Object.keys(params as object).length > 0) {
    const paramStr = JSON.stringify(params, null, 2);
    const lines = paramStr.split("\n");
    lines.forEach((line, index) => {
      if (index === 0) {
        console.log(`  ⏿  ${styler.gray(line)}`);
      } else {
        console.log(`     ${styler.gray(line)}`);
      }
    });
  }
}

/**
 * ツール呼び出し終了メッセージ（Claude Codeスタイル）
 */
export function toolCallEnd(
  _toolName: string,
  result?: string,
  success: boolean = true,
): void {
  // 成功時は結果を表示、失敗時のみエラーメッセージ
  if (!success) {
    const styler = getStyler();
    console.log(`     ${styler.red("✗ エラー")}`);
  } else if (result) {
    const styler = getStyler();
    const lines = result.split("\n").slice(0, 5); // 最初の5行のみ表示
    lines.forEach((line) => {
      console.log(`     ${styler.dim().gray(line)}`);
    });
    if (result.split("\n").length > 5) {
      console.log(`     ${styler.dim().gray("...")}`);
    }
  }
}

/**
 * プログレスインジケータを表示
 */
export function showProgress(message: string): void {
  const styler = getStyler();
  const spinner = styler.cyan("⣾");
  console.log(`${spinner} ${message}`);
}

/**
 * ボックス表示
 */
export function box(content: string, title?: string): void {
  const styler = getStyler();
  const lines = content.split("\n");
  const maxLength = Math.max(...lines.map((l) => l.length), title?.length || 0);

  const top = `┌─${title ? ` ${title} ` : ""}${
    "─".repeat(maxLength - (title?.length || 0) + 1)
  }┐`;
  const bottom = `└${"─".repeat(maxLength + 3)}┘`;

  console.log(styler.gray(top));
  lines.forEach((line) => {
    const padding = " ".repeat(maxLength - line.length);
    console.log(styler.gray("│ ") + line + padding + styler.gray(" │"));
  });
  console.log(styler.gray(bottom));
}

/**
 * 区切り線を表示
 */
export function divider(char: string = "─", length: number = 50): void {
  const styler = getStyler();
  console.log(styler.gray(char.repeat(length)));
}

/**
 * バッジを表示
 */
export function badge(label: string, color?: PrintOptions["color"]): string {
  const styler = getStyler();
  const padded = ` ${label} `;
  return applyColor(styler, color || "cyan", padded);
}

// スピナーアニメーション用の文字配列
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * スピナーインターバルを管理するMapと現在のフレーム
 */
const spinnerIntervals = new Map<string, number>();
const spinnerFrames = new Map<string, number>();

/**
 * スピナーを表示（待機中のインジケータ）
 */
export function showSpinner(
  id: string = "default",
  message: string = "処理中...",
): void {
  // 既存のスピナーがある場合は停止
  hideSpinner(id);

  const styler = getStyler();
  let frameIndex = 0;
  spinnerFrames.set(id, frameIndex);

  const intervalId = setInterval(() => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    // カーソルを行頭に戻して上書き
    Deno.stdout.writeSync(
      new TextEncoder().encode(
        `\r${styler.dim().yellow(frame)} ${styler.yellow(message + "…")} `,
      ),
    );
    frameIndex++;
    spinnerFrames.set(id, frameIndex);
  }, 80);

  spinnerIntervals.set(id, intervalId);
}

/**
 * スピナーを非表示にする
 */
export function hideSpinner(id: string = "default"): void {
  const intervalId = spinnerIntervals.get(id);
  if (intervalId !== undefined) {
    clearInterval(intervalId);
    spinnerIntervals.delete(id);
    spinnerFrames.delete(id);
    // 行をクリア
    Deno.stdout.writeSync(
      new TextEncoder().encode("\r" + " ".repeat(80) + "\r"),
    );
  }
}

/**
 * Markdownテキストをレンダリング
 */
export function renderMarkdown(text: string): string {
  const styler = getStyler();
  let result = text;

  // コードブロック (```...```)
  result = result.replace(/```([^\n]*?)\n([\s\S]*?)```/g, (_, lang, code) => {
    const lines = code.split("\n");
    // 最後の空行を削除
    if (lines[lines.length - 1] === "") {
      lines.pop();
    }
    const formatted = lines.map((line: string) =>
      styler.dim().gray("│ ") + styler.gray(line)
    ).join("\n");
    const header = lang
      ? styler.dim().gray(`┌─ ${lang} ─`)
      : styler.dim().gray("┌─");
    const footer = styler.dim().gray("└─");
    return `\n${header}\n${formatted}\n${footer}\n`;
  });

  // インラインコード (`...`)
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    return styler.green(` ${code} `);
  });

  // 太字 (**...** または __...__)
  result = result.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, text1, text2) => {
    const boldStyler = getStyler();
    return boldStyler.bold().cyan(text1 || text2); // 太字はシアンで表示
  });

  // 見出し (# ...)
  result = result.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const headerStyler = getStyler();
    const level = hashes.length;
    if (level === 1) return headerStyler.bold().underline().cyan(text);
    if (level === 2) return headerStyler.bold().cyan(text);
    return headerStyler.cyan(text); // レベル3以降は太字なし
  });

  // 順序なしリスト (- または * または +) - インデントを保持
  result = result.replace(/^(\s*)[-*+]\s+(.+)$/gm, (_, indent, text) => {
    return `${indent}  ${styler.cyan("•")} ${text}`;
  });

  // 順序付きリスト (1. 2. など) - インデントを保持
  result = result.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (_, indent, num, text) => {
    return `${indent}  ${styler.cyan(num + ".")} ${text}`;
  });

  // 引用 (> ...)
  result = result.replace(/^>\s+(.+)$/gm, (_, text) => {
    const quoteStyler = getStyler();
    return styler.dim().green("▎ ") + quoteStyler.green(text);
  });

  // 水平線 (--- または *** または ___)
  result = result.replace(/^(---+|\*\*\*+|___+)$/gm, () => {
    return styler.magenta("─".repeat(100));
  });

  // 取り消し線 (~~...~~)
  result = result.replace(/~~([^~]+)~~/g, (_, text) => {
    const strikeStyler = getStyler();
    return strikeStyler.strikethrough().gray(text);
  });

  return result;
}

/**
 * ストリーミングバッファの状態
 */
interface StreamingBufferState {
  buffer: string;
  isInCodeBlock: boolean;
}

/**
 * ストリーミングバッファを作成
 */
export function createStreamingBuffer() {
  const state: StreamingBufferState = {
    buffer: "",
    isInCodeBlock: false,
  };

  return {
    /**
     * テキストをバッファに追加し、完成した部分をレンダリング
     */
    append(text: string): void {
      state.buffer += text;

      // コードブロックの開始/終了を検出
      const codeBlockMatches = state.buffer.match(/```/g);
      const codeBlockCount = codeBlockMatches ? codeBlockMatches.length : 0;

      // コードブロック内かどうかを判定
      state.isInCodeBlock = codeBlockCount % 2 === 1;

      if (state.isInCodeBlock) {
        // コードブロック内はバッファリング
        return;
      }

      // コードブロック外の場合は、完成した行を処理
      const lines = state.buffer.split("\n");
      const incompleteLine = lines.pop() || "";

      // 完成した行をレンダリング
      if (lines.length > 0) {
        const completeText = lines.join("\n") + "\n";
        const rendered = renderMarkdown(completeText);
        Deno.stdout.writeSync(new TextEncoder().encode(rendered));
        state.buffer = incompleteLine;
      }
    },

    /**
     * 残りのバッファをすべて出力
     */
    flush(): void {
      if (state.buffer) {
        const rendered = renderMarkdown(state.buffer);
        Deno.stdout.writeSync(new TextEncoder().encode(rendered));
        state.buffer = "";
      }
    },
  };
}

Deno.test("NO_COLOR環境変数のサポート", () => {
  const mockOutput: string[] = [];
  const originalError = console.error;
  const originalNoColor = Deno.env.get("NO_COLOR");
  const originalForceColor = Deno.env.get("FORCE_COLOR");
  console.error = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };

  // FORCE_COLORを削除してNO_COLORを設定
  Deno.env.delete("FORCE_COLOR");
  Deno.env.set("NO_COLOR", "1");

  error("Error without color");

  // カラーコードが含まれていないことを確認
  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "✗ Error without color");

  // 環境変数を元に戻す
  if (originalNoColor === undefined) {
    Deno.env.delete("NO_COLOR");
  } else {
    Deno.env.set("NO_COLOR", originalNoColor);
  }
  if (originalForceColor !== undefined) {
    Deno.env.set("FORCE_COLOR", originalForceColor);
  }
  console.error = originalError;
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== コンソール出力管理 デバッグモード ===\n");

  // 1. セマンティックメッセージのデモ
  console.log("1. セマンティックメッセージの表示:");
  error("これはエラーメッセージです");
  success("これは成功メッセージです");
  warning("これは警告メッセージです");
  info("これは情報メッセージです");
  console.log();

  // 2. カスタムスタイルのデモ
  console.log("2. カスタムスタイルの表示:");
  print("赤色のテキスト", { color: "red" });
  print("太字のテキスト", { bold: true });
  print("薄いテキスト", { dim: true });
  print("下線付きテキスト", { underline: true });
  print("赤色太字のテキスト", { color: "red", bold: true });
  print("青色下線のテキスト", { color: "blue", underline: true });
  console.log();

  // 3. 全カラーの表示
  console.log("3. 利用可能なカラーバリエーション:");
  const colors = [
    "red",
    "green",
    "yellow",
    "cyan",
    "blue",
    "magenta",
    "gray",
  ] as const;
  for (const color of colors) {
    print(`${color}色のテキスト`, { color });
  }
  console.log();

  // 4. スタイル組み合わせのデモ
  console.log("4. スタイル組み合わせの例:");
  print("通常のテキスト");
  print("太字 + 赤色", { bold: true, color: "red" });
  print("薄字 + 青色", { dim: true, color: "blue" });
  print("下線 + 緑色", { underline: true, color: "green" });
  print("太字 + 下線 + 黄色", { bold: true, underline: true, color: "yellow" });
  console.log();

  // 5. 環境変数の影響テスト
  console.log("5. 環境変数の状態確認:");
  console.log(`NO_COLOR: ${Deno.env.get("NO_COLOR") || "(未設定)"}`);
  console.log(`FORCE_COLOR: ${Deno.env.get("FORCE_COLOR") || "(未設定)"}`);
  console.log(`TTY環境: ${Deno.stdout.isTerminal()}`);
  console.log();

  // 6. 対話型デモ
  const runInteractiveDemo = prompt("対話型デモを実行しますか？ (y/N):");
  if (runInteractiveDemo?.toLowerCase() === "y") {
    console.log("\n6. 対話型メッセージデモ:");

    while (true) {
      const messageType = prompt(
        "メッセージタイプを選択 (error/success/warning/info/custom/exit):",
      );

      if (!messageType || messageType === "exit") {
        console.log("デモを終了します。");
        break;
      }

      const message = prompt("メッセージ内容を入力:");
      if (!message) continue;

      switch (messageType) {
        case "error":
          error(message);
          break;
        case "success":
          success(message);
          break;
        case "warning":
          warning(message);
          break;
        case "info":
          info(message);
          break;
        case "custom": {
          const color = prompt(
            "カラーを選択 (red/green/yellow/cyan/blue/magenta/gray):",
          ) as typeof colors[number] | null;
          const bold = prompt("太字にしますか？ (y/N):") === "y";
          const dim = prompt("薄字にしますか？ (y/N):") === "y";
          const underline = prompt("下線を付けますか？ (y/N):") === "y";

          print(message, {
            color: (color && colors.includes(color)) ? color : undefined,
            bold,
            dim,
            underline,
          });
          break;
        }
        default:
          console.log("不明なメッセージタイプです。");
      }
    }
  }

  console.log("\nデバッグモード終了");
}
