# CLAUDE.md

このファイルは、Claude Code (claude.ai/code)
がこのリポジトリのコードを扱う際のガイダンスを提供します。

## コマンド

### 開発

- `deno run -A src/index.ts` - すべての権限でCLIツールを実行
- `deno task dev` - ウォッチモードで実行（main.tsを監視）
- `deno task build` - 'ai'という名前のバイナリ実行ファイルにコンパイル

### テストと品質管理

- `deno test` - テストを実行
- `deno fmt` - コードをフォーマット
- `deno lint` - コードをリント

#### テストファイルの実行

注意:
Denoのテストはファイル内にDeno.test()が含まれているファイルを直接指定する必要があります。

```bash
# UIテストの実行
deno test src/ui/console.ts src/ui/styles.ts --allow-env

# CLIテストの実行  
deno test src/cli/input.test.ts src/cli/modes.test.ts src/cli/parser.test.ts --allow-env --allow-read

# 全テストの実行
deno test src/ui/console.ts src/ui/styles.ts src/cli/input.test.ts src/cli/modes.test.ts src/cli/parser.test.ts --allow-env --allow-read
```

## アーキテクチャ

これは、Google Gemini AIとModel Context Protocol
(MCP)サーバーを統合し、ツール呼び出しを可能にするDenoベースのCLIツールです。

### コアコンポーネント

- **メインCLIループ** (`src/index.ts`):
  ユーザー入力を受け付け、会話履歴を維持し、Geminiからのレスポンスをストリーミングする対話型REPL
- **Gemini API統合** (`src/api/gemini.ts`): GoogleのGenAI
  SDKを使用して、関数呼び出しを有効にしたストリーミングコンテンツ生成を処理
- **MCPクライアント設定** (`src/tools/mcp.ts`):
  JSON設定に基づいてMCPサーバーを設定・接続し、ツール統合を可能にする

### 主要な依存関係

- `@google/genai` - MCPツール統合を含むGoogle Gemini AI SDK
- `@modelcontextprotocol/sdk` - ツールサーバーに接続するためのMCPクライアント
- 環境変数 `GEMINI_API_KEY` - APIアクセスに必要
- 環境変数 `MCP_CONFIG_PATH` - MCPサーバー設定JSONを指定

### 設定

ツールは、`MCP_CONFIG_PATH`環境変数で指定されたパスのMCPサーバー設定ファイルを以下の構造で期待します：

```json
{
  "mcpServer": {
    "server-name": {
      "command": "実行するコマンド",
      "args": ["引数1", "引数2"],
      "env": { "KEY": "値" }
    }
  }
}
```
