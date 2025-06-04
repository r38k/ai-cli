#!/bin/bash
# XDG Base Directory仕様への移行スクリプト

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔄 ai-cli設定をXDG Base Directory仕様に移行します"

# レガシーディレクトリ
LEGACY_DIR="$HOME/.ai-cli"

# 新しいXDG準拠のディレクトリ
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"

CONFIG_DIR="$XDG_CONFIG_HOME/ai-cli"
DATA_DIR="$XDG_DATA_HOME/ai-cli"

# レガシーディレクトリが存在しない場合は終了
if [ ! -d "$LEGACY_DIR" ]; then
    echo -e "${YELLOW}⚠️  レガシー設定ディレクトリが見つかりません: $LEGACY_DIR${NC}"
    echo "新規インストールの場合、移行は不要です。"
    exit 0
fi

echo "📂 レガシーディレクトリ: $LEGACY_DIR"
echo "📂 新しい設定ディレクトリ: $CONFIG_DIR"
echo "📂 新しいデータディレクトリ: $DATA_DIR"
echo ""

# ディレクトリを作成
mkdir -p "$CONFIG_DIR" "$DATA_DIR"

# 認証情報の移行
if [ -f "$LEGACY_DIR/credentials" ]; then
    echo "🔑 認証情報を移行中..."
    if [ -f "$DATA_DIR/credentials" ]; then
        echo -e "${YELLOW}  既存のファイルが見つかりました。スキップします。${NC}"
    else
        cp "$LEGACY_DIR/credentials" "$DATA_DIR/credentials"
        chmod 600 "$DATA_DIR/credentials"
        echo -e "${GREEN}  ✓ 認証情報を移行しました${NC}"
    fi
fi

# MCP設定の移行
if [ -f "$LEGACY_DIR/mcp-config.json" ]; then
    echo "⚙️  MCP設定を移行中..."
    if [ -f "$CONFIG_DIR/mcp-config.json" ]; then
        echo -e "${YELLOW}  既存のファイルが見つかりました。スキップします。${NC}"
    else
        cp "$LEGACY_DIR/mcp-config.json" "$CONFIG_DIR/mcp-config.json"
        echo -e "${GREEN}  ✓ MCP設定を移行しました${NC}"
    fi
fi

echo ""
echo "✅ 移行が完了しました！"
echo ""
echo "古い設定ディレクトリを削除する場合は以下のコマンドを実行してください："
echo -e "${YELLOW}rm -rf $LEGACY_DIR${NC}"