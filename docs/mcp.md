# MCP (Model Context Protocol) q���

## ��

Model Context Protocol (MCP)oLLM�������L����������h�hkqY�_�n����������ȳ�gYAI
CLIoMCP�Xfա�뷹���\Web"����������jinئj_��ЛW~Y

## MCPn)�

### 1. �U�_q

- q U�_���է��k�� �W_�\
- pn������nB)(
- ��ȳ����gn����ƣ�<

### 2. �5'

- �WD���n!Xj��
- �����ƣ����hnq
- �������n�z/�

### 3. ����ƣ

- �����k���h'
- )P�h����6�
- ����n

## ��MCP����

### ա�뷹�����

```bash
npx @modelcontextprotocol/server-filesystem
```

**_�:**

- ա��֊��M�
- ǣ����\
- ա��"����ѿ��
- )P�

**(�:**

```bash
ai --tools "������nREADME.md���g�Wf"
ai --tools "�WDTypeScriptա��\Wf�,�j�鹒��Wf"
```

### Web����

```bash
npx @modelcontextprotocol/server-web
```

**_�:**

- Web"
- HTML���n֗
- REST API|s�W
- JSON/XML���

**(�:**

```bash
ai --tools " �nTypeScript_�kdDf�yf"
ai --tools "GitHub API�cfy�n�ݸ���1�֗Wf"
```

### ����������

```bash
npx @modelcontextprotocol/server-database
```

**_�:**

- SQL ���L
- �����1֗
- ���?e����Jd
- ��󶯷��

### Git ����

```bash
npx @modelcontextprotocol/server-git
```

**_�:**

- ����etn֗
- �����\
- �h:
- ��������

## -���

### 1. -�ա��n\

`~/.ai-cli/mcp-config.json`�\

```json
{
  \"mcpServer\": {
    \"filesystem\": {
      \"command\": \"npx\",
      \"args\": [
        \"-y\",
        \"@modelcontextprotocol/server-filesystem\",
        \"/path/to/your/workspace\"
      ],
      \"env\": {
        \"WORKSPACE_ROOT\": \"/path/to/your/workspace\"
      }
    },
    \"web\": {
      \"command\": \"npx\",
      \"args\": [\"-y\", \"@modelcontextprotocol/server-web\"],
      \"env\": {
        \"SEARCH_API_KEY\": \"your-search-api-key\"
      }
    },
    \"database\": {
      \"command\": \"npx\",
      \"args\": [
        \"-y\",
        \"@modelcontextprotocol/server-database\",
        \"postgresql://user:pass@localhost/db\"
      ],
      \"env\": {
        \"DB_CONNECTION_STRING\": \"postgresql://user:pass@localhost/db\"
      }
    }
  }
}
```

### 2. CLI����gn-�

```bash
# ���ƣ�j-�
ai mcp add

# -�n��
ai mcp list

# y�����nJd
ai mcp remove filesystem

# -�nƹ�
ai mcp test
```

### 3. ��	pgn-�

�z���go��	p�)(��

```bash
export MCP_CONFIG_PATH=~/.config/mcp/custom-config.json
export DENO_ENV=development
ai --tools
```

## ��n(�

### ա���\

```bash
# ������ա��n�
ai --tools \"Sn������n� ��Wf9����HWf\"

# -�ա��n\
ai --tools \"TypeScript������(ntsconfig.json�\Wf\"

# �������
ai --tools \"src/ǣ���nTypeScriptա������Wf\"
```

### Web"�API|s�W

```bash
# �S�1n��
ai --tools \"React 18n�_�kdDf ��1��yf\"

# ����n�
ai --tools \"Vue.js vs React n2024tgn��1�"Wf\"

# API��n��
ai --tools \"GitHub GraphQL APIn(���yf\"
```

### �������\

```bash
# �����
ai --tools \"������n����� ��Wf��'��:Wf\"

# ����
ai --tools \"�
����K�!���ɒ�Wf\"

# ��� i
ai --tools \"SnED��� iWf\"
```

### Git�\

```bash
# ����etn�
ai --tools \"N�1�n����et��Wf���n;Ւ�Wf\"

# ����&en�H
ai --tools \"Sn������kiW_Git�����HWf\"

# ������z/�
ai --tools \"��������n�z�Ւ�HWf\"
```

## ����MCP����n�z

### �,�

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "custom-tool-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

// ���n{2
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "custom_tool",
        description: "�������n�",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
        },
      },
    ],
  };
});

// ���n�L
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "custom_tool") {
    // ������ïn�L
    return {
      content: [
        {
          type: "text",
          text: `�P�: ${args.input}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ����nw�
const transport = new StdioServerTransport();
await server.connect(transport);
```

### �ñ��

```json
{
  \"name\": \"mcp-custom-tool-server\",
  \"version\": \"1.0.0\",
  \"type\": \"module\",
  \"bin\": {
    \"mcp-custom-tool-server\": \"./index.js\"
  },
  \"dependencies\": {
    \"@modelcontextprotocol/sdk\": \"^1.0.0\"
  }
}
```

## ������ƣ�

###  ,�jOL

#### 1. MCP����Lw�WjD

```bash
# -�n��
cat ~/.ai-cli/mcp-config.json

# K�g�����w�Wfƹ�
npx @modelcontextprotocol/server-filesystem /path/to/workspace

# ��n��
ai --tools --verbose
```

#### 2. ���L�dK�jD

```bash
# )(��j���n��
ai mcp list

# ����n�w�
ai mcp restart

# -�n���
ai mcp reload
```

#### 3. )P���

```bash
# ա��)Pn��
ls -la ~/.ai-cli/

# -�ա��n)P�c
chmod 600 ~/.ai-cli/mcp-config.json

# �������n)P��
ls -la /path/to/workspace
```

### ��ð���

```bash
# s0��n	�
DENO_ENV=development ai --tools --verbose

# MCP����n����
MCP_LOG_LEVEL=debug ai --tools

# ���n��
MCP_TRACE=true ai --tools
```

## ٹ���ƣ�

### 1. ����ƣ

-  )Pn�G�i(
- _��1�+�ǣ���xn����6P
- ��j-�n��W

### 2. �թ���

- Łj����n�w�
- ij��ࢦ�-�
- ���(�n�

### 3. �����

- ��j������
- -�ա��n�ï���
- ���������n-�

## ʌnU

MCP������o%kzUWfJ��n�Fj�WD����L�zU�fD~Y

- **AI/ML ����**: _�f����n�L
- **��ɵ���**: AWS/GCP/Azureq
- **�z������**: IDEqCI/CD#:
- **Ӹ͹������**: SlackTeamsNotion#:

 �n�1o[MCP������](https://github.com/modelcontextprotocol)g��gM~Y
