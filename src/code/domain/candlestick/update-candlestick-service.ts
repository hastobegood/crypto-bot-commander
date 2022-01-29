import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange, CandlestickInterval, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickRepository } from './candlestick-repository';

export class UpdateCandlestickService {
  constructor(private fetchCandlestickClient: FetchCandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async updateAllBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    await Promise.all([this.#saveAll(exchange, symbol, '1m'), this.#saveAll(exchange, symbol, '1h'), this.#saveAll(exchange, symbol, '1d')]);
  }

  async #saveAll(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval): Promise<void> {
    const candlesticks = await this.fetchCandlestickClient.fetchAll({
      exchange: exchange,
      symbol: symbol,
      interval: interval,
      period: 2,
    });

    const data = {
      exchange: exchange,
      symbol: symbol,
      interval: interval,
    };

    logger.info(data, `Found ${candlesticks.values.length} ${interval} candlesticks`);
    if (candlesticks.values.length) {
      await this.candlestickRepository.save(candlesticks);
    }
  }
}
