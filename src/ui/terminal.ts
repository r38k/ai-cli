/**
 * ターミナル操作共通ユーティリティモジュール
 *
 * CLI選択UIで使用する低レベルターミナル操作を提供します。
 * Raw modeの制御、カーソル操作、キー入力読み取りなど、
 * 複数のセレクターコンポーネントで共通して使用される機能を集約しています。
 *
 * 主要機能:
 * - ターミナルのraw mode制御
 * - カーソルの表示/非表示
 * - 画面クリア
 * - キーボード入力の読み取りと解析
 *
 * 使用方法:
 * ```typescript
 * import { enableRawMode, readKey, disableRawMode } from "./terminal.ts";
 *
 * enableRawMode();
 * try {
 *   const key = await readKey();
 *   console.log(`Pressed: ${key.key}`);
 * } finally {
 *   disableRawMode();
 * }
 * ```
 */

/**
 * キーボード入力イベント
 */
export interface KeyEvent {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

/**
 * ターミナルをraw modeに設定
 * 文字単位での入力を可能にする
 */
export function enableRawMode() {
  Deno.stdin.setRaw(true);
}

/**
 * ターミナルのraw modeを解除
 * 通常の行バッファリングモードに戻す
 */
export function disableRawMode() {
  Deno.stdin.setRaw(false);
}

/**
 * 画面をクリア
 * カーソルを左上に移動し、画面全体を消去
 */
export function clearScreen() {
  console.log("\x1b[2J\x1b[H");
}

/**
 * カーソルを非表示にする
 */
export function hideCursor() {
  console.log("\x1b[?25l");
}

/**
 * カーソルを表示する
 */
export function showCursor() {
  console.log("\x1b[?25h");
}

/**
 * 生のキー入力を読み取る
 * @returns キーイベント情報
 * @throws stdin が閉じられた場合
 */
export async function readKey(): Promise<KeyEvent> {
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
        return {
          key: String.fromCharCode(byte),
          ctrl: false,
          meta: false,
          shift: false,
        };
    }
  }

  // エスケープシーケンスの処理
  if (bytes[0] === 27 && bytes[1] === 91) { // ESC + [
    if (bytes[2] === 65) { // 上矢印
      return { key: "up", ctrl: false, meta: false, shift: false };
    }
    if (bytes[2] === 66) { // 下矢印
      return { key: "down", ctrl: false, meta: false, shift: false };
    }
  }

  // デフォルト: 最初のバイトを文字として返す
  return {
    key: String.fromCharCode(bytes[0]),
    ctrl: false,
    meta: false,
    shift: false,
  };
}

// === テスト ===

import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("clearScreen - 正しいエスケープシーケンスを出力", () => {
  // console.logをモックして出力を確認
  const originalLog = console.log;
  let output = "";
  console.log = (msg: string) => {
    output = msg;
  };

  try {
    clearScreen();
    assertEquals(output, "\x1b[2J\x1b[H");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("hideCursor/showCursor - 正しいエスケープシーケンスを出力", () => {
  const originalLog = console.log;
  let output = "";
  console.log = (msg: string) => {
    output = msg;
  };

  try {
    hideCursor();
    assertEquals(output, "\x1b[?25l");

    showCursor();
    assertEquals(output, "\x1b[?25h");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("KeyEvent インターフェースの構造", () => {
  const keyEvent: KeyEvent = {
    key: "a",
    ctrl: false,
    meta: false,
    shift: false,
  };

  assertEquals(keyEvent.key, "a");
  assertEquals(keyEvent.ctrl, false);
  assertEquals(keyEvent.meta, false);
  assertEquals(keyEvent.shift, false);
});

// === デバッグ用サンプル実行 ===

if (import.meta.main) {
  console.log("=== ターミナルユーティリティ デバッグ ===\n");

  console.log("このプログラムはキー入力をテストします。");
  console.log("終了するには 'q' または ESC を押してください。\n");

  enableRawMode();
  hideCursor();

  try {
    while (true) {
      const key = await readKey();
      console.log(
        `キー入力: "${key.key}" (ctrl: ${key.ctrl}, meta: ${key.meta}, shift: ${key.shift})`,
      );

      if (key.key === "q" || key.key === "escape") {
        break;
      }
    }
  } catch (error) {
    console.error(
      `エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    showCursor();
    disableRawMode();
    console.log("\n終了しました。");
  }
}
