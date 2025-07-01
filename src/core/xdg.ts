/**
 * XDG Base Directory仕様準拠パス解決モジュール
 *
 * XDG Base Directory仕様に基づいて、アプリケーション設定ファイルの
 * 適切な保存場所を決定します。環境変数による設定とフォールバック処理を
 * 統一的に提供し、クロスプラットフォーム対応も考慮しています。
 *
 * XDG仕様:
 * - CONFIG: ユーザー設定ファイル ($XDG_CONFIG_HOME)
 * - DATA: ユーザーデータファイル ($XDG_DATA_HOME)
 * - CACHE: キャッシュファイル ($XDG_CACHE_HOME)
 * - RUNTIME: ランタイムファイル ($XDG_RUNTIME_DIR)
 *
 * 使用方法:
 * ```typescript
 * const configDir = getXdgConfigDir(); // ~/.config/ai-cli
 * const dataDir = getXdgDataDir();     // ~/.local/share/ai-cli
 * ```
 *
 * 注意事項:
 * - Windows環境では$USERPROFILEを使用
 * - ホームディレクトリが見つからない場合はエラー
 * - レガシー設定(~/.ai-cli)からの移行もサポート
 */

import { join } from "jsr:@std/path";

const APP_NAME = "ai-cli";

/**
 * XDGディレクトリの汎用リゾルバー
 * @param envVar - 環境変数名 (例: "XDG_CONFIG_HOME")
 * @param defaultPath - デフォルトパス (例: [".config"])
 * @returns 解決されたディレクトリパス
 */
function resolveXdgDirectory(envVar: string, defaultPath: string[]): string {
  const xdgDir = Deno.env.get(envVar);
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");

  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }

  const baseDir = xdgDir || join(homeDir, ...defaultPath);
  
  return join(baseDir, APP_NAME);
}

/**
 * XDG設定ディレクトリを取得
 * @returns $XDG_CONFIG_HOME/ai-cli または ~/.config/ai-cli
 */
export function getXdgConfigDir(): string {
  return resolveXdgDirectory("XDG_CONFIG_HOME", [".config"]);
}

/**
 * XDGデータディレクトリを取得
 * @returns $XDG_DATA_HOME/ai-cli または ~/.local/share/ai-cli
 */
export function getXdgDataDir(): string {
  return resolveXdgDirectory("XDG_DATA_HOME", [".local", "share"]);
}

/**
 * XDGキャッシュディレクトリを取得
 * @returns $XDG_CACHE_HOME/ai-cli または ~/.cache/ai-cli
 */
export function getXdgCacheDir(): string {
  return resolveXdgDirectory("XDG_CACHE_HOME", [".cache"]);
}

/**
 * XDGランタイムディレクトリを取得（存在する場合）
 * @returns $XDG_RUNTIME_DIR/ai-cli または null
 */
export function getXdgRuntimeDir(): string | null {
  const xdgRuntimeDir = Deno.env.get("XDG_RUNTIME_DIR");
  if (!xdgRuntimeDir) {
    return null;
  }
  return join(xdgRuntimeDir, APP_NAME);
}

/**
 * レガシー設定ディレクトリ（~/.ai-cli）を取得
 * 移行用途で使用
 */
export function getLegacyConfigDir(): string {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }
  return join(homeDir, ".ai-cli");
}

// === テスト ===

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("getXdgConfigDir - 環境変数に基づいて正しいパスを返す", () => {
  const originalXdg = Deno.env.get("XDG_CONFIG_HOME");
  const originalHome = Deno.env.get("HOME");

  try {
    // XDG_CONFIG_HOMEが設定されている場合
    Deno.env.set("XDG_CONFIG_HOME", "/custom/config");
    assertEquals(getXdgConfigDir(), "/custom/config/ai-cli");

    // XDG_CONFIG_HOMEが未設定の場合（HOMEを使用）
    Deno.env.delete("XDG_CONFIG_HOME");
    Deno.env.set("HOME", "/home/user");
    assertEquals(getXdgConfigDir(), "/home/user/.config/ai-cli");
  } finally {
    // 環境変数を復元
    if (originalXdg) Deno.env.set("XDG_CONFIG_HOME", originalXdg);
    else Deno.env.delete("XDG_CONFIG_HOME");
    if (originalHome) Deno.env.set("HOME", originalHome);
  }
});

Deno.test("getXdgDataDir - 環境変数に基づいて正しいパスを返す", () => {
  const originalXdg = Deno.env.get("XDG_DATA_HOME");
  const originalHome = Deno.env.get("HOME");

  try {
    // XDG_DATA_HOMEが設定されている場合
    Deno.env.set("XDG_DATA_HOME", "/custom/data");
    assertEquals(getXdgDataDir(), "/custom/data/ai-cli");

    // XDG_DATA_HOMEが未設定の場合（HOMEを使用）
    Deno.env.delete("XDG_DATA_HOME");
    Deno.env.set("HOME", "/home/user");
    assertEquals(getXdgDataDir(), "/home/user/.local/share/ai-cli");
  } finally {
    // 環境変数を復元
    if (originalXdg) Deno.env.set("XDG_DATA_HOME", originalXdg);
    else Deno.env.delete("XDG_DATA_HOME");
    if (originalHome) Deno.env.set("HOME", originalHome);
  }
});

Deno.test("getXdgCacheDir - 環境変数に基づいて正しいパスを返す", () => {
  const originalXdg = Deno.env.get("XDG_CACHE_HOME");
  const originalHome = Deno.env.get("HOME");

  try {
    // XDG_CACHE_HOMEが設定されている場合
    Deno.env.set("XDG_CACHE_HOME", "/custom/cache");
    assertEquals(getXdgCacheDir(), "/custom/cache/ai-cli");

    // XDG_CACHE_HOMEが未設定の場合（HOMEを使用）
    Deno.env.delete("XDG_CACHE_HOME");
    Deno.env.set("HOME", "/home/user");
    assertEquals(getXdgCacheDir(), "/home/user/.cache/ai-cli");
  } finally {
    // 環境変数を復元
    if (originalXdg) Deno.env.set("XDG_CACHE_HOME", originalXdg);
    else Deno.env.delete("XDG_CACHE_HOME");
    if (originalHome) Deno.env.set("HOME", originalHome);
  }
});

Deno.test("getXdgRuntimeDir - ランタイムディレクトリを正しく処理", () => {
  const originalRuntime = Deno.env.get("XDG_RUNTIME_DIR");

  try {
    // XDG_RUNTIME_DIRが設定されている場合
    Deno.env.set("XDG_RUNTIME_DIR", "/run/user/1000");
    assertEquals(getXdgRuntimeDir(), "/run/user/1000/ai-cli");

    // XDG_RUNTIME_DIRが未設定の場合
    Deno.env.delete("XDG_RUNTIME_DIR");
    assertEquals(getXdgRuntimeDir(), null);
  } finally {
    // 環境変数を復元
    if (originalRuntime) Deno.env.set("XDG_RUNTIME_DIR", originalRuntime);
    else Deno.env.delete("XDG_RUNTIME_DIR");
  }
});

Deno.test("getLegacyConfigDir - レガシーパスを正しく返す", () => {
  const originalHome = Deno.env.get("HOME");

  try {
    Deno.env.set("HOME", "/home/user");
    assertEquals(getLegacyConfigDir(), "/home/user/.ai-cli");
  } finally {
    if (originalHome) Deno.env.set("HOME", originalHome);
  }
});

Deno.test("ホームディレクトリが見つからない場合のエラー処理", () => {
  const originalHome = Deno.env.get("HOME");
  const originalProfile = Deno.env.get("USERPROFILE");

  try {
    // HOMEもUSERPROFILEも未設定の場合
    Deno.env.delete("HOME");
    Deno.env.delete("USERPROFILE");

    assertThrows(
      () => getXdgConfigDir(),
      Error,
      "ホームディレクトリが見つかりません",
    );

    assertThrows(
      () => getXdgDataDir(),
      Error,
      "ホームディレクトリが見つかりません",
    );
  } finally {
    // 環境変数を復元
    if (originalHome) Deno.env.set("HOME", originalHome);
    if (originalProfile) Deno.env.set("USERPROFILE", originalProfile);
  }
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== XDG Base Directory パス解決 デバッグ ===\n");

  // 現在の環境変数の状態を表示
  console.log("環境変数:");
  console.log(`  HOME: ${Deno.env.get("HOME") || "(未設定)"}`);
  console.log(`  USERPROFILE: ${Deno.env.get("USERPROFILE") || "(未設定)"}`);
  console.log(
    `  XDG_CONFIG_HOME: ${Deno.env.get("XDG_CONFIG_HOME") || "(未設定)"}`,
  );
  console.log(
    `  XDG_DATA_HOME: ${Deno.env.get("XDG_DATA_HOME") || "(未設定)"}`,
  );
  console.log(
    `  XDG_CACHE_HOME: ${Deno.env.get("XDG_CACHE_HOME") || "(未設定)"}`,
  );
  console.log(
    `  XDG_RUNTIME_DIR: ${Deno.env.get("XDG_RUNTIME_DIR") || "(未設定)"}`,
  );
  console.log();

  // 各ディレクトリパスを表示
  console.log("ai-cliディレクトリパス:");
  try {
    console.log(`  設定: ${getXdgConfigDir()}`);
    console.log(`  データ: ${getXdgDataDir()}`);
    console.log(`  キャッシュ: ${getXdgCacheDir()}`);
    console.log(`  ランタイム: ${getXdgRuntimeDir() || "(利用不可)"}`);
    console.log(`  レガシー: ${getLegacyConfigDir()}`);
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  console.log();

  // ディレクトリの存在確認
  console.log("ディレクトリ存在確認:");
  try {
    const dirs = [
      { name: "設定", path: getXdgConfigDir() },
      { name: "データ", path: getXdgDataDir() },
      { name: "レガシー", path: getLegacyConfigDir() },
    ];

    for (const { name, path } of dirs) {
      try {
        const stat = Deno.statSync(path);
        console.log(
          `  ${name}: ${path} (${stat.isDirectory ? "存在" : "ファイル"})`,
        );
      } catch {
        console.log(`  ${name}: ${path} (未作成)`);
      }
    }
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
