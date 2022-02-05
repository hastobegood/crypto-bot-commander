import { Candlestick, CandlestickExchange, CandlestickInterval } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

const intervalDataMap = new Map<CandlestickInterval, number>();
intervalDataMap.set('1m', 60);
intervalDataMap.set('5m', 300);
intervalDataMap.set('15m', 900);
intervalDataMap.set('30m', 1800);
intervalDataMap.set('1h', 3600);
intervalDataMap.set('6h', 21600);
intervalDataMap.set('12h', 43200);
intervalDataMap.set('1d', 86400);

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

    const intervalDates = this.#getIntervalDates(interval, period, effectiveStartingDate);
    const candlesticks = await this.candlestickRepository.getAllBySymbol(exchange, symbol, interval, intervalDates.startDate, intervalDates.endDate);
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
      startDate += intervalData * 1_000;
    }
    startDate -= intervalData * 1_000 * period;

    return {
      startDate: startDate,
      endDate: endDate,
    };
  }
}

interface IntervalDates {
  startDate: number;
  endDate: number;
}
