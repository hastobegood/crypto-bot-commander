import { randomFromList, randomNumber } from '../../random-test-builder';
import { BinanceExchange, BinanceExchangeFilter, BinanceExchangeSymbol } from '../../../../src/code/infrastructure/binance/model/binance-exchange';

export const buildDefaultBinanceExchange = (): BinanceExchange => {
  return {
    symbols: [buildDefaultBinanceExchangeSymbol()],
  };
};

export const buildDefaultBinanceExchangeSymbol = (): BinanceExchangeSymbol => {
  return {
    baseAssetPrecision: randomNumber(8, 10),
    quoteAssetPrecision: randomNumber(8, 10),
    filters: [buildBinanceExchangeLotSizeFilter(randomFromList(['0.1', '0.01', '0.001', '0.001', '0.0001'])), buildBinanceExchangePriceFilter(randomFromList(['0.1', '0.01', '0.001', '0.001', '0.0001']))],
  };
};

export const buildBinanceExchangeLotSizeFilter = (stepSize: string): BinanceExchangeFilter => {
  return {
    filterType: 'LOT_SIZE',
    stepSize: stepSize,
  };
};

export const buildBinanceExchangePriceFilter = (tickSize: string): BinanceExchangeFilter => {
  return {
    filterType: 'PRICE_FILTER',
    tickSize: tickSize,
  };
};
