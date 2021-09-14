import { logger } from '../../configuration/log/logger';
import { InitializeCandlestickService } from '../../domain/candlestick/initialize-candlestick-service';

export class InitializeAllCandlesticksController {
  constructor(private initCandlestickService: InitializeCandlestickService) {}

  async process(symbol: string, year: number, month: number): Promise<void> {
    try {
      logger.info('Initializing all candlesticks');
      await this.initCandlestickService.initializeAllBySymbol(symbol, year, month);
      logger.info('All candlesticks initialized');
    } catch (error) {
      logger.error('Unable to initialize all candlesticks');
      throw error;
    }
  }
}
