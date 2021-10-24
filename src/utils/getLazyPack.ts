const cached = Symbol('[CRPack]: cached');

export const getLazyPack = (gen: any, info: any, ...extraParams: any[]) => {
  return new Proxy(
    { ...gen, [cached]: {} },
    {
      get: (t, rawP, s) => {
        let p = rawP;
        const normalizedName = info.originalName.replace(/^\S/, (s: string) => s.toLowerCase());
        if (
          !gen.hasOwnProperty(rawP) &&
          typeof rawP === 'string' &&
          rawP.startsWith(normalizedName) &&
          rawP !== normalizedName
        ) {
          p = rawP.replace(normalizedName, '').replace(/^\S/, (s: string) => s.toLowerCase());
        }
        const val = Reflect.get(t, p, s);
        const saved = Reflect.get(t, cached, s);
        if (p === 'name') return info.name;
        if (gen.hasOwnProperty(p)) {
          if (p in saved) {
            return saved[p];
          }
          const result = val(info, ...extraParams);
          Reflect.set(t[cached], p, result);
          return result;
        }
        return val;
      },
    },
  ) as any;
};
