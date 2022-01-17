export const CRPackRegex = /\[.+]: CRPack-(.{9}|static)/;
export const hasCRPackName = (name: string): boolean => CRPackRegex.test(name);
