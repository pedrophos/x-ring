/**
 * Gerador de UUID v4 sem dependência de Expo, para o schema rodar também no
 * drizzle-kit (Node) e no back-end futuro. O app injeta o do expo-crypto
 * na inicialização (ver src/db/client.ts).
 */
let generator: () => string = () => globalThis.crypto.randomUUID();

export const setIdGenerator = (fn: () => string): void => {
  generator = fn;
};

export const newId = (): string => generator();
