import { CreateReduxPackAction } from '../types';

export function createBaseAction<PA extends Function = any>(type: string, prepareAction?: PA): any {
  function actionCreator(...args: any[]) {
    if (prepareAction) {
      const prepared = prepareAction(...args) ?? {};
      return {
        type,
        payload: prepared?.payload,
        ...('meta' in prepared && { meta: prepared.meta }),
        ...('error' in prepared && { error: prepared.error }),
      };
    }
    return { type, payload: args[0] };
  }

  actionCreator.toString = () => `${type}`;

  actionCreator.type = type;

  return actionCreator;
}

export const createAction = <Payload extends any[], FP extends (...data: Payload) => any>(
  name: string,
  formatPayload?: FP,
): CreateReduxPackAction<Parameters<FP>, ReturnType<FP>> =>
  Object.assign(
    createBaseAction(name, (...data: Parameters<FP>) => ({
      payload: formatPayload ? formatPayload(...data) : data.length <= 1 ? data[0] : data,
    })),
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
              createBaseAction(name, (...data: Parameters<FP>) => ({
                payload: formatPayload ? formatPayload(...data) : data.length <= 1 ? data[0] : data,
                meta: {
                  instance: p,
                },
              })),
              s,
            );
            return Reflect.get(t, p, s);
          },
        },
      ),
    },
  ) as any;
