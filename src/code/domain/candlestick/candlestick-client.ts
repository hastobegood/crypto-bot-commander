import { Candlestick, CandlestickInterval } from './model/candlestick';

export interface CandlestickClient {
  getAllBySymbol(symbol: string, startDate: number, endDate: number, period: number, interval: CandlestickInterval): Promise<Candlestick[]>;
}
