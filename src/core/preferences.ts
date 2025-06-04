import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";
import { getXdgConfigDir } from "./xdg.ts";
import type { ModelId } from "../api/model.ts";
import { getDefaultModel } from "../api/model.ts";

export interface Preferences {
  defaultModel: ModelId;
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
    return JSON.parse(content);
  } catch {
    // ファイルが存在しない場合はデフォルト値を返す
    return {
      defaultModel: getDefaultModel(),
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

// テスト
if (import.meta.main) {
  Deno.test("preferences - load and save", async () => {
    const testPreferences: Preferences = {
      defaultModel: "gemini-1.5-flash",
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
}