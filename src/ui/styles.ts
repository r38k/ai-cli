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
