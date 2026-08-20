# PLAN: Expansão do Modal de Criação de Campanha (Capa IA 16:9 & Assistente de Sinopse)

> **Objetivo:** Elevar o modal de criação de campanha (`CreateCampaignModal.tsx`) para o mesmo padrão visual, imersivo e modular do `WorldEntityModal`, com navegação por Abas/Etapas, gerador de capa panorâmica (16:9) via IA e assistente de escrita de sinopse integrado.

---

## 🏛️ Inspiração de Design & Padrão Visual (`WorldEntityModal`)

- **Navegação Modular por Abas**:
  1. 📜 **Aba 1: Detalhes & Sinopse:** Identificação da campanha, mundo base, tags/tom e assistente de IA com expansão de ideias e sinopse rica.
  2. 🎨 **Aba 2: Capa Panorâmica (16:9):** Geração de arte por IA (Imagen 3 / Gemini Nano Banana), presets de estilos visuais (Óleo, Concept Art, Dark Fantasy, etc.), suporte a URL direta e preview widescreen.
  3. ⚙️ **Aba 3: Configurações & Tom da Mesa:** Seleção de tom da aventura (Heroico, Sombrio, Investigativo, Sobrevivência) e diretrizes iniciais.

- **Identidade Visual:**
  - Tema Dark Fantasy com bordas âmbar (`border-amber-500/40`), sombras profundas, micro-animações, inputs estilizados com ícones e tooltips descritivos.

---

## 📋 Fases de Execução

### Fase 1: Atualização dos Modelos de Dados & Repositórios
- **Campos em `UserCampaign` (`lib/types.ts`):**
  - `coverImageUrl?: string` (URL do banner panorâmico 16:9 da campanha).
  - `themeTone?: string` (Tom narrativo da campanha).
- **Repositórios e Serviços:**
  - Atualizar `ICampaignRepository`, `LocalStorageCampaignRepository`, `SupabaseCampaignRepository`, `campaignService` e `CampaignContext` para persistir `coverImageUrl` e `themeTone`.

### Fase 2: Ajuste no Endpoint de Imagem IA (`/api/ai/image`)
- Suporte ao parâmetro `aspectRatio` dinâmico na requisição (`'16:9'` para banners de campanha e `'9:16'` / `'1:1'` para avatares).

### Fase 3: Rota / Serviço de Assistente de Sinopse com IA
- Rota/função para aprimoramento e geração de sinopses de campanha:
  - Entrada: Título, Mundo Base (Lore/Gênero) e Ideias/Tópicos do Mestre.
  - Saída: Sinopse polida, gancho de aventura (adventure hook) e introdução imersiva.

### Fase 4: Redesenho Completo de `CreateCampaignModal.tsx`
- Implementação da estrutura inspirada no `WorldEntityModal`:
  - Seletor de abas estilizado no topo com ícones (`BookOpen`, `ImageIcon`, `Sparkles`, `Sliders`).
  - Preview dinâmico da capa widescreen 16:9.
  - Botão com animação de brilho para chamar o assistente de IA para a sinopse.
  - Presets de arte (Ex: *Pintura a Óleo Renascentista*, *Dark Fantasy Épico*, *Concept Art Widescreen*, *Aquarela de Fantasia*).
  - Navegação entre passos (Próximo / Voltar / Concluir) ou acesso direto por abas.

---

## 🔍 Critérios de Verificação & Testes
- [ ] Criação de campanha offline (LocalStorage) persistindo capa 16:9 e tom.
- [ ] Criação de campanha com Supabase configurado persistindo `coverImageUrl`.
- [ ] Geração de sinopse com IA funcionando com feedback visual de carregamento.
- [ ] Geração de arte de capa 16:9 e exibição correta no preview.
- [ ] Execução dos testes automatizados de campanhas (`npm test lib/__tests__/campaign-services.test.ts`).
