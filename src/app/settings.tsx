import { File, Paths } from 'expo-file-system';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useDb } from '@/db/client';
import { type Archer, exportAll, getMe, updateMe } from '@/db/repo';
import { useData } from '@/db/store';
import { dateKey } from '@/domain/weeks';
import { Button, Card, ChipRow, Field, Screen, Section, T } from '@/ui/kit';
import { type ThemePreference, useTheme } from '@/ui/theme';

export default function Settings() {
  const db = useDb();
  const { data: me } = useData(() => getMe(db), [db]);
  if (!me) return null;
  return <SettingsForm me={me} />;
}

function SettingsForm({ me }: { me: Archer }) {
  const { colors, preference, setPreference } = useTheme();
  const db = useDb();
  const [name, setName] = useState(me.name);
  const [diameter, setDiameter] = useState(String(me.arrowDiameterMm).replace('.', ','));
  const [exporting, setExporting] = useState(false);

  async function saveDiameter() {
    const v = Number(diameter.replace(',', '.'));
    if (!(v >= 2 && v <= 12)) {
      Alert.alert('Diâmetro inválido', 'Use um valor entre 2 e 12 mm.');
      return;
    }
    await updateMe(db, { arrowDiameterMm: v });
  }

  async function exportJson() {
    setExporting(true);
    try {
      const data = await exportAll(db);
      const file = new File(Paths.cache, `x-ring-backup-${dateKey(new Date())}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Backup do X-Ring' });
      } else {
        Alert.alert('Backup criado', file.uri);
      }
    } catch (e) {
      Alert.alert('Não foi possível exportar', (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <Section title="Você">
        <Field
          label="Nome"
          value={name}
          onChangeText={setName}
          onEndEditing={() => name.trim() && name !== me.name && updateMe(db, { name: name.trim() })}
        />
        <Field
          label="Diâmetro da flecha (mm)"
          keyboardType="decimal-pad"
          value={diameter}
          onChangeText={setDiameter}
          onEndEditing={saveDiameter}
        />
        <T variant="small" color={colors.inkSoft}>
          Usado na regra da linha: a flecha que toca a linha vale o anel maior. Vale para as próximas sessões; as
          antigas mantêm o valor da época.
        </T>
      </Section>

      <Section title="Aparência">
        <ChipRow<ThemePreference>
          options={[
            { value: 'system', label: 'Sistema' },
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
          ]}
          value={preference}
          onChange={setPreference}
        />
        <T variant="small" color={colors.inkSoft}>
          No sol, o claro lê melhor. O alvo mantém as cores oficiais em qualquer modo.
        </T>
      </Section>

      <Section title="Backup">
        <Card>
          <T>Exporta todos os dados em JSON (sessões, flechas, atiradores, plano). Guarde no Drive ou mande para você mesmo.</T>
          <Button label={exporting ? 'Exportando…' : 'Exportar dados (JSON)'} onPress={exportJson} disabled={exporting} />
        </Card>
      </Section>
    </Screen>
  );
}
