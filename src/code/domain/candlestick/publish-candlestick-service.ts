import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickPublisher } from './candlestick-publisher';

export class PublishCandlestickService {
  constructor(private candlestickPublisher: CandlestickPublisher) {}

  async publishTriggeredBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    await this.candlestickPublisher.publishTriggeredBySymbol(exchange, symbol);
  }

  async publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    await this.candlestickPublisher.publishUpdatedBySymbol(exchange, symbol);
  }
}
