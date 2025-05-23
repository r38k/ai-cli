# コンソール出力ライブラリ比較

## 1. Chalk
**最も有名で機能豊富なライブラリ**

```javascript
import chalk from 'chalk';
console.log(chalk.blue('Hello') + ' World' + chalk.red('!'));
console.log(chalk.bold.rgb(10, 100, 200)('Hello!'));
console.log(chalk.underline.bgBlue('Hello'));
```

### 特徴
- ✅ 最も人気（週間ダウンロード数1億以上）
- ✅ 豊富な機能（RGB、HEX、トゥルーカラー対応）
- ✅ チェーン可能なAPI
- ✅ 優れたドキュメント
- ❌ v5からESMのみ（CommonJS非対応）e
- ❌ 比較的重い（依存関係あり）
- ❌ 他より遅い

### 使用例
```javascript
// Wranglerでの使用例
console.log(chalk.dim(`--- ${chalk.yellow('WARNING')} ---`));
console.log(chalk.green('✓') + ' Success!');
```

## 2. Picocolors
**最小・最速のライブラリ**

```javascript
import pc from 'picocolors';
console.log(pc.blue('Hello') + ' World' + pc.red('!'));
console.log(pc.bold(pc.underline('Important')));
```

### 特徴
- ✅ 非常に軽量（2.7KB）
- ✅ 依存関係なし
- ✅ 最速（シンプルなスタイリング）
- ✅ CommonJS/ESM両対応
- ❌ 基本的な16色のみ
- ❌ 高度な機能なし（RGB、HEXなし）
- ❌ APIがシンプル（チェーン不可）

### ベンチマーク
```
picocolors × 4,360,786 ops/sec
chalk      × 1,841,254 ops/sec（2.4倍遅い）
```

## 3. Ansis
**高度なスタイリングで最速**

```javascript
import { cyan, bold, underline } from 'ansis';
console.log(bold(cyan('Hello')));
console.log(underline.cyan.bold('Chained'));
```

### 特徴
- ✅ 複雑なスタイリングで最速
- ✅ チェーン可能なAPI（Chalk風）
- ✅ 軽量（3.5KB）
- ✅ RGB/HEX対応
- ✅ TypeScript完全対応
- ❌ 比較的新しい（エコシステムが小さい）

### ベンチマーク（複数スタイル適用時）
```
ansis      × 640,101 ops/sec
picocolors × 481,646 ops/sec 
chalk      × 298,189 ops/sec
```

## 4. Kleur
**バランスの取れた選択肢**

```javascript
import kleur from 'kleur';
console.log(kleur.blue('Hello'));
console.log(kleur.bold().underline().red('Error!'));
```

### 特徴
- ✅ 軽量（6KB）
- ✅ 高速
- ✅ チェーン可能なAPI
- ✅ CommonJS/ESM両対応
- ✅ TypeScript対応
- ❌ 基本機能のみ（RGB/HEXなし）
- ❌ Chalkほど機能豊富ではない

## 5. Ansi-colors
**依存関係ゼロの高速ライブラリ**

```javascript
import colors from 'ansi-colors';
console.log(colors.green('Success!'));
console.log(colors.bold.red('Error'));
```

### 特徴
- ✅ 依存関係なし
- ✅ Chalkより10-20倍高速
- ✅ シンボル、テーマ機能
- ✅ 軽量
- ❌ APIが若干異なる
- ❌ コミュニティが小さい

## 比較表

| ライブラリ | サイズ | 速度 | 機能 | 人気度 | Deno対応 |
|---------|------|-----|-----|-------|---------|
| Chalk | 43KB | ★☆☆ | ★★★ | ★★★ | △(ESM) |
| Picocolors | 2.7KB | ★★★ | ★☆☆ | ★★☆ | ◯ |
| Ansis | 3.5KB | ★★★ | ★★☆ | ★☆☆ | ◯ |
| Kleur | 6KB | ★★★ | ★★☆ | ★★☆ | ◯ |
| Ansi-colors | 25KB | ★★★ | ★★☆ | ★☆☆ | △ |

## 推奨

### プロジェクトタイプ別
- **大規模プロジェクト**: Chalk（機能性重視）
- **パフォーマンス重視**: Picocolors/Ansis
- **バランス重視**: Kleur
- **Deno/ブラウザ**: Picocolors（最も互換性高い）

### 私たちのCLIツールには？
**Kleur**か**Picocolors**がおすすめ：
- Denoとの互換性が高い
- 軽量で高速
- Claude Codeの「シンプルさ優先」の思想に合致