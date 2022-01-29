import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange, CandlestickInterval, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

const period = 1_000;
const intervalValue1m = 60 * 1_000;
const intervalValue1h = 60 * 60 * 1_000;
const intervalValue1d = 60 * 60 * 24 * 1_000;

export class InitializeCandlestickService {
  constructor(private fetchCandlestickClient: FetchCandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async initializeAllBySymbol(exchange: CandlestickExchange, symbol: string, year: number, month: number): Promise<void> {
    const startDate = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);

    await this.#initializeAllBySymbolAndInterval(exchange, symbol, year, month, '1m', intervalValue1m, startDate);
    await this.#initializeAllBySymbolAndInterval(exchange, symbol, year, month, '1h', intervalValue1h, startDate);
    await this.#initializeAllBySymbolAndInterval(exchange, symbol, year, month, '1d', intervalValue1d, startDate);
  }

  async #initializeAllBySymbolAndInterval(exchange: CandlestickExchange, symbol: string, year: number, month: number, interval: CandlestickInterval, intervalValue: number, startDate: number): Promise<void> {
    const endDate = Date.UTC(year, month, 1, 0, 0, 0, 0) - intervalValue;

    const data = {
      symbol: symbol,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    let from = startDate;
    while (from < endDate) {
      const to = Math.min(from + intervalValue * (period - 1), endDate);
      const candlesticks = await this.fetchCandlestickClient.fetchAll({
        exchange: exchange,
        symbol: symbol,
        interval: interval,
        period: period,
        startDate: from,
        endDate: to,
      });

      logger.info(data, `Found ${candlesticks.values.length} candlesticks of ${interval} from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);
      if (candlesticks.values.length) {
        await this.candlestickRepository.save(candlesticks);
      }
      from = to + intervalValue;
    }
  }
}
