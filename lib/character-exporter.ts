import { CharacterSheet } from './types';

/**
 * Exporta a ficha do personagem em formato JSON para download
 */
export function exportCharacterToJson(sheet: CharacterSheet): void {
  const jsonString = JSON.stringify(sheet, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sheet.characterName.replace(/\s+/g, '_')}_Ficha_DND5e.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importa uma ficha a partir de um arquivo JSON selecionado pelo usuário
 */
export function importCharacterFromJson(file: File): Promise<CharacterSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as CharacterSheet;
        if (!parsed.characterName || !parsed.attributes) {
          throw new Error('Arquivo JSON inválido para Ficha de Personagem D&D 5e.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
    reader.readAsText(file);
  });
}

/**
 * Abre uma janela limpa e otimizada para impressão em PDF da ficha D&D 5e
 */
export function exportCharacterToPrintablePdf(sheet: CharacterSheet): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ficha de Personagem - ${sheet.characterName}</title>
      <style>
        body {
          font-family: 'Georgia', serif;
          background: #fff;
          color: #000;
          margin: 20px;
          line-height: 1.4;
        }
        h1, h2, h3 {
          margin: 0 0 10px 0;
          font-family: 'Cinzel', serif;
          text-transform: uppercase;
        }
        .header-box {
          border: 2px solid #000;
          padding: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .box {
          border: 1px solid #000;
          padding: 10px;
          border-radius: 4px;
        }
        .attr-box {
          text-align: center;
          border: 2px solid #000;
          padding: 8px;
          margin-bottom: 8px;
        }
        .attr-title {
          font-weight: bold;
          font-size: 12px;
        }
        .attr-score {
          font-size: 20px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          font-size: 12px;
          text-align: left;
        }
        th {
          background: #eee;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header-box">
        <div>
          <h1>${sheet.characterName}</h1>
          <p><strong>Raça:</strong> ${sheet.race} | <strong>Classe:</strong> ${sheet.className} Nível ${sheet.level}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Jogador:</strong> ${sheet.playerName || '-'}</p>
          <p><strong>Tendência:</strong> ${sheet.alignment}</p>
        </div>
      </div>

      <div class="grid-3">
        <div class="box">
          <h3>Atributos</h3>
          ${Object.entries(sheet.attributes)
            .map(
              ([key, attr]) => `
              <div class="attr-box">
                <div class="attr-title">${key.toUpperCase()}</div>
                <div class="attr-score">${attr.score} (${Math.floor((attr.score - 10) / 2) >= 0 ? '+' : ''}${Math.floor((attr.score - 10) / 2)})</div>
              </div>
            `,
            )
            .join('')}
        </div>

        <div class="box">
          <h3>Estatísticas de Combate</h3>
          <p><strong>Classe de Armadura (CA):</strong> ${sheet.armorClass}</p>
          <p><strong>Pontos de Vida (HP):</strong> ${sheet.currentHp} / ${sheet.maxHp}</p>
          <p><strong>Deslocamento:</strong> ${sheet.speed}</p>
          <p><strong>Dados de Vida:</strong> ${sheet.hitDiceTotal}</p>

          <h3>Ataques & Conjuração</h3>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Bônus</th>
                <th>Dano</th>
              </tr>
            </thead>
            <tbody>
              ${sheet.attacks
                .map(
                  (atk) => `
                <tr>
                  <td>${atk.name}</td>
                  <td>${atk.atkBonus}</td>
                  <td>${atk.damage}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="box">
          <h3>Características & História</h3>
          <p><strong>Tracos de Personalidade:</strong> ${sheet.personalityTraits || '-'}</p>
          <p><strong>Ideais:</strong> ${sheet.ideals || '-'}</p>
          <p><strong>Vínculos:</strong> ${sheet.bonds || '-'}</p>
          <p><strong>Defeitos:</strong> ${sheet.flaws || '-'}</p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
