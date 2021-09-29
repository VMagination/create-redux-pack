import { CreateReduxPackAction } from '../types';
import { createAction as createToolkitAction } from '@reduxjs/toolkit';

export const createAction = <Payload extends any[], FP extends (...data: Payload) => any>(
  name: string,
  formatPayload?: FP,
): CreateReduxPackAction<Parameters<FP>, ReturnType<FP>> =>
  Object.assign(
    createToolkitAction(name, (data) => ({
      payload: formatPayload ? formatPayload(...([data] as Payload)) : data,
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
              createToolkitAction(name, (data) => ({
                payload: formatPayload ? formatPayload(...([data] as Payload)) : data,
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
