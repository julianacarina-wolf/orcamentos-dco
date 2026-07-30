# Simulador de Orçamentos PRODEPA

Aplicação web estática para elaboração de orçamentos, preparada para publicação no GitHub Pages.

## Atualizar a base de dados

1. Abra `planilhas/simulador-base.xlsx`.
2. Atualize as abas oficiais, principalmente `regiao`, `linkdados`, `servicos`, `clientes` e `pconfig`.
3. Salve a planilha mantendo o mesmo nome.
4. Envie a alteração para a branch `main` do GitHub.
5. O GitHub Actions converterá a planilha em `data.js` e `pricing.js` e publicará o site.

Exemplo para Salvaterra: na aba `regiao`, coluna **ULTIMA MILHA**, use `FIBRA, RÁDIO`.

## Testar localmente

```bash
pip install -r requirements.txt
python scripts/extract_workbook.py
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todo o conteúdo deste projeto para a branch `main`.
3. Em **Settings → Pages**, selecione **GitHub Actions** como origem.
4. Abra a aba **Actions** e execute `Atualizar base e publicar GitHub Pages` ou faça um novo commit.

O endereço será semelhante a `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Armazenamento atual

Nesta fase, os orçamentos continuam salvos no navegador (`localStorage`). Para uso compartilhado entre computadores, a próxima etapa será integrar uma API e banco de dados.
