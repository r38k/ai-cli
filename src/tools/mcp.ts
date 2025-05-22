import path from "node:path";
import { z } from "zod";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk/client/stdio.js"

const mcpServerConfigSchema = z.object({
    mcpServer: z.record(z.object({
        command: z.string(),
        args: z.array(z.string()),
        env: z.record(z.string(), z.string()).optional()
    }))
});

const MCP_SERVER_CONFIG_PATH = path.resolve(Deno.env.get("MCP_CONFIG_PATH") || "");

export async function configureMCPClient(): Promise<Client[]> {
    const configResult = mcpServerConfigSchema.safeParse(JSON.parse(await Deno.readTextFile(MCP_SERVER_CONFIG_PATH)));

    if (!configResult.success) {
        console.error("Invalid MCP server configuration");
        return [];
    }

    const mcpClientList: Client[] = [];
    for (const [_, config] of Object.entries(configResult.data.mcpServer)) {
        const client = new Client({
            name: "mcp-client",
            version: "0.1.0",
        });

        const transport = new StdioClientTransport(config);

        await client.connect(transport);

        mcpClientList.push(client);
    }

    return mcpClientList;
}