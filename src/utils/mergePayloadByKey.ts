const normalizeValue = (item: any): any => {
  if (!item) return '';
  if (typeof item === 'object' && Array.isArray(item)) return item.map((key) => `${key}`);
  return `${item}`;
};

export const mergePayloadByKey = (state: any, payload: any, key?: PropertyKey): any => {
  if (key && payload && typeof payload === 'object' && state && typeof state === 'object') {
    if (Array.isArray(state)) {
      if (Array.isArray(payload)) {
        const payloadKeys = payload.map(({ [key]: item }) => item);
        return [
          ...state.filter(({ [key]: item }) => !normalizeValue(payloadKeys).includes(normalizeValue(item))),
          ...payload,
        ];
      } else {
        return [...state.filter(({ [key]: item }) => normalizeValue(payload[key]) !== normalizeValue(item)), payload];
      }
    } else {
      if (Array.isArray(payload)) {
        return {
          ...state,
          ...payload.reduce((accum, item) => ({ ...accum, [item[key]]: item }), {}),
        };
      } else {
        if (payload[key]) {
          return {
            ...state,
            [payload[key]]: payload,
          };
        } else if (Object.values(payload).every((item: any) => item?.[key])) {
          const payloadArray = Object.values(payload);
          return {
            ...state,
            ...payloadArray.reduce<{ [key: string]: any }>((accum, item: any) => ({ ...accum, [item[key]]: item }), {}),
          };
        } else {
          return {
            ...state,
            ...payload,
          };
        }
      }
    }
  }

  return key && !payload ? state : payload;
};
