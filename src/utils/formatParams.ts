import { CRPackDefaultTemplate, CRPackTemplates, Params, CreateReduxPackPayloadMap } from '../types';

const formatComplete: unique symbol = Symbol('format complete');

export const formatParams = <
  Config extends Params<any, Actions, Template> = any,
  S = any,
  Actions extends PropertyKey = any,
  Template extends CRPackTemplates = CRPackDefaultTemplate
>(
  rawParams: { payloadMap?: CreateReduxPackPayloadMap<S, Actions, Template> } & Config & {
      actions?: Actions[];
      template?: Template;
    },
  defaultIdGeneration: boolean,
): Config & { actions?: Array<Actions>; template?: Template } & Partial<Record<typeof formatComplete, boolean>> => {
  try {
    const {
      name: paramsName = 'NamelessPack',
      reducerName = 'UnspecifiedReducer',
      template = 'request',
      idGeneration = defaultIdGeneration,
      ...params
    } = rawParams;
    if (formatComplete in params) return rawParams as any;
    const name = `[${paramsName}]: CRPack-${idGeneration ? Math.random().toString(36).substr(2, 9) : 'static'}`;
    return { name, reducerName, originalName: paramsName, template, [formatComplete]: true, ...params } as any;
  } catch (e) {
    throw Error('CRPack received invalid package info');
  }
};
