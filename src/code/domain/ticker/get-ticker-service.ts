import { Ticker } from './model/ticker';
import { TickerRepository } from './ticker-repository';

export class GetTickerService {
  constructor(private tickerRepository: TickerRepository) {}

  async getBySymbol(symbol: string): Promise<Ticker> {
    return this.tickerRepository.getBySymbol(symbol);
  }
}
