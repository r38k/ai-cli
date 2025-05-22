import { parseArgs } from "node:util";
import { generateText } from "./api/gemini.ts";
import { Part, type Content } from "@google/genai";
import { configureMCPClient } from "./tools/mcp.ts";

const args = parseArgs({
    args: Deno.args,
    options: {

    }
})

const mcpClient = await configureMCPClient();

const history: Content[] = [];

while (true) {
    const input = prompt(">");

    

    if (!input) {
        continue;
    }
    if (input === "exit") {
        Deno.exit(0);
    }

    history.push({
        role: "user",
        parts: [{
            text: input
        }]
    })

    const stream = await generateText(history, mcpClient);

    const response: Part = {};
    for await (const chunk of stream) {

        // if (chunk.text) {
        //     response.text += chunk.text;
        //     console.log(chunk.text);
        // }
        // if (chunk.functionCalls) {
        //     console.log("functionCalls:", chunk.functionCalls)
        // }

        if (chunk.candidates) {
            console.dir(chunk.candidates[0].content, { depth: null })
        }
    }

    history.push({
        role: "model",
        parts: [response]
    })
}