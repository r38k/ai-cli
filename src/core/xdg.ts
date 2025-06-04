// XDG Base Directory仕様に基づくパス解決
import { join } from "jsr:@std/path";

const APP_NAME = "ai-cli";

/**
 * XDG設定ディレクトリを取得
 * @returns $XDG_CONFIG_HOME/ai-cli または ~/.config/ai-cli
 */
export function getXdgConfigDir(): string {
  const xdgConfigHome = Deno.env.get("XDG_CONFIG_HOME");
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  
  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }
  
  const baseDir = xdgConfigHome || join(homeDir, ".config");
  return join(baseDir, APP_NAME);
}

/**
 * XDGデータディレクトリを取得
 * @returns $XDG_DATA_HOME/ai-cli または ~/.local/share/ai-cli
 */
export function getXdgDataDir(): string {
  const xdgDataHome = Deno.env.get("XDG_DATA_HOME");
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  
  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }
  
  const baseDir = xdgDataHome || join(homeDir, ".local", "share");
  return join(baseDir, APP_NAME);
}

/**
 * XDGキャッシュディレクトリを取得
 * @returns $XDG_CACHE_HOME/ai-cli または ~/.cache/ai-cli
 */
export function getXdgCacheDir(): string {
  const xdgCacheHome = Deno.env.get("XDG_CACHE_HOME");
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  
  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }
  
  const baseDir = xdgCacheHome || join(homeDir, ".cache");
  return join(baseDir, APP_NAME);
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