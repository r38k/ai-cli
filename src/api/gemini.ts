import { Content, FunctionCallingConfigMode, GoogleGenAI, mcpToTool } from "@google/genai"
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js"

export async function generateText(contents: Content[], mcp: Client[]) {

    const client = new GoogleGenAI({
        apiKey: Deno.env.get("GEMINI_API_KEY"),
    });    

    const response = await client.models.generateContentStream({
        model: "gemini-2.5-pro-preview-05-06",
        contents: contents,
        config: {
            tools: [mcpToTool(...mcp, {})],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO
              }
            },
            maxOutputTokens: 1000,
        }, 
    });

    return response;

}

// https://github.com/googleapis/js-genai/blob/main/sdk-samples/generate_content_with_function_calling.ts

