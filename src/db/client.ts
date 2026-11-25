import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { randomUUID } from 'expo-crypto';
import { openDatabaseAsync } from 'expo-sqlite';
import { createContext, useContext } from 'react';

import { setIdGenerator } from '@/domain/id';

import migrations from '../../drizzle/migrations';
import * as schema from './schema';
import { seed } from './seed';

export type Db = ExpoSQLiteDatabase<typeof schema>;

setIdGenerator(randomUUID);

let opening: Promise<Db> | null = null;

/**
 * Abre o banco uma única vez, roda migrations e seed.
 * Precisa ser assíncrono: na web o SQLite roda num worker que só aceita
 * chamadas síncronas (usadas pelo Drizzle) depois de carregado.
 */
export function openDb(): Promise<Db> {
  opening ??= (async () => {
    const expoDb = await openDatabaseAsync('x-ring.db', { enableChangeListener: true });
    await expoDb.execAsync('PRAGMA foreign_keys = ON;');
    const db = drizzle(expoDb, { schema });
    await migrate(db, migrations);
    await seed(db);
    return db;
  })().catch((err) => {
    opening = null; // permite tentar de novo
    throw err;
  });
  return opening;
}

export const DbContext = createContext<Db | null>(null);

export function useDb(): Db {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb fora do DbContext');
  return db;
}
