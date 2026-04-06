# Transcrição - Five9

Projeto simples que integra Five9, Whisper e OpenAI para transcrever áudio de atendimento, analisar sentimento e exibir resumo e histórico de interações.

## O que foi usado

- `Node.js` como servidor backend.
- `Express` para criar a API REST e o webhook.
- `Mongoose` para conectar e salvar dados em MongoDB.
- `axios` para baixar o arquivo de gravação do Five9.
- `OpenAI` para transcrição de áudio (`whisper-1`) e análise de sentimento/tags (`gpt-3.5-turbo`).
- `React` no frontend (`app.jsx`) para exibir painel de atendimento.
- `socket.io` para notificar eventos em tempo real (padrão no backend).
- `dotenv` para carregar variáveis de ambiente.

## Estrutura do projeto

- `node.js` - servidor backend e lógica principal.
- `app.jsx` - componente React de frontend que consulta o backend.

## Como funciona

1. O Five9 envia um POST para `/webhook/five9` com `contactId`, `recordingId` e `agentId`.
2. O backend baixa o áudio do Five9 usando as credenciais em variáveis de ambiente.
3. O áudio é transcrito com OpenAI Whisper.
4. O texto é analisado com OpenAI Chat para classificar sentimento, gerar pontuação e extrair tags.
5. Os dados são salvos em MongoDB nas coleções `CallLog` e `Contact`.
6. O frontend consulta o backend para mostrar resumo e histórico do cliente pelo `contactId`.

## Endpoints disponíveis

- `POST /webhook/five9`
  - Recebe JSON com: `contactId`, `recordingId`, `agentId`.
  - Processa o áudio e salva o resultado.

- `GET /api/client-summary/:contactId`
  - Retorna o último resumo do cliente com `sentiment`, `score`, `tags` e `dica`.

- `GET /api/client-history/:contactId`
  - Retorna o histórico de chamadas do cliente.

## Variáveis de ambiente necessárias

Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
OPENAI_API_KEY=seu_api_key_openai
FIVE9_USER=seu_usuario_five9
FIVE9_PASS=sua_senha_five9
```

## Requisitos

- Node.js instalado.
- MongoDB rodando localmente em `mongodb://localhost:27017/five9ai`.
- Credenciais do OpenAI válidas.
- Credenciais de acesso ao Five9.

## Como executar

1. Instale as dependências:

```bash
npm install express mongoose axios body-parser openai dotenv socket.io
```

2. Configure o MongoDB e o `.env`.

3. Inicie o servidor backend:

```bash
node node.js
```

4. Use o frontend React para renderizar `App` a partir de `app.jsx`.

> Observação: `app.jsx` é um componente React. Ele precisa ser incluído em um projeto React ou bundler (por exemplo, Create React App, Vite, Next.js) para funcionar.

## Como usar

1. Abra o frontend React no navegador.
2. Digite um `Contact ID` no campo de entrada e pressione Enter.
3. O aplicativo buscará:
   - Resumo do cliente em `/api/client-summary/:contactId`
   - Histórico em `/api/client-history/:contactId`
4. Veja o sentimento, pontuação, dicas e as transcrições associadas.

## Observações

- O backend espera que o Five9 retorne o arquivo de gravação como um buffer de áudio.
- A análise de sentimento retorna `positivo`, `negativo` ou `neutro`.
- As tags são extraídas como palavras-chave do texto transcrito.

## Possíveis melhorias

- Adicionar tratamento de erros mais robusto no frontend.
- Criar um `package.json` para gerenciar dependências.
- Incluir autenticação no backend.
- Melhorar o estilo e layout do painel React.
