import { print, error, success, warning, info } from "./console.ts";

// デモ実行
console.log("=== Kleurを使ったコンソール出力デモ ===\n");

// 基本的なメッセージ
print("通常のメッセージ");
error("エラーが発生しました");
success("タスクが完了しました");
warning("これは警告です");
info("新しいバージョンが利用可能です");

console.log("\n=== カスタムスタイル ===\n");

// カスタムスタイル
print("青色のテキスト", { color: "blue" });
print("太字の赤色テキスト", { color: "red", bold: true });
print("太字のみ", { bold: true });

// デバッグ: 直接Kleurを使用
import kleur from "npm:kleur@4.1.5";
console.log("\n=== 直接Kleur使用 ===");
console.log(kleur.blue("青色のテキスト"));
console.log(kleur.bold().red("太字の赤色テキスト"));

console.log("\n=== 実際のユースケース ===\n");

// 実際のユースケース例
success("ファイルのアップロードが完了しました");
info("3個のファイルが処理されました");
warning("一部のファイルはスキップされました");
error("認証に失敗しました。もう一度お試しください");