import { Content, FunctionCallingConfigMode, type GenerateContentConfig, GoogleGenAI, mcpToTool } from "@google/genai"
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js"

export interface GenerateTextOptions {
  model?: string;
  maxOutputTokens?: number;
}

export async function generateText(
  contents: Content[], 
  mcp: Client[],
  options: GenerateTextOptions = {}
) {
    const client = new GoogleGenAI({
        apiKey: Deno.env.get("GEMINI_API_KEY"),
    });    

    // Build config with conditional tools
    const config: GenerateContentConfig = {
        maxOutputTokens: options.maxOutputTokens || 1000,
    };

    // Only add tools configuration if MCP clients are provided
    if (mcp.length > 0) {
        config.tools = [mcpToTool(...mcp, {})];
        config.toolConfig = {
            functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO
            }
        };
    }

    const response = await client.models.generateContentStream({
        model: options.model || "gemini-2.5-pro-preview-05-06",
        contents: contents,
        config: config,
    });

    return response;
}

// https://github.com/googleapis/js-genai/blob/main/sdk-samples/generate_content_with_function_calling.ts

