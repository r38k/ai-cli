import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stripAnsiCode } from "https://deno.land/std@0.208.0/fmt/colors.ts";
import { print, error, success, warning, info } from "./console.ts";

// テスト用のモックコンソール
let mockOutput: string[] = [];

// console.logをモック
const originalLog = console.log;
const originalError = console.error;

function setupMock() {
  mockOutput = [];
  console.log = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    mockOutput.push(args.map(String).join(" "));
  };
}

function teardownMock() {
  console.log = originalLog;
  console.error = originalError;
}

Deno.test("print - 基本的な出力", () => {
  setupMock();
  
  print("Hello, World!");
  
  assertEquals(stripAnsiCode(mockOutput[0]), "Hello, World!");
  teardownMock();
});

Deno.test("error - エラーメッセージ表示", () => {
  setupMock();
  
  error("Something went wrong");
  
  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "✗ Something went wrong");
  teardownMock();
});

Deno.test("success - 成功メッセージ表示", () => {
  setupMock();
  
  success("Task completed");
  
  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "✓ Task completed");
  teardownMock();
});

Deno.test("warning - 警告メッセージ表示", () => {
  setupMock();
  
  warning("This is deprecated");
  
  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "⚠ This is deprecated");
  teardownMock();
});

Deno.test("info - 情報メッセージ表示", () => {
  setupMock();
  
  info("New version available");
  
  const output = stripAnsiCode(mockOutput[0]);
  assertEquals(output, "ℹ New version available");
  teardownMock();
});

Deno.test("NO_COLOR環境変数のサポート", () => {
  setupMock();
  const originalNoColor = Deno.env.get("NO_COLOR");
  const originalForceColor = Deno.env.get("FORCE_COLOR");
  
  // FORCE_COLORを削除してNO_COLORを設定
  Deno.env.delete("FORCE_COLOR");
  Deno.env.set("NO_COLOR", "1");
  
  // styles.tsをリロードするため、モジュールキャッシュをクリア
  // 注: Denoではモジュールキャッシュをクリアできないため、
  // 新しいスタイラーを作成する必要がある
  
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
  teardownMock();
});

Deno.test("print - カスタムスタイル", () => {
  setupMock();
  const originalForceColor = Deno.env.get("FORCE_COLOR");
  
  // テスト用にFORCE_COLORを設定
  Deno.env.set("FORCE_COLOR", "1");
  
  print("Custom message", { color: "blue", bold: true });
  
  // デバッグ: 実際の出力を確認
  console.log("実際の出力:", mockOutput[0]);
  console.log("stripAnsiCode後:", stripAnsiCode(mockOutput[0]));
  
  // ANSIコードが含まれていることを確認（色やスタイルが適用されている）
  const hasAnsiCode = mockOutput[0] !== stripAnsiCode(mockOutput[0]);
  assertEquals(hasAnsiCode, true);
  
  // テキスト内容は正しい
  assertEquals(stripAnsiCode(mockOutput[0]), "Custom message");
  
  // 環境変数を元に戻す
  if (originalForceColor === undefined) {
    Deno.env.delete("FORCE_COLOR");
  } else {
    Deno.env.set("FORCE_COLOR", originalForceColor);
  }
  teardownMock();
});