import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { randomNumber } from '../../random-test-builder';

export const buildDefaultCandlesticks = (): Candlestick[] => {
  return [buildDefaultCandlestick(), buildDefaultCandlestick(), buildDefaultCandlestick()];
};

export const buildDefaultCandlestick = (): Candlestick => {
  return buildCandlestick(new Date(), randomNumber(1_000, 100_000));
};

export const buildCandlestick = (closingDate: Date, closingPrice: number): Candlestick => {
  return {
    openingDate: new Date().valueOf(),
    closingDate: closingDate.valueOf(),
    openingPrice: randomNumber(1_000, 100_000),
    closingPrice: closingPrice,
    lowestPrice: randomNumber(1_000, 100_000),
    highestPrice: randomNumber(1_000, 100_000),
  };
};

export const buildCandlesticksFromTo = (openingDate: Date, closingDate: Date): Candlestick[] => {
  const end = closingDate.valueOf();
  let current = openingDate.valueOf();
  let openingPrice = randomNumber(400, 500);
  let closingPrice = randomNumber(400, 500);
  let lowestPrice = randomNumber(350, 400);
  let highestPrice = randomNumber(500, 550);

  const results: Candlestick[] = [];
  do {
    results.push({ openingDate: current, closingDate: current + 60 * 1000, openingPrice: openingPrice, closingPrice: closingPrice, lowestPrice: lowestPrice, highestPrice: highestPrice });
    current += 60 * 1000;
    openingPrice = closingPrice;
    closingPrice = randomNumber(400, 500);
    lowestPrice = randomNumber(350, 400);
    highestPrice = randomNumber(500, 550);
  } while (current <= end);

  return results;
};
