/**
 * プロンプト構築モジュール
 *
 * AIアシスタントへのプロンプトを構築・管理するコア機能を提供します。
 * システムプロンプト、ユーザーメッセージ、実行環境コンテキストを統合し、
 * ファイル内容のフォーマットや言語推定などの補助機能も含みます。
 *
 * 主要機能:
 * - デフォルトシステムプロンプトの生成
 * - コンテキストベースのプロンプト構築
 * - 作業ディレクトリ情報の生成
 * - ファイル内容の言語別フォーマット
 *
 * 使用方法:
 * ```typescript
 * const { systemPrompt, userMessage } = buildContextualPrompt(
 *   fileContent,
 *   "このコードをレビューしてください",
 *   customSystemPrompt
 * );
 * ```
 */

/**
 * デフォルトのシステムプロンプト（Claude Code風）
 */
export const DEFAULT_SYSTEM_PROMPT = (workingDirContext: string) =>
  `あなたは優秀なプログラミングアシスタントです。以下の指針に従って行動してください：

## 基本原則
- 簡潔で的確な回答を心がける
- コードは読みやすく、保守しやすいものを提案する
- ユーザーの意図を正確に理解し、必要に応じて確認を求める
- 安全性とセキュリティを常に考慮する

## 回答スタイル
- 技術的な説明は明確かつ正確に
- コード例を示す際は、実行可能で完全なものを提供
- エラーや問題を指摘する際は、解決策も併せて提案
- 不明な点がある場合は、推測せずに確認を求める

## 特別な機能
- ファイル内容が提供された場合は、それを考慮した回答を行う
- コードレビューでは、改善点と理由を明確に説明
- デバッグ支援では、問題の原因と解決方法を段階的に説明

## 倫理的配慮
- 悪意のあるコードの作成や説明は拒否する
- プライバシーやセキュリティに関わる情報は慎重に扱う
- ライセンスや著作権を尊重する

${workingDirContext}`;

/**
 * コンテキストに基づいてプロンプトを構築
 */
export function buildContextualPrompt(
  inputContent: string,
  userPrompt?: string,
  customSystemPrompt?: string,
): { systemPrompt: string; userMessage: string } {
  const workingDirContext = buildWorkingDirectoryContext();
  const systemPrompt = customSystemPrompt ||
    DEFAULT_SYSTEM_PROMPT(workingDirContext);

  let userMessage = "";

  // 入力内容がある場合
  if (inputContent) {
    userMessage = inputContent;
    if (userPrompt) {
      userMessage += "\n\n" + userPrompt;
    }
  } else if (userPrompt) {
    userMessage = userPrompt;
  }

  return { systemPrompt, userMessage };
}

/**
 * 作業ディレクトリ情報を含むコンテキストを生成
 */
export function buildWorkingDirectoryContext(): string {
  const cwd = Deno.cwd();
  let hostname = "unknown";
  try {
    hostname = Deno.hostname();
  } catch {
    // hostname()は権限が必要な場合がある
  }
  const osInfo = Deno.build.os;

  return `## 実行環境情報
- 作業ディレクトリ: ${cwd}
- ホスト名: ${hostname}
- OS: ${osInfo}
- 時刻: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`;
}

/**
 * ファイル内容をフォーマット（改善版）
 */
export function formatFileContent(path: string, content: string): string {
  const extension = path.split(".").pop() || "";
  const language = getLanguageFromExtension(extension);

  return `## ファイル: ${path}
\`\`\`${language}
${content}
\`\`\``;
}

/**
 * 拡張子から言語を推定
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    "ts": "typescript",
    "tsx": "tsx",
    "js": "javascript",
    "jsx": "jsx",
    "py": "python",
    "rb": "ruby",
    "go": "go",
    "rs": "rust",
    "java": "java",
    "cpp": "cpp",
    "c": "c",
    "cs": "csharp",
    "php": "php",
    "swift": "swift",
    "kt": "kotlin",
    "scala": "scala",
    "sh": "bash",
    "bash": "bash",
    "zsh": "zsh",
    "fish": "fish",
    "ps1": "powershell",
    "r": "r",
    "sql": "sql",
    "html": "html",
    "css": "css",
    "scss": "scss",
    "sass": "sass",
    "less": "less",
    "xml": "xml",
    "json": "json",
    "yaml": "yaml",
    "yml": "yaml",
    "toml": "toml",
    "ini": "ini",
    "cfg": "ini",
    "conf": "nginx",
    "md": "markdown",
    "mdx": "markdown",
    "tex": "latex",
    "vim": "vim",
    "lua": "lua",
    "dart": "dart",
    "elm": "elm",
    "clj": "clojure",
    "ex": "elixir",
    "exs": "elixir",
    "erl": "erlang",
    "hrl": "erlang",
    "fs": "fsharp",
    "fsx": "fsharp",
    "ml": "ocaml",
    "mli": "ocaml",
    "pas": "pascal",
    "pl": "perl",
    "hs": "haskell",
    "jl": "julia",
    "nim": "nim",
    "nix": "nix",
    "vue": "vue",
    "svelte": "svelte",
  };

  return languageMap[ext.toLowerCase()] || ext;
}

// === テスト ===

Deno.test("buildWorkingDirectoryContext - 実行環境情報を正しく生成", () => {
  const context = buildWorkingDirectoryContext();

  // 必須情報が含まれているか確認
  assert(context.includes("## 実行環境情報"));
  assert(context.includes("作業ディレクトリ:"));
  assert(context.includes("ホスト名:"));
  assert(context.includes("OS:"));
  assert(context.includes("時刻:"));

  // 実際の値が含まれているか
  assert(context.includes(Deno.cwd()));
  assert(context.includes(Deno.build.os));
});

Deno.test("formatFileContent - ファイル内容を適切にフォーマット", () => {
  const testCases = [
    {
      path: "test.ts",
      content: "const x = 1;",
      expectedLang: "typescript",
    },
    {
      path: "script.py",
      content: "print('hello')",
      expectedLang: "python",
    },
    {
      path: "unknown.xyz",
      content: "some content",
      expectedLang: "xyz",
    },
  ];

  for (const { path, content, expectedLang } of testCases) {
    const formatted = formatFileContent(path, content);
    assert(formatted.includes(`## ファイル: ${path}`));
    assert(formatted.includes("```" + expectedLang));
    assert(formatted.includes(content));
  }
});

Deno.test("getLanguageFromExtension - 拡張子から言語を正しく推定", () => {
  const testCases = [
    { ext: "ts", expected: "typescript" },
    { ext: "py", expected: "python" },
    { ext: "rs", expected: "rust" },
    { ext: "TS", expected: "typescript" }, // 大文字
    { ext: "unknown", expected: "unknown" }, // 未知の拡張子
  ];

  for (const { ext, expected } of testCases) {
    assertEquals(getLanguageFromExtension(ext), expected);
  }
});

Deno.test("buildContextualPrompt - プロンプトを正しく構築", () => {
  // 入力内容とユーザープロンプトの両方がある場合
  const result1 = buildContextualPrompt(
    "ファイル内容",
    "レビューしてください",
  );
  assertEquals(result1.userMessage, "ファイル内容\n\nレビューしてください");
  assert(
    result1.systemPrompt.includes(
      "あなたは優秀なプログラミングアシスタントです",
    ),
  );

  // 入力内容のみの場合
  const result2 = buildContextualPrompt("ファイル内容", undefined);
  assertEquals(result2.userMessage, "ファイル内容");

  // ユーザープロンプトのみの場合
  const result3 = buildContextualPrompt("", "質問です");
  assertEquals(result3.userMessage, "質問です");

  // カスタムシステムプロンプトの場合
  const customPrompt = "カスタムアシスタント";
  const result4 = buildContextualPrompt("", "test", customPrompt);
  assertEquals(result4.systemPrompt, customPrompt);
});

Deno.test("DEFAULT_SYSTEM_PROMPT - 正しい構造を持つ", () => {
  const prompt = DEFAULT_SYSTEM_PROMPT("テストコンテキスト");

  // 主要セクションが含まれているか
  assert(prompt.includes("## 基本原則"));
  assert(prompt.includes("## 回答スタイル"));
  assert(prompt.includes("## 特別な機能"));
  assert(prompt.includes("## 倫理的配慮"));
  assert(prompt.includes("テストコンテキスト"));
});

// 必要なインポート（テスト用）
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== プロンプト構築モジュール デバッグ ===\n");

  // 1. 実行環境コンテキストの生成
  console.log("1. 実行環境コンテキスト:");
  console.log(buildWorkingDirectoryContext());
  console.log("\n" + "=".repeat(50) + "\n");

  // 2. ファイル内容のフォーマット例
  console.log("2. ファイル内容フォーマット例:");
  const sampleCode = `function hello(name: string) {
  console.log(\`Hello, \${name}!\`);
}`;
  console.log(formatFileContent("hello.ts", sampleCode));
  console.log("\n" + "=".repeat(50) + "\n");

  // 3. プロンプト構築例
  console.log("3. プロンプト構築例:");
  const { systemPrompt, userMessage } = buildContextualPrompt(
    sampleCode,
    "このTypeScriptコードをレビューして、改善点を教えてください。",
  );
  console.log("システムプロンプト（最初の200文字）:");
  console.log(systemPrompt.substring(0, 200) + "...");
  console.log("\nユーザーメッセージ:");
  console.log(userMessage);
  console.log("\n" + "=".repeat(50) + "\n");

  // 4. 言語推定のテスト
  console.log("4. 各種拡張子の言語推定:");
  const extensions = ["ts", "py", "rs", "go", "rb", "unknown"];
  for (const ext of extensions) {
    console.log(`  .${ext} → ${getLanguageFromExtension(ext)}`);
  }
}
