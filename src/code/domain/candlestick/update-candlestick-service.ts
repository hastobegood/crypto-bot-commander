import { CandlestickRepository } from './candlestick-repository';
import { CandlestickClient } from './candlestick-client';
import { logger } from '../../configuration/log/logger';

const period = 2;
const interval = 60 * 1_000;

export class UpdateCandlestickService {
  constructor(private candlestickClient: CandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async updateAllBySymbol(symbol: string): Promise<void> {
    const endDate = new Date().setUTCSeconds(0, 0);
    const startDate = endDate - interval * (period - 1);

    const data = {
      symbol: symbol,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    const candlesticks = await this.candlestickClient.getAllBySymbol(symbol, startDate, endDate, period, '1m');
    logger.info(data, `Found ${candlesticks.length} candlesticks of 1 minute from ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`);
    if (candlesticks.length) {
      await this.candlestickRepository.saveAllBySymbol(symbol, candlesticks);
    }
  }
}
