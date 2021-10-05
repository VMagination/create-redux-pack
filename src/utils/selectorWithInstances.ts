import { createSelector as createReSelector } from 'reselect';
import { getNameWithInstance } from './nameGetters';

export const selectorWithInstances = (prevSelector: any, name: string, initial: any, format = (state: any) => state) =>
  Object.assign(
    createReSelector<any, any, any>(prevSelector, (state) => format((state || {})[name])),
    {
      instances: new Proxy(
        {},
        {
          get: (t, p, s) => {
            const result = Reflect.get(t, p, s);
            if (result) return result;
            if (typeof p !== 'string') return result;
            Reflect.set(
              t,
              p,
              createReSelector<any, any, any>(prevSelector, (state) => state[getNameWithInstance(name, p)] ?? initial),
              s,
            );
            return Reflect.get(t, p, s);
          },
        },
      ),
    },
  );
