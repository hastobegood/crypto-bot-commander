import { Candlestick, CandlestickExchange, CandlestickInterval } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

const intervalDataMap = new Map<CandlestickInterval, IntervalData>();
intervalDataMap.set('1m', { value: 1, seconds: 60 });
intervalDataMap.set('5m', { value: 5, seconds: 300 });
intervalDataMap.set('15m', { value: 15, seconds: 900 });
intervalDataMap.set('30m', { value: 30, seconds: 1800 });
intervalDataMap.set('1h', { value: 1, seconds: 3600 });
intervalDataMap.set('6h', { value: 6, seconds: 21600 });
intervalDataMap.set('12h', { value: 12, seconds: 43200 });
intervalDataMap.set('1d', { value: 1, seconds: 86400 });

export class GetCandlestickService {
  constructor(private candlestickRepository: CandlestickRepository) {}

  async getLastBySymbol(exchange: CandlestickExchange, symbol: string): Promise<Candlestick | null> {
    return this.candlestickRepository.getLastBySymbol(exchange, symbol, '1m');
  }

  async getAllLastBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, period: number, startingDate?: number): Promise<Candlestick[]> {
    const effectiveStartingDate = startingDate || (await this.candlestickRepository.getLastBySymbol(exchange, symbol, '1m'))?.openingDate;
    if (!effectiveStartingDate) {
      return [];
    }

    return this.#getAllLastBySymbolAndStartingDate(exchange, symbol, interval, period, effectiveStartingDate);
  }

  async #getAllLastBySymbolAndStartingDate(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, period: number, startingDate: number): Promise<Candlestick[]> {
    const candlesticks: Candlestick[] = [];
    const intervalDates = this.#getIntervalDates(interval, period, startingDate);

    const candlesticksByOpeningDate = new Map<number, Candlestick>(
      (await this.candlestickRepository.getAllBySymbol(exchange, symbol, interval, intervalDates.startDate, intervalDates.endDate)).map((candlestick) => [candlestick.openingDate, candlestick]),
    );

    let currentInterval = intervalDates.startDate;
    while (currentInterval <= intervalDates.endDate) {
      const openingDate = currentInterval;
      const closingDate = currentInterval + intervalDates.data.seconds * 1_000 - 1;
      let openingPrice;
      let closingPrice;
      let lowestPrice;
      let highestPrice;

      while (currentInterval < closingDate) {
        const candlestick = candlesticksByOpeningDate.get(currentInterval);
        if (candlestick) {
          if (!openingPrice) {
            openingPrice = candlestick.openingPrice;
          }
          closingPrice = candlestick.closingPrice;
          if (!lowestPrice || lowestPrice > candlestick.lowestPrice) {
            lowestPrice = candlestick.lowestPrice;
          }
          if (!highestPrice || highestPrice < candlestick.highestPrice) {
            highestPrice = candlestick.highestPrice;
          }
        }
        currentInterval += (intervalDates.data.seconds / intervalDates.data.value) * 1_000;
      }

      if (openingPrice && closingPrice && lowestPrice && highestPrice) {
        candlesticks.push({
          openingDate: openingDate,
          closingDate: closingDate,
          openingPrice: openingPrice,
          closingPrice: closingPrice,
          lowestPrice: lowestPrice,
          highestPrice: highestPrice,
        });
      }
    }

    if (candlesticks.length > period) {
      throw new Error(`More candlesticks than requested periods (${period} requested but found ${candlesticks.length})`);
    }

    return candlesticks;
  }

  #getIntervalDates(interval: CandlestickInterval, period: number, startingDate: number): IntervalDates {
    const intervalData = intervalDataMap.get(interval);
    if (!intervalData) {
      throw new Error(`Unsupported '${interval}' candlestick interval`);
    }

    const endDate = new Date(startingDate).setUTCSeconds(0, 0);

    let startDate = new Date(startingDate).setUTCHours(0, 0, 0, 0);
    while (startDate <= endDate) {
      startDate += intervalData.seconds * 1_000;
    }
    startDate -= intervalData.seconds * 1_000 * period;

    return {
      data: intervalData,
      startDate: startDate,
      endDate: endDate,
    };
  }
}

interface IntervalData {
  value: number;
  seconds: number;
}

interface IntervalDates {
  data: IntervalData;
  startDate: number;
  endDate: number;
}
