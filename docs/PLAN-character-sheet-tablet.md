# Plano de Implementação Aprimorado: Ficha de Personagem Baldur's Gate 3 (Tablet 1138x712 - Zero Scroll)

Adaptação completa de todas as 8 telas da Ficha de Personagem para layout estilo CRPG (Baldur's Gate 3 / Pillars of Eternity), otimizada para tablets em modo paisagem (Samsung Galaxy Tab S4 1138x712, iPads e laptops), eliminando scroll vertical de página com arquitetura de sub-abas ergonômicas, flexbox rígido (`flex-1 min-h-0`) e seletor D20 unificado no HUD inferior.

---

## 🛠️ Correções e Aprimoramentos Identificados

1. **Flexbox Rígido no Lugar de `fixed bottom-0`**:
   - `QuickCombatBar` passa a ser um flex item `shrink-0` e `<main>` passa a ter `flex-1 min-h-0`, ocupando exatamente a altura disponível sem quebras ou rolagem artificial.
2. **Remoção de Alturas Fixas (`h-[500px]`, `h-[260px]`)**:
   - Evita corte de informações na tela de 712px de altura.
3. **Medalhões de Atributos BG3 (Grade 2x3)**:
   - Modificador central gigante (+3, +0, -1) com badge base, reduzindo a altura do bloco de atributos de 600px para apenas ~220px.
4. **Perícias em 2 Colunas de 9**:
   - Todas as 18 perícias e salvaguardas 100% visíveis simultaneamente sem scroll.
5. **Sub-Abas Estratégicas nas Telas Densas**:
   - Geral (Identidade vs Miniatura 3D/Standee), Habilidades (Recursos Rápidos vs Talentos), Equipamento (Mochila vs Carteira/Loja) e Biografia (Personalidade vs Retrato).
