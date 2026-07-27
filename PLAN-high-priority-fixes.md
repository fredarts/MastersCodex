# PLAN-high-priority-fixes

## Overview
Endereçar os bloqueadores críticos e de alta prioridade para o lançamento do Masters Codex: The Campaign Forge Tool. As tarefas incluem a correção da segurança (RLS), o alinhamento do schema SQL com os tipos TypeScript, a otimização do armazenamento de imagens de mapas usando Supabase Storage e a implementação do servidor de sinalização (Signaling Server) via Supabase Realtime para habilitar a funcionalidade de voz WebRTC entre dispositivos.

## Project Type
WEB

## Success Criteria
1. **Segurança**: As políticas RLS (Row Level Security) validam `auth.uid()` e garantem que usuários só acessem dados de suas próprias campanhas/mundos.
2. **Schema**: A coluna `category` da tabela `world_entities` aceita todas as 25 categorias definidas em `lib/types.ts`.
3. **Storage**: As imagens de fundo do `MapMaker` são enviadas para um bucket do Supabase Storage e armazenadas como URLs, eliminando o uso de base64 no banco de dados.
4. **Voz WebRTC**: Jogadores em diferentes dispositivos conseguem se conectar usando áudio bidirecional via sinalização no Supabase Realtime.

## Tech Stack
- Supabase PostgreSQL (RLS, Schema)
- Supabase Storage
- Supabase Realtime (Signaling)
- WebRTC (RTCPeerConnection)
- Next.js (React)

## File Structure
- `supabase/schema.sql`
- `components/MapMaker.tsx`
- `lib/services/storageService.ts` (ou similar, para lidar com o upload)
- `lib/voice/WebRTCVoiceManager.ts`

## Task Breakdown

### Task 1: Corrigir Schema SQL (World Entities)
- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **Dependencies**: Nenhuma
- **INPUT**: Ler `lib/types.ts` (`WorldEntityCategory`) e `supabase/schema.sql`.
- **OUTPUT**: Arquivo `supabase/schema.sql` atualizado para que o `CHECK` da tabela `world_entities` contenha todos os 25 valores permitidos (ex: `spell`, `beast`, `cosmology`, etc.).
- **VERIFY**: Executar o SQL no Supabase e confirmar que a inserção de uma entidade com a categoria `spell` não gera erro.

### Task 2: Implementar Políticas RLS Seguras
- **Agent**: `security-auditor`
- **Skill**: `vulnerability-scanner`
- **Priority**: P0
- **Dependencies**: Nenhuma
- **INPUT**: `supabase/schema.sql`.
- **OUTPUT**: Arquivo `schema.sql` com políticas RLS robustas que substituem o perigoso `USING (true)`. Exemplos: validar se `auth.uid() = dm_id` na tabela `worlds`, ou checar associação na tabela `campaign_members`.
- **VERIFY**: Testar o acesso ao banco com tokens de diferentes usuários para garantir que não haja vazamento cruzado.

### Task 3: Integração do Supabase Storage para Imagens de Mapas
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **Priority**: P1
- **Dependencies**: Task 2 (RLS deve estar pronto)
- **INPUT**: `components/MapMaker.tsx`.
- **OUTPUT**: Alterar a lógica de upload no `MapMaker.tsx`. Em vez de ler via `FileReader` como base64 e salvar no `grid`, enviar o `File` via `supabase.storage.from('maps').upload(...)` e salvar a URL pública no banco.
- **VERIFY**: Fazer o upload de uma imagem e garantir que o tamanho do payload na tabela `scenes` permaneça pequeno (somente a URL).

### Task 4: WebRTC Signaling via Supabase Realtime
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Nenhuma
- **INPUT**: `lib/voice/WebRTCVoiceManager.ts` e `components/live-cockpit/VoiceChatControls.tsx`.
- **OUTPUT**: Lógica de sinalização implementada. O `WebRTCVoiceManager` deve utilizar canais do Supabase Realtime (`broadcast`) para trocar mensagens do tipo `offer`, `answer` e `ice-candidate` entre os clientes da mesma sessão.
- **VERIFY**: Abrir o sistema em duas janelas anônimas (ou navegadores distintos), entrar na mesma sessão de voz e confirmar a comunicação de áudio bidirecional.

## Phase X: Verification
- [ ] Lint: Pass
- [ ] Security: RLS auditada sem alertas críticos
- [ ] Build: Success
- [ ] Date: [To be filled]
