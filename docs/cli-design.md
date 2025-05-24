# AI CLI 設計ドキュメント

## 概要

Claude
CodeのGemini版として、コマンドラインから直接LLMを呼び出せるCLIツールを実装する。

## 主要機能

### 1. 実行モード

- **インタラクティブモード**: `ai` - 対話型のREPLセッション
- **ワンショットモード**: `ai "質問"` - 単一の質問に回答して終了
- **パイプモード**: `command | ai "質問"` - 標準入力を読み取って処理
- **ファイルモード**: `ai -f file.txt "質問"` - ファイル内容を含めて処理

### 2. コマンドライン引数

```bash
ai [options] [prompt]

Options:
  -f, --file <path>      入力ファイルを指定
  -m, --model <name>     使用するモデルを指定 (default: gemini-2.0-flash-exp)
  -t, --max-tokens <n>   最大出力トークン数 (default: 1000)
  -s, --system <prompt>  システムプロンプトを指定
  -v, --verbose          詳細な出力を表示
  -h, --help             ヘルプを表示
```

### 3. アーキテクチャ

```
src/
├── index.ts          # エントリーポイント
├── cli/
│   ├── parser.ts     # コマンドライン引数のパース
│   ├── modes.ts      # 実行モードの判定と処理
│   └── input.ts      # 入力処理（stdin、ファイル）
├── core/
│   ├── context.ts    # コンテキスト管理
│   ├── prompt.ts     # プロンプト構築
│   └── session.ts    # セッション管理
├── api/
│   └── gemini.ts     # Gemini API統合
└── tools/
    └── mcp.ts        # MCPクライアント設定
```

## 実装方針

### フェーズ1: CLI基盤構築

1. コマンドライン引数パーサーの実装
2. 実行モードの判定ロジック
3. 標準入力・ファイル読み取り機能

### フェーズ2: コンテキスト管理

1. 作業ディレクトリ情報の収集
2. ファイル内容の管理
3. 会話履歴の保持

### フェーズ3: プロンプト最適化

1. システムプロンプトの設計
2. コンテキスト情報の注入
3. Claude Code風の振る舞い実装

### フェーズ4: 高度な機能

1. MCPツールの活用
2. ストリーミング出力の改善
3. エラーハンドリングの強化

## テスト戦略

各モジュールに対してユニットテストを作成：

- `parser.test.ts`: CLIパーサーのテスト
- `modes.test.ts`: 実行モード判定のテスト
- `input.test.ts`: 入力処理のテスト
- `context.test.ts`: コンテキスト管理のテスト

## 使用例

```bash
# インタラクティブモード
$ ai
> TypeScriptでFizzBuzzを書いて
...

# ワンショット
$ ai "package.jsonの依存関係を説明して"

# パイプ入力
$ cat error.log | ai "このエラーの原因を分析して"

# ファイル指定
$ ai -f src/index.ts "このコードをレビューして"

# 複数ファイル
$ ai -f src/index.ts -f src/api/gemini.ts "これらのファイルの関係を説明して"
```
