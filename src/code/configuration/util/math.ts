export const round = (number: number, decimals: number): number => {
  const result = +(Math.round(+(Math.abs(number) + 'e+' + decimals)) + 'e-' + decimals);
  return Math.sign(number) === -1 ? result * -1 : result;
};

export const truncate = (number: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  const result = Math.floor(Math.abs(number) * factor) / factor;
  return Math.sign(number) === -1 ? result * -1 : result;
};
