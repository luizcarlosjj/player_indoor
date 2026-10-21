# Tenax Indoor — Documentação do Projeto

**Sistema de gestão de mídia indoor da Tenax Sistemas.**  
Permite controlar TVs em estabelecimentos (barbearias, clínicas, etc.), gerenciar anunciantes, contratos e playlists de vídeo a partir de um painel web centralizado.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Banco de dados | Neon Postgres (serverless, HTTP) |
| Storage de vídeo | Cloudflare R2 (S3-compatible) |
| Autenticação | NextAuth v5 beta (Credentials + JWT) |
| Cache de vídeo no player | Service Worker (Cache API) |
| Estilização | CSS inline (inline styles em todos os componentes) |
| Deploy target | Vercel (serverless functions) |
| Runtime | Node.js / Edge-compatible |

**Dependências principais:**
- `next` 16.4.2
- `next-auth` ^5.0.0-beta.32
- `@neondatabase/serverless` ^1.2.0 — cliente Neon via HTTP (sem TCP, funciona em Edge)
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — upload para R2
- `uuid` — geração de tokens únicos por ponto

---

## Variáveis de Ambiente

```env
DATABASE_URL=          # String de conexão Neon (postgres://...)
ADMIN_EMAIL=           # Email do administrador do painel
ADMIN_PASSWORD=        # Senha do administrador
NEXTAUTH_SECRET=       # Segredo JWT para NextAuth
R2_ACCOUNT_ID=         # Account ID da Cloudflare
R2_ACCESS_KEY_ID=      # Chave de acesso R2
R2_SECRET_ACCESS_KEY=  # Chave secreta R2
R2_BUCKET_NAME=        # Nome do bucket R2
R2_PUBLIC_URL=         # URL pública do bucket (ex: https://pub-xxx.r2.dev)
```

---

## Arquitetura Geral

```
Browser (TV)                    Browser (Admin)
     |                                 |
     | GET /player/{token}             | /admin/*
     |                                 |
     v                                 v
Next.js App Router (Vercel)
     |           |           |
     |           |           |
  Player      Admin        API Routes
  (client)   (server)    (serverless)
     |                       |
     |                  Neon Postgres
     |                  Cloudflare R2
     |
Service Worker
(cache de vídeo local)
```

O sistema tem **dois lados independentes**:

1. **Player** — página client-side aberta na TV. Não requer login. Identificada por token único. Loop infinito de vídeos.
2. **Painel Admin** — interface SSR protegida por autenticação. Gerencia todo o conteúdo.

---

## Banco de Dados

### Schema (`migrations/001_schema_inicial.sql`)

```
pontos
  id, nome, endereco, orientacao, rotacao_graus,
  repasse_mensal, token_player (único), ativo, criado_em

anunciantes
  id, nome, contato, telefone, observacoes, criado_em

contratos
  id, anunciante_id → anunciantes, valor_mensal,
  data_inicio, data_fim, status (ativo|encerrado|suspenso), criado_em

videos
  id, anunciante_id → anunciantes, titulo,
  r2_key (único), duracao_segundos, largura, altura, criado_em

playlist_itens
  id, ponto_id → pontos, video_id → videos,
  contrato_id → contratos (nullable), ordem, ativo
  UNIQUE(ponto_id, video_id)

exibicoes
  id, ponto_id, video_id, inicio

heartbeats
  id, ponto_id, recebido_em, versao_player, info (JSONB)
```

### Relacionamentos chave
- Um **anunciante** tem N **contratos** e N **vídeos**
- Um **ponto** tem uma **playlist** (N `playlist_itens`)
- Cada `playlist_item` aponta para um **vídeo** e opcionalmente um **contrato**
- O player só exibe vídeos cujo contrato está `ativo` e dentro do período `data_inicio–data_fim`

### Índices
```sql
idx_exibicoes_ponto_inicio    — relatórios de exibição por ponto e período
idx_heartbeats_ponto_recebido — status online por ponto
idx_contratos_anunciante      — lista de contratos por anunciante
idx_playlist_ponto            — playlist por ponto
idx_videos_anunciante         — vídeos por anunciante
```

---

## Autenticação

**Arquivo:** `src/auth.ts`

- NextAuth v5 com provider `Credentials`
- Valida `email` e `password` contra as variáveis de ambiente `ADMIN_EMAIL` e `ADMIN_PASSWORD`
- Sessão via **JWT** (stateless, sem tabela de sessões no banco)
- Retorna `{ id: '1', email, name: 'Admin' }` em caso de sucesso

**Middleware:** `src/middleware.ts`

- Intercepta todas as rotas `/admin/:path*`
- Se não autenticado → redireciona para `/admin/login?callbackUrl=<rota>`
- Se autenticado e tentando acessar `/admin/login` → redireciona para `/admin`

**Conexão com banco:** `src/lib/db.ts`

```ts
const sql = neon(process.env.DATABASE_URL!)
```
Singleton de conexão via HTTP (Neon serverless). Funciona em Edge Functions do Vercel sem TCP.

---

## Storage de Vídeo (R2)

**Arquivo:** `src/lib/r2.ts`

Duas funções principais:

- `gerarUrlUpload(key, contentType)` — gera URL pré-assinada com validade de 10 minutos para upload direto do browser para o R2 (sem passar pelo servidor Next.js)
- `urlPublica(key)` — monta a URL pública do vídeo concatenando `R2_PUBLIC_URL + key`

O upload acontece **direto do browser para o R2** via XMLHttpRequest, permitindo acompanhar o progresso em tempo real.

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (importa globals.css)
│   ├── page.tsx                      # Redireciona / → /admin
│   ├── globals.css                   # Estilos globais (body, inputs, .btn-primary, .nav-link)
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Layout com sidebar (verifica sessão)
│   │   ├── page.tsx                  # Dashboard
│   │   ├── SignOutButton.tsx          # Botão de logout (client)
│   │   │
│   │   ├── login/
│   │   │   ├── layout.tsx            # Layout vazio (sem sidebar)
│   │   │   └── page.tsx              # Tela de login split-screen
│   │   │
│   │   ├── pontos/
│   │   │   ├── page.tsx              # Lista de pontos com status online
│   │   │   ├── TogglePonto.tsx       # Botão ativar/desativar (client)
│   │   │   ├── novo/
│   │   │   │   └── page.tsx          # Formulário de criação
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Edição + gerenciamento de playlist
│   │   │       └── PlaylistManager.tsx  # Componente de playlist (client)
│   │   │
│   │   ├── anunciantes/
│   │   │   ├── page.tsx              # Lista de anunciantes
│   │   │   ├── novo/
│   │   │   │   └── page.tsx          # Formulário de criação
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detalhe: dados + contratos + vídeos
│   │   │       ├── AcoesContrato.tsx # Suspender/reativar/encerrar (client)
│   │   │       ├── DeletarVideo.tsx  # Confirmar remoção de vídeo (client)
│   │   │       └── VideoUpload.tsx   # Upload com progresso (client)
│   │   │
│   │   └── contratos/
│   │       └── page.tsx              # Lista geral de contratos ativos e encerrados
│   │
│   ├── player/
│   │   └── [token]/
│   │       ├── layout.tsx            # Layout mínimo (retorna children)
│   │       └── page.tsx              # Player de vídeo (client)
│   │
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts              # Handlers NextAuth
│       ├── player/[token]/
│       │   ├── playlist/route.ts     # GET — retorna playlist com URLs
│       │   ├── heartbeat/route.ts    # POST — registra heartbeat
│       │   └── exibicao/route.ts     # POST — registra exibição de vídeo
│       └── admin/videos/
│           ├── upload-url/route.ts   # POST — gera URL pré-assinada R2
│           └── route.ts              # POST — cria registro no banco após upload
│
├── lib/
│   ├── db.ts                         # Conexão Neon (singleton)
│   ├── r2.ts                         # Cliente R2 (upload + URL pública)
│   ├── tipos.ts                      # Interface ItemPlaylist
│   └── actions/
│       ├── pontos.ts                 # Server Actions: CRUD de pontos
│       ├── anunciantes.ts            # Server Actions: CRUD de anunciantes e contratos
│       └── playlist.ts               # Server Actions: gerenciamento de playlist
│
├── auth.ts                           # Config NextAuth
└── middleware.ts                     # Proteção de rotas /admin/*

public/
└── sw.js                             # Service Worker (cache de vídeos)

migrations/
└── 001_schema_inicial.sql            # Schema completo do banco
```

---

## Telas do Painel Admin

### Login (`/admin/login`)
- Layout **split-screen**: painel esquerdo (55%) com branding Tenax, painel direito (45%) com formulário
- Fundo preto total, tipografia grande para "TENAX" + "INDOOR" em verde neon (`#00FF88`)
- Grade de pontos decorativa no painel esquerdo via `radial-gradient`
- Barra verde no topo (gradiente `#00FF88 → transparent`)
- Campos email e senha com borda verde no foco (via `onFocus`/`onBlur`)
- Botão "ENTRAR" verde escurece durante o loading
- Responsivo: empilha verticalmente em mobile

### Dashboard (`/admin`)
- **Cards de métricas** em grid 4 colunas:
  - TVs online (heartbeat < 10 min)
  - Pontos ativos
  - Contratos ativos
  - Receita mensal total
- **Alerta amarelo** de contratos vencendo nos próximos 30 dias
- **Links rápidos** em grid 3 colunas: Pontos, Anunciantes, Contratos

### Pontos (`/admin/pontos`)
- Lista de pontos com **indicador de status online** (círculo verde/cinza)
- Tempo relativo desde o último heartbeat ("há 5 min", "há 2 h")
- Badge "inativo" para pontos desativados
- Ações inline: **Abrir player ↗**, **Editar**, **Ativar/Desativar**
- Botão "Novo ponto" no cabeçalho

### Novo Ponto (`/admin/pontos/novo`)
- Campos: Nome, Endereço, Orientação (vertical/horizontal), Rotação (0°/90°/180°/270°), Repasse mensal
- `criarPonto` Server Action gera token único via `randomBytes(16)` e redireciona para a lista

### Editar Ponto (`/admin/pontos/[id]`)
- **Link do player** exibido com destaque (código verde com botão Abrir ↗)
- Formulário de edição dos mesmos campos
- **Gerenciador de Playlist** abaixo do formulário

#### PlaylistManager
- Lista os vídeos na playlist com número de ordem
- Cada item: título, anunciante, botões **Pausar/Ativar** e **Remover**
- Itens pausados ficam com opacidade reduzida
- Dropdown para selecionar e adicionar novo vídeo (apenas de contratos vigentes)
- Usa `useTransition` para não bloquear a UI durante operações

### Anunciantes (`/admin/anunciantes`)
- Lista com contador de contratos ativos e total de vídeos
- Link "Ver detalhes" para a página individual

### Novo Anunciante (`/admin/anunciantes/novo`)
- Campos: Nome, Nome do contato, Telefone, Observações

### Detalhe do Anunciante (`/admin/anunciantes/[id]`)
Três seções:

**1. Dados** — formulário de edição inline com `atualizarAnunciante`

**2. Contratos** — lista de contratos com:
- Badge colorido: verde (ativo), amarelo (suspenso), cinza (encerrado)
- Borda amarela em contratos próximos do vencimento
- Ações: Suspender / Reativar / Encerrar (via `AcoesContrato`, client component)
- `<details>` expansível para criar novo contrato (valor, data início, data fim)

**3. Vídeos** — lista de vídeos com duração e resolução, botão Remover (com confirmação)
- **VideoUpload** abaixo da lista:
  - Seleção de arquivo via `<input type="file">`
  - Campo de título (preenchido automaticamente com o nome do arquivo)
  - Barra de progresso verde durante o upload
  - Fluxo: ler metadados → obter URL pré-assinada → upload direto R2 → registrar no banco

### Contratos (`/admin/contratos`)
- Seção de alerta: contratos vencendo em 30 dias
- Seção "Ativos" + seção "Encerrados" (com opacidade reduzida)
- Cada linha: link para o anunciante, valor/mês, período de vigência

---

## Player de Vídeo (`/player/[token]`)

### Fluxo de inicialização
1. Resolve o `token` dos params (Promise — necessário no Next.js 16)
2. Registra o Service Worker (`/sw.js`)
3. Busca a playlist via `GET /api/player/{token}/playlist`
4. Envia heartbeat via `POST /api/player/{token}/heartbeat`
5. Inicia o loop de vídeos

### Loop de reprodução
- Dois elementos `<video>` sobrepostos: um **ativo** (visível) e um **preloading** (opacity 0)
- Ao terminar o vídeo atual (`onEnded`), avança o índice → o próximo já está carregado
- A cada avanço, registra a exibição no banco e pré-carrega o próximo via Service Worker

### Intervalos automáticos
- **Playlist:** atualizada a cada 2 minutos (mudanças no painel refletem em até 2 min)
- **Heartbeat:** enviado a cada 3 minutos (marca a TV como "online" no dashboard)

### Rotação de tela
Suporte a TVs rotacionadas usando CSS transforms sem `overflow: hidden` (o viewport do browser clipa naturalmente):

```
0°   → position: absolute; inset: 0
90°  → width: 100vh; height: 100vw; left: 100vw; top: 0; transform: rotate(90deg); transform-origin: top left
180° → position: absolute; inset: 0; transform: rotate(180deg)
270° → width: 100vh; height: 100vw; left: 0; top: 100vh; transform: rotate(270deg); transform-origin: top left
```

### Estados do player
- **Carregando / sem playlist:** tela preta com "Tenax Indoor" em texto muito discreto
- **Token inválido:** mensagem de erro discreta
- **Reproduzindo:** tela preta total, cursor oculto (`cursor: none`), sem scroll

### Service Worker (`public/sw.js`)
- Cache de vídeos em `Cache API` com nome `tenax-v1`
- Intercepta requisições de arquivos `.mp4`, `.webm`, `.mov`
- **Cache-first:** retorna do cache se disponível, senão busca e armazena
- **Pré-carregamento:** responde à mensagem `{ tipo: 'precarregar', url }` do player para cachear o próximo vídeo antes de precisar dele
- **Limpeza:** ao ativar nova versão do SW, remove caches antigos automaticamente

---

## API Routes

### `GET /api/player/[token]/playlist`
- Valida o token e verifica se o ponto está ativo
- Retorna apenas vídeos cujo `playlist_item` está ativo E cujo contrato está `ativo` e dentro do período
- Monta as URLs públicas dos vídeos via `urlPublica(r2_key)`
- Retorna: `{ ponto_id, rotacao_graus, orientacao, itens: ItemPlaylist[] }`

### `POST /api/player/[token]/heartbeat`
- Insere registro em `heartbeats` com timestamp atual e versão do player
- Não requer autenticação (identificação pelo token do ponto)

### `POST /api/player/[token]/exibicao`
- Insere registro em `exibicoes` com `ponto_id`, `video_id` e timestamp de início
- Base para relatórios futuros de audiência

### `POST /api/admin/videos/upload-url` *(requer auth)*
- Gera chave única: `videos/{randomHex}.{ext}`
- Retorna URL pré-assinada do R2 com validade de 10 minutos e a chave gerada

### `POST /api/admin/videos` *(requer auth)*
- Insere o registro do vídeo no banco com `titulo`, `r2_key`, `duracao_segundos`, `largura`, `altura`

---

## Server Actions

### `src/lib/actions/pontos.ts`
| Função | Descrição |
|--------|-----------|
| `criarPonto(fd)` | Insere ponto com token único gerado por `randomBytes(16)`, redireciona para lista |
| `atualizarPonto(id, fd)` | Atualiza todos os campos do ponto, redireciona para lista |
| `togglePonto(id, ativo)` | Alterna o status ativo/inativo sem redirecionar |

### `src/lib/actions/anunciantes.ts`
| Função | Descrição |
|--------|-----------|
| `criarAnunciante(fd)` | Insere anunciante, redireciona para lista |
| `atualizarAnunciante(id, fd)` | Atualiza dados do anunciante, redireciona para detalhe |
| `criarContrato(anuncianteId, fd)` | Insere contrato com status `ativo`, revalida a página |
| `atualizarStatusContrato(id, status, anuncianteId)` | Muda status do contrato, revalida a página |
| `deletarVideo(id, anuncianteId)` | Remove vídeo E seus registros em `playlist_itens` (cascata manual) |

### `src/lib/actions/playlist.ts`
| Função | Descrição |
|--------|-----------|
| `adicionarVideoPlaylist(pontoId, videoId, contratoId)` | Insere com `ON CONFLICT DO UPDATE` (reativa se já existia) |
| `removerItemPlaylist(itemId, pontoId)` | Remove da playlist, revalida a página |
| `toggleItemPlaylist(itemId, ativo, pontoId)` | Pausa ou ativa um item sem remover |
| `reordenarPlaylist(pontoId, itens)` | Atualiza `ordem` de múltiplos itens (implementado, não exposto na UI ainda) |

---

## Estilização

O projeto utiliza **100% inline styles** em todos os componentes, sem dependência de classes utilitárias. O Tailwind CSS está instalado (`tailwindcss ^4` + `@tailwindcss/turbopack`) mas apresentou problemas de configuração com Next.js 16 / Turbopack.

O `globals.css` define via CSS puro:
- `body`: fundo `#050505`, cor branca, fonte do sistema
- `input`, `select`, `textarea`: fundo `#111`, borda `#222`, verde no foco (`#00FF88`)
- `.btn-primary`: botão verde `#00FF88`, texto preto, bold
- `.nav-link`: link da sidebar com hover sutil
- Scrollbar discreta (4px, cinza escuro)

**Paleta de cores:**
| Uso | Valor |
|-----|-------|
| Fundo principal | `#050505` |
| Fundo sidebar | `#000` |
| Cards/linhas | `#111` |
| Borda padrão | `#1e1e1e` |
| Texto primário | `#fff` |
| Texto secundário | `#555` |
| Labels | `#888` |
| Acento verde | `#00FF88` |
| Alerta amarelo | `#f59e0b` |
| Erro/remover | `#a04040` |
| Link | `#4a9eff` |

---

## Status Atual

### Concluído ✅

- [x] Schema completo do banco com todas as tabelas e índices
- [x] Autenticação com NextAuth v5 (JWT, single-admin)
- [x] Middleware de proteção de rotas com callbackUrl
- [x] Player de vídeo com loop infinito, rotação CSS, cursor oculto
- [x] Service Worker com cache de vídeos e pré-carregamento do próximo
- [x] Heartbeat automático a cada 3 minutos
- [x] Registro de exibições para base de relatórios
- [x] Dashboard com métricas em tempo real
- [x] CRUD completo de Pontos (com geração de token único)
- [x] CRUD completo de Anunciantes
- [x] Gestão de Contratos (criar, suspender, reativar, encerrar)
- [x] Upload de vídeos direto para R2 com barra de progresso
- [x] Gerenciamento de Playlist por ponto (adicionar, pausar, remover)
- [x] Filtro automático: player só exibe vídeos com contrato vigente
- [x] Status online da TV no painel (baseado em heartbeat < 10 min)
- [x] Alerta de contratos vencendo em 30 dias (dashboard + contratos)
- [x] Página de login com design split-screen (branding + formulário)
- [x] Layout responsivo do painel com sidebar fixa

### Pendente / Próximos passos 🚧

- [ ] **Relatórios de exibição** — os dados já são gravados em `exibicoes`, falta a tela de visualização com filtros por período/ponto/anunciante e exportação PDF
- [ ] **Drag-and-drop na playlist** — `reordenarPlaylist` já existe no backend, falta UI
- [ ] **Upload múltiplo de vídeos** — atualmente suporta um por vez
- [ ] **Configuração do Tailwind** — resolver a integração `@tailwindcss/turbopack` com Next.js 16 para poder usar classes utilitárias opcionalmente
- [ ] **Renovação de contratos** — fluxo de renovação rápida de contratos expirados
- [ ] **Logs de eventos do player** — campo `info` JSONB no heartbeat ainda não é usado

---

## Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# (preencher DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, NEXTAUTH_SECRET, R2_*)

# Rodar migrations no banco
npm run migrate

# Iniciar dev server
npm run dev
```

Acesse `http://localhost:3000` — redireciona para `/admin/login`.

O player de qualquer ponto fica em `http://localhost:3000/player/{token_player}`.

---

## Fluxo Completo de Uso

```
1. Admin cria um Anunciante
2. Admin faz upload de Vídeos para o anunciante
3. Admin cria um Contrato com data de início/fim e valor
4. Admin cria um Ponto (TV) → sistema gera token único
5. Admin abre o Ponto e adiciona Vídeos do anunciante à Playlist
6. Admin abre o link do Player na TV: /player/{token}
7. TV exibe os vídeos em loop enquanto o contrato estiver vigente
8. Dashboard mostra TVs online, métricas e alertas de vencimento
9. Ao encerrar o contrato, vídeos são automaticamente removidos do player
```
