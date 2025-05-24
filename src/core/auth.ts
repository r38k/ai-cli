// 必要な権限: --allow-env --allow-read --allow-write (環境変数読み込みと認証情報ファイルの読み書きのため)
import { join } from "jsr:@std/path";
import { ensureDirSync } from "jsr:@std/fs";
import { encodeBase64, decodeBase64 } from "jsr:@std/encoding";

export interface Credentials {
  geminiApiKey: string;
  createdAt: string;
  updatedAt: string;
}

const CONFIG_DIR = ".ai-cli";
const CREDENTIALS_FILE = "credentials";

/**
 * 設定ディレクトリのパスを取得
 */
function getConfigDir(): string {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!homeDir) {
    throw new Error("ホームディレクトリが見つかりません");
  }
  return join(homeDir, CONFIG_DIR);
}

/**
 * 認証情報ファイルのパスを取得
 */
function getCredentialsPath(): string {
  return join(getConfigDir(), CREDENTIALS_FILE);
}

/**
 * 認証情報を保存
 */
export async function saveCredentials(apiKey: string): Promise<void> {
  const configDir = getConfigDir();
  ensureDirSync(configDir);
  
  const credentials: Credentials = {
    geminiApiKey: apiKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
  
  return join(getConfigDir(), "mcp-config.json");
}

// テスト
const { assertEquals, assertExists } = await import("@std/assert") as {
  assertEquals: (actual: unknown, expected: unknown) => void;
  assertExists: (actual: unknown) => void;
};
const { existsSync } = await import("jsr:@std/fs") as {
  existsSync: (path: string) => boolean;
};

// テスト用のホームディレクトリを設定
const TEST_HOME = await Deno.makeTempDir();
const originalHome = Deno.env.get("HOME");

function setTestHome() {
  Deno.env.set("HOME", TEST_HOME);
}

function restoreHome() {
  if (originalHome) {
    Deno.env.set("HOME", originalHome);
  } else {
    Deno.env.delete("HOME");
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
      const credentialsPath = join(TEST_HOME, ".ai-cli", "credentials");
      assertExists(credentialsPath);
      assertEquals(existsSync(credentialsPath), true);
      
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
    
    try {
      Deno.env.set("HOME", freshTestHome);
      const credentials = await loadCredentials();
      assertEquals(credentials, null);
    } finally {
      if (originalHome) {
        Deno.env.set("HOME", originalHome);
      } else {
        Deno.env.delete("HOME");
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
      const credentialsPath = join(TEST_HOME, ".ai-cli", "credentials");
      assertEquals(existsSync(credentialsPath), true);
      
      // 認証情報を削除
      await deleteCredentials();
      assertEquals(existsSync(credentialsPath), false);
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