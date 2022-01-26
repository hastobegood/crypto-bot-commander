import { Candlestick, CandlestickExchange, CandlestickInterval } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

const intervalDataMap = new Map<CandlestickInterval, IntervalData>();
intervalDataMap.set('1m', { value: 1, seconds: 60, minutes: 1 });
intervalDataMap.set('5m', { value: 5, seconds: 300, minutes: 5 });
intervalDataMap.set('15m', { value: 15, seconds: 900, minutes: 15 });
intervalDataMap.set('30m', { value: 30, seconds: 1800, minutes: 30 });
intervalDataMap.set('1h', { value: 1, seconds: 3600, minutes: 60 });
intervalDataMap.set('6h', { value: 6, seconds: 21600, minutes: 360 });
intervalDataMap.set('12h', { value: 12, seconds: 43200, minutes: 720 });
intervalDataMap.set('1d', { value: 1, seconds: 86400, minutes: 1440 });

export class GetCandlestickService {
  constructor(private candlestickRepository: CandlestickRepository) {}

  async getLastBySymbol(exchange: CandlestickExchange, symbol: string): Promise<Candlestick | null> {
    const candlesticks = await this.getAllBySymbol(exchange, symbol, 1, '1m');

    return candlesticks.length === 0 ? null : candlesticks[0];
  }

  async getAllBySymbol(exchange: CandlestickExchange, symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]> {
    const candlesticks: Candlestick[] = [];
    const intervalData = intervalDataMap.get(interval)!;
    const intervalDates = this.#getIntervalDates(period, intervalData);

    const candlesticksByDates = await this.candlestickRepository.getAllBySymbol(exchange, symbol, intervalDates.startDate, intervalDates.endDate);
    if (interval === '1m') {
      return candlesticksByDates;
    }
    const candlesticksByOpeningDate = new Map<number, Candlestick>(candlesticksByDates.map((candlestick) => [candlestick.openingDate, candlestick]));

    let currentInterval = intervalDates.startDate;
    while (currentInterval <= intervalDates.endDate) {
      const openingDate = currentInterval;
      const closingDate = currentInterval + intervalData.seconds * 1000;
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
        currentInterval += 60 * 1000;
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

    return candlesticks;
  }

  #getIntervalDates(period: number, intervalData: IntervalData): IntervalDates {
    const currentDate = new Date();
    const endDate = currentDate.setUTCSeconds(0, 0);

    let startDate = currentDate.setUTCHours(0, 0, 0, 0);
    while (startDate <= endDate) {
      startDate += intervalData.seconds * 1000;
    }
    startDate -= intervalData.seconds * 1000 * period;

    return {
      startDate: startDate,
      endDate: endDate,
      lengthInMinutes: (endDate - startDate) / 1000 / 60 + 1,
    };
  }
}

interface IntervalData {
  value: number;
  seconds: number;
  minutes: number;
}

interface IntervalDates {
  startDate: number;
  endDate: number;
  lengthInMinutes: number;
}
