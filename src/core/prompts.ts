// TODO: プロンプトのカスタマイズ

/**
 * デフォルトのシステムプロンプト（Claude Code風）
 */
export const DEFAULT_SYSTEM_PROMPT =
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
- ライセンスや著作権を尊重する`;

/**
 * コンテキストに基づいてプロンプトを構築
 */
export function buildContextualPrompt(
  inputContent: string,
  userPrompt?: string,
  customSystemPrompt?: string,
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;

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
