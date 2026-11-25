import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Db, DbContext, openDb } from '@/db/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [db, setDb] = useState<Db | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    openDb()
      .then(setDb)
      .catch(setError)
      .finally(() => SplashScreen.hideAsync());
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro ao preparar o banco: {error.message}</Text>
      </View>
    );
  }
  if (!db) return null;

  return (
    <DbContext.Provider value={db}>
      <Stack screenOptions={{ headerTitle: 'X-Ring' }} />
    </DbContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#B00020' },
});
