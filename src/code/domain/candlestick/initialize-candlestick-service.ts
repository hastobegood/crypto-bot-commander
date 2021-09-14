import { CandlestickRepository } from './candlestick-repository';
import { CandlestickClient } from './candlestick-client';
import { logger } from '../../configuration/log/logger';

const period = 1_000;
const interval = 60 * 1_000;

export class InitializeCandlestickService {
  constructor(private candlestickClient: CandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async initializeAllBySymbol(symbol: string, year: number, month: number): Promise<void> {
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
      const candlesticks = await this.candlestickClient.getAllBySymbol(symbol, from, to, period, '1m');
      logger.info(data, `Found ${candlesticks.length} candlesticks of 1 minute from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);
      if (candlesticks.length) {
        await this.candlestickRepository.saveAllBySymbol(symbol, candlesticks);
      }
      from = to + interval;
    }
  }
}
