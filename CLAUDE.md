# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

Google Gemini AIとModel Context Protocol (MCP) を統合したDenoベースのCLIツールです。インタラクティブ対話とワンショット実行をサポートし、外部ツールとの統合により高度な機能を提供します。

## コマンド

### 開発

- `deno run -A src/index.ts` - すべての権限でCLIツールを実行
- `deno task dev` - ウォッチモードで実行（src/index.tsを監視）
- `deno task build` - 'bin/ai'バイナリ実行ファイルにコンパイル

### テストと品質管理

- `deno test` - テストを実行
- `deno fmt` - コードをフォーマット
- `deno lint` - コードをリント

#### テストファイルの実行

注意: このプロジェクトのテストは各ソースファイル内に直接記述されています（別ファイルではありません）。

```bash
# 主要なテストファイルの実行
deno test src/cli/parser.ts src/cli/input.ts src/cli/modes.ts src/ui/console.ts src/ui/styles.ts --allow-env --allow-read --allow-write

# 全テストの実行（srcディレクトリ内のDeno.testを含む全ファイル）
deno test src/ --allow-env --allow-read --allow-write --allow-net --allow-run

# 特定のテストファイルのみ実行
deno test src/cli/parser.ts --allow-env

# 型チェックをスキップして実行（エラーがある場合）
deno test src/ --no-check --allow-env --allow-read --allow-write
```

#### テストが含まれているファイル

- `src/cli/parser.ts` - CLIパーサーのテスト
- `src/cli/input.ts` - 入力処理のテスト
- `src/cli/modes.ts` - 実行モードのテスト
- `src/ui/console.ts` - コンソールUIのテスト
- `src/ui/styles.ts` - スタイリングのテスト
- `src/cli/mcp.ts` - MCP設定のテスト
- `src/core/auth.ts` - 認証のテスト

## アーキテクチャ

これは、Google Gemini AIとModel Context Protocol
(MCP)サーバーを統合し、ツール呼び出しを可能にするDenoベースのCLIツールです。

### コアコンポーネント

- **メインCLIループ** (`src/index.ts`): ユーザー入力を受け付け、会話履歴を維持し、Geminiからのレスポンスをストリーミングする対話型REPL
- **Gemini API統合** (`src/api/gemini.ts`): GoogleのGenAI SDKを使用した関数呼び出し対応のストリーミングコンテンツ生成
- **MCPクライアント設定** (`src/tools/mcp.ts`): JSON設定に基づくMCPサーバーの設定・接続とツール統合
- **CLI解析** (`src/cli/parser.ts`): コマンドライン引数の解析と検証
- **実行モード管理** (`src/cli/modes.ts`): インタラクティブ・ワンショット・パイプモードの判定
- **入力処理** (`src/cli/input.ts`): ファイル読み込み、標準入力、パイプライン入力の統一処理
- **UI管理** (`src/ui/console.ts`, `src/ui/styles.ts`): カラフルなターミナル出力とスタイリング

### 主要な依存関係

- `@google/genai` - MCPツール統合を含むGoogle Gemini AI SDK
- `@modelcontextprotocol/sdk` - ツールサーバーに接続するためのMCPクライアント

### 設定ファイル

- `~/.ai-cli/credentials` - Gemini APIキーの保存（Base64エンコード、権限600）
- `~/.ai-cli/mcp-config.json` - MCPサーバー設定

### 開発モードでの環境変数（オプション）

- `DENO_ENV=development` - 開発モードを有効化
- `GEMINI_API_KEY` - 開発モードでのAPIキー（設定ファイルよりも優先）
- `MCP_CONFIG_PATH` - 開発モードでのMCP設定ファイルパス

### 初期設定とセットアップ

```bash
# APIキーを設定（初回のみ）
ai auth

# MCPサーバーを追加（ツール機能を使用する場合）
ai mcp add

# 設定済みサーバーを確認
ai mcp list

# 設定ファイルの場所確認
ls ~/.ai-cli/
```

### MCPサーバー設定ファイル形式

`~/.ai-cli/mcp-config.json`:

```json
{
  "mcpServer": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/workspace"],
      "env": {}
    },
    "web": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-web"],
      "env": {}
    }
  }
}
```

## トラブルシューティング

### よくある問題

1. **APIキーエラー**:
   ```bash
   # 設定を確認
   ls -la ~/.ai-cli/credentials
   # 再設定
   ai auth
   ```

2. **MCPサーバー接続エラー**:
   ```bash
   # 設定ファイルの確認
   cat ~/.ai-cli/mcp-config.json
   # サーバーリストの確認
   ai mcp list
   ```

3. **権限エラー**:
   ```bash
   # 全権限で実行
   deno run -A src/index.ts
   ```

### デバッグモード

```bash
# 詳細ログ出力
DENO_ENV=development deno run -A src/index.ts --verbose

# 環境変数での設定
export GEMINI_API_KEY="your-api-key"
export MCP_CONFIG_PATH="~/.ai-cli/mcp-config.json"
```
