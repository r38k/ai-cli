本プロジェクトはClaude CodeでVibe Codingチックな開発をしています．

---
# AI CLI

Google Gemini AIとModel Context Protocol (MCP)を統合したDenoベースのCLIツールです。対話型とワンショット実行の両モードをサポートし、MCPツールによる高度な機能拡張が可能です。

## 機能

- 🤖 **Google Gemini AI統合**: ストリーミング対応のリアルタイム対話
- 🔧 **MCP (Model Context Protocol)対応**: 外部ツールとの統合で機能拡張
- 📁 **柔軟な入力サポート**: ファイル入力、標準入力、パイプライン処理
- 🎨 **リッチなターミナル出力**: カラフルで読みやすい表示
- ⚡ **高速実行**: Denoランタイムによる軽量で高速な動作
- 🔒 **セキュアな認証**: 暗号化されたAPIキー管理

## クイックスタート

### 1. インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/ai-cli.git
cd ai-cli

# バイナリとしてビルド
deno task build

# aiコマンドをパスの通った場所にシンボリックリンクで登録（推奨）
sudo ln -sf $(pwd)/bin/ai /usr/local/bin/ai

# または、直接移動（シンボリックリンクを使わない場合）
# sudo mv bin/ai /usr/local/bin/ai
```

### 2. 初期設定

```bash
# Gemini APIキーを設定
ai auth

# MCP設定（オプション、ツール機能を使用する場合）
ai mcp add
```

### 3. MCPコマンド

MCPサーバーの管理には専用のコマンドを使用します：

```bash
# MCPサーバーの追加（インタラクティブ）
ai mcp add

# 設定済みサーバーの一覧表示
ai mcp list

# MCPサーバーの削除（インタラクティブ選択）
ai mcp remove

# MCPヘルプの表示
ai mcp help
```

**MCPサーバー追加の例：**
```bash
ai mcp add
# サーバー名: filesystem
# 実行コマンド: npx
# 引数: -y @modelcontextprotocol/server-filesystem /path/to/workspace
# 環境変数名: (空でEnter)
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
ai -m gemini-2.0-flash-exp -t 2000 "詳細な説明をお願いします"

# 詳細出力モード
ai -v "デバッグ情報を含めて実行"

# TypeScriptコードレビュー（MCPツール使用）
ai -f src/**/*.ts --tools "TypeScriptコードをレビューして改善案を提示して"

# システムプロンプトとファイルを組み合わせる
ai -s "経験豊富なコードレビュアーとして" -f main.go "このGoコードの改善点を教えて"

# Git差分の解析
git diff | ai "この変更について説明して"

# ログファイルの解析
ai -f app.log --tools "エラーパターンを分析してください"
```

## オプション

| オプション     | 短縮形 | 説明                             | デフォルト           |
| -------------- | ------ | -------------------------------- | -------------------- |
| `--file`       | `-f`   | 入力ファイルを指定（複数指定可） | -                    |
| `--model`      | `-m`   | 使用するGeminiモデル             | gemini-2.0-flash-exp |
| `--max-tokens` | `-t`   | 最大出力トークン数               | 1000                 |
| `--system`     | `-s`   | システムプロンプト               | -                    |
| `--verbose`    | `-v`   | 詳細な出力を表示                 | false                |
| `--tools`      | -      | MCPツールを有効化                | false                |
| `--help`       | `-h`   | ヘルプを表示                     | -                    |


## 開発

### 開発環境のセットアップ

```bash
# 依存関係の確認
deno info

# 開発モードで実行（ウォッチモード）
deno task dev

# 権限を指定して直接実行
deno run -A src/index.ts
```

### テストとコード品質

```bash
# 全テストの実行
deno test --allow-env --allow-read --allow-write

# 特定のテストファイルの実行
deno test src/cli/parser.test.ts --allow-env

# コードフォーマット
deno fmt

# リント
deno lint

# バイナリビルド
deno task build
```

### アーキテクチャ

```
src/
├── index.ts          # エントリーポイント
├── cli/              # CLI関連
│   ├── parser.ts     # コマンドライン引数解析
│   ├── modes.ts      # 実行モード判定
│   └── input.ts      # 入力処理
├── core/             # コア機能
│   └── prompts.ts    # プロンプト管理
├── api/              # 外部API
│   └── gemini.ts     # Gemini API統合
├── tools/            # ツール統合
│   └── mcp.ts        # MCPクライアント
└── ui/               # ユーザーインターフェース
    ├── console.ts    # コンソール出力
    └── styles.ts     # スタイリング
```


## ライセンス

MIT License
