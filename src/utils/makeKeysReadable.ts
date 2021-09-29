import { hasCRPackName } from './hasCRPackName';

export const makeKeysReadable = <T>(obj: T): T => {
  if (!(obj && typeof obj === 'object')) return obj;
  const result = { ...obj };
  const renameKeys = (origin: any) => {
    const keys = Object.keys(origin || {}).filter(hasCRPackName);
    if (!keys.length) return origin;
    const copy = { ...origin };

    keys.forEach((k) => {
      const [, realKey] = k.match(/\.([^. ]+) /) || [];
      if (realKey) {
        copy[realKey] = renameKeys(copy[k]);
        delete copy[k];
        return;
      }
    });
    return copy;
  };

  return renameKeys(result);
};
