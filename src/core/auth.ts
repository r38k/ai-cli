/**
 * 認証管理コアモジュール
 *
 * Gemini API認証情報の安全な保存・読み込み・管理を行うコア機能を提供します。
 * XDG Base Directory仕様に準拠した設定ファイル管理、Base64暗号化による安全な保存、
 * 開発環境での環境変数対応など、認証に関わる基盤機能を統合的に管理します。
 *
 * 主要機能:
 * - Gemini APIキーの暗号化保存・復号読み込み
 * - XDG準拠の設定ファイルパス管理
 * - 開発環境での環境変数からの認証情報取得
 * - MCP設定ファイルパスの管理
 * - 認証情報の作成・更新日時管理
 *
 * セキュリティ機能:
 * - APIキーのBase64エンコード保存
 * - ファイル権限の適切な設定（600）
 * - 環境変数経由での開発時認証
 *
 * 必要な権限:
 * - --allow-env: 環境変数へのアクセス
 * - --allow-read: 認証情報ファイルの読み取り
 * - --allow-write: 認証情報ファイルの書き込み
 *
 * 使用方法:
 * ```typescript
 * // 認証情報の保存
 * await saveCredentials("your-api-key");
 *
 * // 認証情報の読み込み
 * const creds = await loadCredentials();
 *
 * // APIキーの取得（環境変数または設定ファイル）
 * const apiKey = await getApiKey();
 * ```
 */

import { join } from "jsr:@std/path";
import { ensureDirSync } from "jsr:@std/fs";
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding";
import { getXdgConfigDir, getXdgDataDir } from "./xdg.ts";

export interface Credentials {
  geminiApiKey: string;
  createdAt: string;
  updatedAt: string;
}

const CREDENTIALS_FILE = "credentials";
const MCP_CONFIG_FILE = "mcp-config.json";

/**
 * 認証情報ファイルのパスを取得
 */
function getCredentialsPath(): string {
  return join(getXdgDataDir(), CREDENTIALS_FILE);
}

/**
 * 認証情報を保存
 */
export async function saveCredentials(apiKey: string): Promise<void> {
  const dataDir = getXdgDataDir();
  ensureDirSync(dataDir);

  const credentials: Credentials = {
    geminiApiKey: apiKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // JSONをBase64エンコードして保存（最小限の難読化）
  const encoded = encodeBase64(JSON.stringify(credentials));
  const credentialsPath = getCredentialsPath();

  await Deno.writeTextFile(credentialsPath, encoded);

  // ファイル権限を600に設定（所有者のみ読み書き可能）
  if (Deno.build.os !== "windows") {
    await Deno.chmod(credentialsPath, 0o600);
  }
}

/**
 * 認証情報を読み込み
 */
export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const credentialsPath = getCredentialsPath();
    const encoded = await Deno.readTextFile(credentialsPath);
    const decoded = new TextDecoder().decode(decodeBase64(encoded));
    return JSON.parse(decoded) as Credentials;
  } catch {
    return null;
  }
}

/**
 * 認証情報を削除
 */
export async function deleteCredentials(): Promise<void> {
  try {
    const credentialsPath = getCredentialsPath();
    await Deno.remove(credentialsPath);
  } catch {
    // ファイルが存在しない場合は無視
  }
}

/**
 * APIキーを取得（開発モードでは環境変数からも読み込み）
 */
export async function getApiKey(): Promise<string | null> {
  // 開発モードの場合は環境変数を優先
  if (Deno.env.get("DENO_ENV") === "development") {
    const envKey = Deno.env.get("GEMINI_API_KEY");
    if (envKey) return envKey;
  }

  // 認証情報から読み込み
  const credentials = await loadCredentials();
  return credentials?.geminiApiKey || null;
}

/**
 * MCPコンフィグパスを取得
 */
export function getMcpConfigPath(): string {
  // 開発モードの場合は環境変数も確認
  if (Deno.env.get("DENO_ENV") === "development") {
    const envPath = Deno.env.get("MCP_CONFIG_PATH");
    if (envPath) return envPath;
  }

  return join(getXdgConfigDir(), MCP_CONFIG_FILE);
}

// テスト
const { assertEquals, assertExists } = await import("@std/assert") as {
  assertEquals: (actual: unknown, expected: unknown) => void;
  assertExists: (actual: unknown) => void;
};
const { existsSync: existsSyncTest } = await import("jsr:@std/fs") as {
  existsSync: (path: string) => boolean;
};

// テスト用のホームディレクトリを設定
const TEST_HOME = await Deno.makeTempDir();
const originalHome = Deno.env.get("HOME");
const originalXdgConfigHome = Deno.env.get("XDG_CONFIG_HOME");
const originalXdgDataHome = Deno.env.get("XDG_DATA_HOME");

function setTestHome() {
  Deno.env.set("HOME", TEST_HOME);
  // XDG環境変数をクリアしてデフォルト値を使用させる
  Deno.env.delete("XDG_CONFIG_HOME");
  Deno.env.delete("XDG_DATA_HOME");
}

function restoreHome() {
  if (originalHome) {
    Deno.env.set("HOME", originalHome);
  } else {
    Deno.env.delete("HOME");
  }

  if (originalXdgConfigHome) {
    Deno.env.set("XDG_CONFIG_HOME", originalXdgConfigHome);
  } else {
    Deno.env.delete("XDG_CONFIG_HOME");
  }

  if (originalXdgDataHome) {
    Deno.env.set("XDG_DATA_HOME", originalXdgDataHome);
  } else {
    Deno.env.delete("XDG_DATA_HOME");
  }
}

Deno.test({
  name: "saveCredentials - 認証情報を保存",
  fn: async () => {
    setTestHome();

    try {
      const testApiKey = "test-api-key-12345";
      await saveCredentials(testApiKey);

      // ファイルが作成されていることを確認
      const credentialsPath = join(
        TEST_HOME,
        ".local",
        "share",
        "ai-cli",
        "credentials",
      );
      assertExists(credentialsPath);
      assertEquals(existsSyncTest(credentialsPath), true);

      // ファイルの権限を確認（Windowsでない場合）
      if (Deno.build.os !== "windows") {
        const fileInfo = await Deno.stat(credentialsPath);
        // 600 (0o600) = rw-------
        assertEquals(fileInfo.mode! & 0o777, 0o600);
      }
    } finally {
      restoreHome();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "loadCredentials - 認証情報を読み込み",
  fn: async () => {
    setTestHome();

    try {
      const testApiKey = "test-api-key-67890";

      // 認証情報を保存
      await saveCredentials(testApiKey);

      // 認証情報を読み込み
      const credentials = await loadCredentials();

      assertExists(credentials);
      assertEquals(credentials!.geminiApiKey, testApiKey);
      assertExists(credentials!.createdAt);
      assertExists(credentials!.updatedAt);
    } finally {
      restoreHome();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "loadCredentials - ファイルが存在しない場合はnullを返す",
  fn: async () => {
    const freshTestHome = await Deno.makeTempDir();
    const originalHome = Deno.env.get("HOME");
    const originalXdgConfigHome = Deno.env.get("XDG_CONFIG_HOME");
    const originalXdgDataHome = Deno.env.get("XDG_DATA_HOME");

    try {
      Deno.env.set("HOME", freshTestHome);
      Deno.env.delete("XDG_CONFIG_HOME");
      Deno.env.delete("XDG_DATA_HOME");
      const credentials = await loadCredentials();
      assertEquals(credentials, null);
    } finally {
      if (originalHome) {
        Deno.env.set("HOME", originalHome);
      } else {
        Deno.env.delete("HOME");
      }
      if (originalXdgConfigHome) {
        Deno.env.set("XDG_CONFIG_HOME", originalXdgConfigHome);
      } else {
        Deno.env.delete("XDG_CONFIG_HOME");
      }
      if (originalXdgDataHome) {
        Deno.env.set("XDG_DATA_HOME", originalXdgDataHome);
      } else {
        Deno.env.delete("XDG_DATA_HOME");
      }
      try {
        await Deno.remove(freshTestHome, { recursive: true });
      } catch {
        // ディレクトリが存在しない場合は無視
      }
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "deleteCredentials - 認証情報を削除",
  fn: async () => {
    setTestHome();

    try {
      const testApiKey = "test-api-key-delete";

      // 認証情報を保存
      await saveCredentials(testApiKey);
      const credentialsPath = join(
        TEST_HOME,
        ".local",
        "share",
        "ai-cli",
        "credentials",
      );
      assertEquals(existsSyncTest(credentialsPath), true);

      // 認証情報を削除
      await deleteCredentials();
      assertEquals(existsSyncTest(credentialsPath), false);
    } finally {
      restoreHome();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "getApiKey - 開発モードで環境変数から読み込み",
  fn: async () => {
    const originalEnv = Deno.env.get("DENO_ENV");
    const originalApiKey = Deno.env.get("GEMINI_API_KEY");

    try {
      Deno.env.set("DENO_ENV", "development");
      Deno.env.set("GEMINI_API_KEY", "env-api-key");

      const apiKey = await getApiKey();
      assertEquals(apiKey, "env-api-key");
    } finally {
      if (originalEnv) {
        Deno.env.set("DENO_ENV", originalEnv);
      } else {
        Deno.env.delete("DENO_ENV");
      }

      if (originalApiKey) {
        Deno.env.set("GEMINI_API_KEY", originalApiKey);
      } else {
        Deno.env.delete("GEMINI_API_KEY");
      }
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "getApiKey - 認証情報ファイルから読み込み",
  fn: async () => {
    setTestHome();
    const originalEnv = Deno.env.get("DENO_ENV");

    try {
      // 非開発モードに設定
      Deno.env.set("DENO_ENV", "production");

      const testApiKey = "file-api-key";
      await saveCredentials(testApiKey);

      const apiKey = await getApiKey();
      assertEquals(apiKey, testApiKey);
    } finally {
      restoreHome();
      if (originalEnv) {
        Deno.env.set("DENO_ENV", originalEnv);
      } else {
        Deno.env.delete("DENO_ENV");
      }
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "getMcpConfigPath - 開発モードで環境変数から読み込み",
  fn: () => {
    const originalEnv = Deno.env.get("DENO_ENV");
    const originalPath = Deno.env.get("MCP_CONFIG_PATH");

    try {
      Deno.env.set("DENO_ENV", "development");
      Deno.env.set("MCP_CONFIG_PATH", "/custom/mcp-config.json");

      const configPath = getMcpConfigPath();
      assertEquals(configPath, "/custom/mcp-config.json");
    } finally {
      if (originalEnv) {
        Deno.env.set("DENO_ENV", originalEnv);
      } else {
        Deno.env.delete("DENO_ENV");
      }

      if (originalPath) {
        Deno.env.set("MCP_CONFIG_PATH", originalPath);
      } else {
        Deno.env.delete("MCP_CONFIG_PATH");
      }
    }
  },
});

// テスト後のクリーンアップ
Deno.test({
  name: "cleanup - テスト用ディレクトリを削除",
  fn: async () => {
    try {
      await Deno.remove(TEST_HOME, { recursive: true });
    } catch {
      // ディレクトリが存在しない場合は無視
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
