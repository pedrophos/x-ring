# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

- **Principal:** arqueiro de recurvo (arco de 30 lb) que treina sozinho, sem instrutor na região, com 1h a 2h por semana e orçamento quase zero. Usa o app na linha de tiro, entre as séries, com o celular na mão.
- **Convidados:** amigos e família que aparecem para atirar junto; entram só pelo nome ou apelido, sem conta, no modo competição.
- **Futuro aberto:** hoje é uso pessoal (APK instalado direto, sem loja), mas pode crescer para outros arqueiros. Não assumir que só existe um usuário nas decisões de produto.

## Product Purpose

Registrar cada flecha num alvo na tela e transformar isso em leitura útil: onde o grupo caiu (ajuste de mira ou causa técnica provável), como a média e a consistência evoluem, e se houve buraco de semanas sem treino. Substitui parte do olhar do instrutor. Sucesso é treinar sem buracos e ver a dispersão diminuir.

## Positioning

Leitura do grupo em mm a partir do toque com lupa (pontuação sempre calculada, nunca guardada), foco técnico semanal guiado por vídeo e competição local com handicap: um caderno de treino de quem aprende sozinho, não um placar de clube.

## Operating Context

- Indoor (18 m, alvo de 40 cm) e ao ar livre (30 m ou mais, às vezes no sol), alternando conforme a semana.
- Totalmente offline na linha de tiro; os dados ficam no aparelho (SQLite), com backup em JSON.
- Ritual: série de até 6 flechas → toca cada flecha no alvo → salva → lê o grupo → busca as flechas.
- Plano semanal que zera toda segunda: sessão técnica, sessão de pontuação, treino físico de 5 min.

## Capabilities and Constraints

- Funcionalidades: registro no alvo com lupa, leitura do grupo, resumo da sessão, faixa de semanas, foco técnico, plano semanal, competição com N atiradores, histórico, evolução, exportar JSON.
- Alvos são dados (WA 40, triplo vertical 40, WA 80, WA 122, livre); as cores dos anéis seguem a World Archery e não mudam com o tema.
- React Native + Expo, só Android; sem servidor no MVP. Modos claro, escuro e sistema.
- Terminologia: série (end), flecha, X, M (fora), dispersão, handicap, retrospecto.

## Brand Commitments

- Nome: **X-Ring** (o anel central do alvo).
- Personalidade escolhida pelo usuário: artesanal e tradicional, com clima "tolkeniano" **só no visual** (tipografia, ornamento, cor). Os textos continuam diretos e técnicos, sem linguagem temática.
- Manter a base de cor atual: verde escuro + dourado.
- Tipografia clássica.
- Ícone e splash: ainda indefinidos (o usuário vai pensar).

## Evidence on Hand

- Briefing: `docs/briefing.md`.
- Não há logo, ícone, fotos ou depoimentos; o ícone e o splash atuais são do template do Expo e não fazem parte da identidade.

## Product Principles

1. A leitura técnica vem antes do enfeite: em nenhuma tela o ornamento pode competir com o alvo, os números ou a leitura do grupo.
2. Usável na linha de tiro: legível no sol e no indoor, toques grandes, uma mão.
3. Constância acima de volume: o app celebra não deixar buraco, não acumular flechas.
4. Os dados são do arqueiro: offline, exportáveis, nada escondido.

## Accessibility & Inclusion

- Contraste AA no mínimo nos dois temas (uso no sol); toque mínimo de 48 dp.
- Identidade nunca só por cor (zonas do alvo também têm rótulo numérico).
