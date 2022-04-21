import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { PublishCandlestickService } from '../../domain/candlestick/publish-candlestick-service';

export class TriggerAllCandlesticksEventScheduler {
  constructor(private publishCandlesticksService: PublishCandlestickService) {}

  async process(exchange: string, symbol: string): Promise<void> {
    const log = {
      exchange: exchange,
      symbol: symbol,
    };

    try {
      logger.info(log, 'Triggering all candlesticks');
      await this.publishCandlesticksService.publishTriggeredBySymbol(this.#parseExchange(exchange), symbol);
      logger.info(log, 'All candlesticks triggered');
    } catch (error) {
      logger.error(log, 'Unable to trigger all candlesticks');
      throw error;
    }
  }

  #parseExchange(exchange: string): CandlestickExchange {
    switch (exchange) {
      case 'Binance':
        return 'Binance';
      default:
        throw new Error(`Unsupported '${exchange}' exchange`);
    }
  }
}
