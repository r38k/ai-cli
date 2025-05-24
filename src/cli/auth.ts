// 必要な権限: --allow-env --allow-read --allow-write (認証情報の管理のため)
import { error, info, success, warning } from "../ui/console.ts";
import { saveCredentials, loadCredentials, deleteCredentials } from "../core/auth.ts";

/**
 * 認証フローを実行
 */
export async function runAuth(): Promise<void> {
  
  // 既存の認証情報を確認
  const existing = await loadCredentials();
  if (existing) {
    warning("既存の認証情報が見つかりました。");
    const overwrite = confirm("上書きしますか？");
    if (!overwrite) {
      info("認証をキャンセルしました。");
      return;
    }
  }
  
  // APIキーの入力を受け付け（セキュアな入力）
  let apiKey: string;
  
  // TTYが利用可能かチェック
  if (Deno.stdin.isTerminal()) {
    // 改行せずにプロンプトを表示
    await Deno.stdout.write(new TextEncoder().encode("Gemini API Key: "));
    
    // パスワード入力を隠すための設定
    const decoder = new TextDecoder();
    Deno.stdin.setRaw(true);
    
    const apiKeyBytes: number[] = [];
    
    try {
      while (true) {
        const buf = new Uint8Array(1);
        const n = await Deno.stdin.read(buf);
        
        if (n === null || n === 0) break;
        
        const char = buf[0];
        
        // Enter key
        if (char === 10 || char === 13) {
          console.log(); // 改行
          break;
        }
        
        // Backspace
        if (char === 127 || char === 8) {
          if (apiKeyBytes.length > 0) {
            apiKeyBytes.pop();
            // カーソルを戻して文字を消す
            await Deno.stdout.write(new TextEncoder().encode("\b \b"));
          }
          continue;
        }
        
        // 通常の文字
        if (char >= 32 && char <= 126) {
          apiKeyBytes.push(char);
          // アスタリスクを表示
          await Deno.stdout.write(new TextEncoder().encode("*"));
        }
      }
    } finally {
      Deno.stdin.setRaw(false);
    }
    
    apiKey = decoder.decode(new Uint8Array(apiKeyBytes));
  } else {
    // TTYが利用できない場合は通常のpromptを使用
    apiKey = prompt("Gemini API Key:") || "";
  }
  if (!apiKey || apiKey.trim() === "") {
    error("APIキーが入力されませんでした。");
    return;
  }
  
  try {
    // APIキーを保存
    await saveCredentials(apiKey.trim());
    success("認証情報を保存しました: ~/.ai-cli/credentials");
    info("これで ai コマンドが使用できます。");
  } catch (err) {
    error(`認証情報の保存に失敗しました: ${err}`);
  }
}

/**
 * 認証情報のステータスを表示
 */
export async function showAuthStatus(): Promise<void> {
  const credentials = await loadCredentials();
  
  if (credentials) {
    success("認証済み");
    console.log(`作成日時: ${credentials.createdAt}`);
    console.log(`更新日時: ${credentials.updatedAt}`);
    console.log(`APIキー: ${credentials.geminiApiKey.substring(0, 8)}...`);
  } else {
    warning("未認証");
    console.log("ai auth コマンドで認証してください。");
  }
}

/**
 * 認証情報をクリア
 */
export async function clearAuth(): Promise<void> {
  const confirm = prompt("認証情報を削除しますか？ (y/N):");
  
  if (confirm?.toLowerCase() === "y") {
    await deleteCredentials();
    success("認証情報を削除しました。");
  } else {
    info("キャンセルしました。");
  }
}