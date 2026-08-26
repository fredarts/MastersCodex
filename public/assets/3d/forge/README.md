# 🏰 Masters Codex - 3D Forge Custom Assets & Overrides

Coloque seus modelos 3D customizados (`.glb` ou `.gltf`) nesta pasta para substituir automaticamente os blocos e objetos procedurais da **Forja de Cenários 3D**!

---

## 🚀 Como Funciona:
1. Exporte ou baixe seu modelo 3D no formato **`.glb`** (formato padrão binário da web, com texturas embutidas).
2. Salve o arquivo dentro desta pasta (`public/assets/3d/forge/`) com o **nome exato do tipo de asset**.
3. O Masters Codex detectará o arquivo automaticamente e carregará o seu modelo 3D em tempo real.
4. Caso o arquivo não exista nesta pasta, o sistema utilizará a **malha procedural padrão como fallback**.

---

## 📋 Tabela de Nomes de Arquivos Suportados:

### 🧱 Estruturas & Exteriores
| Nome do Arquivo | Tipo do Asset | Descrição |
| :--- | :--- | :--- |
| `wall_stone.glb` | Parede de Pedra | Parede de alvenaria |
| `wall_wood.glb` | Parede de Madeira | Parede de toras/tábuas |
| `half_wall.glb` | Mureta / Barricada | Mureta baixa (half cover) |
| `fence_wood.glb` | Cerca de Madeira | Cerca rústica |
| `well_stone.glb` | Poço de Água | Poço com balde e telhado |
| `pillar_round.glb` | Pilar Redondo | Coluna clássica |
| `pillar_square.glb` | Coluna Quadrada | Pilar de blocos de pedra |
| `pillar_broken.glb` | Pilar em Ruínas | Coluna quebrada |
| `stairs.glb` | Escadaria | Escadas de 5ft |
| `tree_pine.glb` | Pinheiro | Árvore de floresta |
| `rock_boulder.glb` | Pedregulho | Rocha de caverna |
| `tent_camp.glb` | Tenda | Tenda de acampamento |

### 🚪 Portas & Portais
| Nome do Arquivo | Tipo do Asset | Descrição |
| :--- | :--- | :--- |
| `door_wood.glb` | Porta de Madeira | Porta simples |
| `door_double_wood.glb` | Portão Duplo | Portão grande de carvalho |
| `door_stone.glb` | Porta de Pedra | Porta de cripta/tumba |
| `door_arch.glb` | Porta em Arco | Porta gótica em arco |
| `archway_stone.glb` | Arco de Pedra Aberto | Passagem aberta de pedra |
| `portcullis_iron.glb` | Rastrilho de Ferro | Grade levadiça |
| `jail_bars.glb` | Grade de Cela | Barras de prisão |

### 🔥 Iluminação & Cristais
| Nome do Arquivo | Tipo do Asset | Descrição |
| :--- | :--- | :--- |
| `torch_wall.glb` | Tocha de Parede | Arandela com tocha |
| `torch_standing.glb` | Tocha de Chão | Tocha em pedestal de ferro |
| `campfire.glb` | Fogueira | Fogueira ardente de acampamento |
| `brazier.glb` | Braseiro | Braseiro imperial de ferro |
| `candle.glb` | Vela | Vela individual |
| `candelabra.glb` | Castiçal | Castiçal de 3 velas |
| `oil_lamp.glb` | Candeeiro de Óleo | Lamparina de óleo |
| `lantern_medieval.glb` | Lanterna Medieval | Lanterna de ferro |
| `crystal_pylon.glb` | Cristal Arcano | Pilão com cristal flutuante |

### 📦 Props, Mobiliário & Masmorras
| Nome do Arquivo | Tipo do Asset | Descrição |
| :--- | :--- | :--- |
| `chest.glb` | Baú de Madeira | Baú de tesouro |
| `barrel.glb` | Barril | Barril de carvalho |
| `barrel_stack.glb` | Pilha de Barris | Pirâmide de barris |
| `crate_stack.glb` | Pilha de Caixotes | Caixas de carga empilhadas |
| `table_wood.glb` | Mesa de Taverna | Mesa de madeira |
| `chair_wood.glb` | Cadeira / Banco | Cadeira de taverna |
| `bed_medieval.glb` | Cama Medieval | Cama com cobertor |
| `tavern_bar.glb` | Balcão de Taverna | Balcão de bar |
| `throne_stone.glb` | Trono do Rei | Trono real de pedra |
| `altar_stone.glb` | Altar Ritualístico | Altar de templo |
| `sarcophagus.glb` | Sarcófago | Sarcófago de cripta |
| `statue_knight.glb` | Estátua do Guardião | Estátua de cavaleiro |
| `bookshelf.glb` | Estante de Grimórios | Estante com livros |
| `cauldron.glb` | Caldeirão Mágico | Caldeirão com poção |
| `weapon_rack.glb` | Suporte de Armas | Suporte com espadas |
| `torture_rack.glb` | Mesa de Tortura | Potro medieval de madeira |
| `iron_maiden.glb` | Dama de Ferro | Sarcófago com espinhos |
| `gibbet_cage.glb` | Gaiola Suspensa | Gaiola de ferro com esqueleto |
| `guillotine.glb` | Guilhotina | Guilhotina de execução |
| `fountain_stone.glb` | Fonte de Pedra | Chafariz com água |
| `alchemy_workbench.glb` | Bancada Alquímica | Mesa com poções e retortas |
| `magic_portal.glb` | Portal Arcano | Portal dimensional |
| `treasure_pile.glb` | Pilha de Tesouro | Monte de ouro e gemas |

---

## 💡 Dicas de Otimização:
- **Origem (Pivot):** Coloque a base do modelo no ponto `Y = 0` (no nível do chão).
- **Escala:** O sistema normaliza automaticamente o tamanho do modelo para caber no grid (1 célula de 5ft = 2 unidades Three.js).
- **Texturas:** Prefira texturas embutidas no arquivo `.glb` compactado (glTF Binary) com resolução até 1024x1024 ou 2048x2048 para carregamento instantâneo.
