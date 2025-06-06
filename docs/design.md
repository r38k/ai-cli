# AI CLI -ɭ����

## ��

Google Gemini AIhModel Context Protocol (MCP)�qW_�'�CLI���gYClaude
Code餯jS�������gЛW�zn#' ��W~Y

## -�

### 1. ����Sn *H

- **��j�\**: �6j �gn���ɟL
- **�j���**: ��������k��s�nգ���ï
- **��je��**: Ѥ���ա���q�nq ���է��

### 2. �5'

- **MCP��ȳ�**: ����hn����jq
- **�鰤�-**: _�n������ޤ�L�
- **-�n��'**: ��k�X_�\�t

### 3. �<'

- **��������**: ij����û��h��K
- **����ƣ**: API��n�hj�
- **ƹ���**: �jƹȫ��ø

## ���Ư��-

### ����

```
                                     
         UI Layer (src/ui/)          
  - Console output & formatting     
  - Color styling & themes          
                                     
                                     
        CLI Layer (src/cli/)         
  - Argument parsing                 
  - Input processing                 
  - Mode detection                   
                                     
                                     
       Core Layer (src/core/)        
  - Prompt management                
  - Session handling                 
  - Context management               
                                     
                                     
    Integration Layer (src/api/)     
  - Gemini API client                
  - Streaming response handling      
  - Function calling                 
                                     
                                     
      Tools Layer (src/tools/)       
  - MCP client management            
  - Tool discovery & execution       
  - Server lifecycle management      
                                     
```

### ������

```
User Input � CLI Parser � Mode Detection � Input Processing
                                �
Context Building � Prompt Construction � Gemini API
                                �
Response Streaming � Tool Execution (MCP) � Output Formatting
                                �
                         Console Display
```

## �L���

### 1. ���ƣ����

```bash
ai
> S�kao
AI�T...
> exit
```

**y�:**

- qetn�
- �뿤������
- p�n�q����

### 2. ��������

```bash
ai "TypeScriptgFizzBuzz�\cf"
```

**y�:**

- X �O�X �T
- �����D���
- P�n���׷��

### 3. Ѥ������

```bash
cat data.json | ai "SnJSON��Wf"
```

**y�:**

- �e�K�n����֊
- UNIXѤ���hnq
- ������

### 4. ա�����

```bash
ai -f src/**/*.ts "�������Wf"
```

**y�:**

- pա��nB�
- ���ѿ����
- '��ա��n����

## �������-

### CLI Parser (`src/cli/parser.ts`)

```typescript
interface CLIOptions {
  files: string[];
  model: string;
  maxTokens: number;
  system?: string;
  verbose: boolean;
  tools: boolean;
}
```

### Input Processor (`src/cli/input.ts`)

```typescript
interface InputSource {
  type: "stdin" | "file" | "args";
  content: string;
  metadata?: FileMetadata;
}
```

### MCP Integration (`src/tools/mcp.ts`)

```typescript
interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  tools: Tool[];
}
```

## -��

### ա���

```
~/.ai-cli/
   credentials          # ��U�_API��
   mcp-config.json     # MCP ����-�
   user-config.json    # ����-�
   session-history/    # �÷��et
       2024-01-01.json
       2024-01-02.json
```

### -�*HM

1. ������p
2. ��	p
3. ����-�ա��
4. �թ��$

## ����ƣn�

### API���

- Base64�����X
- ա��)P600-�
- ��	pgn B�)(����

### e�<

- ա��ѹn<
- ���ɤ󸧯����V
- ���6Pn��

### MCP ����ƣ

- ��������n�
- )Pn 
- ��ࢦ�-�

## �թ��� i

### ������

- ���XMgn��
- ��ա�� i
- ���(�n6�

### ա���

- ^I/O;(
- '��ա��nr�
- ��÷�_�

### MCP i

- �����n)(
- �����)(
- ���&

## ƹ�&e

### ����ƹ�

- �������n��ƹ�
- �ï����n;(
- ���ø90%� ��

### qƹ�

- �������ɷ��
- MCP����hnq
- ��nAPI�(W_ƹ�

### �թ���ƹ�

- '��ա���
- B��pn<
- �������

## ʌn�5;

### է��2: ئj���q

- ��������
- Web APIq
- ��ӹ#:

### է��3: AI_�7

- ��ƭ�� i
- f�_�
- ����餼����

### է��4: mQ_�

- ���-�q
- ����
- ����ƣ���
