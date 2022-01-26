import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

const period = 1_000;
const interval = 60 * 1_000;

export class InitializeCandlestickService {
  constructor(private fetchCandlestickClient: FetchCandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async initializeAllBySymbol(exchange: CandlestickExchange, symbol: string, year: number, month: number): Promise<void> {
    const startDate = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = Date.UTC(year, month, 1, 0, 0, 0, 0) - 60 * 1_000;

    const data = {
      symbol: symbol,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    let from = startDate;
    while (from < endDate) {
      const to = Math.min(from + interval * (period - 1), endDate);
      const candlesticks = await this.fetchCandlestickClient.fetchAll({
        exchange: exchange,
        symbol: symbol,
        interval: '1m',
        period: period,
        startDate: from,
        endDate: to,
      });

      logger.info(data, `Found ${candlesticks.values.length} candlesticks of 1 minute from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);
      if (candlesticks.values.length) {
        await this.candlestickRepository.saveAllBySymbol(exchange, symbol, candlesticks.values);
      }
      from = to + interval;
    }
  }
}
