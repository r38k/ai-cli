import kleur from "npm:kleur@4.1.5";

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
  
  // スタイル（チェーン可能）
  bold: () => Styler;
  dim: () => Styler;
  underline: () => Styler;
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
  bold: () => noColorStyler,
  dim: () => noColorStyler,
  underline: () => noColorStyler,
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
  bold: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.bold().red(text),
    green: (text: string) => kleur.bold().green(text),
    yellow: (text: string) => kleur.bold().yellow(text),
    blue: (text: string) => kleur.bold().blue(text),
    cyan: (text: string) => kleur.bold().cyan(text),
    gray: (text: string) => kleur.bold().gray(text),
  }),
  dim: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.dim().red(text),
    green: (text: string) => kleur.dim().green(text),
    yellow: (text: string) => kleur.dim().yellow(text),
    blue: (text: string) => kleur.dim().blue(text),
    cyan: (text: string) => kleur.dim().cyan(text),
    gray: (text: string) => kleur.dim().gray(text),
  }),
  underline: () => ({
    ...kleurStyler,
    red: (text: string) => kleur.underline().red(text),
    green: (text: string) => kleur.underline().green(text),
    yellow: (text: string) => kleur.underline().yellow(text),
    blue: (text: string) => kleur.underline().blue(text),
    cyan: (text: string) => kleur.underline().cyan(text),
    gray: (text: string) => kleur.underline().gray(text),
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