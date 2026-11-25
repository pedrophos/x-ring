# Prompts dos assets (ícone e splash)

Identidade "Os alvos da vila" (`.impeccable/surfaces/src-app.md`): gramado `#1F3D2B`, palha `#D9A62E`, carvalho `#6B4A2B` / `#2E1F12`, creme da barra `#F3EEDD`. Cor chapada, sem textura, sem gradiente, sem texto.

Gerar primeiro o **ícone principal (1)**; depois pedir os outros **a partir dele** ("use the same mark as the previous image"), para os quatro saírem iguais.

## Conceito da marca

O anel X visto de frente: um disco cor de palha (o centro do alvo) com dois anéis finos ao redor, e um **X entalhado** no meio como se cortado com faca em madeira. O X tem o mesmo entalhe em V do bastão de contagem do app. Lê como "alvo" e como "X" mesmo em 48 px.

## 1. Ícone principal — `assets/images/icon.png`

```
App icon for an archery training app called X-Ring. Square 1024x1024 PNG, full bleed, no transparency, no text, no letters other than the mark.

Flat vector style, solid colors only: no gradients, no textures, no shadows, no glow, no 3D, no paper or parchment effect.

Background: solid deep turf green #1F3D2B filling the whole square.

Centered mark, about 60% of the canvas: a round archery target seen straight on, simplified to a solid straw-gold disc #D9A62E with two thin concentric rings around it in cream #F3EEDD, evenly spaced. In the center of the gold disc, a bold "X" made of two crossing notches carved as if cut with a knife into wood: each stroke is a V-shaped notch, wider at the ends and narrowing toward the middle, filled with dark oak #2E1F12. Crisp geometric edges, slightly hand-cut character but symmetrical.

Mood: traditional, artisanal, medieval village archery, timeless. Must stay legible at 48x48 pixels. Do not add arrows, bows, runes, banners, swords or any symbols.
```

## 2. Ícone adaptativo do Android — frente — `assets/images/android-icon-foreground.png`

```
Same mark as the previous image (gold target disc, cream rings, carved dark-oak X), on a fully TRANSPARENT background. 1024x1024 PNG with alpha.

The whole mark must fit inside the central circle of 660 pixels diameter (Android adaptive icon safe zone); leave the outer area empty and transparent. No background color, no shadow, no text. Flat solid colors only.
```

## 3. Ícone adaptativo — monocromático — `assets/images/android-icon-monochrome.png`

```
Same mark as the previous image, as a single-color silhouette: pure white #FFFFFF shapes on a fully TRANSPARENT background, 1024x1024 PNG with alpha. The carved X must be cut out (transparent) from the white disc so it stays readable; the rings stay as thin white rings. Mark inside the central 660-pixel circle. No gray, no gradients, no text.
```

## 4. Splash — `assets/images/splash-icon.png`

```
Same mark as the previous image (gold target disc, cream rings, carved dark-oak X) on a fully TRANSPARENT background, 1024x1024 PNG with alpha, mark centered and filling about 70% of the canvas. It will be shown small and centered on a solid #1F3D2B green screen. No text, no shadow, flat solid colors only.
```

## Fundo do ícone adaptativo — `assets/images/android-icon-background.png`

Não precisa gerar: é só verde `#1F3D2B` chapado. O fundo vai como cor no `app.json` (`android.adaptiveIcon.backgroundColor`).

## Conferir antes de entregar

- Os 4 PNGs têm 1024×1024; os itens 2, 3 e 4 têm transparência de verdade, não um fundo xadrez desenhado.
- Nada de texto, letras extras, runas, setas ou arcos.
- No monocromático, o X aparece vazado.
- Reduzido a 48 px, ainda dá para ler um alvo com um X.

## O que foi usado de fato (25/11/2026)

A arte final veio do ChatGPT numa direção diferente dos prompts acima: um medalhão de bronze com nós entrelaçados, o X metálico e "X-RING" gravado. Os originais ficam em `assets/source/`:

- `icone-gpt.jpeg` — ícone principal (veio em JPEG, com cantos arredondados brancos).
- `medalhao-recorte.png` — o medalhão com transparência.
- `monocromatico-gpt.jpeg` — versão branco e preto.
- `splash-com-nome-gpt.png` — medalhão com o nome e "Precision Marksmanship" embaixo (não usado: o splash do Android 12+ recorta o ícone num círculo, e o texto embaixo seria cortado).

`node scripts/build-icons.js` gera os quatro PNGs de `assets/images/`: ícone quadrado com o verde `#1F3D2B` chapado fora do medalhão, frente do ícone adaptativo e monocromático reduzidos a 610 px (dentro da zona segura de 626 px), e splash só com o medalhão.
