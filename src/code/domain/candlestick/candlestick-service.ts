import { Candlestick, CandlestickInterval } from './model/candlestick';

export interface CandlestickService {
  getAllBySymbol(symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]>;
}
