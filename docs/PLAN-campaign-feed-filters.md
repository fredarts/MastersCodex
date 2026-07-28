# Plano de Implementação: Filtros do Feed da Campanha

Este plano detalha a refatoração da aba "Feed Cronológico" no `CampaignSettingsStudio`, transformando a atual barra de filtros horizontal do topo em um menu sanduíche colapsável na lateral esquerda.

## ✅ Socratic Gate (Resolvido)

1. **Localização**: Dentro do conteúdo do Feed (segunda barra lateral).
2. **Botão "+ Adicionar ao Feed"**: Mover para dentro do novo menu de filtros na esquerda.
3. **Comportamento Mobile**: Empurrar o conteúdo do feed.

## 📋 Divisão de Tarefas

### Fase 1: Atualização do Layout da Aba "Feed"
- [ ] Modificar o layout do conteúdo do Feed em `CampaignSettingsStudio.tsx` para usar um layout `flex flex-row`.
- [ ] Criar o estado local para o controle de colapso dessa nova sidebar (ex: `isFilterSidebarCollapsed`).
- [ ] Mover os botões de filtro (`Todos`, `Batalhas`, `NPCs`, etc.) da barra horizontal superior para esta nova estrutura lateral.

### Fase 2: Componentização e Estilização
- [ ] Implementar o ícone de menu sanduíche para abrir/fechar os filtros.
- [ ] Estilizar os botões de filtro com o design da aplicação (cores âmbar/ciano/rubi dependendo do tipo de evento), garantindo que ocupem a largura total do menu quando expandido e mostrem apenas os ícones quando colapsado (ou sumam dependendo da sua preferência de UI).
- [ ] Reposicionar o botão `+ Adicionar ao Feed` conforme definido na questão 2 acima.

### Fase 3: Responsividade
- [ ] Ajustar o CSS (`md:w-64`, etc.) para garantir que o menu lateral funcione bem em resoluções de desktop e seja tratado de forma elegante em telas mobile.

## 👥 Agentes Atribuídos
- **@project-planner**: Elaboração deste plano (Fase 0).
- **@frontend-specialist**: Execução das Fases 1, 2 e 3 (focando em React e classes do Tailwind v4 para manter os tokens estéticos premium).

## ✅ Critérios de Verificação (Verification Checklist)
- O menu principal ("Menu Painel") não deve ser quebrado pela nova mudança.
- Clicar nos filtros deve continuar funcionando e alterando a lista de eventos cronológicos corretamente.
- A alternância entre aberto e colapsado deve ser suave (com animação).
- O layout não deve quebrar em larguras menores.

---
**Status**: Aguardando respostas do usuário (Socratic Gate).
