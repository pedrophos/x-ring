import * as Sharing from 'expo-sharing';
import { Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { PixelRatio, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { useDb } from '@/db/client';
import { loadSession, standings } from '@/db/repo';
import { useData } from '@/db/store';
import { useDialog } from '@/ui/dialog';
import { Button, Chip, Row, Screen, T } from '@/ui/kit';
import { PodiumCard, SHARE_HEIGHT, SHARE_WIDTH, ShareCard } from '@/ui/ShareCard';
import { useTheme } from '@/ui/theme';

/** Tamanho final da imagem em pixels físicos (story 9:16). */
const OUT_W = 1080;
const OUT_H = 1920;
/** Altura máxima da prévia na tela, para o botão ficar à vista. */
const PREVIEW_MAX_H = 520;

const PODIUM = 'podium';

export default function Share() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const dialog = useDialog();
  const { data: s } = useData(() => loadSession(db, id), [db, id]);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avail, setAvail] = useState(SHARE_WIDTH);
  const cardRef = useRef<ComponentRef<typeof View>>(null);

  if (!s) return null;
  const isComp = s.mode === 'competition';
  const rows = isComp ? standings(s) : [];
  const picked = choice ?? (isComp ? PODIUM : s.participants[0].id);
  const participant = s.participants.find((x) => x.id === picked);
  const standing = rows.find((r) => r.p.id === picked);
  const scale = Math.min(1, avail / SHARE_WIDTH, PREVIEW_MAX_H / SHARE_HEIGHT);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        await dialog.notice({
          title: 'Sem tela de compartilhar',
          message: 'Este aparelho não oferece o compartilhamento do Android, então a imagem não tem para onde ir.',
          confirm: 'Entendi',
        });
        return;
      }
      // A view mede em pontos lógicos; dividir pela densidade dá 1080 × 1920 px reais.
      const ratio = PixelRatio.get();
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: OUT_W / ratio,
        height: OUT_H / ratio,
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar no story' });
    } catch (e) {
      await dialog.notice({
        title: 'A imagem não saiu',
        message: `${e instanceof Error ? e.message : String(e)}. Tente de novo em instantes.`,
        confirm: 'Entendi',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Compartilhar' }} />
      {isComp && (
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label="Pódio" selected={picked === PODIUM} onPress={() => setChoice(PODIUM)} />
          {s.participants.map((x) => (
            <Chip key={x.id} label={x.archer.nickname || x.archer.name} selected={x.id === picked} onPress={() => setChoice(x.id)} />
          ))}
        </Row>
      )}
      {/* Prévia reduzida para caber na tela; a captura é do cartão em tamanho cheio. */}
      <View style={{ alignItems: 'center' }} onLayout={(e) => setAvail(e.nativeEvent.layout.width)}>
        <View style={{ width: SHARE_WIDTH * scale, height: SHARE_HEIGHT * scale }}>
          <View style={{ width: SHARE_WIDTH, height: SHARE_HEIGHT, transform: [{ scale }], transformOrigin: 'top left' }}>
            {participant ? (
              <ShareCard
                ref={cardRef}
                session={s}
                participant={participant}
                rank={standing ? { rank: standing.rank, of: rows.length, final: standing.final } : undefined}
              />
            ) : (
              <PodiumCard ref={cardRef} session={s} rows={rows} />
            )}
          </View>
        </View>
      </View>
      <T variant="small" color={colors.inkSoft} style={{ textAlign: 'center' }}>
        Imagem 1080 × 1920, no formato do story.
      </T>
      <Button big label={busy ? 'Gerando imagem…' : 'Compartilhar'} onPress={share} disabled={busy} />
    </Screen>
  );
}
