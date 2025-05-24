import path from "node:path";
import { z } from "zod";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk/client/stdio.js";

const mcpServerConfigSchema = z.object({
  mcpServer: z.record(z.object({
    command: z.string(),
    args: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
  })),
});

const MCP_SERVER_CONFIG_PATH = Deno.env.get("MCP_CONFIG_PATH");

export async function configureMCPClient(): Promise<Client[]> {
  if (!MCP_SERVER_CONFIG_PATH) {
    console.error("MCP_CONFIG_PATH環境変数が設定されていません");
    return [];
  }

  const resolvedPath = path.resolve(MCP_SERVER_CONFIG_PATH);

  try {
    const configData = await Deno.readTextFile(resolvedPath);
    const configResult = mcpServerConfigSchema.safeParse(
      JSON.parse(configData),
    );

    if (!configResult.success) {
      console.error("Invalid MCP server configuration");
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
    console.error(
      `MCPサーバー設定ファイルの読み込みエラー: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}
