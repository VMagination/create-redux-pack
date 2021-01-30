import { hasCRPackName } from './hasCRPackName';

export const getReadableKey = (key: string): string => (!hasCRPackName(key) ? key : key.replace(/ of .+/, ''));
