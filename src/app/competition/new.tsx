import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useDb } from '@/db/client';
import { type Archer, createArcher, createCompetition, type CompetitorSetup, lastDistance, listArchers, listFaces, type TargetFace } from '@/db/repo';
import { useData } from '@/db/store';
import type { HandicapType } from '@/domain/ranking';
import { DistancePicker } from '@/ui/DistancePicker';
import { Button, Card, Chip, ChipRow, Field, Row, Screen, Section, T, ToggleRow } from '@/ui/kit';
import { space, useTheme } from '@/ui/theme';

const HANDICAP: { value: HandicapType; label: string; hint: string }[] = [
  { value: 'none', label: 'Sem handicap', hint: 'Todos na mesma distância e alvo.' },
  { value: 'distance', label: 'Distância', hint: 'Iniciante atira mais perto.' },
  { value: 'target', label: 'Alvo maior', hint: 'Iniciante usa um alvo maior.' },
  { value: 'points', label: 'Pontos', hint: 'Pontos extras por série para quem está começando.' },
];

export default function NewCompetition() {
  const db = useDb();
  const { data } = useData(
    async () => ({ archers: await listArchers(db), faces: await listFaces(db), distance: (await lastDistance(db)) ?? 18 }),
    [db],
  );
  if (!data) return null;
  return <CompetitionForm data={data} />;
}

function CompetitionForm({ data }: { data: { archers: Archer[]; faces: TargetFace[]; distance: number } }) {
  const { colors } = useTheme();
  const db = useDb();
  const defaultFace = data.faces[0]?.id ?? '';
  const me = data.archers.find((a) => a.isMe);

  const [ends, setEnds] = useState(6);
  const [arrowsPerEnd, setArrowsPerEnd] = useState(3);
  const [handicap, setHandicap] = useState<HandicapType>('none');
  const [countForStats, setCountForStats] = useState(false);
  // O atirador principal entra de início.
  const [competitors, setCompetitors] = useState<CompetitorSetup[]>(
    me ? [{ archerId: me.id, distanceM: data.distance, targetFaceId: defaultFace, handicapPoints: 0 }] : [],
  );
  const [newName, setNewName] = useState('');
  const [baseDistance, setBaseDistance] = useState(data.distance);
  const [saving, setSaving] = useState(false);

  const byId = new Map(data.archers.map((a) => [a.id, a]));
  const selected = new Set(competitors.map((c) => c.archerId));
  const others = data.archers.filter((a) => !selected.has(a.id));
  const perArcherSetup = handicap !== 'none';

  const add = (a: Archer) =>
    setCompetitors((c) => [...c, { archerId: a.id, distanceM: baseDistance, targetFaceId: defaultFace, handicapPoints: 0 }]);
  const remove = (id: string) => setCompetitors((c) => c.filter((x) => x.archerId !== id));
  const patch = (id: string, p: Partial<CompetitorSetup>) =>
    setCompetitors((c) => c.map((x) => (x.archerId === id ? { ...x, ...p } : x)));

  async function addNew() {
    const name = newName.trim();
    if (!name) return;
    const a = await createArcher(db, name);
    setNewName('');
    add(a);
  }

  function setAllDistance(d: number) {
    setBaseDistance(d);
    if (!perArcherSetup || handicap !== 'distance') setCompetitors((c) => c.map((x) => ({ ...x, distanceM: d })));
  }

  async function start() {
    if (competitors.length < 2 || saving) return;
    setSaving(true);
    const id = await createCompetition(db, {
      endsPlanned: ends,
      arrowsPerEnd,
      handicapType: handicap,
      countForStats,
      competitors: competitors.map((c) => ({
        ...c,
        distanceM: handicap === 'distance' ? c.distanceM : baseDistance,
        targetFaceId: handicap === 'target' ? c.targetFaceId || defaultFace : competitors[0].targetFaceId || defaultFace,
      })),
    });
    router.replace(`/session/${id}`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nova competição' }} />

      <Section title={`Atiradores (${competitors.length})`}>
        <Card>
          {competitors.map((c, i) => (
            <Row key={c.archerId}>
              <T variant="heading" style={{ width: 24 }} color={colors.inkSoft}>
                {i + 1}
              </T>
              <T variant="heading" style={{ flex: 1 }}>
                {byId.get(c.archerId)?.name}
              </T>
              {!byId.get(c.archerId)?.isMe && (
                <Pressable onPress={() => remove(c.archerId)} hitSlop={10}>
                  <T color={colors.danger} variant="small" style={{ fontWeight: '700' }}>
                    Tirar
                  </T>
                </Pressable>
              )}
            </Row>
          ))}
          <T variant="small" color={colors.inkSoft}>
            A ordem acima é a ordem de vez.
          </T>
        </Card>
        {others.length > 0 && (
          <View style={{ gap: space.xs }}>
            <T variant="small" color={colors.inkSoft}>
              Quem já atirou (mais recentes primeiro)
            </T>
            <Row style={{ flexWrap: 'wrap' }}>
              {others.map((a) => (
                <Chip key={a.id} label={`+ ${a.nickname || a.name}`} onPress={() => add(a)} />
              ))}
            </Row>
          </View>
        )}
        <Row>
          <View style={{ flex: 1 }}>
            <Field label="Novo atirador" placeholder="Nome ou apelido" value={newName} onChangeText={setNewName} onSubmitEditing={addNew} returnKeyType="done" />
          </View>
          <Button label="Adicionar" kind="secondary" onPress={addNew} disabled={!newName.trim()} style={{ alignSelf: 'flex-end' }} />
        </Row>
      </Section>

      <Section title="Regras">
        <T variant="small" color={colors.inkSoft}>
          Séries
        </T>
        <ChipRow options={[5, 6].map((n) => ({ value: n, label: `${n} séries` }))} value={ends} onChange={setEnds} />
        <T variant="small" color={colors.inkSoft}>
          Flechas por série
        </T>
        <ChipRow options={[3, 6].map((n) => ({ value: n, label: `${n} flechas` }))} value={arrowsPerEnd} onChange={setArrowsPerEnd} />
        <T variant="small" color={colors.inkSoft}>
          Distância {handicap === 'distance' ? 'base' : ''}
        </T>
        <DistancePicker value={baseDistance} onChange={setAllDistance} />
        {handicap !== 'target' && (
          <>
            <T variant="small" color={colors.inkSoft}>
              Alvo
            </T>
            <ChipRow
              options={data.faces.map((f) => ({ value: f.id, label: f.name }))}
              value={competitors[0]?.targetFaceId || defaultFace}
              onChange={(f) => setCompetitors((c) => c.map((x) => ({ ...x, targetFaceId: f })))}
            />
          </>
        )}
        <T variant="small" color={colors.inkSoft}>
          Desempate pelo número de 10s, depois de X.
        </T>
      </Section>

      <Section title="Handicap">
        <ChipRow options={HANDICAP.map((h) => ({ value: h.value, label: h.label }))} value={handicap} onChange={setHandicap} />
        <T variant="small" color={colors.inkSoft}>
          {HANDICAP.find((h) => h.value === handicap)?.hint}
        </T>
        {perArcherSetup &&
          competitors.map((c) => (
            <Card key={c.archerId}>
              <T variant="heading">{byId.get(c.archerId)?.name}</T>
              {handicap === 'distance' && (
                <DistancePicker value={c.distanceM} onChange={(d) => patch(c.archerId, { distanceM: d })} />
              )}
              {handicap === 'target' && (
                <ChipRow
                  options={data.faces.map((f) => ({ value: f.id, label: f.name }))}
                  value={c.targetFaceId || defaultFace}
                  onChange={(f) => patch(c.archerId, { targetFaceId: f })}
                />
              )}
              {handicap === 'points' && (
                <ChipRow
                  options={[0, 1, 2, 3, 5, 8, 10].map((n) => ({ value: n, label: `+${n}/série` }))}
                  value={c.handicapPoints}
                  onChange={(n) => patch(c.archerId, { handicapPoints: n })}
                />
              )}
            </Card>
          ))}
      </Section>

      <Card>
        <ToggleRow
          label="Contar para minhas estatísticas"
          hint="Desligado: a competição não entra na evolução do treino."
          value={countForStats}
          onChange={setCountForStats}
        />
      </Card>

      <Button
        big
        label={competitors.length < 2 ? 'Adicione pelo menos 2 atiradores' : 'Começar competição'}
        onPress={start}
        disabled={competitors.length < 2 || saving}
      />
    </Screen>
  );
}
