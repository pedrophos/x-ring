import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { useDb } from '@/db/client';
import { createTraining, listFaces, loadSessions, type Session, type TargetFace } from '@/db/repo';
import { useData } from '@/db/store';
import { DistancePicker } from '@/ui/DistancePicker';
import { Button, ChipRow, Screen, Section } from '@/ui/kit';

const ENDS = [
  { value: 0, label: 'Livre' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 10, label: '10' },
  { value: 12, label: '12' },
  { value: 20, label: '20' },
];
const ARROWS = [3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }));

export default function NewTraining() {
  const db = useDb();
  const { data } = useData(async () => {
    const [faces, recent] = await Promise.all([listFaces(db), loadSessions(db)]);
    const last = recent.find((s) => s.mode === 'training')?.participants[0];
    const lastSession = recent.find((s) => s.mode === 'training');
    return { faces, last, lastSession };
  }, [db]);

  if (!data) return null;
  return <TrainingForm {...data} />;
}

/** Começa com a configuração do último treino. */
function TrainingForm({ faces, last, lastSession }: { faces: TargetFace[]; last?: { distanceM: number; targetFaceId: string }; lastSession?: Session }) {
  const db = useDb();
  const [distanceM, setDistanceM] = useState(last?.distanceM ?? 18);
  const [faceId, setFaceId] = useState<string | null>(last?.targetFaceId ?? faces[0]?.id ?? null);
  const [arrowsPerEnd, setArrowsPerEnd] = useState(lastSession?.arrowsPerEnd ?? 6);
  const [endsPlanned, setEndsPlanned] = useState(lastSession?.endsPlanned ?? 0);
  const [saving, setSaving] = useState(false);

  const valid = faceId && distanceM > 0;

  async function start() {
    if (!valid || saving) return;
    setSaving(true);
    const id = await createTraining(db, {
      distanceM,
      targetFaceId: faceId!,
      arrowsPerEnd,
      endsPlanned: endsPlanned || null,
    });
    router.replace(`/session/${id}`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Novo treino' }} />
      <Section title="Distância">
        <DistancePicker value={distanceM} onChange={setDistanceM} />
      </Section>

      <Section title="Alvo">
        <ChipRow
          options={faces.map((f) => ({ value: f.id, label: f.name }))}
          value={faceId ?? ''}
          onChange={setFaceId}
        />
      </Section>

      <Section title="Flechas por série">
        <ChipRow options={ARROWS} value={arrowsPerEnd} onChange={setArrowsPerEnd} />
      </Section>

      <Section title="Séries planejadas">
        <ChipRow options={ENDS} value={endsPlanned} onChange={setEndsPlanned} />
      </Section>

      <Button big label="Começar" onPress={start} disabled={!valid || saving} />
    </Screen>
  );
}
