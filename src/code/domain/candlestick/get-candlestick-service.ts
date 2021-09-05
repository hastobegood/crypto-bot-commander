import { CandlestickRepository } from './candlestick-repository';
import { Candlestick, CandlestickInterval } from './model/candlestick';

export class GetCandlestickService {
  constructor(private candlestickRepository: CandlestickRepository) {}

  async getAllBySymbol(symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]> {
    return this.candlestickRepository.getAllBySymbol(symbol, period, interval);
  }
}
