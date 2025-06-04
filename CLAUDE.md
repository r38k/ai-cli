# CLAUDE.md

このファイルは、Claude Code (claude.ai/code)
がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

Google Gemini AIとModel Context Protocol (MCP)
を統合したDenoベースのCLIツールです。インタラクティブ対話とワンショット実行をサポートし、外部ツールとの統合により高度な機能を提供します。

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

注意:
このプロジェクトのテストは各ソースファイル内に直接記述されています（別ファイルではありません）。

```bash
# 主要なテストファイルの実行（core + cli）
deno test src/core/prompts.ts src/core/xdg.ts src/core/auth.ts src/core/preferences.ts src/cli/auth.ts src/cli/input.ts src/cli/mcp.ts src/cli/modes.ts src/cli/parser.ts src/cli/model-selector.ts src/cli/toolset-selector.ts --allow-env --allow-read --allow-write

# 全テストの実行（srcディレクトリ内のDeno.testを含む全ファイル）
deno test src/ --allow-env --allow-read --allow-write --allow-net --allow-run

# 特定のテストファイルのみ実行
deno test src/cli/parser.ts --allow-env

# 型チェックをスキップして実行（エラーがある場合）
deno test src/ --no-check --allow-env --allow-read --allow-write

# UIテストファイルの実行
deno test src/ui/console.ts src/ui/styles.ts src/ui/terminal.ts --allow-env --allow-read --allow-write
```

#### テストが含まれているファイル

**Core モジュール:**
- `src/core/prompts.ts` - プロンプト構築のテスト
- `src/core/xdg.ts` - XDGパス解決のテスト
- `src/core/auth.ts` - 認証管理のテスト
- `src/core/preferences.ts` - 設定管理のテスト

**CLI モジュール:**
- `src/cli/auth.ts` - 認証CLIのテスト
- `src/cli/input.ts` - 入力処理のテスト
- `src/cli/mcp.ts` - MCP設定のテスト
- `src/cli/modes.ts` - 実行モードのテスト
- `src/cli/parser.ts` - CLIパーサーのテスト
- `src/cli/model-selector.ts` - モデル選択UIのテスト
- `src/cli/toolset-selector.ts` - ツールセット選択UIのテスト

**UI モジュール:**
- `src/ui/console.ts` - コンソール出力のテスト
- `src/ui/styles.ts` - スタイリングのテスト
- `src/ui/terminal.ts` - ターミナル操作のテスト

## アーキテクチャ

これは、Google Gemini AIとModel Context Protocol
(MCP)サーバーを統合し、ツール呼び出しを可能にするDenoベースのCLIツールです。

### コアコンポーネント

- **メインCLIループ** (`src/index.ts`):
  ユーザー入力を受け付け、会話履歴を維持し、Geminiからのレスポンスをストリーミングする対話型REPL
- **Gemini API統合** (`src/api/gemini.ts`): GoogleのGenAI
  SDKを使用した関数呼び出し対応のストリーミングコンテンツ生成
- **MCPクライアント設定** (`src/tools/mcp.ts`):
  JSON設定に基づくMCPサーバーの設定・接続とツール統合
- **CLI解析** (`src/cli/parser.ts`): コマンドライン引数の解析と検証
- **実行モード管理** (`src/cli/modes.ts`):
  インタラクティブ・ワンショット・パイプモードの判定
- **入力処理** (`src/cli/input.ts`):
  ファイル読み込み、標準入力、パイプライン入力の統一処理
- **UI管理** (`src/ui/console.ts`, `src/ui/styles.ts`):
  カラフルなターミナル出力とスタイリング

### 主要な依存関係

- `@google/genai` - MCPツール統合を含むGoogle Gemini AI SDK
- `@modelcontextprotocol/sdk` - ツールサーバーに接続するためのMCPクライアント

### 設定ファイル

本プロジェクトはXDG Base Directory仕様に準拠しています：

- `$XDG_DATA_HOME/ai-cli/credentials` - Gemini
  APIキーの保存（Base64エンコード、権限600）
  - デフォルト: `~/.local/share/ai-cli/credentials`
- `$XDG_CONFIG_HOME/ai-cli/mcp-config.json` - MCPサーバー設定
  - デフォルト: `~/.config/ai-cli/mcp-config.json`

#### レガシー設定からの移行

`~/.ai-cli/`からの移行には以下のスクリプトを使用：

```bash
./migrate-xdg.sh
```

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
ls ~/.config/ai-cli/
ls ~/.local/share/ai-cli/
```

### MCPサーバー設定ファイル形式

`~/.config/ai-cli/mcp-config.json`:

```json
{
  "mcpServer": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/workspace"
      ],
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
   ls -la ~/.local/share/ai-cli/credentials
   # 再設定
   ai auth
   ```

2. **MCPサーバー接続エラー**:
   ```bash
   # 設定ファイルの確認
   cat ~/.config/ai-cli/mcp-config.json
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
export MCP_CONFIG_PATH="~/.config/ai-cli/mcp-config.json"
```

## コーディング規約

### ファイル構造とコメント

- **ファイルの先頭にはコメントで仕様を記述する**
  - ファイルの目的、主要な機能、使用方法を明記
  - 依存関係や前提条件があれば記述

### テスト戦略

- **実装と同じファイルに `Deno.test()` でテストを書く**
  - 各ソースファイル内に直接テストコードを記述
  - テストはファイルの末尾に配置
  - importチェーンにより依存ファイルのテストも実行される仕様

### デバッグとサンプル実行

- **`if(import.meta.main) {}` で直接実行時のサンプルを記述する**
  - ファイルを直接実行した際の動作例を実装
  - 開発者がデバッグ目的で使用可能
  - 機能の使用例やテストケースとしても活用

### アーキテクチャ設計

- **関数指向でドメインモデリングする**
  - classよりも関数による実装を優先
  - 純粋関数を基本とし、副作用を最小化
  - 型安全性を重視したTypeScript設計
  - モジュール間の依存関係を明確化

### 実装例

```typescript
/**
 * ユーザー設定管理モジュール
 * XDG Base Directory仕様に準拠した設定ファイルの読み書き
 * preferences.json形式でモデル、ツールセット設定を永続化
 */

// 型定義
export type ToolsetType = "custom" | "builtin" | "codeExecution" | "googleSearch";

// 設定取得関数
export async function getDefaultToolset(): Promise<ToolsetType> {
  // 実装...
}

// テスト
Deno.test("getDefaultToolset - デフォルト値を正しく返す", async () => {
  // テスト実装...
});

// デバッグ用サンプル実行
if (import.meta.main) {
  console.log("=== 設定管理デバッグ ===");
  const toolset = await getDefaultToolset();
  console.log("現在のツールセット:", toolset);
}
```
