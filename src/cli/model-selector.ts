import { GEMINI_MODELS, type ModelId } from "../api/model.ts";
import { getDefaultModelFromPreferences, setDefaultModel } from "../core/preferences.ts";
import { green, yellow, cyan, dim } from "../ui/styles.ts";

/**
 * キーボード入力を処理するための型
 */
interface KeyEvent {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

/**
 * 生のキー入力を読み取る
 */
async function readKey(): Promise<KeyEvent> {
  const buf = new Uint8Array(8);
  const nread = await Deno.stdin.read(buf);
  
  if (!nread) {
    throw new Error("stdin closed");
  }
  
  const bytes = buf.slice(0, nread);
  
  // 単一バイトキーの直接処理
  if (bytes.length === 1) {
    const byte = bytes[0];
    switch (byte) {
      case 27: // ESC
        return { key: "escape", ctrl: false, meta: false, shift: false };
      case 13: // CR (Enter)
      case 10: // LF
        return { key: "return", ctrl: false, meta: false, shift: false };
      case 113: // 'q'
        return { key: "q", ctrl: false, meta: false, shift: false };
      default:
        return { key: String.fromCharCode(byte), ctrl: false, meta: false, shift: false };
    }
  }
  
  // ESCシーケンスの処理
  if (bytes[0] === 27 && bytes[1] === 91) { // ESC [
    switch (bytes[2]) {
      case 65: // Up arrow
        return { key: "up", ctrl: false, meta: false, shift: false };
      case 66: // Down arrow
        return { key: "down", ctrl: false, meta: false, shift: false };
    }
  }
  
  // フォールバック
  const key = new TextDecoder().decode(bytes).trim();
  return { key, ctrl: false, meta: false, shift: false };
}

/**
 * ターミナルを生モードに設定
 */
function enableRawMode() {
  Deno.stdin.setRaw(true);
}

/**
 * ターミナルの生モードを解除
 */
function disableRawMode() {
  Deno.stdin.setRaw(false);
}

/**
 * 画面をクリア
 */
function clearScreen() {
  console.log("\x1b[2J\x1b[H");
}

/**
 * カーソルを非表示
 */
function hideCursor() {
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));
}

/**
 * カーソルを表示
 */
function showCursor() {
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
}

/**
 * モデル選択UIを表示
 */
export async function selectModel(): Promise<ModelId | null> {
  const models = Object.values(GEMINI_MODELS);
  const currentDefault = await getDefaultModelFromPreferences();
  let selectedIndex = models.findIndex(model => model.id === currentDefault);
  if (selectedIndex === -1) selectedIndex = 0;
  
  enableRawMode();
  hideCursor();
  
  try {
    while (true) {
      clearScreen();
      
      // ヘッダー
      console.log(cyan("🤖 Gemini モデルを選択してください\n"));
      
      // モデルリスト
      models.forEach((model, index) => {
        const isSelected = index === selectedIndex;
        const isDefault = model.id === currentDefault;
        
        let line = "  ";
        if (isSelected) {
          line += green("> " + model.displayName);
        } else {
          line += "  " + model.displayName;
        }
        
        console.log(line);
      });
      
      // フッター
      console.log(dim("\n[↑/↓] 選択  [Enter] 決定  [Esc/q] キャンセル"));
      
      // キー入力を待つ
      const keyEvent = await readKey();
      
      switch (keyEvent.key) {
        case "up":
          selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : models.length - 1;
          break;
        case "down":
          selectedIndex = selectedIndex < models.length - 1 ? selectedIndex + 1 : 0;
          break;
        case "return":
          const selectedModel = models[selectedIndex];
          await setDefaultModel(selectedModel.id as ModelId);
          return selectedModel.id as ModelId;
        case "escape":
        case "q":
          return null;
      }
    }
  } finally {
    disableRawMode();
    showCursor();
  }
}

// テスト
if (import.meta.main) {
  Deno.test("model-selector - basic functionality", () => {
    // UIテストは手動で行う必要があるため、基本的な型チェックのみ
    const models = Object.values(GEMINI_MODELS);
    console.assert(models.length > 0);
    console.assert(typeof models[0].displayName === "string");
  });
}