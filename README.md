# AI CLI

Google Gemini AIとModel Context Protocol (MCP)を統合したDenoベースのCLIツールです。対話型とワンショット実行の両モードをサポートし、MCPツールによる高度な機能拡張が可能です。

## 機能

- 🤖 Google Gemini AIとの対話（ストリーミング対応）
- 🔧 MCP (Model Context Protocol)によるツール統合
- 📁 ファイル入力・標準入力のサポート
- 🎨 カラフルなターミナル出力
- ⚡ 高速なDeno実行環境

## 必要な環境

- Deno 2.0以上
- Google Gemini APIキー（環境変数 `GEMINI_API_KEY`）
- MCPサーバー設定（オプション、環境変数 `MCP_CONFIG_PATH`）

## インストール

```bash
# バイナリとしてビルド
deno task build

# aiコマンドをパスの通った場所に移動
sudo mv ai /usr/local/bin/
```

## 使用方法

### インタラクティブモード

```bash
# 対話型セッションを開始
ai

# システムプロンプトを指定して開始
ai -s "あなたは親切なアシスタントです"

# MCPツールを有効化して開始
ai --tools
```

### ワンショットモード

```bash
# 単一の質問を実行
ai "今日の日付は？"

# ファイルを読み込んで質問
ai -f package.json "このファイルの内容を説明して"

# 複数ファイルを読み込む
ai -f src/index.ts -f README.md "これらのファイルの関係を説明して"

# 標準入力からデータを受け取る
cat data.json | ai "このJSONデータを解析して"

# パイプラインで使用
ls -la | ai "このディレクトリ構造について説明して"
```

### 高度な使用例

```bash
# モデルとトークン数を指定
ai -m gemini-pro -t 2000 "長い説明をお願いします"

# 詳細出力モード
ai -v "デバッグ情報を含めて実行"

# ファイルレビュー
ai -f src/**.ts --tools "TypeScriptコードをレビューして改善案を提示して"

# システムプロンプトとファイルを組み合わせる
ai -s "経験豊富なコードレビュアーとして" -f main.go "このGoコードの改善点を教えて"
```

## オプション

| オプション | 短縮形 | 説明 | デフォルト |
|---------|-------|------|----------|
| `--file` | `-f` | 入力ファイルを指定（複数指定可） | - |
| `--model` | `-m` | 使用するGeminiモデル | gemini-2.0-flash-exp |
| `--max-tokens` | `-t` | 最大出力トークン数 | 1000 |
| `--system` | `-s` | システムプロンプト | - |
| `--verbose` | `-v` | 詳細な出力を表示 | false |
| `--tools` | - | MCPツールを有効化 | false |
| `--help` | `-h` | ヘルプを表示 | - |

## MCP設定

MCPツールを使用するには、設定ファイルを作成して環境変数で指定します：

```json
{
  "mcpServer": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/workspace"],
      "env": {}
    }
  }
}
```

```bash
export MCP_CONFIG_PATH=~/.config/mcp/servers.json
ai --tools "ファイルを作成して"
```

## 開発

```bash
# 開発モードで実行（ウォッチモード）
deno task dev

# テストを実行
deno test

# コードフォーマット
deno fmt

# リント
deno lint

# ビルド
deno task build
```

## ライセンス

MIT
