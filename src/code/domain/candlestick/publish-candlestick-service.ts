import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickPublisher } from './candlestick-publisher';

export class PublishCandlestickService {
  constructor(private candlestickPublisher: CandlestickPublisher) {}

  async publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    await this.candlestickPublisher.publishUpdatedBySymbol(exchange, symbol);
  }
}
