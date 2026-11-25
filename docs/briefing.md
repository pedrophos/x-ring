# X-Ring — app de treino de tiro com arco

Nov 24, 2026 · @Pedro

X-Ring é um app Android pessoal e offline para treino de tiro com arco recurvo, com competição local entre amigos. Este documento é o briefing para começar o desenvolvimento: decisões tomadas, modelo de dados e ordem de construção.

## Visão geral

Um app Android pessoal, offline, para registrar cada flecha num alvo na tela e acompanhar a evolução no tiro com arco recurvo (arco de 30 lb).

O problema que ele resolve tem três partes:

- **Treino sozinho, sem instrutor na região.** Sem alguém olhando, erros de técnica se repetem até virar hábito. O app substitui parte desse olhar lendo o padrão dos grupos e guiando a autoanálise por vídeo.
- **Longos intervalos sem praticar.** O app mostra as semanas com e sem treino, e o objetivo é não deixar buraco, não acumular volume.
- **Pouco tempo e orçamento.** O plano cabe em 1h a 2h por semana, quase sem gastar.

Também precisa ser divertido quando aparece alguém para atirar junto, daí o modo competição local.

## Mockups

Três telas cobrem o MVP: registrar a série no alvo, acompanhar a evolução e competir com convidados.

&#91;embedded content: Mockup das três telas principais · ilustrativo\]

No registro, a lupa amplia o ponto tocado para o ajuste fino; abaixo do alvo ficam as flechas da série e a leitura do grupo. Na competição, chips mostram quem está atirando, o placar é um ranking por atirador (com handicap) e o histórico guarda as competições passadas.

## Funcionalidades do MVP

O MVP é tudo local: registrar flechas, ler o grupo e ver a evolução, sozinho ou com convidados.

| Funcionalidade | O que faz | Por que importa |
| --- | --- | --- |
| Registro no alvo | Toque onde a flecha entrou; lupa ampliada para ajustar antes de confirmar; até 6 flechas por série | O dedo cobre o ponto; sem ajuste fino a dispersão fica ruidosa |
| Leitura do grupo | A partir de 3 flechas: grupo fechado fora do centro = ajuste de mira; espalhado na vertical ou horizontal = causas técnicas prováveis | É o mais perto de um instrutor olhando o alvo |
| Resumo da sessão | Todas as flechas do dia sobrepostas, média por flecha, primeira vs. última série | Mostra cansaço e se 30 lb está pesado para o momento |
| Semanas com treino | Faixa das últimas semanas, marcada quando houve treino | Ataca os longos intervalos |
| Foco técnico da semana | Um elemento por vez (postura, empunhadura, gancho, puxada, ancoragem, soltura, follow-through), com onde pôr o celular para filmar e o que procurar | Autoanálise por vídeo no lugar do instrutor |
| Plano semanal | Sessão técnica, sessão de pontuação e treino físico de 5 min, zerando toda segunda | Cabe em 1h a 2h por semana |
| Competição local | Vários atiradores na mesma sessão, uma aba por pessoa, placar por série e total, desempate por número de 10s, handicap por distância, alvo ou pontos | Divertido com amigos e família; iniciante não perde feio |
| Histórico e evolução | Média por flecha e dispersão em mm por distância ao longo do tempo | A dispersão mede consistência mesmo com a mira desajustada |

Sessões de competição têm uma opção "contar para minhas estatísticas", desligada por padrão, para não misturar treino com tiro sob pressão.

## Competição

Uma competição aceita qualquer número de atiradores e fica salva com o mesmo modelo de uma sessão de treino.

- **Atiradores com nome ou apelido.** Ao montar a competição, escolhe-se de uma lista de quem já atirou (mais recentes primeiro) ou cria-se alguém novo só com o nome. O mesmo amigo mantém o histórico entre visitas.
- **Vez de quem.** Uma fileira de chips com rolagem horizontal, com o atirador da vez destacado. Ao salvar a série de um, o app passa para o próximo.
- **Placar em ranking.** Uma linha por atirador: posição, nome, total, handicap e final, ordenado. Colunas por pessoa não cabem com 4 ou 5 atiradores.
- **Regras.** Número fixo de séries (5 ou 6), desempate pelo número de 10s, handicap por distância, por alvo maior ou por pontos por série.
- **Histórico.** Lista de competições passadas com data, participantes, vencedor e placar; o detalhe abre série a série.
- **Retrospecto.** Confronto por pessoa (ex.: você 4 x 1 Fulano) e recorde de cada atirador, calculados a partir dos dados já guardados.

Ao encerrar a competição, `final_rank` e `final_score` são gravados em `participants`, para que mudanças futuras na regra de handicap não alterem resultados antigos.

## Tipos de alvo

A flecha é guardada em milímetros a partir do centro do spot em que caiu; a pontuação é calculada a partir do tipo de alvo, nunca guardada.

Assim a análise de grupo funciona igual em qualquer alvo e sessões diferentes são comparáveis. O tipo de alvo é dado, não código: uma lista de anéis (raio em mm, valor, cor) e uma lista de centros.

| Alvo | Uso típico | Observação |
| --- | --- | --- |
| WA 40 cm, 10 anéis | 18 m indoor | O mais usado no início |
| Triplo vertical 40 cm | 18 m indoor, competição | Uma flecha por spot; na análise, os três spots se sobrepõem |
| WA 80 cm | 30 m e 50 m | Para quando houver espaço |
| WA 122 cm | 70 m outdoor | Distância olímpica do recurvo |
| Livre/caseiro | Prato de papel, alvo improvisado | Centro e anéis definidos pelo usuário |

As dimensões exatas de cada alvo devem ser conferidas nas regras da World Archery antes de virar seed do banco.

## Modelo de dados

O atirador existe desde o primeiro dia: treino é uma sessão com um participante, competição é a mesma sessão com vários.

Cadeia principal: `sessions` → `participants` → `ends` → `arrows`. Todas as tabelas usam UUID gerado no cliente (TEXT), `created_at`, `updated_at` e `deleted_at` (exclusão lógica), para que a sincronização futura seja quase só enviar o que é novo.

| Tabela | Campos principais | Notas |
| --- | --- | --- |
| `archers` | id, name, nickname, is\_me, last\_seen\_at | Convidados = nome ou apelido, sem conta; reaproveitados entre competições, ordenados por last\_seen\_at |
| `target_faces` | id, name, rings (JSON: raio em mm, valor, cor), centers (JSON: x, y em mm), is\_builtin | Alvos padrão vêm como seed; o livre é criado pelo usuário |
| `sessions` | id, date, mode (treino, competição), ends\_planned, arrows\_per\_end, count\_for\_stats, notes | count\_for\_stats desligado por padrão em competição |
| `participants` | id, session\_id, archer\_id, distance\_m, target\_face\_id, handicap\_points, final\_rank, final\_score | Distância e alvo por participante permitem handicap; final\_rank e final\_score congelam o resultado ao encerrar |
| `ends` | id, participant\_id, index, shot\_at | Uma série de até 6 flechas |
| `arrows` | id, end\_id, x\_mm, y\_mm, spot\_index | Pontuação calculada, não guardada; praticamente imutável |
| `weekly_plan` | id, week\_start, technical\_done, scoring\_done, spt\_days | Plano zera toda segunda |
| `technique_focus` | id, week\_start, element | Um elemento por semana |

No triplo, `spot_index` diz em qual dos três centros a flecha caiu, e x\_mm/y\_mm são relativos a esse centro.

## Stack

React Native com Expo, só Android, uso pessoal; o APK é instalado direto no celular, sem loja e sem custo.

| Peça | Escolha | Papel |
| --- | --- | --- |
| App | React Native + Expo | Evita configuração nativa manual |
| Banco | expo-sqlite | Fonte primária dos dados, funciona sem sinal na linha de tiro |
| ORM | Drizzle | Schema tipado em TypeScript e migrations; definições reaproveitáveis no back-end futuro |
| Alvo | react-native-svg | Desenha o alvo a partir da definição em mm e converte toque em mm |

iOS fica de fora: sem a conta paga de desenvolvedor da Apple, um app instalado direto deixa de abrir após cerca de 7 dias. Reavaliar se houver um iPhone no futuro.

## Decisões tomadas

| Tema | Decisão |
| --- | --- |
| Nome | X-Ring (o anel central do alvo) |
| Plataforma | Android, uso pessoal, APK instalado direto |
| Dados | Tudo local no MVP; servidor só numa fase futura |
| Coordenadas | Flechas em mm a partir do centro do spot; pontuação sempre calculada |
| Chaves | UUID gerado no cliente, com created\_at, updated\_at e deleted\_at em todas as tabelas |
| Atirador | Existe desde o primeiro dia; treino = sessão com 1 participante |
| Competição | N atiradores com nome ou apelido, ranking, handicap, histórico e retrospecto |
| Estatísticas | Competição não conta para as estatísticas de treino, salvo se marcado |
| Alvos móveis | Fora; no lugar, modos de treino (cronometrado, rounds, desafios) |

## Ordem de desenvolvimento

Cada etapa termina com algo usável na linha de tiro, para o app entrar em uso cedo.

1. **Base do projeto:** Expo com TypeScript, expo-sqlite e Drizzle; schema completo, migrations e seed dos alvos padrão.
2. **Componente do alvo:** desenhado com react-native-svg a partir da definição em mm; conversão de toque para mm; lupa de ajuste antes de confirmar; suporte ao triplo (spot\_index).
3. **Fluxo de treino:** criar sessão (distância e alvo), registrar séries de até 6 flechas, desfazer, pontuação calculada.
4. **Leitura do grupo:** deslocamento do centroide (ajuste de mira) e dispersão vertical vs. horizontal (técnica), por série e pelo dia todo; primeira vs. última série.
5. **Histórico e evolução:** lista por dia, média por flecha e dispersão em mm por distância ao longo do tempo, faixa de semanas com treino.
6. **Foco técnico e plano semanal:** elemento da semana com orientação de vídeo; plano que zera toda segunda.
7. **Competição:** cadastro rápido de atiradores, chips de vez, ranking com handicap e desempate, encerramento com final\_rank/final\_score, histórico e retrospecto.
8. **Exportar dados:** JSON com tudo, como backup antes de existir servidor.

Testes valem mais nas funções puras: pontuação por tipo de alvo, conversão toque→mm, análise de grupo e ranking com handicap.

## Fora do escopo agora

O MVP não tem servidor; as próximas fases só entram depois de o app local estar em uso.

1. **App local** (este documento): alvos, leitura do grupo, histórico, semanas, foco, competição.
2. **Back-end e sincronização:** API simples (SQLite num servidor pequeno basta), envio do que é novo por `updated_at`. Serve para backup e troca de aparelho.
3. **Dashboard compartilhável:** link só de leitura com a evolução, útil para um técnico remoto analisar à distância.

Alvos móveis ficam de fora: a análise de grupo perde sentido quando o alvo se mexe, e esse treino puxa para o tiro apressado, o oposto do que um arqueiro treinando sozinho precisa. No lugar, modos de treino: série cronometrada (2 min para 6 flechas), rounds oficiais (ex.: 60 flechas a 18 m) e desafios.

## Perguntas em aberto

- [ ] Modos de treino (cronometrado, rounds, desafios) entram no MVP ou na fase seguinte?
- [ ] Lupa de ajuste: aparece após o toque, ou o usuário arrasta o dedo com a lupa ativa desde o início?
- [ ] Leitura do grupo: limiares fixos (ex.: razão vertical/horizontal acima de 1,6) ou calibrados pelo histórico do próprio atirador?
- [ ] Exportar dados (JSON ou CSV) já no MVP, como backup antes do servidor?
- [ ] Guardar o link ou caminho do vídeo da semana junto ao foco técnico?
- [ ] Convidados frequentes também ganham tela de evolução, ou estatísticas só para o atirador principal?
