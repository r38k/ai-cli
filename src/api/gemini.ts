import {
  Content,
  FunctionCallingConfigMode,
  type GenerateContentConfig,
  GoogleGenAI,
  mcpToTool,
} from "@google/genai";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { getDefaultModel } from "./model.ts";
import { getApiKey } from "../core/auth.ts";

export interface GenerateTextOptions {
  model?: string;
  maxOutputTokens?: number;
  onToolCall?: (toolName: string, params: unknown) => void;
  onToolResult?: (toolName: string, result: unknown) => void;
}

export async function* generateText(
  contents: Content[],
  mcp: Client[],
  options: GenerateTextOptions = {},
): AsyncGenerator<
  {
    text?: string;
    toolCall?: { name: string; params: unknown };
    toolResult?: { name: string; result: unknown };
  }
> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("APIキーが設定されていません。'ai auth' コマンドで認証してください。");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey,
  });

  // Build config with conditional tools
  const config: GenerateContentConfig = {
    maxOutputTokens: options.maxOutputTokens || 8192,
    tools: mcp.length > 0 ? [mcpToTool(...mcp, {}), 
      { codeExecution: {}, googleSearch: {} }, 
    ] : [
      { codeExecution: {}, googleSearch: {} },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    },
  };

  const response = await client.models.generateContentStream({
    model: options.model || getDefaultModel(),
    contents: contents,
    config: config,
  });

  // Process the stream
  for await (const chunk of response) {
    // Check for function calls
    if (chunk.candidates?.[0]?.content?.parts) {
      for (const part of chunk.candidates[0].content.parts) {
        if ("functionCall" in part && part.functionCall) {
          const toolName = part.functionCall.name || "unknown";
          const params = part.functionCall.args || {};

          // Notify about tool call
          if (options.onToolCall) {
            options.onToolCall(toolName, params);
          }
          yield { toolCall: { name: toolName, params } };
        } else if ("functionResponse" in part && part.functionResponse) {
          const toolName = part.functionResponse.name || "unknown";
          const result = part.functionResponse.response || {};

          // Notify about tool result
          if (options.onToolResult) {
            options.onToolResult(toolName, result);
          }
          yield { toolResult: { name: toolName, result } };
        } else if (part.text) {
          yield { text: part.text };
        }
      }
    }
  }
}

// https://github.com/googleapis/js-genai/blob/main/sdk-samples/generate_content_with_function_calling.ts
