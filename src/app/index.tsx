import { isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { StyleSheet, Text, View } from 'react-native';

import { useDb } from '@/db/client';
import { targetFaces } from '@/db/schema';

/** Tela provisória da etapa 1: confirma migrations e seed no aparelho. */
export default function Home() {
  const db = useDb();
  const { data } = useLiveQuery(
    db.select({ id: targetFaces.id, name: targetFaces.name }).from(targetFaces).where(isNull(targetFaces.deletedAt)),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Banco pronto</Text>
      <Text>Alvos disponíveis:</Text>
      {data.map((f) => (
        <Text key={f.id}>• {f.name}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
});
