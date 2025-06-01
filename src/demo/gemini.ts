import {
  GoogleGenAI,
} from "@google/genai";

import { getApiKey } from "../core/auth.ts";
import { getDefaultModel } from "../api/model.ts";

async function generateText(text: string
) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("APIキーが設定されていません。'ai auth' コマンドで認証してください。");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey,
  });

  const response = await client.models.generateContent({
    model: getDefaultModel(),
    contents: [{
        text: text
    }],
    config: {
        candidateCount: 2
    },
  });

  console.dir(response, { depth: null });
}

await generateText("こんにちは")