export const mergeObjects = (target: Record<string, any>, source: Record<string, any>): any => {
  const targetCopy = { ...target };
  const merge = (target: any, source: any): any => {
    Object.keys(source).forEach((key) => {
      if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
    });
    Object.assign(target ?? {}, source);
    return target;
  };
  merge(targetCopy, source);
  return targetCopy;
};
