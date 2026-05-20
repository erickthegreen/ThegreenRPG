# Danubia Online

Esta versao prepara a mesa para uso online com duas visoes:

- Mestre: edita mapa, cidade, masmorras, mesa, tokens, iniciativa e todas as fichas.
- Jogador: ve apenas as abas liberadas pelo mestre e edita somente a propria ficha.

## Rodar localmente

Na pasta `Danubia`:

```powershell
npm start
```

O servidor imprime no terminal:

- link do mestre
- links dos jogadores 1 a 5

Exemplo:

```text
Danubia online em http://127.0.0.1:8767/mesa-danubia.html?role=gm&room=danubia&key=...#mesa
Jogador 1: http://127.0.0.1:8767/mesa-danubia.html?role=player&room=danubia&slot=1&key=...#mesa
```

## Permissoes

Na aba `Mesa`, o mestre usa `Abas dos Jogadores` para escolher o que os jogadores podem abrir:

- Mapa
- Cidade
- Masmorras
- Mesa

A aba `Mesa` fica sempre disponivel para manter a ficha e o combate acessiveis.

## Publicar

O app agora tem um servidor Node simples (`server.js`) e pode ser publicado em hospedagens que mantenham processo Node e armazenamento em disco persistente.

Boas opcoes:

- Render Web Service
- Railway
- Fly.io
- VPS propria

Vercel nao e a melhor opcao para esta versao porque o servidor usa eventos em tempo real e salva a sala em arquivo local persistente.

## Dados

As salas ficam em:

```text
.danubia-data/
```

Guarde essa pasta se quiser backup da campanha.
