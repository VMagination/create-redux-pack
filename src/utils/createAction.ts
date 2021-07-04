import { CreateReduxPackAction } from '../types';
import { createAction as createToolkitAction } from '@reduxjs/toolkit';

export const createAction = <Payload, Result = Payload>(
  name: string,
  formatPayload?: (data: Payload) => Result,
): CreateReduxPackAction<Payload, Result | Payload> =>
  Object.assign(
    createToolkitAction(name, (data) => ({
      payload: formatPayload ? formatPayload(data) : data,
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
                payload: formatPayload ? formatPayload(data) : data,
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
  );
