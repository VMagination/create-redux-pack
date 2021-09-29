import { hasCRPackName } from './hasCRPackName';

export const getRunName = (name: string): string => `run ${name}`;
export const getSuccessName = (name: string): string => `success ${name}`;
export const getSetName = (name: string): string => `set ${name}`;
export const getResetName = (name: string): string => `reset ${name}`;
export const getFailName = (name: string): string => `fail ${name}`;
export const getLoadingName = (name: string): string => `isLoading ${name}`;
export const getResultName = (name: string): string => `result ${name}`;
export const getValueName = (name: string): string => `value ${name}`;
export const getErrorName = (name: string): string => `error ${name}`;
export const getKeyName = (name: string, key: string): string => (hasCRPackName(key) ? key : `${key} of ${name}`);
export const getActionName = (name: string, actionName: string): string => `${actionName} ${name}`;
export const getNameWithInstance = (name: string, instance?: string): string =>
  instance ? `${name} [Instance]: ${instance}` : name;
