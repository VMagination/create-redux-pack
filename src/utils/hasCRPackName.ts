export const hasCRPackName = (name: string): boolean => /\[.+]: CRPack-(.{9}|static)/.test(name);
