import { createStyler, type Styler } from "./styles.ts";

export interface PrintOptions {
  color?: "red" | "green" | "yellow" | "cyan" | "blue";
  bold?: boolean;
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

  // ボールド適用
  if (options.bold && typeof currentStyler === "object") {
    currentStyler = currentStyler.bold();
  }

  // カラー適用
  if (options.color && typeof currentStyler === "object") {
    return currentStyler[options.color](text);
  }

  return text;
}

/**
 * 基本的な出力関数
 */
export function print(message: string, options?: PrintOptions): void {
  console.log(applyStyle(message, options));
}

/**
 * エラーメッセージ表示
 */
export function error(message: string): void {
  const styler = getStyler();
  const prefix = styler.red("✗");
  const text = styler.red(message);
  console.error(`${prefix} ${text}`);
}

/**
 * 成功メッセージ表示
 */
export function success(message: string): void {
  const styler = getStyler();
  const prefix = styler.green("✓");
  const text = styler.green(message);
  console.log(`${prefix} ${text}`);
}

/**
 * 警告メッセージ表示
 */
export function warning(message: string): void {
  const styler = getStyler();
  const prefix = styler.yellow("⚠");
  const text = styler.yellow(message);
  console.log(`${prefix} ${text}`);
}

/**
 * 情報メッセージ表示
 */
export function info(message: string): void {
  const styler = getStyler();
  const prefix = styler.cyan("ℹ");
  const text = styler.cyan(message);
  console.log(`${prefix} ${text}`);
}