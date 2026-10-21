# Tenax Indoor — Documentação do Projeto

**Sistema de gestão de mídia indoor da Tenax Sistemas.**
Controla TVs em estabelecimentos (barbearias, clínicas, etc.), gerencia anunciantes, contratos e playlists de vídeo a partir de um painel web centralizado.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Banco de dados | Neon Postgres (serverless, HTTP) |
| Storage de vídeo | Cloudflare R2 (S3-compatible) |
| Autenticação | NextAuth v5 beta (Credentials + JWT) |
| Cache de vídeo no player | IndexedDB via `idb` |
| Estilização | Tailwind v4 com PostCSS + design tokens |
| Deploy | Vercel (serverless) |
| Ícones | lucide-react |
| Toasts | sonner |
| Gráficos | recharts |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| QR Code | qrcode.react |
| Validação | zod |

**Dependências principais:**
- `next` 16.4.2, `react` 19, `next-auth` ^5.0.0-beta.32
- `@neondatabase/serverless` — cliente HTTP (sem TCP, funciona em Edge)
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — upload R2
- `idb` — IndexedDB no player
- `recharts` — gráficos no painel
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop na playlist e funil
- `qrcode.react` — QR code do link do player
- `zod` — validação de formulários

---

## Variáveis de Ambiente

```env
DATABASE_URL=          # String de conexão Neon
ADMIN_EMAIL=           # Email do administrador
ADMIN_PASSWORD=        # Senha do administrador
NEXTAUTH_SECRET=       # Segredo JWT para NextAuth
R2_ACCOUNT_ID=         # Account ID da Cloudflare
R2_ACCESS_KEY_ID=      # Chave de acesso R2
R2_SECRET_ACCESS_KEY=  # Chave secreta R2
R2_BUCKET_NAME=        # Nome do bucket R2
R2_PUBLIC_URL=         # URL pública do bucket (ex: https://pub-xxx.r2.dev)
```

---

## Design System

### Tokens (globals.css — `@theme inline`)

| Token | Escuro | Claro |
|-------|--------|-------|
| `--color-base` | `#0A0A0A` | `#F5F5F5` |
| `--color-surface` | `#111111` | `#FFFFFF` |
| `--color-elevated` | `#171717` | `#F0F0F0` |
| `--color-border` | `#232323` | `#E5E5E5` |
| `--color-fg` | `#FFFFFF` | `#0A0A0A` |
| `--color-muted` | `#A3A3A3` | `#6B6B6B` |
| `--color-subtle` | `#6B6B6B` | `#A3A3A3` |
| `--color-accent` | `#C9A063` | `#C9A063` |
| `--color-online` | `#22C55E` | — |
| `--color-alert` | `#F59E0B` | — |
| `--color-error` | `#EF4444` | — |
| `--color-info` | `#60A5FA` | — |

Tipografia: Poppins (next/font). Raio: 12px cards, 8px inputs. Tema escuro padrão; toggle salvo em localStorage.

### Componentes (src/components/ui/)

`Button`, `Badge`, `Card`, `Field`, `StatusDot`, `EmptyState`, `Skeleton`, `Modal`, `ConfirmModal`, `Tabs`, `Avatar`, `CopyButton`, `PageHeader`

---

## Banco de Dados

### Schema completo

```
pontos
  id, nome, endereco, orientacao, rotacao_graus,
  repasse_mensal, token_player (único), ativo,
  horario (JSONB), programacao_versao (INT),
  criado_em

anunciantes
  id, nome, contato, telefone, observacoes,
  segmento, instagram, whatsapp, endereco,
  logo_r2_key, cupom,
  criado_em

contratos
  id, anunciante_id → anunciantes, valor_mensal,
  data_inicio, data_fim, status (ativo|encerrado|suspenso), criado_em

videos
  id, anunciante_id → anunciantes (nullable), titulo,
  r2_key (único), thumb_r2_key,
  tipo (anunciante|ponto|neutro),
  duracao_segundos, largura, altura,
  atualizado_em, criado_em

playlist_itens
  id, ponto_id, video_id, contrato_id (nullable),
  ordem, ativo
  UNIQUE(ponto_id, video_id)

exibicoes
  id, ponto_id, video_id, inicio,
  exibicao_uuid (UNIQUE)

heartbeats
  id, ponto_id, recebido_em, versao_player, info (JSONB)

leads (Fase 3)
  id, empresa, segmento, telefone, instagram,
  endereco, etapa, proxima_acao, proxima_data,
  observacoes, anunciante_id (nullable), criado_em
```

### Migrations

| Arquivo | O que faz |
|---------|-----------|
| `001_schema_inicial.sql` | Schema base completo |
| `002_horario_versao.sql` | `horario` e `programacao_versao` em pontos |
| `003_video_tipo.sql` | `tipo`, `thumb_r2_key` em videos; `anunciante_id` nullable |
| `004_exibicoes_uuid.sql` | `exibicao_uuid` UNIQUE em exibicoes |
| `005_anunciantes_campos.sql` | Campos novos em anunciantes |
| `006_leads.sql` | Tabela leads para funil de vendas |
| `007_videos_atualizado_em.sql` | Coluna `atualizado_em` em videos |

---

## Arquitetura

```
Browser (TV)                    Browser (Admin)
     |                                 |
     | GET /player/{token}             | /admin/*
     v                                 v
         Next.js App Router (Vercel)
              |           |
           Player       Admin + API
           (client)     (server/SSR)
              |              |
           IndexedDB     Neon Postgres
           (cache)       Cloudflare R2
```

---

## Rotas

### Player
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/player/[token]/playlist` | GET | Playlist completa com URLs |
| `/api/player/[token]/versao` | GET | Versão leve (poll 60s) |
| `/api/player/[token]/heartbeat` | POST | Registro de status |
| `/api/player/[token]/exibicoes` | POST | Batch de exibições |
| `/api/player/[token]/exibicao` | POST | Legado (manter até atualizar TVs) |

### Admin
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/admin/videos/upload-url` | POST | URL pré-assinada R2 |
| `/api/admin/videos` | POST | Registrar vídeo no banco |
| `/api/admin/relatorio/[token]` | GET | Dados do relatório público |

---

## Player de Vídeo

### Comportamento
- Dois `<video>` com crossfade 300ms
- Cache em IndexedDB (chave: `video_id:atualizado_em`)
- Poll de versão a cada 60s, baixa playlist só se mudou
- Fila de exibições: flush a cada 60s ou 50 itens
- Wake Lock quando suportado
- Reload diário às 4h (fuso Sao_Paulo)
- Fora do horário de funcionamento: tela preta
- Debug overlay com `?debug=1`
- Tela "Anuncie aqui" quando playlist vazia

### Rotação CSS

```
0°   → inset: 0
90°  → width: 100vh; height: 100vw; left: 100vw; transform: rotate(90deg)
180° → inset: 0; transform: rotate(180deg)
270° → width: 100vh; height: 100vw; top: 100vh; transform: rotate(270deg)
```

---

## Telas do Painel

### Login
Split-screen: TV CSS animada à esquerda, formulário à direita. Mobile: só formulário. Rate limit 5 tentativas / 10 min (memória).

### Dashboard
Saudação por horário, resumo humano, KPIs, gráfico de exibições 30 dias, lista de atenção (TVs offline, contratos vencendo), atividade recente.

### Telas (Pontos)
Grade de cards com miniatura de TV. Abas: Programação, Dados, Horário, Aparelho, Desempenho.

### Programação (Playlist)
Drag-and-drop para reordenar (@dnd-kit). Preview da TV. Resumo de duração e estimativa de exibições.

### Anunciantes
Lista com busca e filtros. Campos: segmento, instagram, whatsapp, logo. Botão WhatsApp.

### Funil de Vendas
Kanban em 6 colunas. Importação por CSV.

### Contratos
Filtros, renovação em 1 clique, atalhos de duração.

### Relatórios
Exibições por período/anunciante/tela. Relatório público `/r/[token]` para WhatsApp. Exportar CSV.

---

## Status das Fases

### Fase 1 - Fundação visual ✅
- [x] Tailwind v4 com PostCSS configurado
- [x] Design tokens com @theme inline
- [x] Tema escuro padrão + toggle para claro
- [x] Poppins via next/font
- [x] Componentes UI base completos
- [x] Sidebar recolhível (desktop) + nav inferior (mobile)
- [x] Login redesenhado com TV CSS ilustrada
- [x] Todas as páginas migradas para Tailwind

### Fase 2 - Correções técnicas do player ✅
- [x] Cache IndexedDB com idb (fallback para stream direto)
- [x] Exibições contam só no `ended`, fila batch, POST único
- [x] Horário de funcionamento por ponto (JSONB)
- [x] Tipo de vídeo (anunciante/ponto/neutro)
- [x] Crossfade 300ms entre videos
- [x] Wake Lock + reload 4h
- [x] Versão de programação (poll 60s)
- [x] Debug overlay (?debug=1)
- [x] Tela "Anuncie aqui"

### Fase 3 - Telas redesenhadas e funcionalidades novas ✅
- [x] Dashboard com gráfico, KPIs completos, lista de atenção
- [x] Telas em grade de cards, abas (Programação, Dados, Horário, Aparelho)
- [x] QR code + link copiável + forçar atualização na aba Aparelho
- [x] Editor de horário por dia da semana
- [x] Drag-and-drop na playlist (@dnd-kit)
- [x] Anunciantes com campos novos (segmento, instagram, whatsapp, cupom)
- [x] Lista de anunciantes com busca + filtros por abas
- [x] Funil de vendas Kanban (/admin/funil) com @dnd-kit
- [x] Upload múltiplo de vídeos com fila e progresso por arquivo
- [x] Contratos com renovação em 1 clique e atalhos de duração

### Fase 4 - Relatórios ✅
- [x] /admin/relatorios com filtros (período, ponto, anunciante), tabela 200 linhas, KPIs
- [x] /api/admin/relatorios — GET com query condicional
- [x] /api/admin/relatorios/csv — export sem limite, timezone SP
- [x] /r/[token] — relatório público para anunciante (exibições mês, telas, vídeos, contrato)
- [x] Gerar/regenerar link do relatório no cadastro do anunciante
- [x] Migração 008 — relatorio_token em anunciantes

### Fase 5 - Personalidade e acabamento ✅
- [x] loading.tsx para todas as páginas admin (streaming/Suspense)
- [x] Checklist "Primeiros passos" no dashboard (quando sem telas)
- [x] Paleta de comandos Cmd+K / Ctrl+K com busca e navegação rápida
- [x] aria-label em todos os botões de ícone
- [x] Dica de atalho ⌘K no rodapé da sidebar

---

## Instalação de uma TV nova

1. Instalar Fully Kiosk Browser no Fire TV Stick
2. Configurar URL de inicialização: `https://seu-dominio/player/{token_player}`
3. Ativar "Keep Screen On" e "Motion Detection"
4. No painel: Telas → ponto → aba Aparelho → copiar link ou escanear QR

---

## Como Rodar Localmente

```bash
npm install
cp .env.example .env.local
# preencher DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, NEXTAUTH_SECRET, R2_*
npm run migrate
npm run dev
```

Acesse `http://localhost:3000` → redireciona para `/admin/login`.
Player: `http://localhost:3000/player/{token_player}`
