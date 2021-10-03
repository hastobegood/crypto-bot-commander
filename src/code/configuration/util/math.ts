export const roundNumber = (number: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.round((number + Number.EPSILON) * factor) / factor;
};

export const truncateNumber = (number: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.floor((number + Number.EPSILON) * factor) / factor;
};
