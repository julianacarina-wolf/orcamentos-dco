# Simulador de Orçamentos PRODEPA

Projeto estático modular preparado para GitHub Pages.

## Estrutura

- `index.html`: interface principal.
- `css/`: estilos de tela e impressão.
- `js/`: módulos separados de infraestrutura, cálculos, tabelas, armazenamento e interface.
- `dados/`: base gerada da planilha (`data.js` e `pricing.js`).
- `planilhas/`: planilha oficial e correções emergenciais.
- `scripts/`: conversor da planilha.
- `.github/workflows/`: atualização automática e publicação.

## Atualizar a base

1. Substitua `planilhas/simulador-base.xlsx`.
2. Faça o commit no GitHub.
3. O workflow converte a planilha, atualiza `dados/` e publica o site.

Para uma correção pontual de última milha, edite `planilhas/overrides.json`.

## Publicar

Em **Settings → Pages**, selecione **GitHub Actions**. Depois faça um commit ou execute manualmente o workflow na aba **Actions**.
