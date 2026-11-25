# X-Ring

App Android pessoal e offline para treinar tiro com arco recurvo, com competição local entre amigos. Registra onde cada flecha entrou no alvo, lê o agrupamento como um instrutor faria e mostra a evolução ao longo das semanas.

Feito para quem treina sozinho, com pouco tempo (1 a 2 horas por semana) e sem instrutor por perto: o app aponta o ajuste de mira, as causas técnicas prováveis e o que filmar para se autoanalisar.

## O que o app faz

- **Registro no alvo.** Toque onde a flecha entrou; uma lupa acompanha o dedo para o ajuste fino e a flecha é confirmada ao soltar. Alvos WA de 40, 80 e 122 cm e o triplo vertical. Pontuação pela regra da linha (a haste que toca a linha conta o anel de dentro).
- **Leitura do grupo.** A partir de 3 flechas: grupo fechado fora do centro vira ajuste de mira ("mova a mira para cima e à direita"); espalhado na vertical ou na horizontal vira lista de causas técnicas prováveis. Por série e pelo dia todo.
- **Resumo da sessão.** Todas as flechas do dia sobrepostas, total, média por flecha, 10 e X, dispersão em mm e primeira contra última série, que denuncia cansaço.
- **Evolução.** Média por flecha e dispersão por distância ao longo do tempo e o bastão das semanas com treino, para não deixar os intervalos crescerem.
- **Semana.** Plano que zera toda segunda (sessão técnica, sessão de pontuação, 5 minutos de treino físico) e um foco técnico por vez, com onde pôr o celular para filmar e o que procurar no vídeo.
- **Competição local.** Vários atiradores na mesma sessão, ordem de vez, placar por série, desempate por 10 e depois por X, handicap por distância, por alvo ou por pontos e retrospecto entre atiradores.
- **Compartilhar no story.** Imagem 1080 × 1920 com o alvo e os números do treino, ou o pódio da competição.
- **Backup.** Exporta todos os dados em JSON.
- **Modo claro, escuro ou do sistema.**

Tudo fica no aparelho (SQLite). Não há conta, servidor nem internet envolvidos; sincronização é uma fase futura.

## Identidade

"Os alvos da vila": tiro tradicional, artesanal. Barra de topo verde-gramado, ação principal cor de palha, títulos em IM Fell English e o bastão de carvalho com entalhes como assinatura (contagem de séries, semanas treinadas e o seletor de distância). Números sempre na fonte do sistema, para ler rápido na linha de tiro. O alvo usa as cores oficiais da World Archery nos dois modos.

## Rodando

Requisitos: Node 20+ e o app **Expo Go** no celular Android.

```bash
npm install
npx expo start      # escaneie o QR code com o Expo Go
```

Celular e computador na mesma rede. A web não é alvo do projeto (o SQLite síncrono não roda no navegador servido pelo Expo).

## Gerando o APK

Compilado na nuvem pelo EAS, sem Android Studio:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

No fim aparece um link para baixar o APK no celular. Ícone e splash só aparecem no APK (o Expo Go mostra o próprio ícone). Os dados do Expo Go e do APK são separados.

Mudanças só de código e texto chegam ao APK instalado sem recompilar, pelo EAS Update:

```bash
npm run update -- --message "o que mudou"
```

O app baixa a atualização ao abrir e passa a usá-la na abertura seguinte. Biblioteca nativa nova, ícone ou splash pedem um APK novo.

## Desenvolvimento

```bash
npm test                 # Jest: pontuação, geometria, leitura do grupo, ranking, semanas
npm run typecheck
npx expo lint
npm run db:generate      # gera migration depois de mudar src/db/schema.ts
node scripts/build-icons.js   # regenera ícones e splash a partir de assets/source
```

| Pasta | O que tem |
| --- | --- |
| `src/domain/` | Lógica pura, sem Expo nem React: pontuação, alvos, geometria, leitura do grupo, ranking, semanas. É onde ficam os testes. |
| `src/db/` | Schema Drizzle, cliente expo-sqlite, seed dos alvos e o repositório com todas as leituras e escritas. |
| `src/ui/` | Tema, componentes base, o alvo com lupa, gráficos, bastão de contagem, seletor de distância, cartões de compartilhar. |
| `src/app/` | Telas (expo-router). |
| `drizzle/` | Migrations geradas. |
| `docs/` | Briefing do projeto e prompts dos assets. |

**Stack:** Expo SDK 58 (React Native 0.88, React 19), TypeScript, expo-router, expo-sqlite com Drizzle ORM, react-native-svg.

Decisões de modelo e convenções de código estão em [`CLAUDE.md`](CLAUDE.md); o briefing completo, com a ordem de construção e as fases futuras, em [`docs/briefing.md`](docs/briefing.md).
