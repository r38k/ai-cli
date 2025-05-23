import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stripAnsiCode } from "https://deno.land/std@0.208.0/fmt/colors.ts";
import { createStyler, type Styler } from "./styles.ts";

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

Deno.test("createStyler - NO_COLOR環境変数のサポート", () => {
  const originalNoColor = Deno.env.get("NO_COLOR");
  
  // NO_COLORを設定
  Deno.env.set("NO_COLOR", "1");
  
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
    bold: () => mockStyler,
    dim: () => mockStyler,
    underline: () => mockStyler,
  };
  
  const styler = createStyler(mockStyler);
  
  assertEquals(styler.red("Error"), "[RED]Error[/RED]");
  assertEquals(styler.green("Success"), "[GREEN]Success[/GREEN]");
});

Deno.test("createStyler - 全ての色とスタイル", () => {
  const styler = createStyler();
  
  // 色
  const colors = ["red", "green", "yellow", "blue", "cyan", "gray"] as const;
  colors.forEach(color => {
    const styled = styler[color]("Test");
    assertEquals(stripAnsiCode(styled), "Test");
  });
  
  // スタイル
  const styles = ["bold", "dim", "underline"] as const;
  styles.forEach(style => {
    const styled = styler[style]().red("Test");
    assertEquals(stripAnsiCode(styled), "Test");
  });
});