/**
 * スタイリングシステムモジュール
 *
 * ターミナル向けテキストスタイリングの統一APIを提供します。
 * Kleurライブラリをベースとしつつ、環境変数（NO_COLOR）対応、
 * TTY検出、チェーン可能なスタイル適用システムを実装しています。
 *
 * 主要機能:
 * - 統一されたスタイラーインターフェース
 * - 環境変数による自動カラー制御（NO_COLOR, FORCE_COLOR）
 * - TTY/non-TTY環境の自動判定
 * - チェーン可能なスタイル適用
 * - カスタムスタイラー実装のサポート
 *
 * サポートカラー:
 * - red, green, yellow, blue, cyan, gray, magenta
 *
 * サポートスタイル:
 * - bold: 太字
 * - dim: 薄字
 * - underline: 下線
 * - strikethrough: 取り消し線
 *
 * 環境変数対応:
 * - NO_COLOR: カラー出力を無効化（値の内容に関わらず設定されていれば無効）
 * - FORCE_COLOR: TTY検出に関わらずカラー出力を強制有効化
 * - TTY検出: Deno.stdout.isTerminal()による自動判定
 *
 * 使用方法:
 * ```typescript
 * import { createStyler, applyColor } from "./styles.ts";
 *
 * const styler = createStyler();
 * const redText = styler.red("Error message");
 * const boldBlue = styler.bold().blue("Important");
 *
 * // カラー適用ヘルパー
 * const coloredText = applyColor(styler, "green", "Success");
 * ```
 *
 * 技術仕様:
 * - Kleur 4.1.5ベースの実装
 * - ANSIエスケープシーケンス対応
 * - 環境変数による動的制御
 * - インターフェース抽象化によるライブラリ交換可能性
 */

import kleur from "npm:kleur@4.1.5";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stripAnsiCode } from "https://deno.land/std@0.208.0/fmt/colors.ts";

/**
 * スタイラーインターフェース
 * 後から別のライブラリに切り替えられるように抽象化
 */
export interface Styler {
  // 色
  red: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  cyan: (text: string) => string;
  gray: (text: string) => string;
  magenta: (text: string) => string;

  // スタイル（チェーン可能）
  bold: () => Styler;
  dim: () => Styler;
  underline: () => Styler;
  strikethrough: () => Styler;
}

/**
 * 色を適用する共通関数
 */
export function applyColor(
  styler: Styler,
  color: string | undefined,
  text: string,
): string {
  switch (color) {
    case "red":
      return styler.red(text);
    case "green":
      return styler.green(text);
    case "yellow":
      return styler.yellow(text);
    case "blue":
      return styler.blue(text);
    case "cyan":
      return styler.cyan(text);
    case "gray":
      return styler.gray(text);
    case "magenta":
      return styler.magenta(text);
    default:
      return text;
  }
}

/**
 * カラー出力を使用するかチェック
 */
function shouldUseColor(): boolean {
  // FORCE_COLORが設定されている場合は常にカラーを使用
  if (Deno.env.get("FORCE_COLOR")) {
    return true;
  }
  // NO_COLORが設定されている場合はカラーを使用しない
  if (Deno.env.get("NO_COLOR")) {
    return false;
  }
  // TTYかどうかチェック（標準出力がターミナルに接続されているか）
  return Deno.stdout.isTerminal();
}

Deno.test("shouldUseColor - NO_COLOR環境変数のサポート", () => {
  const originalNoColor = Deno.env.get("NO_COLOR");
  const originalForceColor = Deno.env.get("FORCE_COLOR");

  // NO_COLORを設定
  Deno.env.set("NO_COLOR", "1");
  if (originalForceColor !== undefined) {
    Deno.env.delete("FORCE_COLOR");
  }

  const styler = createStyler();
  const redText = styler.red("Error");

  // カラーコードが含まれていないことを確認
  assertEquals(redText, "Error");

  // 環境変数を元に戻す
  if (originalNoColor === undefined) {
    Deno.env.delete("NO_COLOR");
  } else {
    Deno.env.set("NO_COLOR", originalNoColor);
  }
  if (originalForceColor !== undefined) {
    Deno.env.set("FORCE_COLOR", originalForceColor);
  }
});

/**
 * カラーを無効化するスタイラー
 */
const noColorStyler: Styler = {
  red: (text: string) => text,
  green: (text: string) => text,
  yellow: (text: string) => text,
  blue: (text: string) => text,
  cyan: (text: string) => text,
  gray: (text: string) => text,
  magenta: (text: string) => text,
  bold: () => noColorStyler,
  dim: () => noColorStyler,
  underline: () => noColorStyler,
  strikethrough: () => noColorStyler,
};

/**
 * Kleurをラップしたスタイラー
 */
const kleurStyler: Styler = {
  red: kleur.red,
  green: kleur.green,
  yellow: kleur.yellow,
  blue: kleur.blue,
  cyan: kleur.cyan,
  gray: kleur.gray,
  magenta: kleur.magenta,
  bold: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.bold().red(text),
    green: (text: string) => kleur.bold().green(text),
    yellow: (text: string) => kleur.bold().yellow(text),
    blue: (text: string) => kleur.bold().blue(text),
    cyan: (text: string) => kleur.bold().cyan(text),
    gray: (text: string) => kleur.bold().gray(text),
    magenta: (text: string) => kleur.bold().magenta(text),
  }),
  dim: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.dim().red(text),
    green: (text: string) => kleur.dim().green(text),
    yellow: (text: string) => kleur.dim().yellow(text),
    blue: (text: string) => kleur.dim().blue(text),
    cyan: (text: string) => kleur.dim().cyan(text),
    gray: (text: string) => kleur.dim().gray(text),
    magenta: (text: string) => kleur.dim().magenta(text),
  }),
  underline: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.underline().red(text),
    green: (text: string) => kleur.underline().green(text),
    yellow: (text: string) => kleur.underline().yellow(text),
    blue: (text: string) => kleur.underline().blue(text),
    cyan: (text: string) => kleur.underline().cyan(text),
    gray: (text: string) => kleur.underline().gray(text),
    magenta: (text: string) => kleur.underline().magenta(text),
  }),
  strikethrough: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.strikethrough().red(text),
    green: (text: string) => kleur.strikethrough().green(text),
    yellow: (text: string) => kleur.strikethrough().yellow(text),
    blue: (text: string) => kleur.strikethrough().blue(text),
    cyan: (text: string) => kleur.strikethrough().cyan(text),
    gray: (text: string) => kleur.strikethrough().gray(text),
    magenta: (text: string) => kleur.strikethrough().magenta(text),
  }),
};

/**
 * スタイラーを作成
 * @param customStyler カスタムスタイラー（テスト用）
 */
export function createStyler(customStyler?: Styler): Styler {
  if (customStyler) {
    return customStyler;
  }

  return shouldUseColor() ? kleurStyler : noColorStyler;
}

Deno.test("createStyler - デフォルト実装（kleur）", () => {
  const styler = createStyler();

  // 基本的な色
  const redText = styler.red("Error");
  assertEquals(typeof redText, "string");
  assertEquals(stripAnsiCode(redText), "Error");

  // チェーン
  const boldBlue = styler.bold().blue("Important");
  assertEquals(stripAnsiCode(boldBlue), "Important");
});

Deno.test("createStyler - カスタム実装", () => {
  // モック実装
  const mockStyler: Styler = {
    red: (text: string) => `[RED]${text}[/RED]`,
    green: (text: string) => `[GREEN]${text}[/GREEN]`,
    yellow: (text: string) => `[YELLOW]${text}[/YELLOW]`,
    blue: (text: string) => `[BLUE]${text}[/BLUE]`,
    cyan: (text: string) => `[CYAN]${text}[/CYAN]`,
    gray: (text: string) => `[GRAY]${text}[/GRAY]`,
    magenta: (text: string) => `[MAGENTA]${text}[/MAGENTA]`,
    bold: () => mockStyler,
    dim: () => mockStyler,
    underline: () => mockStyler,
    strikethrough: () => mockStyler,
  };

  const styler = createStyler(mockStyler);

  assertEquals(styler.red("Error"), "[RED]Error[/RED]");
  assertEquals(styler.green("Success"), "[GREEN]Success[/GREEN]");
});

Deno.test("createStyler - 全ての色とスタイル", () => {
  const styler = createStyler();

  // 色
  const colors = [
    "red",
    "green",
    "yellow",
    "blue",
    "cyan",
    "gray",
    "magenta",
  ] as const;
  colors.forEach((color) => {
    const styled = styler[color]("Test");
    assertEquals(stripAnsiCode(styled), "Test");
  });

  // スタイル
  const styles = ["bold", "dim", "underline"] as const;
  styles.forEach((style) => {
    const styled = styler[style]().red("Test");
    assertEquals(stripAnsiCode(styled), "Test");
  });
});

// 便利な関数をエクスポート
const defaultStyler = createStyler();
export const red = defaultStyler.red;
export const green = defaultStyler.green;
export const yellow = defaultStyler.yellow;
export const blue = defaultStyler.blue;
export const cyan = defaultStyler.cyan;
export const gray = defaultStyler.gray;
export const magenta = defaultStyler.magenta;
export const dim = defaultStyler.dim().gray;

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== スタイリングシステム デバッグ ===\n");

  console.log("1. 環境変数の状態確認:");
  console.log(`NO_COLOR: ${Deno.env.get("NO_COLOR") || "(未設定)"}`);
  console.log(`FORCE_COLOR: ${Deno.env.get("FORCE_COLOR") || "(未設定)"}`);
  console.log(`TTY環境: ${Deno.stdout.isTerminal()}`);
  console.log(`カラー有効: ${shouldUseColor()}`);
  console.log();

  const styler = createStyler();

  console.log("2. 基本カラーテスト:");
  const colors = [
    "red",
    "green",
    "yellow",
    "blue",
    "cyan",
    "gray",
    "magenta",
  ] as const;
  for (const color of colors) {
    const colorFunc = styler[color];
    console.log(`${colorFunc(`${color}色のテキスト`)}`);
  }
  console.log();

  console.log("3. スタイルテスト:");
  console.log(`通常: ${styler.cyan("Normal text")}`);
  console.log(`太字: ${styler.bold().cyan("Bold text")}`);
  console.log(`薄字: ${styler.dim().cyan("Dim text")}`);
  console.log(`下線: ${styler.underline().cyan("Underlined text")}`);
  console.log(
    `取り消し線: ${styler.strikethrough().cyan("Strikethrough text")}`,
  );
  console.log();

  console.log("4. チェーンスタイルテスト:");
  console.log(`太字+赤: ${styler.bold().red("Bold Red")}`);
  console.log(`薄字+青: ${styler.dim().blue("Dim Blue")}`);
  console.log(`下線+緑: ${styler.underline().green("Underlined Green")}`);
  console.log();

  console.log("5. applyColor関数テスト:");
  for (const color of colors) {
    const result = applyColor(styler, color, `applyColor ${color}`);
    console.log(result);
  }
  console.log();

  console.log("6. 便利関数テスト:");
  console.log(`${red("Red便利関数")}`);
  console.log(`${green("Green便利関数")}`);
  console.log(`${yellow("Yellow便利関数")}`);
  console.log(`${blue("Blue便利関数")}`);
  console.log(`${cyan("Cyan便利関数")}`);
  console.log(`${gray("Gray便利関数")}`);
  console.log(`${magenta("Magenta便利関数")}`);
  console.log(`${dim("Dim便利関数")}`);
  console.log();

  console.log("7. カスタムスタイラーテスト:");
  const customStyler: Styler = {
    red: (text: string) => `[カスタム赤]${text}[/カスタム赤]`,
    green: (text: string) => `[カスタム緑]${text}[/カスタム緑]`,
    yellow: (text: string) => `[カスタム黄]${text}[/カスタム黄]`,
    blue: (text: string) => `[カスタム青]${text}[/カスタム青]`,
    cyan: (text: string) => `[カスタムシアン]${text}[/カスタムシアン]`,
    gray: (text: string) => `[カスタム灰]${text}[/カスタム灰]`,
    magenta: (text: string) => `[カスタム紫]${text}[/カスタム紫]`,
    bold: () => customStyler,
    dim: () => customStyler,
    underline: () => customStyler,
    strikethrough: () => customStyler,
  };

  const customStyle = createStyler(customStyler);
  console.log(`カスタム赤: ${customStyle.red("Custom Red")}`);
  console.log(`カスタム緑: ${customStyle.green("Custom Green")}`);
  console.log();

  console.log("8. 環境変数変更テスト:");
  const originalNoColor = Deno.env.get("NO_COLOR");

  // NO_COLORを一時的に設定
  console.log("NO_COLORを設定中...");
  Deno.env.set("NO_COLOR", "1");
  const noColorStyler = createStyler();
  console.log(`NO_COLOR有効時: ${noColorStyler.red("この文字は色なし")}`);

  // NO_COLORを元に戻す
  if (originalNoColor === undefined) {
    Deno.env.delete("NO_COLOR");
  } else {
    Deno.env.set("NO_COLOR", originalNoColor);
  }
  console.log(`NO_COLOR復元後: ${createStyler().red("この文字は再び色付き")}`);
  console.log();

  console.log("9. 対話型カラーテスト:");
  const runInteractiveTest = prompt("対話型テストを実行しますか？ (y/N):");

  if (runInteractiveTest?.toLowerCase() === "y") {
    while (true) {
      const colorInput = prompt(`カラーを選択 (${colors.join("/")}/exit):`);

      if (!colorInput || colorInput === "exit") {
        console.log("対話型テスト終了");
        break;
      }

      if (colors.includes(colorInput as typeof colors[number])) {
        const text = prompt("表示するテキストを入力:") || "サンプルテキスト";
        const styledText = applyColor(styler, colorInput, text);
        console.log(`結果: ${styledText}`);
      } else {
        console.log("無効なカラーです。");
      }
    }
  }

  console.log("\nデバッグモード終了");
}
