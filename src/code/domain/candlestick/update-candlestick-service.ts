import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

export class UpdateCandlestickService {
  constructor(private fetchCandlestickClient: FetchCandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async updateAllBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    const data = {
      symbol: symbol,
    };

    const candlesticks = await this.fetchCandlestickClient.fetchAll({
      exchange: exchange,
      symbol: symbol,
      interval: '1m',
      period: 2,
    });

    logger.info(data, `Found ${candlesticks.values.length} candlesticks of 1 minute`);
    if (candlesticks.values.length) {
      await this.candlestickRepository.saveAllBySymbol(exchange, symbol, candlesticks.values);
    }
  }
}
