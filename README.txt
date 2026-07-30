SIMULADOR DE ORÇAMENTOS WEB — PRODEPA

1. Abra o arquivo index.html em um navegador moderno.
2. Escolha a metodologia:
   - Link Dados (oficial): permite selecionar as tabelas de 2021 a 2026.
   - Região de Integração (teste): usa preço unificado regional de junho/2026.
3. Para Link de Dados, informe município, tecnologia e banda em Mbps.

Os valores históricos de 2021 a 2025 são reconstituídos a partir da tabela Link Dados 2026 e dos reajustes anuais registrados na aba pconfig da planilha:
2022: 17,79%; 2023: 6,72%; 2024: 1,59%; 2025: 6,54%; 2026: 3,28%.

O sistema funciona localmente e salva o orçamento no armazenamento do navegador.

CORREÇÃO DO CÁLCULO DE LINK DE DADOS
A metodologia oficial agora reproduz a fórmula da planilha:
Preço 2021 = (UnitTransFinal x Mbps x fator de desconto da faixa) + Cmanutfinal.
Para os anos de 2022 a 2026, os reajustes anuais são aplicados cumulativamente.


Correção de fatores de desconto:
- Faixas reproduzidas de pconfig!A11:C21.
- O fator incide apenas sobre o componente de transporte.
- A manutenção é somada após o desconto.
- Os reajustes anuais incidem cumulativamente sobre o total resultante.
