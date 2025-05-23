import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  readStdin, 
  readFiles, 
  type InputContent 
} from "./input.ts";

// テスト用の一時ファイルを作成するヘルパー
async function createTempFile(content: string): Promise<string> {
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, content);
  return tempFile;
}

Deno.test("readStdin - 標準入力からテキストを読み取る", async () => {
  // 標準入力をモック
  const originalStdin = Deno.stdin;
  const encoder = new TextEncoder();
  const data = encoder.encode("Hello from stdin\nLine 2");
  
  // ReadableStreamを作成
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    }
  });
  
  // @ts-ignore - テスト用にstdinを置き換え
  Deno.stdin = {
    readable: stream,
    isTerminal: () => false,
  };
  
  const content = await readStdin();
  assertEquals(content, "Hello from stdin\nLine 2");
  
  // 元に戻す
  // @ts-ignore
  Deno.stdin = originalStdin;
});

Deno.test("readStdin - TTYの場合は空文字を返す", async () => {
  const originalStdin = Deno.stdin;
  
  // @ts-ignore - テスト用にstdinを置き換え
  Deno.stdin = {
    readable: new ReadableStream(),
    isTerminal: () => true,
  };
  
  const content = await readStdin();
  assertEquals(content, "");
  
  // 元に戻す
  // @ts-ignore
  Deno.stdin = originalStdin;
});

Deno.test("readFiles - 単一ファイルを読み取る", async () => {
  const tempFile = await createTempFile("Test content\nLine 2");
  
  try {
    const contents = await readFiles([tempFile]);
    assertEquals(contents.length, 1);
    assertEquals(contents[0].path, tempFile);
    assertEquals(contents[0].content, "Test content\nLine 2");
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("readFiles - 複数ファイルを読み取る", async () => {
  const tempFile1 = await createTempFile("File 1 content");
  const tempFile2 = await createTempFile("File 2 content");
  
  try {
    const contents = await readFiles([tempFile1, tempFile2]);
    assertEquals(contents.length, 2);
    assertEquals(contents[0].content, "File 1 content");
    assertEquals(contents[1].content, "File 2 content");
  } finally {
    await Deno.remove(tempFile1);
    await Deno.remove(tempFile2);
  }
});

Deno.test("readFiles - 存在しないファイル", async () => {
  await assertRejects(
    async () => {
      await readFiles(["/nonexistent/file.txt"]);
    },
    Deno.errors.NotFound
  );
});

Deno.test("readFiles - 空の配列", async () => {
  const contents = await readFiles([]);
  assertEquals(contents, []);
});