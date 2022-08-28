import { generateId } from './formatParams';

const RESET_ACTION_TYPE = `[CRPack]: Reset action ${generateId(3)}`;

export const resetAction = Object.assign(() => ({ type: RESET_ACTION_TYPE }), { type: RESET_ACTION_TYPE });
