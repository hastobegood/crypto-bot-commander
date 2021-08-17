import { randomNumber } from '../../random-test-builder';
import { BinanceSymbolCandlestick } from '../../../../src/code/infrastructure/binance/model/binance-candlestick';

export const buildDefaultBinanceSymbolCandlesticks = (): BinanceSymbolCandlestick[] => {
  return [buildDefaultBinanceSymbolCandlestick(), buildDefaultBinanceSymbolCandlestick(), buildDefaultBinanceSymbolCandlestick()];
};

export const buildDefaultBinanceSymbolCandlestick = (): BinanceSymbolCandlestick => {
  return {
    openingDate: new Date().valueOf(),
    closingDate: new Date().valueOf(),
    openingPrice: randomNumber(1_000, 100_000).toString(),
    closingPrice: randomNumber(1_000, 100_000).toString(),
    lowestPrice: randomNumber(1_000, 100_000).toString(),
    highestPrice: randomNumber(1_000, 100_000).toString(),
  };
};
