import path from "node:path";
import { z } from "zod";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk/client/stdio.js";
import { getMcpConfigPath } from "../core/auth.ts";

const mcpServerConfigSchema = z.object({
  mcpServer: z.record(z.object({
    command: z.string(),
    args: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
  })),
});

export async function configureMCPClient(): Promise<Client[]> {
  const configPath = getMcpConfigPath();
  const resolvedPath = path.resolve(configPath);

  try {
    const configData = await Deno.readTextFile(resolvedPath);
    const configResult = mcpServerConfigSchema.safeParse(
      JSON.parse(configData),
    );

    if (!configResult.success) {
      console.error("MCPサーバー設定が無効です");
      return [];
    }

    const mcpClientList: Client[] = [];
    for (
      const [_serverName, config] of Object.entries(configResult.data.mcpServer)
    ) {
      const client = new Client({
        name: "mcp-client",
        version: "0.1.0",
      });

      // MCPサーバーのverboseな出力を抑制するための設定
      const quietConfig = {
        ...config,
        // stderrを"pipe"にして出力を制御
        stderr: "pipe" as const,
      };

      const transport = new StdioClientTransport(quietConfig);

      await client.connect(transport);

      mcpClientList.push(client);
    }

    return mcpClientList;
  } catch (error) {
    // ファイルが存在しない場合は空の配列を返す（エラーメッセージは表示しない）
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    console.error(
      `MCPサーバー設定ファイルの読み込みエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}
