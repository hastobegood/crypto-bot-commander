export const extractAssets = (symbol: string): { baseAsset: string; quoteAsset: string } => {
  const assets = splitSymbol(symbol);
  return {
    baseAsset: assets[0],
    quoteAsset: assets[1],
  };
};

const splitSymbol = (symbol: string): string[] => {
  const assets = symbol.split('#');
  if (assets.length != 2) {
    throw new Error(`Unable to extract assets, symbol '${symbol}' is invalid`);
  }
  return assets;
};
