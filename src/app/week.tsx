import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/db/client';
import { loadOverview } from '@/db/overview';
import { setFocus, updateWeekPlan } from '@/db/repo';
import { useData } from '@/db/store';
import { nextElement, TECHNIQUE_ELEMENTS, TECHNIQUE_GUIDE, type TechniqueElement } from '@/domain/technique';
import { addDays, dateKey, parseDateKey } from '@/domain/weeks';
import { Card, Chip, ChipRow, Field, Row, Screen, Section, T, ToggleRow } from '@/ui/kit';
import { space, useTheme } from '@/ui/theme';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function Week() {
  const { colors } = useTheme();
  const db = useDb();
  const { data } = useData(() => loadOverview(db), [db]);
  if (!data) return null;

  const { me, week, plan } = data;
  const element: TechniqueElement = data.focus?.element ?? nextElement(data.previousFocus?.element);
  const guide = TECHNIQUE_GUIDE[element];
  const sptDays = plan?.sptDays ?? [];
  const days = Array.from({ length: 7 }, (_, i) => dateKey(addDays(parseDateKey(week), i)));

  const toggleDay = (d: string) =>
    updateWeekPlan(db, me.id, week, { sptDays: sptDays.includes(d) ? sptDays.filter((x) => x !== d) : [...sptDays, d] });

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Semana' }} />
      <T variant="small" color={colors.inkSoft}>
        Semana de {parseDateKey(week).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}. O plano zera
        toda segunda.
      </T>

      <Section title="Plano (1h a 2h por semana)">
        <Card>
          <ToggleRow
            label="Sessão técnica"
            hint="Perto do alvo (5–10 m), sem contar pontos: só o foco da semana, filmando."
            value={!!plan?.technicalDone}
            onChange={(v) => updateWeekPlan(db, me.id, week, { technicalDone: v })}
          />
          <ToggleRow
            label="Sessão de pontuação"
            hint="Na distância de sempre, registrando no app."
            value={!!plan?.scoringDone}
            onChange={(v) => updateWeekPlan(db, me.id, week, { scoringDone: v })}
          />
          <View style={{ gap: space.sm }}>
            <T>Treino físico de 5 min</T>
            <T variant="small" color={colors.inkSoft}>
              Com elástico: 5 × 30 s segurando na ancoragem e 10 puxadas lentas. Marque os dias.
            </T>
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {days.map((d, i) => (
                <Chip
                  key={d}
                  label={DAY_LABELS[i]}
                  selected={sptDays.includes(d)}
                  onPress={() => toggleDay(d)}
                  style={{ paddingHorizontal: space.md, opacity: d > data.today ? 0.45 : 1 }}
                />
              ))}
            </Row>
          </View>
        </Card>
      </Section>

      <Section title="Foco técnico da semana">
        <ChipRow
          options={TECHNIQUE_ELEMENTS.map((e) => ({ value: e, label: TECHNIQUE_GUIDE[e].label }))}
          value={element}
          onChange={(e) => setFocus(db, me.id, week, { element: e })}
        />
        <Card>
          <T variant="display">{guide.label}</T>
          <View style={{ gap: 2 }}>
            <T variant="label" color={colors.inkSoft}>
              Onde pôr o celular
            </T>
            <T>{guide.camera}</T>
          </View>
          <View style={{ gap: 2 }}>
            <T variant="label" color={colors.inkSoft}>
              O que procurar no vídeo
            </T>
            {guide.lookFor.map((l) => (
              <T key={l}>• {l}</T>
            ))}
          </View>
          <T variant="small" color={colors.inkSoft}>
            Filme 3 a 6 flechas e assista em câmera lenta. Um elemento por vez.
          </T>
        </Card>
        <FocusNotes
          key={`${week}-${element}`}
          initialNotes={data.focus?.notes ?? ''}
          initialVideo={data.focus?.videoUri ?? ''}
          onSave={(patch) => setFocus(db, me.id, week, { element, ...patch })}
        />
      </Section>
    </Screen>
  );
}

function FocusNotes({
  initialNotes,
  initialVideo,
  onSave,
}: {
  initialNotes: string;
  initialVideo: string;
  onSave: (p: { notes?: string; videoUri?: string | null }) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [video, setVideo] = useState(initialVideo);
  return (
    <View style={{ gap: space.md }}>
      <Field
        label="O que você viu no vídeo"
        multiline
        value={notes}
        onChangeText={setNotes}
        onEndEditing={() => notes !== initialNotes && onSave({ notes })}
        placeholder="ex.: ombro subindo nas últimas flechas"
        style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: space.md }}
      />
      <Field
        label="Link ou nome do vídeo (opcional)"
        value={video}
        onChangeText={setVideo}
        onEndEditing={() => video !== initialVideo && onSave({ videoUri: video || null })}
        placeholder="ex.: VID_20261124_1830.mp4"
        autoCapitalize="none"
      />
    </View>
  );
}
