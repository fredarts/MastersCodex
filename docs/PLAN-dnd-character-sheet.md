# PLAN: Ficha de Personagem D&D 5e Inteligente (Mobile Portrait-First)

## Resumo do Projeto
Adicionar a funcionalidade completa de criação e edição da **Ficha de Personagem oficial de D&D 5e (3 Páginas)** na área do jogador (`PlayerLobby`). A interface será desenhada com foco total em **Mobile Portrait Mode**, com menu sanduíche/drawer de abas, barra rápida inferior para combate e um motor de inteligência que autocompleta e calcula atributos, modificadores, testes, perícias e magias de acordo com Raça, Classe e Nível.

---

## 📐 Diretrizes de Design UI/UX (UI/UX Pro Max)
- **Modo Retrato Mobile-First**: Otimizado para telas de 375px a 430px de largura sem rolagem horizontal acidental.
- **Navegação Sanduíche / Drawer**: Menu retrátil intuitivo com ícones para navegar entre as 6 áreas da ficha:
  1. 👤 **Geral & Identidade** (Nome, Raça, Classe, Nível, Antecedente, Tendência, Foto, XP, Inspiração)
  2. ⚔️ **Atributos & Combate** (FOR, DES, CON, INT, SAB, CAR, CA, HP, Inic, Desloc, Ataques)
  3. 🎯 **Perícias & Testes** (Testes de Resistência, 18 Perícias, Sabedoria Passiva, Idiomas)
  4. 🎒 **Equipamentos & Moedas** (Armas, Armaduras, Inventário, PO/PP/PC/PL/PE)
  5. ✨ **Conjuração & Magias** (CD do TR, Bônus de Ataque, Espaços Lvl 0-9, Magias Preparadas)
  6. 📜 **História & RP** (Aparência, Personalidade, Ideais, Ligações, Defeitos, História, Aliados)
- **Quick Combat Bar (Rodapé Fixo)**: Botões táteis de ajuste rápido de HP (+1, -1, Cura, Dano), indicador de CA e Sabedoria Passiva acessíveis de qualquer tela.

---

## ⚡ Motor de Autocompletar & Auto-Cálculo
- **Raça**: Preenche bônus de atributo, Deslocamento base (ex: 9m/30ft), visão no escuro e idiomas padrão.
- **Classe**: Preenche Dado de Vida (d6, d8, d10, d12), Habilidade Chave de Conjuração e Proficiências em Salvaguardas.
- **Nível**: Recalcula Bônus de Proficiência (+2 a +6), quantidade de dados de vida e tabela de slots de magia.
- **Atributos**: Recalcula instantaneamente Modificadores, Salvaguardas, 18 Perícias, Sabedoria Passiva, CA base, CD de Magia e Bônus de Ataque.

---

## 📋 Arquivos a Criar/Modificar

1. `lib/types.ts` (Modificar): Adicionar definições completas para `CharacterSheet` e sub-estruturas.
2. `lib/dnd5e-data.ts` (Novo): Dados de referência SRD (Raças, Classes, Perícias, Tabela de proficiência por nível).
3. `lib/dnd5e-calculator.ts` (Novo): Funções de cálculo de modificadores, perícias, CD de magia e autocompletar.
4. `components/character-sheet/CharacterSheetModal.tsx` (Novo): Componente principal da ficha com Menu Sanduíche/Abas.
5. `components/character-sheet/Sections/` (Novos):
   - `GeneralSection.tsx`
   - `CombatSection.tsx`
   - `SkillsSection.tsx`
   - `EquipmentSection.tsx`
   - `SpellsSection.tsx`
   - `RPSection.tsx`
6. `components/PlayerLobby.tsx` (Modificar): Adicionar acionamento do criador/editor de ficha.

---

## 🎯 Próximos Passos
- Revisar o plano com o usuário.
- Executar a implementação ao receber o sinal verde.
