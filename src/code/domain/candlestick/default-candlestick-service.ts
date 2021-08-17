import { CandlestickService } from './candlestick-service';
import { CandlestickRepository } from './candlestick-repository';
import { Candlestick, CandlestickInterval } from './model/candlestick';

export class DefaultCandlestickService implements CandlestickService {
  constructor(private candlestickRepository: CandlestickRepository) {}

  async getAllBySymbol(symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]> {
    return await this.candlestickRepository.getAllBySymbol(symbol, period, interval);
  }
}
