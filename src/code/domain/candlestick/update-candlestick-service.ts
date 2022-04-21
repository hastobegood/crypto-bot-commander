import { CandlestickExchange, CandlestickInterval, Candlesticks, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { CandlestickRepository } from './candlestick-repository';

export class UpdateCandlestickService {
  constructor(private fetchCandlestickClient: FetchCandlestickClient, private candlestickRepository: CandlestickRepository) {}

  async updateAllBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    await Promise.all([this.#saveAll(exchange, symbol, '1m'), this.#saveAll(exchange, symbol, '1h'), this.#saveAll(exchange, symbol, '1d')]);
  }

  async #saveAll(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval): Promise<void> {
    const candlesticks = await this.#getLastCandlesticks(exchange, symbol, interval);

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

  async #getLastCandlesticks(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval): Promise<Candlesticks> {
    const candlesticks = await this.fetchCandlestickClient.fetchAll({
      exchange: exchange,
      symbol: symbol,
      interval: interval,
      period: 2,
    });

    // ignore candlesticks older than 2 minutes
    const limitDate = new Date().valueOf() - 120_000;

    return {
      ...candlesticks,
      values: candlesticks.values.filter((value) => value.closingDate >= limitDate),
    };
  }
}
