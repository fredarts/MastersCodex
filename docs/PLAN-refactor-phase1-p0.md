# Plano de Implementação: Fase 1 (Curto Prazo - P0 Crítico: Fundações & Limpeza)

> **Status:** ⏳ Aguardando Aprovação  
> **Prioridade:** P0 (Crítico)  
> **Alvo:** Decomposição de Monólitos, Tipagem Estrita DTO Supabase e Sistema Global de Toast  

---

## 🎯 Objetivos de Engenharia

1. **Decompor os Monólitos de UI (`BattleGrid3D.tsx` & `LiveCockpitStudio.tsx`):**
   - Reduzir arquivos de >1.500 linhas para componentes focados de 100 a 250 linhas cada.
   - Extrair lógicas 3D/WebGL para custom hooks e submódulos dedicados em `components/battle-3d/`.
   - Extrair o cockpit de controle do mestre para componentes modulares em `components/live-cockpit/`.

2. **Eliminar Tipagens Inseguras (`any`) e Implementar Camada de DTOs:**
   - Mapear schemas completos do banco Supabase em `lib/database.types.ts`.
   - Criar funções utilitárias de mapeamento estrito em `lib/mappers.ts`.
   - Garantir 100% de cobertura de tipo nos serviços `worldService`, `sessionService`, `campaignService` e `storageService`.

3. **Sistema Global de Notificações de Erro (Toast System):**
   - Integrar biblioteca de Toast (`sonner`) em `AppProviders.tsx`.
   - Adicionar notificações com tratamento visual de erros em todas as operações de rede/banco de dados, encerrando a captura silenciosa de exceções (`catch (e) {}`).

---

## 🏗️ Estrutura de Arquivos Proposta

```plaintext
lib/
├── database.types.ts             [NOVO] Interfaces de tabelas do Supabase (SceneRow, WorldEntityRow, etc)
├── mappers.ts                    [NOVO] Mapeadores estritos (DB Row -> Domain Model)
├── hooks/
│   └── useBattleGridState.ts    [NOVO] Hook isolado para raycasting, Math de grid 3D e drag de tokens
└── services/
    ├── worldService.ts           [MODIFICAR] Substituir 'any' por DTOs + Toast Errors
    ├── sessionService.ts         [MODIFICAR] Substituir 'any' por DTOs + Toast Errors
    ├── campaignService.ts        [MODIFICAR] Substituir 'any' por DTOs + Toast Errors
    └── storageService.ts         [MODIFICAR] Resiliência + Toast Errors

components/
├── AppProviders.tsx              [MODIFICAR] Adicionar <Toaster /> da sonner
├── BattleGrid3D.tsx              [REESTRUTURAR] Reduzir para ~150 linhas (Container principal)
├── LiveCockpitStudio.tsx         [REESTRUTURAR] Reduzir para ~200 linhas (Container principal)
├── battle-3d/                    [NOVO DIRETÓRIO]
│   ├── BattleEnvironment.tsx     [NOVO] Iluminação, névoa e atmosfera 3D
│   ├── BattleCameraControls.tsx  [NOVO] Câmera, órbita e transições suaves
│   ├── Token3DMesh.tsx           [NOVO] Mesh de token 3D, contorno e animações
│   └── WeatherEffects.tsx        [NOVO] Partículas de chuva/neve/tempestade
└── live-cockpit/                 [EXPANDIR DIRETÓRIO EXISTENTE]
    ├── CockpitHeaderPanel.tsx    [NOVO] Cabeçalho, modos de exibição e status de conexão
    ├── CombatTurnOrderPanel.tsx  [NOVO] Rastreador de iniciativa e status dos combatentes
    ├── QuickAudioWidget.tsx      [NOVO] Atalhos rápidos de BGM/SFX e volume
    └── SceneProjectionSelector.tsx [NOVO] Seletor de cenas e controle de projeção do player view
```

---

## 📋 Detalhamento das Tarefas (Fase 1)

### Módulo 1: Camada de Tipagem DTO & Mapeamento Estrito
- [ ] **Criar `lib/database.types.ts`:**
  - Definir interfaces de tabelas Postgres: `WorldRow`, `WorldEntityRow`, `CampaignRow`, `CampaignMemberRow`, `SessionRow`, `SceneRow`, `CampaignFeedEventRow`, `AudioAssetRow`.
- [ ] **Criar `lib/mappers.ts`:**
  - `mapSceneRowToDomain(row: SceneRow): GameScene`
  - `mapWorldEntityRowToDomain(row: WorldEntityRow): WorldEntity`
  - `mapCampaignMemberRowToDomain(row: CampaignMemberRow): CampaignMember`
- [ ] **Refatorar Serviços em `lib/services/`:**
  - Eliminar o uso de `any` nas respostas das queries do Supabase.
  - Retornar modelos de domínio validados e tipados.

### Módulo 2: Sistema Global de Notificações de Erro
- [ ] **Instalar `sonner` no projeto:** `npm install sonner`
- [ ] **Configurar Toaster em `AppProviders.tsx`:**
  - Posicionamento `bottom-right` com suporte a modo escuro.
- [ ] **Instrumentar Tratamento de Erros:**
  - Substituir blocos `catch (e) {}` vazios por `toast.error('Mensagem explicativa ao usuário')`.

### Módulo 3: Decomposição do `BattleGrid3D.tsx`
- [ ] **Criar `lib/hooks/useBattleGridState.ts`:**
  - Mover lógicas de raycasting, seleção de token no grid, cálculo de posição `(x, z)` e colisão para o custom hook.
- [ ] **Criar Submódulos em `components/battle-3d/`:**
  - `BattleEnvironment.tsx`: Iluminação (directional light, ambient light, fog).
  - `BattleCameraControls.tsx`: Controles de câmera e limites de navegação.
  - `Token3DMesh.tsx`: Componente de renderização individual de cada miniatura 3D.
  - `WeatherEffects.tsx`: Efeitos climáticos (chuva, raios, névoa).
- [ ] **Refatorar `BattleGrid3D.tsx`:**
  - Converter em um container declarativo limpo integrando os submódulos extraídos.

### Módulo 4: Decomposição do `LiveCockpitStudio.tsx`
- [ ] **Criar Submódulos em `components/live-cockpit/`:**
  - `CockpitHeaderPanel.tsx`: Barra superior do estúdio.
  - `CombatTurnOrderPanel.tsx`: Gerenciador de turnos e combate em tempo real.
  - `QuickAudioWidget.tsx`: Widget compacto de áudio maestro.
  - `SceneProjectionSelector.tsx`: Carrossel de cenas e projeção do telão.
- [ ] **Refatorar `LiveCockpitStudio.tsx`:**
  - Montar a interface principal a partir dos 4 painéis modulares.

---

## 🔍 Plano de Verificação

### Testes Automatizados
- Executar `npm run build` para garantir ausência de erros de compilação do TypeScript após remoção do `any`.
- Executar `npm run test` (Vitest) para garantir que nenhuma regressão foi introduzida.

### Verificação Manual
1. **Grid de Combate 3D:**
   - Abrir o cockpit ao vivo, mover tokens 3D no grid e verificar posicionamento, névoa e câmera.
2. **Navegação no Cockpit do Mestre:**
   - Alternar entre modos Artwork, Map e Combat.
   - Disparar rolagens de dados e verificar sincronização.
3. **Simulação de Erros de Rede:**
   - Desconectar a internet temporariamente e tentar salvar uma entidade/cena para validar a exibição do Toast de erro visual.

---
