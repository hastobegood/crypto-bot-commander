import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { InitializeCandlestickService } from '../../domain/candlestick/initialize-candlestick-service';

export class InitializeAllCandlesticksApiController {
  constructor(private initCandlestickService: InitializeCandlestickService) {}

  async process(exchange: string, symbol: string, year: number, month: number): Promise<void> {
    const log = {
      exchange: exchange,
      symbol: symbol,
      year: year,
      month: month,
    };

    try {
      logger.info(log, 'Initializing all candlesticks');
      await this.initCandlestickService.initializeAllBySymbol(this.#parseExchange(exchange), symbol, year, month);
      logger.info(log, 'All candlesticks initialized');
    } catch (error) {
      logger.error(log, 'Unable to initialize all candlesticks');
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
