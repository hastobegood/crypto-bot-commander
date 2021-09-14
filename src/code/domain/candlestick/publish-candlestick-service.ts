import { CandlestickPublisher } from './candlestick-publisher';

export class PublishCandlestickService {
  constructor(private candlestickPublisher: CandlestickPublisher) {}

  async publishUpdatedBySymbol(symbol: string): Promise<void> {
    await this.candlestickPublisher.publishUpdatedBySymbol(symbol);
  }
}
