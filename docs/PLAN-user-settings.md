# Configurações de Usuário e Modelos de IA

Este documento descreve o plano para implementar o dropdown de usuário e a configuração de modelos de IA.

## Visão Geral
Transformar o botão de usuário no Header (avatar + nome) em um menu dropdown. O menu terá opções para sair da conta e acessar configurações. A tela de configurações permitirá que o usuário gerencie chaves de API e selecione quais modelos de IA deseja usar para texto e imagem.

## Tipo de Projeto
WEB

## Critérios de Sucesso
- Dropdown abre ao clicar no avatar do usuário.
- Opção "Sair" desloga o usuário usando `signOut`.
- Opção "Configurações" abre o modal `UserSettingsModal`.
- Modal permite salvar:
  - Chave da API OpenRouter
  - Chave da API Gemini
  - Modelo de Texto Preferido
  - Modelo de Imagem Preferido (nano banana 2 ou imagen 3)
- Configurações são salvas de forma segura no `localStorage`.

## Estrutura de Arquivos
- `components/Header.tsx` (modificado)
- `components/UserSettingsModal.tsx` (novo)
- `lib/hooks/useUserSettings.ts` (novo)

## Detalhamento de Tarefas

### Tarefa 1: Criar hook `useUserSettings`
- **Agente**: `frontend-specialist`
- **Habilidades**: `react-best-practices`
- **INPUT**: Estado inicial com valores do localStorage.
- **OUTPUT**: Hook que retorna e seta `openRouterKey`, `geminiKey`, `textModel`, `imageModel`.
- **VERIFY**: Hook consegue ler e gravar no localStorage com sucesso.

### Tarefa 2: Criar `UserSettingsModal`
- **Agente**: `frontend-specialist`
- **Habilidades**: `frontend-design`
- **INPUT**: Campos para preenchimento de chaves e dropdowns de modelos.
- **OUTPUT**: Modal funcional que usa o `useUserSettings` para persistir os dados.
- **VERIFY**: Campos renderizam corretamente e os selects de imagem possuem "gemini-3.1-flash-lite-image" e "imagen 3".

### Tarefa 3: Atualizar o `Header.tsx`
- **Agente**: `frontend-specialist`
- **Habilidades**: `react-best-practices`
- **INPUT**: Header atual.
- **OUTPUT**: Header com o novo menu Dropdown (Sair, Configurações).
- **VERIFY**: Dropdown abre/fecha corretamente e os botões chamam as funções corretas.

## ✅ Fase X: Verificação Final
- [x] Lint: `npm run lint`
- [x] Checagem de tipagem: `npx tsc --noEmit`
- [x] UX/Design: Verificar se o Modal está usando o mesmo estilo visual de outros modais do projeto.
