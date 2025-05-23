import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { parseArgs, type ParsedArgs } from "./parser.ts";

Deno.test("parseArgs - 引数なし（インタラクティブモード）", () => {
  const args: string[] = [];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.mode, "interactive");
  assertEquals(parsed.prompt, undefined);
  assertEquals(parsed.files, []);
  assertEquals(parsed.options.help, false);
  assertEquals(parsed.options.model, "gemini-2.0-flash-exp");
  assertEquals(parsed.options.maxTokens, 1000);
  assertEquals(parsed.options.tools, false);
});

Deno.test("parseArgs - プロンプトのみ（ワンショットモード）", () => {
  const args = ["エラーを解説して"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.mode, "oneshot");
  assertEquals(parsed.prompt, "エラーを解説して");
  assertEquals(parsed.files, []);
});

Deno.test("parseArgs - ヘルプオプション", () => {
  const args1 = ["-h"];
  const parsed1 = parseArgs(args1);
  assertEquals(parsed1.options.help, true);
  
  const args2 = ["--help"];
  const parsed2 = parseArgs(args2);
  assertEquals(parsed2.options.help, true);
});

Deno.test("parseArgs - ファイルオプション", () => {
  const args = ["-f", "test.ts", "コードをレビューして"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.mode, "oneshot");
  assertEquals(parsed.prompt, "コードをレビューして");
  assertEquals(parsed.files, ["test.ts"]);
});

Deno.test("parseArgs - 複数ファイル", () => {
  const args = ["-f", "file1.ts", "-f", "file2.ts", "--file", "file3.ts"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.files, ["file1.ts", "file2.ts", "file3.ts"]);
});

Deno.test("parseArgs - モデル指定", () => {
  const args = ["--model", "gemini-pro", "質問"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.options.model, "gemini-pro");
  assertEquals(parsed.prompt, "質問");
});

Deno.test("parseArgs - 最大トークン数指定", () => {
  const args = ["-t", "2000", "質問"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.options.maxTokens, 2000);
  
  const args2 = ["--max-tokens", "500"];
  const parsed2 = parseArgs(args2);
  
  assertEquals(parsed2.options.maxTokens, 500);
});

Deno.test("parseArgs - システムプロンプト指定", () => {
  const args = ["-s", "あなたは親切なアシスタントです", "質問"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.options.system, "あなたは親切なアシスタントです");
  assertEquals(parsed.prompt, "質問");
});

Deno.test("parseArgs - 詳細出力オプション", () => {
  const args = ["-v", "質問"];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.options.verbose, true);
  
  const args2 = ["--verbose"];
  const parsed2 = parseArgs(args2);
  
  assertEquals(parsed2.options.verbose, true);
});

Deno.test("parseArgs - 複数のオプションを組み合わせ", () => {
  const args = [
    "-f", "test.ts",
    "--model", "gemini-pro",
    "-t", "3000",
    "-v",
    "このコードをレビューして"
  ];
  const parsed = parseArgs(args);
  
  assertEquals(parsed.mode, "oneshot");
  assertEquals(parsed.prompt, "このコードをレビューして");
  assertEquals(parsed.files, ["test.ts"]);
  assertEquals(parsed.options.model, "gemini-pro");
  assertEquals(parsed.options.maxTokens, 3000);
  assertEquals(parsed.options.verbose, true);
});

Deno.test("parseArgs - 無効なオプション", () => {
  const args = ["--invalid-option"];
  
  assertThrows(
    () => parseArgs(args),
    Error,
    "Unknown option '--invalid-option'"
  );
});

Deno.test("parseArgs - ファイルオプションに値がない", () => {
  const args = ["-f"];
  
  assertThrows(
    () => parseArgs(args),
    Error,
    "Option '-f, --file <value>' argument missing"
  );
});

Deno.test("parseArgs - 数値オプションに無効な値", () => {
  const args = ["-t", "invalid"];
  
  assertThrows(
    () => parseArgs(args),
    Error,
    "Option --max-tokens requires a numeric value"
  );
});

Deno.test("parseArgs - ツールオプション", () => {
  const args1 = ["--tools", "質問"];
  const parsed1 = parseArgs(args1);
  assertEquals(parsed1.options.tools, true);
  assertEquals(parsed1.prompt, "質問");
  
  const args2 = ["質問"];
  const parsed2 = parseArgs(args2);
  assertEquals(parsed2.options.tools, false);
});