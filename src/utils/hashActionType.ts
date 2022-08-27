export const hashActionType = function (str: string) {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i) * 2;
    hash = (hash << 3) - hash + chr;
    hash |= 8;
  }

  const a = `${hash}`.replace('-', '').split('').reverse().join('');
  return Math.floor(+`0.${a}` * 16777215)
    .toString(16)
    .padEnd(6, '8');
};
