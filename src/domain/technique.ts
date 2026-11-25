export const TECHNIQUE_ELEMENTS = [
  'stance',
  'grip',
  'hook',
  'draw',
  'anchor',
  'release',
  'follow_through',
] as const;

export type TechniqueElement = (typeof TECHNIQUE_ELEMENTS)[number];

export type TechniqueGuide = {
  label: string;
  /** Onde apoiar o celular para filmar. */
  camera: string;
  /** O que procurar no vídeo. */
  lookFor: string[];
};

export const TECHNIQUE_GUIDE: Record<TechniqueElement, TechniqueGuide> = {
  stance: {
    label: 'Postura',
    camera: 'Atrás de você, na altura do quadril, alinhado com a linha de tiro.',
    lookFor: [
      'Pés na mesma posição em todas as flechas (marque o chão)',
      'Peso distribuído igual nos dois pés',
      'Quadril e ombros sem girar para o alvo',
    ],
  },
  grip: {
    label: 'Empunhadura',
    camera: 'De frente para a mão do arco, a uns 50 cm, um pouco abaixo.',
    lookFor: [
      'A pressão fica no músculo da base do polegar, não na palma inteira',
      'Dedos relaxados, sem agarrar o punho',
      'O arco cai para a frente na soltura, sem a mão girar',
    ],
  },
  hook: {
    label: 'Gancho',
    camera: 'Do lado da mão da corda, bem perto, na altura da mão.',
    lookFor: [
      'Corda na primeira dobra dos três dedos',
      'Costas da mão relaxadas e retas',
      'Mesma posição dos dedos em todas as flechas',
    ],
  },
  draw: {
    label: 'Puxada',
    camera: 'De lado, a 2–3 m, enquadrando do quadril à cabeça.',
    lookFor: [
      'Ombro do arco baixo, sem subir durante a puxada',
      'Puxada pelas costas (escápula), não pelo braço',
      'Movimento contínuo, sem parar e recomeçar',
    ],
  },
  anchor: {
    label: 'Ancoragem',
    camera: 'De frente para o rosto, do lado da corda, na altura dos olhos.',
    lookFor: [
      'Corda tocando sempre o mesmo ponto do queixo e do nariz',
      'Mão firme sob o queixo, sem deslizar',
      'Cabeça parada: a mão vem até o rosto, não o rosto até a mão',
    ],
  },
  release: {
    label: 'Soltura',
    camera: 'De cima/atrás do ombro da corda, focado na mão da corda.',
    lookFor: [
      'Os dedos relaxam, não abrem empurrando',
      'A mão recua junto ao pescoço, sem abrir para fora',
      'Sem "pinçar" a flecha nem mexer o arco antes de soltar',
    ],
  },
  follow_through: {
    label: 'Follow-through',
    camera: 'De lado, a 2–3 m, como na puxada; filme 2 s após a soltura.',
    lookFor: [
      'Braço do arco continua apontado para o alvo',
      'Mão da corda termina atrás do pescoço, relaxada',
      'Manter a posição até a flecha chegar no alvo',
    ],
  },
};

/** Próximo elemento na rotação; sem histórico, começa pela postura. */
export function nextElement(previous: TechniqueElement | null | undefined): TechniqueElement {
  if (!previous) return TECHNIQUE_ELEMENTS[0];
  const i = TECHNIQUE_ELEMENTS.indexOf(previous);
  return TECHNIQUE_ELEMENTS[(i + 1) % TECHNIQUE_ELEMENTS.length];
}
