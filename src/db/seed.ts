import { eq } from 'drizzle-orm';

import { BUILTIN_FACES } from '@/domain/builtin-faces';

import type { Db } from './client';
import { archers, targetFaces } from './schema';

/**
 * Idempotente: roda a cada abertura do app. Alvos padrão são atualizados pela
 * builtin_key (mantendo o id, que é referenciado por participants); o
 * atirador principal (is_me) é criado se ainda não existir.
 */
export async function seed(db: Db): Promise<void> {
  for (const face of BUILTIN_FACES) {
    await db
      .insert(targetFaces)
      .values({ ...face, isBuiltin: true })
      .onConflictDoUpdate({
        target: targetFaces.builtinKey,
        set: { name: face.name, rings: face.rings, centers: face.centers, updatedAt: new Date() },
      });
  }

  const me = await db.select({ id: archers.id }).from(archers).where(eq(archers.isMe, true)).limit(1);
  if (me.length === 0) {
    await db.insert(archers).values({ name: 'Eu', isMe: true });
  }
}
