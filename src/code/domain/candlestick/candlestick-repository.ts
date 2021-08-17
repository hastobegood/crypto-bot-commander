import { Candlestick, CandlestickInterval } from './model/candlestick';

export interface CandlestickRepository {
  getAllBySymbol(symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]>;
}
