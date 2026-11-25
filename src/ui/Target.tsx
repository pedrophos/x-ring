import { memo, useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { type ArrowPoint, arrowToDrawing, drawingToArrow, faceViewBox, pxToDrawing, type ViewBox } from '@/domain/geometry';
import type { TargetFaceDef } from '@/domain/target-face';

import { colors } from './theme';

export type MarkedArrow = ArrowPoint & { tone?: 'current' | 'last' | 'old' };

type Props = {
  face: TargetFaceDef;
  arrows?: MarkedArrow[];
  /** Diâmetro real da haste: o marcador é desenhado nesse tamanho (mínimo legível). */
  arrowDiameterMm?: number;
  /** Ativa o registro por toque: a lupa acompanha o dedo e a flecha é confirmada ao soltar. */
  onPlace?: (p: ArrowPoint) => void;
  /** Avisa início/fim do toque (para travar a rolagem da tela). */
  onTouchingChange?: (touching: boolean) => void;
  /** Altura máxima em px; a largura acompanha a proporção do alvo. */
  maxHeight?: number;
};

const LOUPE_SIZE = 132;
const LOUPE_ZOOM = 3.2;
const LOUPE_GAP = 36; // distância acima do dedo

const ringStroke = (color: string) => (color.toUpperCase() === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A');

/** Anéis de todos os spots; memorizado porque é o desenho mais pesado. */
const Rings = memo(function Rings({ face }: { face: TargetFaceDef }) {
  const sorted = [...face.rings].sort((a, b) => b.radiusMm - a.radiusMm);
  const outer = sorted[0]?.radiusMm ?? 100;
  const stroke = outer / 220;
  return (
    <>
      {face.centers.map((c, i) => (
        <G key={i}>
          {sorted.map((r, j) => (
            <Circle
              key={j}
              cx={c.x}
              cy={c.y}
              r={r.radiusMm}
              fill={r.color}
              stroke={ringStroke(r.color)}
              strokeWidth={r.isX ? stroke * 0.6 : stroke}
            />
          ))}
          {/* cruz central fina */}
          <Line x1={c.x - outer / 60} y1={c.y} x2={c.x + outer / 60} y2={c.y} stroke="#1A1A1A" strokeWidth={stroke * 0.5} />
          <Line x1={c.x} y1={c.y - outer / 60} x2={c.x} y2={c.y + outer / 60} stroke="#1A1A1A" strokeWidth={stroke * 0.5} />
        </G>
      ))}
    </>
  );
});

function Arrows({ face, arrows, rMm }: { face: TargetFaceDef; arrows: MarkedArrow[]; rMm: number }) {
  return (
    <>
      {arrows.map((a, i) => {
        const p = arrowToDrawing(face, a);
        const fill = a.tone === 'last' ? colors.arrowLast : a.tone === 'old' ? colors.arrowOld : colors.arrow;
        return (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={rMm}
            fill={fill}
            opacity={a.tone === 'old' ? 0.55 : 1}
            stroke="#FFFFFF"
            strokeWidth={rMm * 0.35}
          />
        );
      })}
    </>
  );
}

export function Target({ face, arrows = [], arrowDiameterMm = 5, onPlace, onTouchingChange, maxHeight = 520 }: Props) {
  const vb = useMemo(() => faceViewBox(face), [face]);
  const [width, setWidth] = useState(0);
  const [touch, setTouchState] = useState<{ px: number; py: number } | null>(null);
  // Ref para o release ler a última posição mesmo antes do re-render.
  const touchRef = useRef<{ px: number; py: number } | null>(null);
  const setTouch = (t: { px: number; py: number } | null) => {
    touchRef.current = t;
    setTouchState(t);
  };

  const aspect = vb.width / vb.height;
  const size = width > 0 ? fit(width, maxHeight, aspect) : { width: 0, height: 0 };
  const outer = Math.max(...face.rings.map((r) => r.radiusMm));
  // Marcador visível mesmo em alvos grandes: no mínimo ~1,6% do raio.
  const markerR = Math.max(arrowDiameterMm / 2, outer * 0.016);

  const toDrawing = (e: GestureResponderEvent) => {
    const px = clamp(e.nativeEvent.locationX, 0, size.width);
    const py = clamp(e.nativeEvent.locationY, 0, size.height);
    return { px, py };
  };

  const handlers = onPlace
    ? {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderTerminationRequest: () => false,
        onResponderGrant: (e: GestureResponderEvent) => {
          onTouchingChange?.(true);
          setTouch(toDrawing(e));
        },
        onResponderMove: (e: GestureResponderEvent) => setTouch(toDrawing(e)),
        onResponderRelease: () => {
          const last = touchRef.current;
          if (last) {
            const d = pxToDrawing(last.px, last.py, size, vb);
            onPlace(drawingToArrow(face, d.x, d.y));
          }
          setTouch(null);
          onTouchingChange?.(false);
        },
        onResponderTerminate: () => {
          setTouch(null);
          onTouchingChange?.(false);
        },
      }
    : {};

  const touchDrawing = touch ? pxToDrawing(touch.px, touch.py, size, vb) : null;
  const preview: MarkedArrow[] = touchDrawing ? [{ ...drawingToArrow(face, touchDrawing.x, touchDrawing.y), tone: 'last' }] : [];

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ width: '100%', alignItems: 'center' }}
    >
      {size.width > 0 && (
        <View style={{ width: size.width, height: size.height }} {...handlers}>
          <Svg
            width={size.width}
            height={size.height}
            viewBox={`${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`}
            pointerEvents="none"
          >
            <Rings face={face} />
            <Arrows face={face} arrows={arrows} rMm={markerR} />
            {!touch ? null : <Arrows face={face} arrows={preview} rMm={markerR} />}
          </Svg>

          {touch && touchDrawing && (
            <Loupe face={face} vb={vb} sizePx={size} touch={touch} point={touchDrawing} arrows={arrows} markerR={markerR} />
          )}
        </View>
      )}
    </View>
  );
}

function Loupe({
  face,
  vb,
  sizePx,
  touch,
  point,
  arrows,
  markerR,
}: {
  face: TargetFaceDef;
  vb: ViewBox;
  sizePx: { width: number; height: number };
  touch: { px: number; py: number };
  point: { x: number; y: number };
  arrows: MarkedArrow[];
  markerR: number;
}) {
  const mmPerPx = vb.width / sizePx.width;
  const spanMm = (LOUPE_SIZE * mmPerPx) / LOUPE_ZOOM;
  const left = clamp(touch.px - LOUPE_SIZE / 2, -LOUPE_SIZE / 4, sizePx.width - (LOUPE_SIZE * 3) / 4);
  // Acima do dedo; se não couber, abaixo.
  const above = touch.py - LOUPE_SIZE - LOUPE_GAP;
  const top = above >= -LOUPE_SIZE / 3 ? above : touch.py + LOUPE_GAP;
  const cross = spanMm / 8;
  const sw = spanMm / 90;

  return (
    <View pointerEvents="none" style={[styles.loupe, { left, top }]}>
      <Svg
        width={LOUPE_SIZE}
        height={LOUPE_SIZE}
        viewBox={`${point.x - spanMm / 2} ${point.y - spanMm / 2} ${spanMm} ${spanMm}`}
      >
        <Rings face={face} />
        <Arrows face={face} arrows={arrows} rMm={markerR} />
        <Circle cx={point.x} cy={point.y} r={markerR} fill="none" stroke={colors.arrowLast} strokeWidth={sw * 1.5} />
        <Line x1={point.x - cross} y1={point.y} x2={point.x + cross} y2={point.y} stroke={colors.arrowLast} strokeWidth={sw} />
        <Line x1={point.x} y1={point.y - cross} x2={point.x} y2={point.y + cross} stroke={colors.arrowLast} strokeWidth={sw} />
      </Svg>
    </View>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function fit(maxW: number, maxH: number, aspect: number) {
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { width: w, height: h };
}

const styles = StyleSheet.create({
  loupe: {
    position: 'absolute',
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    elevation: 8,
  },
});
