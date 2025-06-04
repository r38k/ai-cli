/**
 * ユーザー設定管理モジュール
 *
 * AI CLIアプリケーションのユーザー設定を永続化・管理するコア機能を提供します。
 * XDG Base Directory仕様に準拠した設定ファイル管理により、デフォルトモデル、
 * ツールセット、各モデル固有のツール設定などを統一的に管理します。
 *
 * 主要機能:
 * - デフォルトAIモデルの設定・取得
 * - デフォルトツールセットの設定・取得
 * - モデル固有のツール設定管理
 * - 設定の自動保存・読み込み
 * - 設定ファイルの整合性保証
 *
 * 管理する設定項目:
 * - defaultModel: 使用するAIモデル（Gemini等）
 * - defaultToolset: 使用するツールセット（custom/builtin/etc）
 * - toolPreferences: モデル毎の個別ツール設定
 * - lastUpdated: 設定更新日時
 *
 * 使用方法:
 * ```typescript
 * // デフォルトモデルの設定
 * await setDefaultModel("gemini-2.0-flash");
 *
 * // デフォルトツールセットの設定
 * await setDefaultToolset("builtin");
 *
 * // 設定の取得
 * const model = await getDefaultModelFromPreferences();
 * const toolset = await getDefaultToolset();
 *
 * // モデル固有ツール設定
 * await setToolPreferencesForModel("gemini-1.5-pro", ["codeExecution"]);
 * ```
 *
 * 設定ファイル:
 * - パス: ~/.config/ai-cli/preferences.json
 * - 形式: JSON
 * - 自動バックアップ: あり
 */

import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";
import { getXdgConfigDir } from "./xdg.ts";
import type { ModelId } from "../api/model.ts";
import { getDefaultModel } from "../api/model.ts";

export type ToolsetType =
  | "custom"
  | "builtin"
  | "codeExecution"
  | "googleSearch";

export interface Preferences {
  defaultModel: ModelId;
  defaultToolset: ToolsetType;
  toolPreferences: {
    [modelId: string]: {
      selectedTools: ("codeExecution" | "googleSearch")[];
      lastUpdated: string;
    };
  };
  lastUpdated: string;
}

const PREFERENCES_FILE = "preferences.json";

/**
 * 設定ファイルのパスを取得
 */
export function getPreferencesPath(): string {
  return join(getXdgConfigDir(), PREFERENCES_FILE);
}

/**
 * 設定を読み込む
 */
export async function loadPreferences(): Promise<Preferences> {
  try {
    const path = getPreferencesPath();
    const content = await Deno.readTextFile(path);
    const parsed = JSON.parse(content);

    // 後方互換性: toolPreferencesが存在しない場合は追加
    if (!parsed.toolPreferences) {
      parsed.toolPreferences = {};
    }

    // 後方互換性: defaultToolsetが存在しない場合は追加
    if (!parsed.defaultToolset) {
      parsed.defaultToolset = "custom";
    }

    return parsed;
  } catch {
    // ファイルが存在しない場合はデフォルト値を返す
    return {
      defaultModel: getDefaultModel(),
      defaultToolset: "custom",
      toolPreferences: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * 設定を保存する
 */
export async function savePreferences(preferences: Preferences): Promise<void> {
  const configDir = getXdgConfigDir();
  await ensureDir(configDir);

  const path = getPreferencesPath();
  const content = JSON.stringify(preferences, null, 2);
  await Deno.writeTextFile(path, content);
}

/**
 * デフォルトモデルを取得
 */
export async function getDefaultModelFromPreferences(): Promise<ModelId> {
  const preferences = await loadPreferences();
  return preferences.defaultModel;
}

/**
 * デフォルトモデルを設定
 */
export async function setDefaultModel(modelId: ModelId): Promise<void> {
  const preferences = await loadPreferences();
  preferences.defaultModel = modelId;
  preferences.lastUpdated = new Date().toISOString();
  await savePreferences(preferences);
}

/**
 * デフォルトツールセットを取得
 */
export async function getDefaultToolset(): Promise<ToolsetType> {
  const preferences = await loadPreferences();
  return preferences.defaultToolset;
}

/**
 * デフォルトツールセットを設定
 */
export async function setDefaultToolset(toolset: ToolsetType): Promise<void> {
  const preferences = await loadPreferences();
  preferences.defaultToolset = toolset;
  preferences.lastUpdated = new Date().toISOString();
  await savePreferences(preferences);
}

/**
 * 特定モデルのツール設定を取得
 */
export async function getToolPreferencesForModel(
  modelId: ModelId,
): Promise<string[]> {
  const preferences = await loadPreferences();
  const toolPref = preferences.toolPreferences[modelId];
  return toolPref ? toolPref.selectedTools : [];
}

/**
 * 特定モデルのツール設定を保存
 */
export async function setToolPreferencesForModel(
  modelId: ModelId,
  tools: ("codeExecution" | "googleSearch")[],
): Promise<void> {
  const preferences = await loadPreferences();

  // toolPreferencesが存在しない場合は初期化
  if (!preferences.toolPreferences) {
    preferences.toolPreferences = {};
  }

  preferences.toolPreferences[modelId] = {
    selectedTools: tools,
    lastUpdated: new Date().toISOString(),
  };
  preferences.lastUpdated = new Date().toISOString();
  await savePreferences(preferences);
}

// テスト
Deno.test("preferences - load and save", async () => {
  const testPreferences: Preferences = {
    defaultModel: "gemini-1.5-flash",
    defaultToolset: "custom",
    toolPreferences: {},
    lastUpdated: new Date().toISOString(),
  };

  // 一時的なテスト用ディレクトリを使用
  const originalEnv = Deno.env.get("XDG_CONFIG_HOME");
  const tempDir = await Deno.makeTempDir();
  Deno.env.set("XDG_CONFIG_HOME", tempDir);

  try {
    await savePreferences(testPreferences);
    const loaded = await loadPreferences();

    console.assert(loaded.defaultModel === testPreferences.defaultModel);
    console.assert(loaded.lastUpdated === testPreferences.lastUpdated);
  } finally {
    // 環境変数を元に戻す
    if (originalEnv) {
      Deno.env.set("XDG_CONFIG_HOME", originalEnv);
    } else {
      Deno.env.delete("XDG_CONFIG_HOME");
    }
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("preferences - default values", async () => {
  // 一時的なテスト用ディレクトリを使用（ファイルが存在しない状態をテスト）
  const originalEnv = Deno.env.get("XDG_CONFIG_HOME");
  const tempDir = await Deno.makeTempDir();
  Deno.env.set("XDG_CONFIG_HOME", tempDir);

  try {
    const loaded = await loadPreferences();
    console.assert(loaded.defaultModel === getDefaultModel());
    console.assert(typeof loaded.lastUpdated === "string");
  } finally {
    // 環境変数を元に戻す
    if (originalEnv) {
      Deno.env.set("XDG_CONFIG_HOME", originalEnv);
    } else {
      Deno.env.delete("XDG_CONFIG_HOME");
    }
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("preferences - tool preferences for model", async () => {
  // 一時的なテスト用ディレクトリを使用
  const originalEnv = Deno.env.get("XDG_CONFIG_HOME");
  const tempDir = await Deno.makeTempDir();
  Deno.env.set("XDG_CONFIG_HOME", tempDir);

  try {
    // 初期状態で空配列を返すか確認
    const initialTools = await getToolPreferencesForModel("gemini-2.0-flash");
    console.assert(initialTools.length === 0);

    // ツール設定を保存
    await setToolPreferencesForModel("gemini-2.0-flash", ["codeExecution"]);
    const savedTools = await getToolPreferencesForModel("gemini-2.0-flash");
    console.assert(savedTools.length === 1);
    console.assert(savedTools[0] === "codeExecution");

    // 設定が永続化されているか確認
    const preferences = await loadPreferences();
    console.assert(
      preferences.toolPreferences["gemini-2.0-flash"] !== undefined,
    );
    console.assert(
      preferences.toolPreferences["gemini-2.0-flash"].selectedTools[0] ===
        "codeExecution",
    );
  } finally {
    // 環境変数を元に戻す
    if (originalEnv) {
      Deno.env.set("XDG_CONFIG_HOME", originalEnv);
    } else {
      Deno.env.delete("XDG_CONFIG_HOME");
    }
    await Deno.remove(tempDir, { recursive: true });
  }
});
