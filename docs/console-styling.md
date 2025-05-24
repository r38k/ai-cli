# コンソール出力スタイリング設計

## 概要

Claude CodeやWranglerのような洗練されたコンソール出力スタイルを実装する。

## デザイン原則

1. **可読性**: 情報の階層を明確に表現
2. **一貫性**: 統一されたカラースキームとフォーマット
3. **アクセシビリティ**: NO_COLOR環境変数のサポート
4. **パフォーマンス**: ストリーミング出力に対応

## 出力スタイル仕様

### カラーパレット

- Primary: 青 - 主要な情報
- Success: 緑 - 成功メッセージ
- Warning: 黄 - 警告
- Error: 赤 - エラー
- Info: シアン - 補足情報
- Muted: グレー - 二次的な情報

### 出力パターン

#### ステータスメッセージ

```
✓ タスクが完了しました
✗ エラーが発生しました
⚠ 警告: 非推奨のAPIを使用しています
ℹ 情報: 新しいバージョンが利用可能です
```

#### プログレス表示

```
⠋ 処理中...
[████████████████████████] 100% 完了
```

#### マークダウンレンダリング

- **太字**、_斜体_、`インラインコード`
- コードブロックのシンタックスハイライト
- リスト、見出しの適切な表示

## 実装方針

### ライブラリ選定

- `cliffy/ansi`: ANSIエスケープシーケンス処理
- `std/fmt/colors`: Deno標準のカラー処理
- マークダウンレンダリングは軽量な実装を検討

### モジュール構成

```
src/ui/
├── console.ts       # メイン出力インターフェース
├── colors.ts        # カラー定義と適用
├── spinner.ts       # スピナー・プログレス表示
└── markdown.ts      # Markdownレンダリング
```

## API設計

```typescript
// 基本出力
export function print(message: string, options?: PrintOptions): void;
export function error(message: string): void;
export function success(message: string): void;
export function warning(message: string): void;
export function info(message: string): void;

// スピナー
export function spinner(message: string): Spinner;

// Markdownレンダリング
export function renderMarkdown(content: string): void;
```
