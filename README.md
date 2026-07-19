# ⚔️ Masters Codex — The Campaign Forge Tool

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**Masters Codex** é uma suíte completa de ferramentas digitais projetada para transformar a experiência de **Mestres (DMs)** e **Jogadores** de RPG de mesa (TTRPG), focada no ecossistema D&D 5ª Edição. A plataforma une o poder de worldbuilding, gestão de sessões em tempo real, assistente IA para o mestre e uma experiência de **Ficha de Personagem Mobile-First Portrait** otimizada para smartphones.

---

## 🌟 Funcionalidades Atuais (Implementadas)

### 🧙‍♂️ 1. Área do Mestre (DM Studio)
- **Worldbuilding Studio**: Criação e gestão de mundos ricos com suporte a entidades categorizadas (NPCs, Facções, Locais, Religiões, Lore/História) e visualização de rede através do **LoreGraph** interativo.
- **Session Studio & Navigator**: Planejamento visual de sessões através de cenas compostas por descrições, notas secretas do mestre, gatilhos de áudio e encontros de combate.
- **Combat Tracker (Rastreador de Combate)**: Controle de ordem de iniciativa, pontos de vida (HP max/atual/temp), classe de armadura (CA) e gerenciamento de condições/status dos combatentes.
- **Audio Maestro (Gerenciador de Som)**: Sistema de trilhas sonoras atmosféricas e efeitos ambientais com controle de volume independentes e gatilhos de cena.
- **AI Co-Pilot (Assistente do Mestre)**: Assistente integrado alimentado por IA para geração instantânea de nomes de NPCs, reviravoltas de trama, descrições de salas e sugestões de encontros improvisados.
- **Compendium D&D 5e SRD**: Busca rápida e integrada por magias, itens mágicos e monstros da SRD oficial.
- **Campaign Settings & Feed**: Gerenciador de mesas com geração de código de convite, atribuição de papéis (DM / Jogador) e feed de novidades da campanha.

---

### 🛡️ 2. Área do Jogador (Player Suite)
- **Lobby do Jogador**: Interface limpa para navegação rápida entre campanhas ativas, histórico de mesas passadas e atalho para a central de fichas.
- **Gerenciador Multi-Fichas (Character Manager)**: Permite ao jogador criar, duplicar, editar e guardar múltiplas fichas de personagens para diferentes campanhas ou acervo pessoal.
- **Ficha de Personagem D&D 5e (Mobile-First Portrait)**:
  - **Layout Otimizado**: Design responsivo estilo aplicativo mobile com navegação por abas horizontais e menu gaveta estilo hambúrguer.
  - **Motor de Autocompletar e Cálculos Automatizados**: Ajuste automático de modificadores de atributos, bônus de proficiência, testes de resistência, classe de armadura, CD de magias e pontos de vida com base na Raça, Classe e Nível (1 ao 20).
  - **Aba de Atributos & Combate**: Visualização rápida de FOR, DES, CON, INT, SAB, CAR, gerenciador de PVs (Dano/Cura rápida), salvaguardas contra a morte e lista de ataques/armas.
  - **Aba de Perícias & Proficiências**: Toggles de 3 estados para as 18 perícias oficiais (Sem Proficiência / Proficiente / Especialização) e Percepção Passiva autocalculada.
  - **Aba de Magias (Spellbook)**: Rastreador de espaços de magia (Slots do Truque ao 9º Nível) com marcadores de magias preparadas e bônus de ataque/salvaguarda.
  - **Equipamentos & Pouch de Moedas**: Gestão de cobre, prata, electro, ouro e platina, além de lista de inventário e tesouros.
  - **Roleplay & Lore**: Registro de histórico, traços de personalidade, ideais, vínculos, defeitos, aparência e organizações aliadas.
  - **Quick Combat Bar Sticky & Rolador d20**: Barra fixa inferior para ações rápidas de combate mobile com rolador de dados d20 embutido.

---

### ☁️ 3. Arquitetura & Infraestrutura
- **Supabase Cloud Sync & LocalStorage Fallback**: Sincronização automática com banco PostgreSQL no Supabase, com suporte a fallback gracioso no `localStorage` do navegador para funcionamento offline ou sem banco configurado.
- **Segurança RLS (Row Level Security)**: Scripts PostgreSQL dinâmicos protegendo tabelas contra acessos não autorizados e evitando recursões no PostgREST.

---

## 🚀 Próximas Funcionalidades (Roadmap / A Implementar)

| Status | Funcionalidade | Descrição |
| :---: | :--- | :--- |
| ⏳ | **VTT Battlemap com Fog of War** | Tabuleiro tático visual com suporte a grid, movimentação de tokens e névoa de guerra interativa para o mestre. |
| ⏳ | **Sincronização Live WebSockets** | Atualizações em tempo real entre o Mestre e os Jogadores (rolagens de dados visíveis na mesa, alteração de HP e troca de turno). |
| ⏳ | **Exportação & Importação em PDF** | Capacidade de exportar a ficha de personagem preenchida diretamente para o PDF oficial de D&D 5e e importar arquivos salvos. |
| ⏳ | **Calculadora de Encontros (CR & XP)** | Ferramenta para o Mestre calcular automaticamente a dificuldade de encontros (Fácil, Médio, Difícil, Mortal) baseada no grupo de jogadores. |
| ⏳ | **Gerador de Conteúdo Homebrew** | Interface para criação e compartilhamento de raças, classes, magias e itens customizados fora da SRD. |
| ⏳ | **Sistema de Inventário Compartilhado & Loot** | Distribuição de moedas e itens encontrados em baús diretamente para os inventários dos jogadores. |
| ⏳ | **Integração com Áudio Avançado & Efeitos** | Sintetizador de áudio e biblioteca estendida de efeitos sonoros (espadas, trovões, magias) vinculados ao rastreador de combate. |

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Estilização**: [React 19](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados & Autenticação**: [Supabase](https://supabase.com/) (PostgreSQL & PostgREST API)

---

## ⚡ Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior
- **npm**, **pnpm** ou **yarn**

### 1. Clonar o repositório
```bash
git clone git@github.com:fredarts/MastersCodex.git
cd MastersCodex
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto contendo as chaves do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica-do-supabase
```

### 4. Configurar o Banco de Dados no Supabase
1. Abra o painel do seu projeto no Supabase Dashboard.
2. Acesse o **SQL Editor**.
3. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/supabase/schema.sql) do repositório e execute no editor.

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra o navegador em `http://localhost:3000` para explorar o aplicativo.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

<p center="align">
  Desenvolvido com ⚔️ e ❤️ para a comunidade de RPG de Mesa!
</p>
