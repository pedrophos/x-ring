import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T } from './kit';
import { radius, space, useTheme } from './theme';

export type DialogOptions = {
  title: string;
  message?: string;
  /** Conteúdo próprio entre o título e a mensagem (ex.: bastão das séries, flechas da série). */
  extra?: ReactNode;
  confirm: string;
  /** Sem `cancel`, é um aviso de um botão só. */
  cancel?: string;
  /** `danger` para apagar/excluir: o botão de confirmar fica no vermelho de alerta. */
  tone?: 'primary' | 'danger';
};

type Pending = DialogOptions & { resolve: (ok: boolean) => void };

type DialogApi = {
  /** Abre a folha e resolve `true` se confirmou, `false` se cancelou, tocou fora ou voltou. */
  confirm: (o: DialogOptions) => Promise<boolean>;
  /** Aviso de um botão. */
  notice: (o: Omit<DialogOptions, 'cancel' | 'tone'>) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

/**
 * Folha de confirmação na identidade do app (no lugar do alerta nativo do
 * Android, que não aceita fonte nem cor): sobe de baixo, título em IM Fell,
 * ação principal na palha.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const current = useRef<Pending | null>(null);

  const close = useCallback((ok: boolean) => {
    const p = current.current;
    current.current = null;
    setPending(null);
    p?.resolve(ok);
  }, []);

  const api = useMemo<DialogApi>(() => {
    const confirm = (o: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        current.current?.resolve(false); // um diálogo por vez
        const p = { ...o, resolve };
        current.current = p;
        setPending(p);
      });
    return { confirm, notice: async (o) => void (await confirm(o)) };
  }, []);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal visible={!!pending} transparent animationType="fade" statusBarTranslucent onRequestClose={() => close(false)}>
        {pending && <Sheet options={pending} onClose={close} />}
      </Modal>
    </DialogContext.Provider>
  );
}

function Sheet({ options: o, onClose }: { options: DialogOptions; onClose: (ok: boolean) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={() => onClose(false)} accessibilityLabel="Fechar" />
      <View
        accessibilityViewIsModal
        style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line, paddingBottom: space.lg + insets.bottom }]}
      >
        <T variant="display">{o.title}</T>
        {o.extra}
        {o.message ? <T color={colors.inkSoft}>{o.message}</T> : null}
        <View style={styles.actions}>
          {o.cancel ? <Button kind="secondary" label={o.cancel} onPress={() => onClose(false)} style={{ flex: 1 }} /> : null}
          <Button kind={o.tone === 'danger' ? 'danger' : 'primary'} label={o.confirm} onPress={() => onClose(true)} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

export function useDialog(): DialogApi {
  const d = useContext(DialogContext);
  if (!d) throw new Error('useDialog fora do DialogProvider');
  return d;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: space.lg,
    gap: space.md,
  },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
});
