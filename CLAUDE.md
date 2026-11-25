@AGENTS.md

# X-Ring

App Android pessoal e offline de treino de tiro com arco recurvo (30 lb), com competição local.
Briefing completo, decisões e ordem de desenvolvimento: `docs/briefing.md`.

## Comandos

```bash
npx expo start          # dev server; abrir no celular pelo Expo Go
npm test                # Jest (funções puras em src/domain)
npm run typecheck
npx expo lint
npm run db:generate     # gera migration após mudar src/db/schema.ts
npx eas-cli@latest build -p android --profile preview   # APK para instalar direto
```

## Estrutura

- `src/domain/` — lógica pura, sem Expo/React (pontuação, alvos, análise de grupo, ranking). Reaproveitável no back-end futuro. É onde ficam os testes.
- `src/db/` — schema Drizzle, cliente expo-sqlite, seed idempotente. O banco é aberto de forma assíncrona uma vez (`openDb`, obrigatório na web) e chega às telas por `useDb()`; não criar instância global síncrona.
- `drizzle/` — migrations geradas; nunca editar à mão.
- `src/app/` — telas (expo-router).

## Regras do modelo (decididas — não mudar sem conversar)

- Flecha guardada em mm a partir do centro do spot em que caiu; **pontuação sempre calculada**, nunca guardada.
- Miss: `is_miss = true`, `x_mm`/`y_mm` nulos; vale M (0) e fica fora da análise de grupo.
- Regra da linha: pontua pela borda da haste mais próxima do centro (`distância − diâmetro/2`). Diâmetro da haste é snapshot em `participants.arrow_diameter_mm`.
- X = anel com `isX: true` na definição do alvo (10 interno, metade do raio do 10).
- Alvos são dados (`target_faces`), seed por `builtin_key`; o id de um alvo padrão nunca muda.
- Todas as tabelas: UUID gerado no cliente, `created_at`, `updated_at`, `deleted_at` (exclusão lógica). Consultas filtram `deleted_at IS NULL`.
- Treino = sessão com 1 participante; competição = mesma sessão com N. `count_for_stats` desligado por padrão em competição.
- `final_rank`/`final_score` congelados ao encerrar a competição.
- `src/domain` não importa Expo: o gerador de UUID é injetado em `src/db/client.ts`.
- Lupa do alvo: ativa enquanto o dedo arrasta, confirma ao soltar.
