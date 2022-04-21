import { Candlestick, CandlestickExchange, CandlestickInterval } from '@hastobegood/crypto-bot-artillery/candlestick';

import { CandlestickRepository } from './candlestick-repository';

const intervalDataMap = new Map<CandlestickInterval, number>();
intervalDataMap.set('1m', 60);
intervalDataMap.set('5m', 300);
intervalDataMap.set('15m', 900);
intervalDataMap.set('30m', 1_800);
intervalDataMap.set('1h', 3_600);
intervalDataMap.set('6h', 21_600);
intervalDataMap.set('12h', 43_200);
intervalDataMap.set('1d', 86_400);

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

    const candlesticks = await this.#getAllLastBySymbolAndStartingDate(exchange, symbol, interval, period, effectiveStartingDate);
    if (candlesticks.length > period) {
      throw new Error(`More candlesticks than requested periods (${period} requested but found ${candlesticks.length})`);
    }

    return candlesticks;
  }

  async #getAllLastBySymbolAndStartingDate(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, period: number, startingDate: number): Promise<Candlestick[]> {
    const intervalInSeconds = this.#getIntervalInSeconds(interval);
    let intervalDates = this.#getIntervalDates(intervalInSeconds, period, startingDate);
    let candlesticks = await this.#getAllBySymbol(exchange, symbol, interval, intervalDates.startDate, intervalDates.endDate);

    let count = 0;
    while (candlesticks.length < period && count < 3) {
      const missingPeriod = period - candlesticks.length;
      intervalDates = this.#getIntervalDates(intervalInSeconds, 86_400 / intervalInSeconds, intervalDates.startDate - 1);
      candlesticks = [...(await this.#getAllBySymbol(exchange, symbol, interval, intervalDates.startDate, intervalDates.endDate)).slice(-missingPeriod), ...candlesticks];
      count++;
    }

    return candlesticks;
  }

  #getIntervalInSeconds(interval: CandlestickInterval): number {
    const intervalInSeconds = intervalDataMap.get(interval);
    if (!intervalInSeconds) {
      throw new Error(`Unsupported '${interval}' candlestick interval`);
    }

    return intervalInSeconds;
  }

  #getIntervalDates(intervalInSeconds: number, period: number, startingDate: number): IntervalDates {
    const limitDate = new Date(startingDate).setUTCSeconds(0, 0);

    let endDate = new Date(startingDate).setUTCHours(0, 0, 0, 0);
    while (endDate <= limitDate) {
      endDate += intervalInSeconds * 1_000;
    }

    return {
      startDate: endDate - intervalInSeconds * 1_000 * period,
      endDate: endDate - intervalInSeconds * 1_000,
    };
  }

  async #getAllBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, startDate: number, endDate: number): Promise<Candlestick[]> {
    const candlesticks = await this.candlestickRepository.getAllBySymbol(exchange, symbol, interval, startDate, endDate);

    return candlesticks.sort((current, next) => current.openingDate - next.openingDate);
  }
}

interface IntervalDates {
  startDate: number;
  endDate: number;
}
