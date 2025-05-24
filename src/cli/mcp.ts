// 必要な権限: --allow-env --allow-read --allow-write (MCP設定ファイルの管理のため)
import { error, info, success } from "../ui/console.ts";
import { getMcpConfigPath } from "../core/auth.ts";
import { ensureDirSync, existsSync } from "jsr:@std/fs";
import { dirname, join } from "jsr:@std/path";

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServer: Record<string, McpServerConfig>;
}

/**
 * MCP設定ファイルを読み込み
 */
export async function loadMcpConfig(): Promise<McpConfig> {
  const configPath = getMcpConfigPath();
  
  if (!existsSync(configPath)) {
    return { mcpServer: {} };
  }
  
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content) as McpConfig;
  } catch (err) {
    error(`MCP設定ファイルの読み込みエラー: ${err}`);
    return { mcpServer: {} };
  }
}

/**
 * MCP設定ファイルを保存
 */
export async function saveMcpConfig(config: McpConfig): Promise<void> {
  const configPath = getMcpConfigPath();
  const configDir = dirname(configPath);
  
  // ディレクトリを作成
  ensureDirSync(configDir);
  
  try {
    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
    success(`MCP設定を保存しました: ${configPath}`);
  } catch (err) {
    error(`MCP設定の保存エラー: ${err}`);
    throw err;
  }
}

/**
 * MCPサーバーを追加
 */
export async function addMcpServer(): Promise<void> {
  info("MCPサーバーの追加");
  
  // サーバー名の入力
  const name = prompt("サーバー名:");
  if (!name || name.trim() === "") {
    error("サーバー名が入力されませんでした。");
    return;
  }
  
  // コマンドの入力
  const command = prompt("実行コマンド:");
  if (!command || command.trim() === "") {
    error("実行コマンドが入力されませんでした。");
    return;
  }
  
  // 引数の入力
  const argsInput = prompt("引数 (スペース区切り、空の場合はEnter):");
  const args = argsInput ? argsInput.trim().split(/\s+/) : [];
  
  // 環境変数の入力
  const env: Record<string, string> = {};
  info("環境変数を設定します（空の場合は終了）:");
  
  while (true) {
    const envKey = prompt("環境変数名:");
    if (!envKey || envKey.trim() === "") break;
    
    const envValue = prompt(`${envKey}の値:`);
    if (envValue !== null) {
      env[envKey.trim()] = envValue;
    }
  }
  
  // 設定を読み込み
  const config = await loadMcpConfig();
  
  // 既存のサーバーチェック
  if (config.mcpServer[name]) {
    const overwrite = confirm(`サーバー '${name}' は既に存在します。上書きしますか？`);
    if (!overwrite) {
      info("追加をキャンセルしました。");
      return;
    }
  }
  
  // サーバー設定を追加
  config.mcpServer[name] = {
    command: command.trim(),
    args,
    ...(Object.keys(env).length > 0 && { env }),
  };
  
  // 設定を保存
  await saveMcpConfig(config);
  success(`MCPサーバー '${name}' を追加しました。`);
}

/**
 * MCPサーバーの一覧表示
 */
export async function listMcpServers(): Promise<void> {
  const config = await loadMcpConfig();
  const serverNames = Object.keys(config.mcpServer);
  
  if (serverNames.length === 0) {
    info("設定されているMCPサーバーはありません。");
    info("'ai mcp add' でサーバーを追加できます。");
    return;
  }
  
  info(`設定済みMCPサーバー (${serverNames.length}個):`);
  console.log();
  
  for (const [name, serverConfig] of Object.entries(config.mcpServer)) {
    console.log(`📦 ${name}`);
    console.log(`   コマンド: ${serverConfig.command}`);
    if (serverConfig.args.length > 0) {
      console.log(`   引数: ${serverConfig.args.join(" ")}`);
    }
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
      console.log(`   環境変数: ${Object.entries(serverConfig.env).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    }
    console.log();
  }
}

/**
 * MCPサーバーを削除
 */
export async function removeMcpServer(): Promise<void> {
  const config = await loadMcpConfig();
  const serverNames = Object.keys(config.mcpServer);
  
  if (serverNames.length === 0) {
    info("削除できるMCPサーバーがありません。");
    return;
  }
  
  info("設定済みMCPサーバー:");
  serverNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  
  const selection = prompt("削除するサーバー名を入力:");
  if (!selection || selection.trim() === "") {
    info("削除をキャンセルしました。");
    return;
  }
  
  const serverName = selection.trim();
  
  if (!config.mcpServer[serverName]) {
    error(`サーバー '${serverName}' は存在しません。`);
    return;
  }
  
  const confirm = prompt(`サーバー '${serverName}' を削除しますか？ (y/N):`);
  if (confirm?.toLowerCase() !== "y") {
    info("削除をキャンセルしました。");
    return;
  }
  
  delete config.mcpServer[serverName];
  await saveMcpConfig(config);
  success(`MCPサーバー '${serverName}' を削除しました。`);
}

/**
 * MCP設定のヘルプ表示
 */
export function showMcpHelp(): void {
  console.log(`
MCP (Model Context Protocol) 設定コマンド

使用方法:
  ai mcp <subcommand>

サブコマンド:
  add     MCPサーバーを追加
  list    設定済みMCPサーバーを表示
  remove  MCPサーバーを削除
  help    このヘルプを表示

例:
  # MCPサーバーを追加
  ai mcp add

  # 設定済みサーバーを表示
  ai mcp list

  # サーバーを削除
  ai mcp remove

設定ファイル: ~/.ai-cli/mcp-config.json
`);
}

// テスト
const { assertEquals } = await import("@std/assert") as {
  assertEquals: (actual: unknown, expected: unknown) => void;
};

// テスト用のホームディレクトリを設定
const TEST_HOME_MCP = await Deno.makeTempDir();
const originalHomeMcp = Deno.env.get("HOME");

function setTestHomeMcp() {
  Deno.env.set("HOME", TEST_HOME_MCP);
}

function restoreHomeMcp() {
  if (originalHomeMcp) {
    Deno.env.set("HOME", originalHomeMcp);
  } else {
    Deno.env.delete("HOME");
  }
}

Deno.test({
  name: "loadMcpConfig - 設定ファイルが存在しない場合は空の設定を返す",
  fn: async () => {
    setTestHomeMcp();
    
    try {
      const config = await loadMcpConfig();
      assertEquals(config, { mcpServer: {} });
    } finally {
      restoreHomeMcp();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "saveMcpConfig - 設定ファイルを保存",
  fn: async () => {
    setTestHomeMcp();
    
    try {
      const testConfig: McpConfig = {
        mcpServer: {
          "test-server": {
            command: "node",
            args: ["server.js"],
            env: { "NODE_ENV": "production" }
          }
        }
      };
      
      await saveMcpConfig(testConfig);
      
      // ファイルが作成されていることを確認
      const configPath = join(TEST_HOME_MCP, ".ai-cli", "mcp-config.json");
      assertEquals(existsSync(configPath), true);
      
      // 内容を確認
      const savedContent = await Deno.readTextFile(configPath);
      const savedConfig = JSON.parse(savedContent);
      assertEquals(savedConfig, testConfig);
    } finally {
      restoreHomeMcp();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "loadMcpConfig - 保存された設定を読み込み",
  fn: async () => {
    setTestHomeMcp();
    
    try {
      const testConfig: McpConfig = {
        mcpServer: {
          "test-server": {
            command: "python",
            args: ["-m", "server"],
            env: { "PYTHONPATH": "/app" }
          },
          "another-server": {
            command: "deno",
            args: ["run", "--allow-all", "server.ts"]
          }
        }
      };
      
      // 設定を保存
      await saveMcpConfig(testConfig);
      
      // 設定を読み込み
      const loadedConfig = await loadMcpConfig();
      assertEquals(loadedConfig, testConfig);
    } finally {
      restoreHomeMcp();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "loadMcpConfig - 無効なJSONファイルの場合は空の設定を返す",
  fn: async () => {
    setTestHomeMcp();
    
    try {
      const configPath = join(TEST_HOME_MCP, ".ai-cli", "mcp-config.json");
      const configDir = dirname(configPath);
      
      // ディレクトリを作成
      ensureDirSync(configDir);
      
      // 無効なJSONを書き込み
      await Deno.writeTextFile(configPath, "invalid json content");
      
      const config = await loadMcpConfig();
      assertEquals(config, { mcpServer: {} });
    } finally {
      restoreHomeMcp();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// テスト後のクリーンアップ
Deno.test({
  name: "cleanup-mcp - テスト用ディレクトリを削除",
  fn: async () => {
    try {
      await Deno.remove(TEST_HOME_MCP, { recursive: true });
    } catch {
      // ディレクトリが存在しない場合は無視
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});