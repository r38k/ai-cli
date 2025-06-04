/**
 * モデル選択UIモジュール
 *
 * Gemini AIのモデルを対話的に選択するためのターミナルUIを提供します。
 * 矢印キーでの選択、Enterでの決定、Esc/qでのキャンセルに対応し、
 * 選択したモデルをデフォルトとして保存します。
 *
 * 主要機能:
 * - 利用可能なGeminiモデルの一覧表示
 * - キーボードナビゲーション（上下矢印）
 * - 現在のデフォルトモデルのハイライト表示
 * - 選択したモデルの永続化
 *
 * 使用方法:
 * ```typescript
 * const selectedModel = await selectModel();
 * if (selectedModel) {
 *   console.log(`選択されたモデル: ${selectedModel}`);
 * }
 * ```
 */

import { GEMINI_MODELS, type ModelId } from "../api/model.ts";
import {
  getDefaultModelFromPreferences,
  setDefaultModel,
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
 * モデル選択UIを表示
 */
export async function selectModel(): Promise<ModelId | null> {
  const models = Object.values(GEMINI_MODELS);
  const currentDefault = await getDefaultModelFromPreferences();
  let selectedIndex = models.findIndex((model) => model.id === currentDefault);
  if (selectedIndex === -1) selectedIndex = 0;

  enableRawMode();
  hideCursor();

  try {
    while (true) {
      clearScreen();

      // ヘッダー
      console.log(cyan("🤖 Gemini モデルを選択してください\n"));

      // モデルリスト
      models.forEach((model, index) => {
        const isSelected = index === selectedIndex;

        let line = "  ";
        if (isSelected) {
          line += green("> " + model.displayName);
        } else {
          line += "  " + model.displayName;
        }

        console.log(line);
      });

      // フッター
      console.log(dim("\n[↑/↓] 選択  [Enter] 決定  [Esc/q] キャンセル"));

      // キー入力を待つ
      const keyEvent = await readKey();

      switch (keyEvent.key) {
        case "up":
          selectedIndex = selectedIndex > 0
            ? selectedIndex - 1
            : models.length - 1;
          break;
        case "down":
          selectedIndex = selectedIndex < models.length - 1
            ? selectedIndex + 1
            : 0;
          break;
        case "return": {
          const selectedModel = models[selectedIndex];
          await setDefaultModel(selectedModel.id as ModelId);
          return selectedModel.id as ModelId;
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

import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("model-selector - モデル一覧の整合性チェック", () => {
  const models = Object.values(GEMINI_MODELS);

  // モデルが存在することを確認
  assert(models.length > 0, "少なくとも1つのモデルが必要");

  // 各モデルの必須プロパティを確認
  for (const model of models) {
    assert(
      typeof model.id === "string",
      "モデルIDは文字列である必要があります",
    );
    assert(
      typeof model.displayName === "string",
      "表示名は文字列である必要があります",
    );
    assert(model.id.length > 0, "モデルIDは空であってはいけません");
    assert(model.displayName.length > 0, "表示名は空であってはいけません");
  }
});

Deno.test("model-selector - デフォルトモデルの検索", async () => {
  const models = Object.values(GEMINI_MODELS);
  const currentDefault = await getDefaultModelFromPreferences();

  // デフォルトモデルが有効なモデルIDであることを確認
  const defaultIndex = models.findIndex((model) => model.id === currentDefault);
  assert(
    defaultIndex !== -1 || currentDefault === null,
    "デフォルトモデルは有効なモデルIDか未設定である必要があります",
  );
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== モデル選択UI デバッグモード ===\n");
  console.log("モデル選択UIを起動します...\n");

  try {
    const selected = await selectModel();

    if (selected) {
      console.log(`\n選択されたモデル: ${selected}`);
      console.log("このモデルがデフォルトとして保存されました。");
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
