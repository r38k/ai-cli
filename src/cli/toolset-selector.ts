/**
 * ツールセット選択UIモジュール
 *
 * AIアシスタントが使用するツールセットを対話的に選択するUIを提供します。
 * MCPカスタムツール、ビルトインツール、コード実行、Google検索などの
 * ツールセットから選択でき、選択した設定を永続化します。
 *
 * 主要機能:
 * - ツールセットの一覧表示（説明付き）
 * - キーボードナビゲーション（上下矢印）
 * - 現在のデフォルトツールセットのハイライト
 * - 選択したツールセットの永続化
 *
 * 使用方法:
 * ```typescript
 * const selectedToolset = await selectToolset();
 * if (selectedToolset) {
 *   console.log(`選択されたツールセット: ${selectedToolset}`);
 * }
 * ```
 */

import {
  getDefaultToolset,
  setDefaultToolset,
  type ToolsetType,
} from "../core/preferences.ts";
import { cyan, dim, green } from "../ui/styles.ts";
import {
  clearScreen,
  disableRawMode,
  enableRawMode,
  hideCursor,
  readKey,
  showCursor,
} from "../ui/terminal.ts";

/**
 * ツールセット情報
 */
interface ToolsetInfo {
  id: ToolsetType;
  displayName: string;
  description: string;
}

const TOOLSETS: ToolsetInfo[] = [
  {
    id: "custom",
    displayName: "カスタムツール (MCP)",
    description: "ユーザー定義のMCPツールを使用",
  },
  {
    id: "builtin",
    displayName: "ビルトインツール",
    description: "コード実行 + Google検索",
  },
  {
    id: "codeExecution",
    displayName: "コード実行のみ",
    description: "Pythonコードの実行機能のみ",
  },
  {
    id: "googleSearch",
    displayName: "Google検索のみ",
    description: "Google検索機能のみ",
  },
];

/**
 * ツールセット選択UIを表示
 */
export async function selectToolset(): Promise<ToolsetType | null> {
  const currentDefault = await getDefaultToolset();
  let selectedIndex = TOOLSETS.findIndex((toolset) =>
    toolset.id === currentDefault
  );
  if (selectedIndex === -1) selectedIndex = 0;

  enableRawMode();
  hideCursor();

  try {
    while (true) {
      clearScreen();

      // ヘッダー
      console.log(cyan("🛠️  ツールセットを選択してください\n"));

      // ツールセットリスト
      TOOLSETS.forEach((toolset, index) => {
        const isSelected = index === selectedIndex;

        let line = "  ";
        if (isSelected) {
          line += green(`> ${toolset.displayName}`);
          line += "\n    " + dim(toolset.description);
        } else {
          line += `  ${toolset.displayName}`;
          line += "\n    " + dim(toolset.description);
        }

        console.log(line);
        console.log(); // 空行
      });

      // フッター
      console.log(dim("[↑/↓] 選択  [Enter] 決定  [Esc/q] キャンセル"));

      // キー入力を待つ
      const keyEvent = await readKey();

      switch (keyEvent.key) {
        case "up":
          selectedIndex = selectedIndex > 0
            ? selectedIndex - 1
            : TOOLSETS.length - 1;
          break;
        case "down":
          selectedIndex = selectedIndex < TOOLSETS.length - 1
            ? selectedIndex + 1
            : 0;
          break;
        case "return": {
          const selectedToolset = TOOLSETS[selectedIndex];
          await setDefaultToolset(selectedToolset.id);
          return selectedToolset.id;
        }
        case "escape":
        case "q":
          return null;
      }
    }
  } finally {
    disableRawMode();
    showCursor();
  }
}

// === テスト ===

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("toolset-selector - ツールセット一覧の整合性チェック", () => {
  // ツールセットが存在することを確認
  assert(TOOLSETS.length > 0, "少なくとも1つのツールセットが必要");

  // 各ツールセットの必須プロパティを確認
  for (const toolset of TOOLSETS) {
    assert(
      typeof toolset.id === "string",
      "ツールセットIDは文字列である必要があります",
    );
    assert(
      typeof toolset.displayName === "string",
      "表示名は文字列である必要があります",
    );
    assert(
      typeof toolset.description === "string",
      "説明は文字列である必要があります",
    );
    assert(toolset.id.length > 0, "ツールセットIDは空であってはいけません");
    assert(toolset.displayName.length > 0, "表示名は空であってはいけません");
  }
});

Deno.test("toolset-selector - デフォルトツールセットの検索", async () => {
  const currentDefault = await getDefaultToolset();

  // デフォルトツールセットが有効な値であることを確認
  const defaultIndex = TOOLSETS.findIndex((toolset) =>
    toolset.id === currentDefault
  );
  assert(
    defaultIndex !== -1,
    `デフォルトツールセット '${currentDefault}' は有効なツールセットIDである必要があります`,
  );
});

Deno.test("toolset-selector - 全てのツールセットが一意", () => {
  const ids = TOOLSETS.map((t) => t.id);
  const uniqueIds = new Set(ids);

  assertEquals(
    ids.length,
    uniqueIds.size,
    "ツールセットIDは一意である必要があります",
  );
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== ツールセット選択UI デバッグモード ===\n");
  console.log("現在利用可能なツールセット:");

  for (const toolset of TOOLSETS) {
    console.log(`\n- ${toolset.displayName} (${toolset.id})`);
    console.log(`  ${toolset.description}`);
  }

  console.log("\nツールセット選択UIを起動します...\n");

  try {
    const selected = await selectToolset();

    if (selected) {
      console.log(`\n選択されたツールセット: ${selected}`);
      console.log("このツールセットがデフォルトとして保存されました。");
    } else {
      console.log("\nキャンセルされました。");
    }
  } catch (error) {
    console.error(
      `\nエラーが発生しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
