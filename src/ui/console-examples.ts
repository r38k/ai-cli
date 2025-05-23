import { gray, green, red, yellow, blue, dim } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// 例1: インデント付きリスト表示
export function showTodoList() {
  console.log("● Update Todos");
  console.log("  ⎿  ☒ CLI設計ドキュメントを/docs/cli-design.mdに作成");
  console.log("     ☐ コンソール出力スタイリングの設計ドキュメントを作成");
  console.log("     ☐ CLIの基本構造を再設計（コマンドライン引数、パイプ入力対応）");
}

// 例2: カラー付きで実装
export function showColoredTodoList() {
  console.log(blue("●") + " Update Todos");
  console.log("  ⎿  " + green("☒") + " " + dim("CLI設計ドキュメントを/docs/cli-design.mdに作成"));
  console.log("     " + yellow("☐") + " コンソール出力スタイリングの設計ドキュメントを作成");
  console.log("     " + yellow("☐") + " CLIの基本構造を再設計（コマンドライン引数、パイプ入力対応）");
}

// 例3: 構造化された出力関数
export function printTree(items: Array<{ label: string; done: boolean; children?: Array<{ label: string; done: boolean }> }>) {
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const connector = isLast ? "└─" : "├─";
    const checkbox = item.done ? green("☒") : yellow("☐");
    
    console.log(`${connector} ${checkbox} ${item.label}`);
    
    if (item.children) {
      item.children.forEach((child, childIndex) => {
        const prefix = isLast ? "   " : "│  ";
        const childConnector = childIndex === item.children!.length - 1 ? "└─" : "├─";
        const childCheckbox = child.done ? green("☒") : yellow("☐");
        
        console.log(`${prefix}${childConnector} ${childCheckbox} ${child.label}`);
      });
    }
  });
}

// 例4: ボックス描画
export function printBox(title: string, content: string[]) {
  const maxLength = Math.max(title.length, ...content.map(line => line.length)) + 4;
  
  // 上枠
  console.log("╭─" + "─".repeat(maxLength - 2) + "╮");
  
  // タイトル
  console.log("│ " + blue(title.padEnd(maxLength - 4)) + " │");
  
  // 区切り線
  console.log("├─" + "─".repeat(maxLength - 2) + "┤");
  
  // コンテンツ
  content.forEach(line => {
    console.log("│ " + line.padEnd(maxLength - 4) + " │");
  });
  
  // 下枠
  console.log("╰─" + "─".repeat(maxLength - 2) + "╯");
}

// 例5: プログレスバー
export function showProgress(current: number, total: number, label?: string) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.floor((current / total) * 20);
  const empty = 20 - filled;
  
  const bar = green("█".repeat(filled)) + gray("░".repeat(empty));
  const status = label ? ` ${label}` : "";
  
  console.log(`[${bar}] ${percentage}%${status}`);
}

// 使用例
if (import.meta.main) {
  console.log("\n=== インデント付きリスト ===");
  showTodoList();
  
  console.log("\n=== カラー付きリスト ===");
  showColoredTodoList();
  
  console.log("\n=== ツリー表示 ===");
  printTree([
    {
      label: "プロジェクト設定",
      done: true,
      children: [
        { label: "package.json作成", done: true },
        { label: "tsconfig.json設定", done: true },
      ]
    },
    {
      label: "機能実装",
      done: false,
      children: [
        { label: "CLIパーサー", done: false },
        { label: "ファイル読み込み", done: false },
      ]
    }
  ]);
  
  console.log("\n=== ボックス表示 ===");
  printBox("ファイル分析", [
    "src/index.ts",
    "行数: 150",
    "複雑度: 中"
  ]);
  
  console.log("\n=== プログレスバー ===");
  showProgress(75, 100, "処理中...");
}